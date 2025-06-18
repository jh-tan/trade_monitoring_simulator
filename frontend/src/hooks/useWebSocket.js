import { useEffect, useRef, useState } from 'react';
import websocketService from '../services/websocket';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const listenersRef = useRef({});

  useEffect(() => {
    websocketService.connect();
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    websocketService.on('connect', handleConnect);
    websocketService.on('disconnect', handleDisconnect);

    return () => {
      websocketService.off('connect', handleConnect);
      websocketService.off('disconnect', handleDisconnect);
      websocketService.disconnect();
    };
  }, []);

  const subscribe = (event, callback) => {
    if (!listenersRef.current[event]) {
      listenersRef.current[event] = [];
    }
    listenersRef.current[event].push(callback);
    websocketService.on(event, callback);
  };

  const unsubscribe = (event, callback) => {
    websocketService.off(event, callback);
    if (listenersRef.current[event]) {
      listenersRef.current[event] = listenersRef.current[event].filter(
        cb => cb !== callback
      );
    }
  };

  const subscribeToClient = (clientId) => {
    websocketService.subscribeToClient(clientId);
  };

  const unsubscribeFromClient = (clientId) => {
    websocketService.unsubscribeFromClient(clientId);
  };

  return {
    isConnected,
    lastMessage,
    subscribe,
    unsubscribe,
    subscribeToClient,
    unsubscribeFromClient
  };
};
