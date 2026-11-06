const test = require('node:test');
const assert = require('node:assert/strict');
const { validateApiUrl } = require('./check-vercel-env.cjs');

test('Vercel frontend requires an HTTPS API base under /api', () => {
  assert.doesNotThrow(() => validateApiUrl('https://backend.example.test/api'));
  assert.doesNotThrow(() => validateApiUrl('https://backend.example.test/api/'));
  assert.throws(() => validateApiUrl(undefined), /must be set/);
  assert.throws(() => validateApiUrl('http://localhost:3000/api'), /HTTPS/);
  assert.throws(() => validateApiUrl('https://frontend.example.test'), /ending in \/api/);
});
