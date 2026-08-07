const buckets = new Map();

const chatRateLimiter = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.ip;
  const now = Date.now();
  const windowMs = 10 * 1000;
  const max = 8;
  const entry = buckets.get(userId) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  buckets.set(userId, entry);

  if (entry.count > max) {
    return res.status(429).json({
      success: false,
      message: 'Too many messages, slow down',
    });
  }
  next();

  setTimeout(() => {
    const cur = buckets.get(userId);
    if (cur && Date.now() >= cur.resetAt) buckets.delete(userId);
  }, windowMs + 1000).unref?.();
};

module.exports = chatRateLimiter;
