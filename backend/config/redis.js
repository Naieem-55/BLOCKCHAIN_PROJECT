const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

const connectRedis = async () => {
  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('Redis reconnection attempts exceeded, disabling Redis');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      }
    });

    let errorLogged = false;
    
    client.on('connect', () => {
      logger.info('Redis client connected');
      errorLogged = false;
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
      errorLogged = false;
    });

    client.on('error', (err) => {
      // Only log the error once to avoid spam
      if (!errorLogged) {
        logger.warn(`Redis not available: ${err.message}. Application will continue without caching.`);
        errorLogged = true;
      }
    });

    client.on('end', () => {
      if (!errorLogged) {
        logger.warn('Redis client connection ended');
      }
    });

    await client.connect();
    
    // Test the connection
    await client.ping();
    logger.info('Redis connection established successfully');
    
  } catch (error) {
    logger.warn(`Redis not available: ${error.message}. Application will continue without caching.`);
    // Don't exit process, allow app to run without Redis
    client = null; // Set client to null to avoid further connection attempts
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