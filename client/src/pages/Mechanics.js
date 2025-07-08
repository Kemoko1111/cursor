import React from 'react';
import { Wrench } from 'lucide-react';

export const Mechanics = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wrench className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Mechanic Management</h1>
        <p className="text-gray-600 mt-2">
          Manage mechanic profiles and performance
        </p>
      </div>
      
      <div className="card text-center">
        <p className="text-gray-600">
          Mechanic management features coming soon!
        </p>
      </div>
    </div>
  );
};