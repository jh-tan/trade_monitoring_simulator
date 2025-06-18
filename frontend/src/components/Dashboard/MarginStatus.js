import React from 'react';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

const MarginStatus = ({ marginStatus }) => {
  const getMarginHealthColor = (ratio) => {
    if (ratio >= 0.5) return 'text-green-600';
    if (ratio >= 0.3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMarginHealthBg = (ratio) => {
    if (ratio >= 0.5) return 'bg-green-100';
    if (ratio >= 0.3) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Margin Status Details</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Margin Ratio */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Margin Ratio</span>
            {marginStatus.marginRatio >= 0.3 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className={`text-2xl font-bold ${getMarginHealthColor(marginStatus.marginRatio)}`}>
            {formatPercentage(marginStatus.marginRatio)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                marginStatus.marginRatio >= 0.5 ? 'bg-green-500' :
                marginStatus.marginRatio >= 0.3 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(marginStatus.marginRatio * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* Maintenance Margin */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Maintenance Margin</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(marginStatus.maintenanceMargin)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Required: {formatPercentage(0.25)}
          </div>
        </div>

        {/* Available Margin */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Available Margin</span>
          </div>
          <div className={`text-2xl font-bold ${
            marginStatus.availableMargin >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(marginStatus.availableMargin)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Excess margin available
          </div>
        </div>
      </div>

      {/* Margin Call Warning */}
      {marginStatus.marginCallTriggered && (
        <div className={`mt-6 p-4 rounded-lg ${getMarginHealthBg(marginStatus.marginRatio)}`}>
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <div>
              <h3 className="font-medium text-red-800">Margin Call Active</h3>
              <p className="text-sm text-red-700 mt-1">
                Shortfall: {formatCurrency(marginStatus.marginShortfall)} - 
                Additional funds or position reduction required immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarginStatus;
