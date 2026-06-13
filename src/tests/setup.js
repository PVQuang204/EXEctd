const { MongoMemoryReplSet } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const { loadEnv } = require('../config/env');

loadEnv();

let mongoServer;

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-32chars!!';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-32chars!';
  process.env.JWT_ACCESS_EXPIRE = '15m';
  process.env.JWT_REFRESH_EXPIRE = '7d';
  process.env.CLIENT_URL = 'http://localhost:3000';

  mongoServer = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: 'wiredTiger' },
  });
  await mongoose.connect(mongoServer.getUri());
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

afterEach(async () => {
  const testPath = expect.getState()?.testPath || '';
  if (testPath.includes('full-requirements') || testPath.includes('socket.realtime')) return;

  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});
