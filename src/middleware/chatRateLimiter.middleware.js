const buckets = new Map();
const MAX_BUCKETS = 10000; // hard cap to prevent unbounded growth
const SWEEP_INTERVAL_MS = 30 * 1000;

// Periodic sweep to remove expired entries (defense against leaks
// from users who hit the limit once and never return).
const sweep = () => {
  const now = Date.now();
  for (const [key, entry] of buckets) {
    if (now >= entry.resetAt) {
      buckets.delete(key);
    }
  }
};

if (!sweep.timer) {
  sweep.timer = setInterval(sweep, SWEEP_INTERVAL_MS);
  sweep.timer.unref?.();
}

const chatRateLimiter = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = 10 * 1000;
  const max = 8;
  let entry = buckets.get(userId);

  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    buckets.set(userId, entry);
  }

  entry.count += 1;

  // Hard cap: drop a random expired-ish entry if we exceed MAX_BUCKETS
  if (buckets.size > MAX_BUCKETS) {
    sweep();
  }

  if (entry.count > max) {
    return res.status(429).json({
      success: false,
      message: 'Too many messages, slow down',
      retryAfterMs: Math.max(0, entry.resetAt - now),
    });
  }

  next();
};

module.exports = chatRateLimiter;