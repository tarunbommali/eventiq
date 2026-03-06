const Redis = require("ioredis");

let redis = null;

const connectRedis = async () => {
  // Only attempt connection if REDIS_HOST is explicitly configured
  if (!process.env.REDIS_HOST) {
    console.log("REDIS_HOST not set — Redis disabled (seat locking uses fallback)");
    return;
  }

  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null; // stop retrying after 3 attempts
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on("connect", () => {
    console.log("Redis connected successfully");
  });

  redis.on("error", (err) => {
    console.error("Redis connection error:", err.message);
  });

  try {
    await redis.connect();
  } catch (err) {
    console.warn("Redis not available, seat locking disabled:", err.message);
    redis = null;
  }
};

const getRedis = () => redis;

module.exports = { getRedis, connectRedis };
