const test = require('node:test');
const assert = require('node:assert/strict');
const { assertConnectionUrls, models } = require('./migrate-sqlite-to-postgres.cjs');

test('SQLite transfer requires a local SQLite source and PostgreSQL target', () => {
  assert.doesNotThrow(() => assertConnectionUrls(
    'file:./dev.db',
    'postgresql://app:secret@db.example.test/postgres'
  ));
  assert.throws(() => assertConnectionUrls(
    'postgresql://app:secret@db.example.test/postgres',
    'postgresql://app:secret@db.example.test/postgres'
  ), /SOURCE_DATABASE_URL/);
  assert.throws(() => assertConnectionUrls('file:./dev.db', 'file:./other.db'), /DIRECT_URL/);
});

test('SQLite migration inventory includes all SQLite models and excludes the PostgreSQL-only identity map', () => {
  assert.equal(new Set(models).size, models.length);
  assert.equal(models.length, 23);
  assert.equal(models.includes('LegacyIdentityMap'), false);
});
