const axios = require('axios');
const logger = require('../utils/logger');
const MarketData = require('../models/MarketData');

class MarketDataService {
  constructor() {
    this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    this.fallbackApiKey = process.env.TWELVE_DATA_API_KEY
    this.baseUrl = 'https://www.alphavantage.co/query';
    this.fallbackUrl = 'https://api.twelvedata.com';
  }

  async fetchRealTimePrice(symbols) {
    try {
      const promises = symbols.map(symbol =>
        axios.get(this.baseUrl, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: this.apiKey
          }
        })
      );

      const responses = await Promise.all(promises);
      return {
        priceData: this.processRealTimeData(responses, symbols),
        source: "alphavantage"
      };
    } catch (error) {
      logger.warn('Alpha Vantage API failed, trying fallback:', error.message);
      return {
        priceData: await this.fetchFallbackData(symbols),
        source: "twelvedata"
      };
    }
  }

  async fetchFallbackData(symbols) {
    try {
      // Twelve Data API call
      const response = await axios.get(`${this.fallbackUrl}/price`, {
        params: {
          symbol: symbols.join(','),
          apikey: this.fallbackApiKey
        }
      });

      return this.processFallbackData(response.data, symbols);
    } catch (error) {
      logger.error('All market data APIs failed:', error);
      throw new Error('Unable to fetch market data');
    }
  }


  processRealTimeData(responses, symbols) {
    return responses.map((response, index) => {
      const quote = response.data['Global Quote'];
      return {
        symbol: symbols[index],
        price: parseFloat(quote['05. price']),
        timestamp: new Date()
      };
    });
  }

  processFallbackData(data, symbols) {
    const results = [];

    if (symbols.length === 1) {
      results.push({
        symbol: symbols[0],
        price: parseFloat(data.price),
        timestamp: new Date()
      });
    } else {
      Object.entries(data).forEach(([symbol, info]) => {
        results.push({
          symbol: symbol,
          price: parseFloat(info.price),
          timestamp: new Date()
        });
      });
    }

    return results;
  }


  async updateMarketData(symbols) {
    try {
      const { priceData, source } = await this.fetchRealTimePrice(symbols);

      const dataToInsert = priceData.map(data => ({
        symbol: data.symbol,
        currentPrice: data.price,
        timestamp: data.timestamp,
        source: source
      }));

      // Perform batch insert or update
      await MarketData.bulkCreate(dataToInsert, {
        updateOnDuplicate: ['currentPrice', 'timestamp', 'source']
      });

      logger.info(`Updated market data for ${symbols.length} symbols`);
      return priceData;
    } catch (error) {
      logger.error('Failed to update market data:', error);
      throw error;
    }
  }

  async getLatestMarketData(symbols = null) {
    try {
      const where = symbols ? { symbol: symbols } : {};
      const data = await MarketData.findAll({
        where,
        order: [['timestamp', 'DESC']],
        limit: symbols ? symbols.length : 100
      });

      return data.map(item => ({
        symbol: item.symbol,
        currentPrice: parseFloat(item.currentPrice),
        timestamp: item.timestamp
      }));
    } catch (error) {
      logger.error('Failed to get market data from database:', error);
      throw error;
    }
  }
}

module.exports = new MarketDataService();
