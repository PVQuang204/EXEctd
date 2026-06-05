const http = require('http');
const { loadEnv } = require('./config/env');
loadEnv();

const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
  });
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
