import React from 'react';
import { BarChart3 } from 'lucide-react';

export const Analytics = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <BarChart3 className="h-16 w-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600 mt-2">
          View detailed analytics and reports
        </p>
      </div>
      
      <div className="card text-center">
        <p className="text-gray-600">
          Analytics dashboard coming soon!
        </p>
      </div>
    </div>
  );
};