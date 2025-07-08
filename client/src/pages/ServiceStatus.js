import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Car, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  ArrowLeft,
  Phone,
  Wrench
} from 'lucide-react';
import { api } from '../services/api';

export const ServiceStatus = () => {
  const { qrId } = useParams();
  const navigate = useNavigate();
  
  const [serviceData, setServiceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (qrId) {
      fetchServiceStatus();
    }
  }, [qrId]);

  const fetchServiceStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/qr/scan/${qrId}`);
      
      if (response.data.type === 'service_check') {
        setServiceData(response.data);
      } else {
        setError('This QR code is not for service status checking');
      }
    } catch (error) {
      console.error('Error fetching service status:', error);
      setError('Invalid QR code or service not found');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (daysUntilNext) => {
    if (daysUntilNext < 0) return 'text-red-600';
    if (daysUntilNext <= 7) return 'text-orange-600';
    if (daysUntilNext <= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = (daysUntilNext) => {
    if (daysUntilNext < 0) return <AlertTriangle className="h-8 w-8 text-red-500" />;
    if (daysUntilNext <= 30) return <Clock className="h-8 w-8 text-yellow-500" />;
    return <CheckCircle className="h-8 w-8 text-green-500" />;
  };

  const getStatusMessage = (daysUntilNext, isOverdue) => {
    if (isOverdue) {
      return `Your service is overdue by ${Math.abs(daysUntilNext)} days`;
    }
    if (daysUntilNext <= 7) {
      return `Service due in ${daysUntilNext} days - Book soon!`;
    }
    if (daysUntilNext <= 30) {
      return `Service due in ${daysUntilNext} days`;
    }
    return `Next service in ${daysUntilNext} days`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
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

  const service = serviceData?.serviceInfo;
  const daysUntilNext = serviceData?.daysUntilNextService;
  const isOverdue = serviceData?.isOverdue;

  if (!service) {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            No Service History Found
          </h2>
          <p className="text-gray-600 mb-4">
            This QR code doesn't have any associated service records yet.
          </p>
          <button
            onClick={() => navigate('/scan')}
            className="btn btn-primary"
          >
            Scan Different Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <Car className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Service Status</h1>
        <p className="text-gray-600 mt-2">
          Your car maintenance information
        </p>
      </div>

      {/* Service Status Card */}
      <div className={`card ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
        <div className="text-center mb-4">
          {getStatusIcon(daysUntilNext)}
          <h2 className={`text-xl font-bold mt-2 ${getStatusColor(daysUntilNext)}`}>
            {getStatusMessage(daysUntilNext, isOverdue)}
          </h2>
        </div>

        {daysUntilNext !== null && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Next Service Due:</span>
              <span className={`font-semibold ${getStatusColor(daysUntilNext)}`}>
                {formatDate(service.next_service_date)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Information */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Vehicle Information</h3>
        <div className="space-y-2 text-sm">
          {service.customer_name && (
            <div className="flex justify-between">
              <span className="text-gray-600">Owner:</span>
              <span className="font-medium">{service.customer_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Phone:</span>
            <span className="font-medium">{service.customer_phone}</span>
          </div>
          {service.car_make && service.car_model && (
            <div className="flex justify-between">
              <span className="text-gray-600">Vehicle:</span>
              <span className="font-medium">{service.car_make} {service.car_model}</span>
            </div>
          )}
          {service.license_plate && (
            <div className="flex justify-between">
              <span className="text-gray-600">License Plate:</span>
              <span className="font-medium">{service.license_plate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Last Service Information */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Last Service</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span className="font-medium">{formatDate(service.service_date)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Oil Type:</span>
            <span className={`badge ${service.oil_type === 'diesel' ? 'oil-diesel' : 'oil-super'}`}>
              {service.oil_type}
            </span>
          </div>
          {service.mileage && (
            <div className="flex justify-between">
              <span className="text-gray-600">Mileage:</span>
              <span className="font-medium">{service.mileage.toLocaleString()} miles</span>
            </div>
          )}
          {service.cost && (
            <div className="flex justify-between">
              <span className="text-gray-600">Cost:</span>
              <span className="font-medium">{formatCurrency(service.cost)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Mechanic Information */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-3">Service Provider</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Mechanic:</span>
            <span className="font-medium">{service.mechanic_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contact:</span>
            <a 
              href={`tel:${service.mechanic_phone}`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {service.mechanic_phone}
            </a>
          </div>
        </div>
      </div>

      {/* Service Notes */}
      {service.notes && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-3">Service Notes</h3>
          <p className="text-sm text-gray-700">{service.notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        {(isOverdue || daysUntilNext <= 30) && (
          <a
            href={`tel:${service.mechanic_phone}`}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            <Phone className="h-4 w-4 mr-2" />
            Call for Appointment
          </a>
        )}
        
        <button
          onClick={() => navigate('/scan')}
          className="btn btn-secondary w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Scan Another Code
        </button>
      </div>

      {/* Reminder Information */}
      <div className="card bg-blue-50">
        <h3 className="font-medium text-blue-900 mb-2">SMS Reminders</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• You'll receive reminders before your next service</li>
          <li>• First reminder: 1 month before due date</li>
          <li>• Second reminder: 2 weeks before due date</li>
          <li>• Keep this sticker for easy access to your service info</li>
        </ul>
      </div>
    </div>
  );
};