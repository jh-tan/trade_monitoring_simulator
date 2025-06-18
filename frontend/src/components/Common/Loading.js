import React from 'react';
import { RefreshCw } from 'lucide-react';

const Loading = ({ message = 'Loading...', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex items-center justify-center py-8">
      <RefreshCw className={`${sizeClasses[size]} animate-spin text-blue-600 mr-3`} />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

export default Loading;
