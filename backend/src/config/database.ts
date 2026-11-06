import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

const schemaDir = path.resolve(__dirname, '..', '..', 'prisma');
const candidateDbPaths = [
  path.resolve(process.cwd(), 'backend', 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'backend', 'prisma', 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'prisma', 'dev.db'),
  path.resolve(process.cwd(), 'prisma', 'prisma', 'dev.db'),
  path.resolve(schemaDir, 'dev.db'),
  path.resolve(schemaDir, 'prisma', 'dev.db'),
];

const localDbPath = candidateDbPaths.find((candidate) => fs.existsSync(candidate)) || path.resolve(schemaDir, 'dev.db');
const relativeDbPath = path.relative(schemaDir, localDbPath).replace(/\\/g, '/');
const sqliteDatabaseUrl = `file:${relativeDbPath.startsWith('.') ? relativeDbPath : `./${relativeDbPath}`}`;

if (process.env.SQL_HOST && process.env.SQL_USER) {
  const user = encodeURIComponent(process.env.SQL_USER || '');
  const pass = encodeURIComponent(process.env.SQL_PASSWORD || '');
  const host = encodeURIComponent(process.env.SQL_HOST || '');
  const db = process.env.SQL_DB_NAME || 'cloud_sql_development_database';
  process.env.DATABASE_URL = `postgresql://${user}:${pass}@localhost/${db}?host=${host}&schema=my_due`;
  process.env.DIRECT_URL = process.env.DATABASE_URL;
} else if (
  !process.env.DATABASE_URL ||
  process.env.DATABASE_URL.includes('POOLER_HOST') ||
  process.env.DATABASE_URL.includes('USER:PASSWORD') ||
  process.env.DATABASE_URL.includes('prisma/dev.db') ||
  process.env.DATABASE_URL.includes('prisma/prisma/dev.db')
) {
  process.env.DATABASE_URL = sqliteDatabaseUrl;
}

import { PrismaClient } from '@prisma/client';
import './index';

const isPostgres =
  /^postgres(?:ql)?:/.test(process.env.DATABASE_URL || '') &&
  !process.env.DATABASE_URL.includes('POOLER_HOST') &&
  !process.env.DATABASE_URL.includes('USER:PASSWORD');

const globalDatabase = globalThis as unknown as { myDuePrisma?: PrismaClient };

let ClientConstructor = PrismaClient;
if (isPostgres) {
  try {
    ClientConstructor = require('../../generated/postgresql').PrismaClient as typeof PrismaClient;
  } catch {
    ClientConstructor = PrismaClient;
  }
}

const prisma = globalDatabase.myDuePrisma ?? new ClientConstructor();
globalDatabase.myDuePrisma = prisma;

export default prisma;
