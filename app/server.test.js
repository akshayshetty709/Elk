const test = require('node:test');
const assert = require('node:assert/strict');

test('practice API source includes expected lab endpoints', () => {
  const fs = require('node:fs');
  const source = fs.readFileSync(require.resolve('./server.js'), 'utf8');
  assert.match(source, /\/health/);
  assert.match(source, /\/fail/);
  assert.match(source, /Simulated database connection failure/);
});
