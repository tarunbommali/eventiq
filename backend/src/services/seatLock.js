const { getRedis } = require("../config/redis");

const LOCK_TTL = 300; // 5 minutes TTL for distributed seat locks

// Lua script for atomic unlock: check-and-delete in a single Redis operation
// Prevents race conditions where another user could acquire the lock between GET and DEL
const UNLOCK_LUA_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * Acquire a distributed lock on a seat using Redis SET NX EX
 * The lock automatically expires after LOCK_TTL seconds to prevent deadlocks.
 * @param {string} eventId - Event ID
 * @param {number} seatNumber - Seat number to lock
 * @param {string} userId - User requesting the lock
 * @returns {boolean} true if lock acquired, false otherwise
 */
const lockSeat = async (eventId, seatNumber, userId) => {
  const redis = getRedis();
  if (!redis) return false; // fail-safe: deny booking when Redis is unavailable to prevent double-booking
  try {
    const key = `lock:${eventId}:seat:${seatNumber}`;
    // SET key value NX EX ttl — atomic acquire with TTL to prevent deadlocks
    const result = await redis.set(key, userId, "EX", LOCK_TTL, "NX");
    return result === "OK";
  } catch (err) {
    console.error("Redis lockSeat error:", err.message);
    return false;
  }
};

/**
 * Release a distributed lock using an atomic Lua script.
 * Only the lock owner can release it (compare-and-delete).
 * @param {string} eventId
 * @param {number} seatNumber
 * @param {string} userId - Only unlock if locked by this user
 * @returns {boolean}
 */
const unlockSeat = async (eventId, seatNumber, userId) => {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const key = `lock:${eventId}:seat:${seatNumber}`;
    // Atomic check-and-delete via Lua — prevents race between GET and DEL
    const result = await redis.eval(UNLOCK_LUA_SCRIPT, 1, key, userId);
    return result === 1;
  } catch (err) {
    console.error("Redis unlockSeat error:", err.message);
    return false;
  }
};

/**
 * Lock multiple seats atomically
 * @param {string} eventId
 * @param {number[]} seatNumbers
 * @param {string} userId
 * @returns {{ success: boolean, failedSeats: number[] }}
 */
const lockMultipleSeats = async (eventId, seatNumbers, userId) => {
  const failedSeats = [];
  const lockedSeats = [];

  for (const seat of seatNumbers) {
    const locked = await lockSeat(eventId, seat, userId);
    if (locked) {
      lockedSeats.push(seat);
    } else {
      failedSeats.push(seat);
    }
  }

  // If any seat failed, unlock all previously locked seats
  if (failedSeats.length > 0) {
    for (const seat of lockedSeats) {
      await unlockSeat(eventId, seat, userId);
    }
    return { success: false, failedSeats };
  }

  return { success: true, failedSeats: [] };
};

/**
 * Unlock multiple seats
 * @param {string} eventId
 * @param {number[]} seatNumbers
 * @param {string} userId
 */
const unlockMultipleSeats = async (eventId, seatNumbers, userId) => {
  for (const seat of seatNumbers) {
    await unlockSeat(eventId, seat, userId);
  }
};

/**
 * Check if a seat is locked
 * @param {string} eventId
 * @param {number} seatNumber
 * @returns {{ locked: boolean, lockedBy: string|null }}
 */
const isSeatLocked = async (eventId, seatNumber) => {
  const redis = getRedis();
  if (!redis) return { locked: false, lockedBy: null };
  try {
    const key = `lock:${eventId}:seat:${seatNumber}`;
    const lockedBy = await redis.get(key);
    return { locked: !!lockedBy, lockedBy };
  } catch (err) {
    console.error("Redis isSeatLocked error:", err.message);
    return { locked: false, lockedBy: null };
  }
};

module.exports = {
  lockSeat,
  unlockSeat,
  lockMultipleSeats,
  unlockMultipleSeats,
  isSeatLocked,
};
