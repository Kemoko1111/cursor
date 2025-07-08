import React from 'react';
import { Users } from 'lucide-react';

export const Customers = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-600 mt-2">
          Manage customer information and service history
        </p>
      </div>
      
      <div className="card text-center">
        <p className="text-gray-600">
          Customer management features coming soon!
        </p>
      </div>
    </div>
  );
};