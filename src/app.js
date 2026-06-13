const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { loadEnv } = require('./config/env');

loadEnv();
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');
const { configureCloudinary } = require('./config/cloudinary');
const { requestLogger } = require('./middleware/requestLogger.middleware');

configureCloudinary();

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL?.replace(/\/+$/, ""),
  "http://localhost:5000",
  "http://127.0.0.1:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Cho phép request không có Origin (Postman, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/+$/, "");

    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(
      new Error(`CORS: origin ${origin} not allowed`)
    );
  },
  credentials: true,
}));
app.use(apiLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize());
app.use(xss());

app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
  })
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Mobile Restaurant API',
}));

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
