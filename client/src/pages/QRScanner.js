import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, QrCode, AlertCircle, CheckCircle } from 'lucide-react';
import QrScanner from 'qr-scanner';

export const QRScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Get available cameras
    QrScanner.listCameras(true).then(cameras => {
      setCameras(cameras);
      if (cameras.length > 0) {
        // Prefer back camera for mobile devices
        const backCamera = cameras.find(camera => camera.label.toLowerCase().includes('back'));
        setSelectedCamera(backCamera || cameras[0]);
      }
    }).catch(err => {
      console.error('Error listing cameras:', err);
      setError('Unable to access cameras. Please ensure camera permissions are granted.');
    });

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    if (!selectedCamera) {
      setError('No camera available');
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      const qrScanner = new QrScanner(
        videoRef.current,
        result => {
          console.log('QR Code detected:', result.data);
          handleQRCodeDetected(result.data);
        },
        {
          onDecodeError: err => {
            // Ignore decode errors - they happen when no QR code is visible
            console.log('Decode error (normal):', err);
          },
          preferredCamera: selectedCamera.id,
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      qrScannerRef.current = qrScanner;
      await qrScanner.start();
    } catch (err) {
      console.error('Error starting scanner:', err);
      setError('Failed to start camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleQRCodeDetected = (qrData) => {
    try {
      // Try to parse QR data as JSON first
      let qrInfo;
      try {
        qrInfo = JSON.parse(qrData);
      } catch {
        // If not JSON, treat as plain URL or QR ID
        qrInfo = { url: qrData };
      }

      setSuccess('QR Code detected! Redirecting...');
      stopScanning();

      // Wait a moment to show success message
      setTimeout(() => {
        if (qrInfo.qrId) {
          // Direct QR ID
          if (qrInfo.type === 'service_station') {
            navigate(`/service/${qrInfo.qrId}`);
          } else if (qrInfo.type === 'car_sticker') {
            navigate(`/check/${qrInfo.qrId}`);
          } else {
            navigate(`/service/${qrInfo.qrId}`);
          }
        } else if (qrInfo.url) {
          // URL format - extract QR ID from URL
          const urlParts = qrInfo.url.split('/');
          const qrId = urlParts[urlParts.length - 1];
          
          if (qrInfo.url.includes('/service/')) {
            navigate(`/service/${qrId}`);
          } else if (qrInfo.url.includes('/check/')) {
            navigate(`/check/${qrId}`);
          } else {
            // Fallback - assume it's a service QR
            navigate(`/service/${qrId}`);
          }
        } else {
          // Plain QR ID
          navigate(`/service/${qrData}`);
        }
      }, 1500);
    } catch (err) {
      console.error('Error processing QR code:', err);
      setError('Invalid QR code format');
      stopScanning();
    }
  };

  const handleManualInput = () => {
    const qrId = prompt('Enter QR Code ID manually:');
    if (qrId) {
      navigate(`/service/${qrId}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <QrCode className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-600 mt-2">
          Scan the QR code at your service station or on your car sticker
        </p>
      </div>

      {/* Camera Selection */}
      {cameras.length > 1 && (
        <div className="card">
          <label className="form-label">Select Camera</label>
          <select
            value={selectedCamera?.id || ''}
            onChange={(e) => {
              const camera = cameras.find(c => c.id === e.target.value);
              setSelectedCamera(camera);
              if (isScanning) {
                stopScanning();
              }
            }}
            className="form-input"
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scanner */}
      <div className="card">
        {!isScanning ? (
          <div className="text-center py-8">
            <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Ready to scan QR code
            </p>
            <button
              onClick={startScanning}
              disabled={!selectedCamera}
              className="btn btn-primary w-full"
            >
              Start Camera
            </button>
          </div>
        ) : (
          <div className="qr-scanner-container">
            <video
              ref={videoRef}
              className="w-full rounded-lg"
              style={{ aspectRatio: '1' }}
            />
            <div className="qr-scanner-overlay" />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">
                Position the QR code within the frame
              </p>
              <button
                onClick={stopScanning}
                className="btn btn-secondary"
              >
                Stop Scanning
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Manual Input Option */}
      <div className="card border-dashed">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-3">
            Having trouble scanning? You can enter the QR code manually
          </p>
          <button
            onClick={handleManualInput}
            className="btn btn-secondary"
          >
            Enter Code Manually
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="card bg-blue-50">
        <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Point your camera at the QR code</li>
          <li>• Wait for automatic detection</li>
          <li>• For service stations: Log your service</li>
          <li>• For car stickers: Check service status</li>
        </ul>
      </div>
    </div>
  );
};