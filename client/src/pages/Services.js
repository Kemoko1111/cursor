import React from 'react';
import { ClipboardList } from 'lucide-react';

export const Services = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <ClipboardList className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Service Management</h1>
        <p className="text-gray-600 mt-2">
          View and manage all service records
        </p>
      </div>
      
      <div className="card text-center">
        <p className="text-gray-600">
          Service management features coming soon!
        </p>
      </div>
    </div>
  );
};