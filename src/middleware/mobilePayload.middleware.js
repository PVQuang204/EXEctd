const isMobileRequest = (req) => {
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  return /mobi|android|iphone|ipad|ipod|mobile/.test(ua);
};

const mobilePayloadMiddleware = (req, res, next) => {
  if (!isMobileRequest(req)) return next();
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    if (body && typeof body === 'object' && body.data && !Array.isArray(body.data)) {
      const obj = body.data;
      if (obj.description && typeof obj.description === 'string' && obj.description.length > 240) {
        obj.description = obj.description.slice(0, 240) + '…';
      }
    }
    return originalJson(body);
  };
  next();
};

module.exports = mobilePayloadMiddleware;
