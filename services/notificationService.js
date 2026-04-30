const twilio = require("twilio");

let emailTransporter;

const isTwilioConfigured = () => {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE
  );
};

const isEmailConfigured = () => {
  return Boolean(
    process.env.EMAIL_HOST &&
    process.env.EMAIL_PORT &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_FROM
  );
};

const getEmailTransporter = () => {
  if (emailTransporter) {
    return emailTransporter;
  }

  const nodemailer = require("nodemailer");

  emailTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return emailTransporter;
};

const normalizeIndianPhoneNumber = (phone) => {
  if (!phone) {
    return null;
  }

  const digits = String(phone).replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return phone;
};

const sendSMS = async (phone, message) => {
  const normalizedPhone = normalizeIndianPhoneNumber(phone);

  if (!normalizedPhone) {
    console.log("SMS skipped: missing recipient phone number");
    return;
  }

  if (!isTwilioConfigured()) {
    console.log("SMS skipped: Twilio environment variables are not configured");
    return;
  }

  try {
    console.log("SMS sending to:", normalizedPhone);

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: normalizedPhone
    });

    console.log("SMS sent:", result.sid);
  } catch (error) {
    console.log("SMS failed:", error.message);
  }
};

const sendEmail = async (email, subject, message) => {
  if (!email) {
    console.log("Email skipped: missing recipient email");
    return;
  }

  if (!isEmailConfigured()) {
    console.log("Email skipped: email environment variables are not configured");
    return;
  }

  try {
    console.log("Email sending to:", email);

    const transporter = getEmailTransporter();
    const result = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      text: message
    });

    console.log("Email sent:", result.messageId);
  } catch (error) {
    console.log("Email failed:", error.message);
  }
};

const getMilestoneNotification = (shipment, status) => {
  const trackingId = shipment.trackingId;
  const messages = {
    booked: {
      subject: `Shipment ${trackingId} has been booked`,
      message: `Your shipment ${trackingId} has been booked successfully.`
    },
    assigned: {
      subject: `Shipment ${trackingId} has been assigned`,
      message: `Your shipment ${trackingId} has been assigned to a delivery driver.`
    },
    picked_up: {
      subject: `Shipment ${trackingId} has been picked up`,
      message: `Your shipment ${trackingId} has been picked up by the delivery driver.`
    },
    in_transit: {
      subject: `Shipment ${trackingId} is in transit`,
      message: `Your shipment ${trackingId} is now in transit.`
    },
    out_for_delivery: {
      subject: `Shipment ${trackingId} is out for delivery`,
      message: `Your shipment ${trackingId} is out for delivery and should arrive soon.`
    },
    delivered: {
      subject: `Shipment ${trackingId} has been delivered`,
      message: `Your shipment ${trackingId} has been delivered successfully.`
    },
    failed: {
      subject: `Shipment ${trackingId} delivery was unsuccessful`,
      message: `Delivery for shipment ${trackingId} was unsuccessful. Please contact support for help.`
    }
  };

  return messages[status] || null;
};

const sendMilestoneNotifications = async (shipment, status) => {
  const notification = getMilestoneNotification(shipment, status);

  if (!notification) {
    console.log("Notification skipped: no message configured for status", status);
    return;
  }

  const recipient = shipment.receiver || {};

  console.log("Notification triggered:", {
    trackingId: shipment.trackingId,
    status,
    hasPhone: Boolean(recipient.phone),
    hasEmail: Boolean(recipient.email)
  });

  try {
    await sendSMS(recipient.phone, notification.message);
  } catch (error) {
    console.log("SMS notification failed unexpectedly:", error.message);
  }

  try {
    await sendEmail(recipient.email, notification.subject, notification.message);
  } catch (error) {
    console.log("Email notification failed unexpectedly:", error.message);
  }
};

module.exports = {
  sendSMS,
  sendEmail,
  sendMilestoneNotifications
};