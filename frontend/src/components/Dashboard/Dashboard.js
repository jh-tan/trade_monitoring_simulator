import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import MetricsCards from './MetricsCards';
import MarginStatus from './MarginStatus';
import PositionsTable from './PositionsTable';
import MarketDataTable from './MarketDataTable';
import { useMarginData } from '../../hooks/useMarginData';
import { useWebSocket } from '../../hooks/useWebSocket';
import websocketService from '../../services/websocket';

const Dashboard = () => {
  const [selectedClient, setSelectedClient] = useState('CLIENT001');
  const [availableClients] = useState(['CLIENT001', 'CLIENT002', 'CLIENT003']);

  const {
    marginStatus,
    marketData,
    loading,
    error,
    lastUpdate,
    refreshData
  } = useMarginData(selectedClient);

  // WebSocket connection management
  const { isConnected } = useWebSocket(); // 👈 access connection status here

  const handleClientChange = (newClientId) => {
    setSelectedClient(newClientId);
  };

  const handleRefresh = async () => {
    await refreshData();
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm border p-8 max-w-md">
          <div className="flex items-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Margin Trading Monitor
              </h1>
              <p className="text-gray-600 text-sm">
                Real-time portfolio monitoring and risk management
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Last Update */}
              <span className="text-sm text-gray-500">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Client Selection */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Select Client:
            </label>
            <select
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {availableClients.map(clientId => (
                <option key={clientId} value={clientId}>
                  {clientId}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && !marginStatus ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        ) : marginStatus ? (
          <>
            {/* Margin Call Alert */}
            {marginStatus.marginCallTriggered && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mr-2" />
                  <h3 className="text-lg font-medium text-red-800">
                    MARGIN CALL TRIGGERED
                  </h3>
                </div>
                <p className="text-red-700 mt-1">
                  Margin shortfall of ${marginStatus.marginShortfall.toFixed(2)} detected. 
                  Immediate action required to meet margin requirements.
                </p>
              </div>
            )}

            {/* Key Metrics */}
            <MetricsCards marginStatus={marginStatus} />

            {/* Margin Status Details */}
            <MarginStatus marginStatus={marginStatus} />

            {/* Positions Table */}
            <PositionsTable 
              positions={marginStatus.positions} 
              loading={loading}
            />

            {/* Market Data Table */}
            <MarketDataTable 
              marketData={marketData} 
              loading={loading}
            />
          </>
        ) : null}
      </div>
    </div>
  );
};

export default Dashboard;
