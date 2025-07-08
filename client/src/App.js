import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { QRScanner } from './pages/QRScanner';
import { ServiceForm } from './pages/ServiceForm';
import { ServiceStatus } from './pages/ServiceStatus';
import { Customers } from './pages/Customers';
import { Mechanics } from './pages/Mechanics';
import { Services } from './pages/Services';
import { QRGenerator } from './pages/QRGenerator';
import { Analytics } from './pages/Analytics';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <main className="container mx-auto px-4 py-6">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={<Dashboard />} />
            
            {/* QR Code Routes */}
            <Route path="/scan" element={<QRScanner />} />
            <Route path="/service/:qrId" element={<ServiceForm />} />
            <Route path="/check/:qrId" element={<ServiceStatus />} />
            
            {/* Management Routes */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/mechanics" element={<Mechanics />} />
            <Route path="/services" element={<Services />} />
            <Route path="/qr-generator" element={<QRGenerator />} />
            <Route path="/analytics" element={<Analytics />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;