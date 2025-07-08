import React from 'react';
import { QrCode } from 'lucide-react';

export const QRGenerator = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <QrCode className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">QR Code Generator</h1>
        <p className="text-gray-600 mt-2">
          Generate QR codes for service stations and car stickers
        </p>
      </div>
      
      <div className="card text-center">
        <p className="text-gray-600">
          QR code generation features coming soon!
        </p>
      </div>
    </div>
  );
};