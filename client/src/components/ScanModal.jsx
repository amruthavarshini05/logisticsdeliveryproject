import { useEffect, useRef, useState } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import "../styles/ScanModal.css";

export default function ScanModal({ isOpen, onClose, onScanComplete, assignments }) {
  const scannerRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState("");
  const [scannedId, setScannedId] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    try {
      // Initialize scanner
      const html5Scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0
        },
        false
      );

      const onScanSuccess = (decodedText) => {
        // Extract tracking ID from barcode
        const trackingId = decodedText.trim();
        setScannedId(trackingId);

        // Check if tracking ID exists in assignments
        const foundAssignment = assignments.find(
          (shipment) => shipment.trackingId === trackingId
        );

        if (foundAssignment) {
          // Stop scanner and call callback
          html5Scanner.clear().then(() => {
            onScanComplete(foundAssignment);
            setScannedId("");
          }).catch(err => console.error("Error stopping scanner:", err));
        } else {
          setError(`Tracking ID "${trackingId}" not found in your assignments`);
          setScannedId("");
        }
      };

      const onScanFailure = (error) => {
        // Silently handle scanning failures (continuous scanning)
      };

      html5Scanner.render(onScanSuccess, onScanFailure);
      setScanner(html5Scanner);

      return () => {
        if (html5Scanner) {
          html5Scanner.clear().catch(err => console.error("Cleanup error:", err));
        }
      };
    } catch (err) {
      setError("Failed to initialize camera. Make sure you've granted camera permissions.");
      console.error("Scanner initialization error:", err);
    }
  }, [isOpen, assignments, onScanComplete]);

  const handleClose = () => {
    if (scanner) {
      scanner.clear().catch(err => console.error("Error closing scanner:", err));
    }
    setError("");
    setScannedId("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="scan-modal-overlay" onClick={handleClose}>
      <div className="scan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="scan-modal-header">
          <h2>Scan Barcode</h2>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        <div className="scan-modal-body">
          {error && <div className="scan-error">{error}</div>}

          <div className="scanner-container">
            <div id="qr-reader" className="qr-reader"></div>
            <p className="scanner-hint">
              Position the barcode within the frame to scan
            </p>
          </div>

          {scannedId && (
            <div className="scanned-result">
              <p>Scanned: <strong>{scannedId}</strong></p>
            </div>
          )}
        </div>

        <div className="scan-modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
