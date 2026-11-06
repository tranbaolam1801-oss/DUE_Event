const { test } = require('node:test');
const assert = require('node:assert/strict');
const { databaseJsonReplacer } = require('../dist/utils/json');
const { Prisma } = require('@prisma/client');
test('nested bigint IDs stay exact, dates and decimals retain precision', () => {
 const data = { id: 9007199254740993n, rows: [{ id: 9223372036854775807n }], at: new Date('2026-01-01T00:00:00Z'), money: new Prisma.Decimal('1234567890.1234'), active: true, missing: null };
 const out = JSON.parse(JSON.stringify(data, databaseJsonReplacer));
 assert.equal(out.id, '9007199254740993');
 assert.equal(out.rows[0].id, '9223372036854775807');
 assert.equal(out.money, '1234567890.1234');
 assert.equal(out.at, '2026-01-01T00:00:00.000Z');
 assert.equal(out.active, true); assert.equal(out.missing, null);
});
