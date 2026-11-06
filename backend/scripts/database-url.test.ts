import test from 'node:test';
import assert from 'node:assert/strict';
import { configureDatabaseUrl } from '../src/config/databaseUrl';

test('production requires PostgreSQL URLs and never silently falls back to SQLite', () => {
  const original = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    useLocalSqlite: process.env.USE_LOCAL_SQLITE,
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
  };

  try {
    process.env.NODE_ENV = 'production';
    delete process.env.VERCEL_ENV;
    delete process.env.USE_LOCAL_SQLITE;
    delete process.env.DATABASE_URL;
    delete process.env.DIRECT_URL;
    assert.throws(() => configureDatabaseUrl(), /DATABASE_URL must be configured/);

    process.env.DATABASE_URL = 'file:./dev.db';
    process.env.DIRECT_URL = 'postgresql://app:secret@db.example.test/postgres';
    assert.throws(() => configureDatabaseUrl(), /DATABASE_URL must be a complete PostgreSQL/);

    process.env.DATABASE_URL = 'postgresql://app:secret@db.example.test/postgres';
    delete process.env.DIRECT_URL;
    assert.throws(() => configureDatabaseUrl(), /DIRECT_URL must be configured/);

    process.env.DIRECT_URL = 'postgresql://app:secret@db.example.test/postgres';
    assert.equal(configureDatabaseUrl(), process.env.DATABASE_URL);

    process.env.NODE_ENV = 'development';
    process.env.VERCEL_ENV = 'preview';
    process.env.DATABASE_URL = 'file:./dev.db';
    assert.throws(() => configureDatabaseUrl(), /DATABASE_URL must be a complete PostgreSQL/);
  } finally {
    if (original.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = original.nodeEnv;
    if (original.vercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = original.vercelEnv;
    if (original.useLocalSqlite === undefined) delete process.env.USE_LOCAL_SQLITE;
    else process.env.USE_LOCAL_SQLITE = original.useLocalSqlite;
    if (original.databaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = original.databaseUrl;
    if (original.directUrl === undefined) delete process.env.DIRECT_URL;
    else process.env.DIRECT_URL = original.directUrl;
  }
});
