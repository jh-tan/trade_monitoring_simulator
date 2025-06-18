export const MARGIN_REQUIREMENTS = {
  MAINTENANCE_MARGIN_RATIO: 0.25,
  INITIAL_MARGIN_RATIO: 0.5,
  MARGIN_CALL_THRESHOLD: 0.3
};

export const WEBSOCKET_EVENTS = {
  MARKET_UPDATE: 'market_update',
  MARGIN_ALERT: 'margin_alert',
  POSITION_UPDATE: 'position_update',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect'
};

export const API_ENDPOINTS = {
  MARKET_DATA: '/market/data',
  POSITIONS: '/positions',
  MARGIN_STATUS: '/margin/status',
  HEALTH: '/health'
};

export const ALERT_TYPES = {
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  INFO: 'info'
};

export const TABLE_PAGE_SIZES = [10, 25, 50, 100];

export const REFRESH_INTERVALS = {
  FAST: 1000,
  NORMAL: 5000,
  SLOW: 30000
};
