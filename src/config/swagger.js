const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const specPath = path.join(__dirname, '../docs/openapi.yaml');
const spec = yaml.load(fs.readFileSync(specPath, 'utf8'));

if (process.env.API_URL) {
  spec.servers = [{ url: process.env.API_URL, description: 'Configured API URL' }];
}

module.exports = spec;
