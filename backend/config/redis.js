const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis server refused connection');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Redis retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return new Error('Redis max retry attempts reached');
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    client.on('connect', () => {
      logger.info('Redis client connected');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('error', (err) => {
      logger.error(`Redis client error: ${err}`);
    });

    client.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    await client.connect();
    
    // Test the connection
    await client.ping();
    logger.info('Redis connection established successfully');
    
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    // Don't exit process, allow app to run without Redis
    logger.warn('Application will continue without Redis caching');
  }
};

const getRedisClient = () => {
  return client;
};

const cacheGet = async (key) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client not available for GET operation');
    return null;
  }
  
  try {
    const result = await client.get(key);
    return result ? JSON.parse(result) : null;
  } catch (error) {
    logger.error(`Redis GET error for key ${key}: ${error.message}`);
    return null;
  }
};

const cacheSet = async (key, value, expireInSeconds = 3600) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client not available for SET operation');
    return false;
  }
  
  try {
    await client.setEx(key, expireInSeconds, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error(`Redis SET error for key ${key}: ${error.message}`);
    return false;
  }
};

const cacheDel = async (key) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client not available for DEL operation');
    return false;
  }
  
  try {
    await client.del(key);
    return true;
  } catch (error) {
    logger.error(`Redis DEL error for key ${key}: ${error.message}`);
    return false;
  }
};

const cacheExists = async (key) => {
  if (!client || !client.isOpen) {
    return false;
  }
  
  try {
    const result = await client.exists(key);
    return result === 1;
  } catch (error) {
    logger.error(`Redis EXISTS error for key ${key}: ${error.message}`);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheExists
};