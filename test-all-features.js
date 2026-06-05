#!/usr/bin/env node
/**
 * Chạy toàn bộ test đối chiếu yêu cầu đề bài.
 * Usage: node test-all-features.js
 */
const { spawnSync } = require('child_process');

console.log('Running Jest full test suite + requirements checklist...\n');

const result = spawnSync('npm', ['test'], { stdio: 'inherit', shell: true });
if (result.status !== 0) process.exit(result.status);

const req = spawnSync('npm', ['run', 'test:requirements'], { stdio: 'inherit', shell: true });
process.exit(req.status || 0);
