import { useState, useEffect, useCallback } from 'react';
import apiService from '../services/api';
import websocketService from '../services/websocket';

export const useMarginData = (clientId) => {
  const [marginStatus, setMarginStatus] = useState(null);
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const fetchMarginStatus = useCallback(async () => {
    if (!clientId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getMarginStatus(clientId);
      setMarginStatus(response.data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message || 'Failed to fetch margin status');
      console.error('Error fetching margin status:', err);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const fetchMarketData = useCallback(async () => {
    try {
      const response = await apiService.getMarketData();
      setMarketData(response.data);
    } catch (err) {
      console.error('Error fetching market data:', err);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchMarginStatus(),
      fetchMarketData()
    ]);
  }, [fetchMarginStatus, fetchMarketData]);

  // WebSocket event handlers
  useEffect(() => {
    const handleMarketUpdate = (dataArray) => {
      setMarketData(prevData => {
        const updatedMap = new Map(prevData.map(item => [item.symbol, item]));

        dataArray.forEach(update => {
          const prevItem = updatedMap.get(update.symbol) || {};
          const newPrice = parseFloat(update.price);
          const oldPrice = parseFloat(prevItem.price ?? prevItem.currentPrice);

          const change = (typeof oldPrice === 'number' && !isNaN(oldPrice))
            ? newPrice - oldPrice
            : 0;

          const changePercent = (typeof oldPrice === 'number' && oldPrice !== 0 && !isNaN(oldPrice))
            ? (change / oldPrice) * 100
            : 0;

          const newItem = {
            ...prevItem,
            ...update,
            price: newPrice,
            currentPrice: newPrice,
            change,
            changePercent,
          };

          updatedMap.set(update.symbol, newItem);
        });

        return Array.from(updatedMap.values());
      });

      if (clientId) {
        fetchMarginStatus();
      }
    };

    const handleMarginAlert = (data) => {
      if (data.clientId === clientId) {
        setMarginStatus(prevStatus => ({
          ...prevStatus,
          ...data,
          alertTriggered: true
        }));
      }
    };

    websocketService.on('market_update', handleMarketUpdate);
    websocketService.on('margin_alert', handleMarginAlert);

    return () => {
      websocketService.off('market_update', handleMarketUpdate);
      websocketService.off('margin_alert', handleMarginAlert);
    };
  }, [clientId, fetchMarginStatus, fetchMarketData]);

  // Subscribe to client updates
  useEffect(() => {
    if (clientId) {
      websocketService.subscribeToClient(clientId);
      return () => {
        websocketService.unsubscribeFromClient(clientId);
      };
    }
  }, [clientId]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    console.log("New Market Data: ", marketData)
  }, [marketData])

  return {
    marginStatus,
    marketData,
    loading,
    error,
    lastUpdate,
    refreshData,
    fetchMarginStatus,
    fetchMarketData
  };
};
