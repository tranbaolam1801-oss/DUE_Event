import dotenv from 'dotenv';
dotenv.config();

import { configureDatabaseUrl } from './databaseUrl';
configureDatabaseUrl();

import { PrismaClient } from '@prisma/client';
import './index';

const databaseUrl = process.env.DATABASE_URL || '';
const isPostgres =
  /^postgres(?:ql)?:/.test(databaseUrl) &&
  !databaseUrl.includes('POOLER_HOST') &&
  !databaseUrl.includes('USER:PASSWORD');

const globalDatabase = globalThis as unknown as { myDuePrisma?: PrismaClient };

let ClientConstructor = PrismaClient;
if (isPostgres) {
  try {
    ClientConstructor = require('../../generated/postgresql').PrismaClient as typeof PrismaClient;
  } catch (error) {
    throw new Error(
      `PostgreSQL was selected but the generated PostgreSQL Prisma client is unavailable: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

const prisma = globalDatabase.myDuePrisma ?? new ClientConstructor();
globalDatabase.myDuePrisma = prisma;

export default prisma;
