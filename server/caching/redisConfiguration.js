import { createClient } from 'redis';

let client; // Declare client variable outside the function

async function connect() {
  try {
    client = createClient({
      host: 'localhost',
      port: 6379
    });
    await client.connect();
    console.log('Connected to Redis server');
  } catch (error) {
    console.error('Redis connection error:', error.toString());
    // Handle connection errors gracefully, e.g., retry logic or fallback behavior
    throw error
  }
}

// Helper function to get a cached value
async function get(key) {
  try {
    if (!client) {
      await connect(); // Ensure connection before attempting operations
    }
    return await client.get(key);
  } catch (error) {
    console.error('Error getting value from Redis:', error);
    return undefined;
  }
}

async function set(key, value, expiry = null) {
  try {
    if (!client) {
      await connect(); // Ensure connection before attempting operations
    }
    await client.set(key, JSON.stringify(value), expiry ? { EX: expiry } : undefined);
  } catch (error) {
    console.error('Error setting value in Redis:', error);
    return undefined;
  }
}

async function del(key) {
  try {
    if (!client) {
      await connect(); // Ensure connection before attempting operations
    }
    return await client.del(key);
  } catch (error) {
    console.error('Error deleting value in Redis:', error);
    return undefined;
  }
}

async function getWithTimeout(key, timeout = 2000) {
  return Promise.race([
    get(key),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Redis operation timed out')), timeout);
    })
  ]);
}

async function setWithTimeout(key, data, timing, timeout = 2000) {
  return Promise.race([
    set(key, data, timing),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Redis operation timed out')), timeout);
    })
  ]);
}

async function deleteWithTimeout(key, timeout = 2000) {
  return Promise.race([
    del(key),
    new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Redis operation timed out')), timeout);
    })
  ]);
}

export { get, set, del, getWithTimeout, setWithTimeout, deleteWithTimeout }; // Export helper functions
