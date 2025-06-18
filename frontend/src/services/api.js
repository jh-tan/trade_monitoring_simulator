import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error.response?.data || error);
      }
    );
  }

  async getMarketData() {
    return await this.client.get('/market/data');
  }

  async getMarketDataBySymbol(symbol) {
    return await this.client.get(`/market/data/${symbol}`);
  }

  async refreshMarketData() {
    return await this.client.post('/market/refresh');
  }

  // Positions API
  async getClientPositions(clientId) {
    return await this.client.get(`/positions/${clientId}`);
  }

  async createPosition(positionData) {
    return await this.client.post('/positions', positionData);
  }

  async updatePosition(id, positionData) {
    return await this.client.put(`/positions/${id}`, positionData);
  }

  async deletePosition(id) {
    return await this.client.delete(`/positions/${id}`);
  }

  // Margin API
  async getMarginStatus(clientId) {
    return await this.client.get(`/margin/status/${clientId}`);
  }

  async getAllMarginStatuses() {
    return await this.client.get('/margin/status');
  }

  // Health Check
  async healthCheck() {
    return await this.client.get('/health');
  }
}

export default new ApiService();
