const JsBarcode = require("jsbarcode");
const { createCanvas } = require("canvas");
const fs = require("fs");
//fs module is used to write the generated barcode image to the filesystem, allowing us to save it and serve it later.
const path = require("path");

const generateBarcode = (trackingId) => {
  const canvas = createCanvas();

  JsBarcode(canvas, trackingId, {
    format: "CODE128"
    //add styling if necessary
  });

  const buffer = canvas.toBuffer("image/png");

  const fileName = `${trackingId}.png`;
  const filePath = path.join(__dirname, "../public/barcodes", fileName);

  fs.writeFileSync(filePath, buffer);

  return `/barcodes/${fileName}`;
};

module.exports = generateBarcode;