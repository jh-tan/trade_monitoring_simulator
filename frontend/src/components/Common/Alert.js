import React from 'react';
import { AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

const Alert = ({ type = 'info', title, message, onClose }) => {
  const icons = {
    error: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const IconComponent = icons[type];

  return (
    <div className={`border rounded-md p-4 ${colors[type]}`}>
      <div className="flex">
        <IconComponent className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="ml-3 flex-1">
          {title && <h3 className="font-medium">{title}</h3>}
          <p className={title ? 'mt-1 text-sm' : 'text-sm'}>{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
