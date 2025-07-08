import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Wrench, 
  ClipboardList, 
  DollarSign, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  QrCode
} from 'lucide-react';
import { api } from '../services/api';

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentServices, setRecentServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, servicesResponse] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/services?limit=5')
      ]);
      
      setStats(statsResponse.data);
      setRecentServices(servicesResponse.data.services || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Car Service Tracking System Overview
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-3">
          <Link
            to="/scan"
            className="btn btn-primary flex items-center space-x-2"
          >
            <QrCode className="h-4 w-4" />
            <span>Scan QR Code</span>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card stat-card-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.total_customers || 0}
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="stat-card stat-card-success">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Services</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.total_services || 0}
              </p>
            </div>
            <ClipboardList className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="stat-card stat-card-warning">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(stats?.total_revenue)}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="stat-card stat-card-danger">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue Services</p>
              <p className="text-3xl font-bold text-gray-900">
                {stats?.overdue_services || 0}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* This Month Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Services This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.services_this_month || 0}
              </p>
            </div>
            <Calendar className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats?.revenue_this_month)}
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.upcoming_services || 0}
              </p>
            </div>
            <Wrench className="h-6 w-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/qr-generator"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <QrCode className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Generate QR</span>
          </Link>
          
          <Link
            to="/customers"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Customers</span>
          </Link>
          
          <Link
            to="/mechanics"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Wrench className="h-8 w-8 text-yellow-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Mechanics</span>
          </Link>
          
          <Link
            to="/analytics"
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <TrendingUp className="h-8 w-8 text-purple-500 mb-2" />
            <span className="text-sm font-medium text-gray-700">Analytics</span>
          </Link>
        </div>
      </div>

      {/* Recent Services */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Services</h2>
          <Link
            to="/services"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        
        {recentServices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Oil Type</th>
                  <th>Mechanic</th>
                  <th>Date</th>
                  <th>Cost</th>
                </tr>
              </thead>
              <tbody>
                {recentServices.map((service) => (
                  <tr key={service.id}>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900">
                          {service.customer_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {service.customer_phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        service.oil_type === 'diesel' ? 'oil-diesel' : 'oil-super'
                      }`}>
                        {service.oil_type}
                      </span>
                    </td>
                    <td className="text-gray-900">{service.mechanic_name}</td>
                    <td className="text-gray-500">
                      {formatDate(service.service_date)}
                    </td>
                    <td className="font-medium text-gray-900">
                      {formatCurrency(service.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No recent services found</p>
          </div>
        )}
      </div>
    </div>
  );
};