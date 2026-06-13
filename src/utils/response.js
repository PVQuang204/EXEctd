const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../constants');

const success = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

const created = (res, data) => success(res, data, 201);

const paginated = (res, { data, page, limit, total }) => {
  res.json({
    success: true,
    data,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
    },
  });
};

const parsePagination = (query) => {
  let page = Number(query.page) || DEFAULT_PAGE;
  let limit = Number(query.limit) || DEFAULT_LIMIT;
  page = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), MAX_LIMIT);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const error = (res, statusCode, message, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  res.status(statusCode).json(body);
};

const notFound = (res, message = 'Resource not found') => error(res, 404, message);
const badRequest = (res, message = 'Bad request', errors = null) => error(res, 400, message, errors);
const unauthorized = (res, message = 'Unauthorized') => error(res, 401, message);
const forbidden = (res, message = 'Forbidden') => error(res, 403, message);

module.exports = {
  success,
  created,
  paginated,
  parsePagination,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
};
