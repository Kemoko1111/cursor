import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Wrench, 
  Phone, 
  Car, 
  DollarSign, 
  FileText,
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { api } from '../services/api';

export const ServiceForm = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  
  const [qrInfo, setQrInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    customerPhone: '',
    oilType: 'super',
    mileage: '',
    cost: '',
    notes: ''
  });

  useEffect(() => {
    if (qrId) {
      fetchQRInfo();
    }
  }, [qrId]);

  const fetchQRInfo = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/qr/scan/${qrId}`);
      setQrInfo(response.data);
      
      if (response.data.type !== 'service_station') {
        setError('This QR code is not for service logging');
      }
    } catch (error) {
      console.error('Error fetching QR info:', error);
      setError('Invalid QR code or QR code not found');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.customerPhone.trim()) {
      setError('Phone number is required');
      return false;
    }
    
    if (!formData.oilType) {
      setError('Oil type is required');
      return false;
    }
    
    if (formData.cost && isNaN(parseFloat(formData.cost))) {
      setError('Cost must be a valid number');
      return false;
    }
    
    if (formData.mileage && isNaN(parseInt(formData.mileage))) {
      setError('Mileage must be a valid number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const serviceData = {
        qrId: qrId,
        customerPhone: formData.customerPhone.trim(),
        oilType: formData.oilType,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        cost: formData.cost ? parseFloat(formData.cost) : null,
        notes: formData.notes.trim()
      };
      
      const response = await api.post('/qr/log-service', serviceData);
      
      if (response.data.success) {
        setSuccess(true);
        // Redirect to success page after a delay
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        setError(response.data.message || 'Failed to log service');
      }
    } catch (error) {
      console.error('Error logging service:', error);
      setError(error.response?.data?.error || 'Failed to log service');
    } finally {
      setSubmitting(false);
    }
  };

  const formatPhoneNumber = (value) => {
    // Simple phone number formatting (adjust based on your needs)
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 10) {
      return `+1${cleaned.slice(-10)}`;
    }
    return `+${cleaned}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error && !qrInfo) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => navigate('/scan')}
            className="btn btn-secondary mt-4 w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Scanner
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card bg-green-50 border-green-200 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-green-900 mb-2">
            Service Logged Successfully!
          </h2>
          <p className="text-green-700 mb-4">
            Your service has been recorded and SMS reminders have been scheduled.
          </p>
          <p className="text-sm text-green-600">
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Wrench className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Log Your Service</h1>
        <p className="text-gray-600 mt-2">
          Fill out the details below to track your car service
        </p>
      </div>

      {/* Mechanic Information */}
      {qrInfo?.stationInfo && (
        <div className="card bg-blue-50">
          <h3 className="font-medium text-blue-900 mb-3">Service Station</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Station:</span>
              <span className="text-blue-900 font-medium">
                {qrInfo.stationInfo.station}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Mechanic:</span>
              <span className="text-blue-900 font-medium">
                {qrInfo.stationInfo.mechanic.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Workshop:</span>
              <span className="text-blue-900 font-medium">
                {qrInfo.stationInfo.mechanic.workshop}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Contact:</span>
              <span className="text-blue-900 font-medium">
                {qrInfo.stationInfo.mechanic.phone}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Service Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card">
          {/* Customer Phone */}
          <div>
            <label className="form-label">
              <Phone className="h-4 w-4 inline mr-1" />
              Your Phone Number *
            </label>
            <input
              type="tel"
              name="customerPhone"
              value={formData.customerPhone}
              onChange={handleInputChange}
              placeholder="+1234567890"
              className="form-input"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              We'll send you service reminders via SMS
            </p>
          </div>

          {/* Oil Type */}
          <div>
            <label className="form-label">
              <Car className="h-4 w-4 inline mr-1" />
              Oil Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="oilType"
                  value="diesel"
                  checked={formData.oilType === 'diesel'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="badge oil-diesel">Diesel</span>
              </label>
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="oilType"
                  value="super"
                  checked={formData.oilType === 'super'}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <span className="badge oil-super">Super</span>
              </label>
            </div>
          </div>

          {/* Mileage */}
          <div>
            <label className="form-label">Current Mileage (Optional)</label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleInputChange}
              placeholder="e.g. 45000"
              className="form-input"
            />
          </div>

          {/* Cost */}
          <div>
            <label className="form-label">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Service Cost (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              name="cost"
              value={formData.cost}
              onChange={handleInputChange}
              placeholder="e.g. 45.00"
              className="form-input"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="form-label">
              <FileText className="h-4 w-4 inline mr-1" />
              Notes (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              placeholder="Any additional notes about the service..."
              className="form-input"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting ? (
            <>
              <div className="loading-spinner mr-2 h-4 w-4" />
              Logging Service...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Log Service
            </>
          )}
        </button>

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/scan')}
          className="btn btn-secondary w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Scanner
        </button>
      </form>

      {/* Info */}
      <div className="card bg-yellow-50">
        <h3 className="font-medium text-yellow-900 mb-2">What happens next?</h3>
        <ul className="text-sm text-yellow-800 space-y-1">
          <li>• Your service will be recorded in our system</li>
          <li>• SMS reminders will be scheduled automatically</li>
          <li>• You'll receive reminders 1 month and 2 weeks before your next service</li>
          <li>• A QR sticker will be generated for your car</li>
        </ul>
      </div>
    </div>
  );
};