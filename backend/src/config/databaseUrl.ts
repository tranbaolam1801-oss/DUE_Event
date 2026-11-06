import fs from 'fs';
import path from 'path';
import { isProductionRuntime } from './runtime';

function requirePostgresUrl(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} must be configured with a Supabase PostgreSQL connection string in production`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid PostgreSQL connection string in production`);
  }

  if (
    !['postgres:', 'postgresql:'].includes(parsed.protocol) ||
    !parsed.hostname ||
    !parsed.username ||
    !parsed.password ||
    /placeholder|your[_-]?project|pooler_host|user:password/i.test(value)
  ) {
    throw new Error(`${name} must be a complete PostgreSQL connection string in production`);
  }

  return value;
}

export function configureDatabaseUrl(): string {
  if (isProductionRuntime()) {
    if (process.env.USE_LOCAL_SQLITE === 'true') {
      throw new Error('USE_LOCAL_SQLITE cannot be enabled in production');
    }

    const databaseUrl = requirePostgresUrl('DATABASE_URL', process.env.DATABASE_URL);
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = requirePostgresUrl('DIRECT_URL', process.env.DIRECT_URL);
    return databaseUrl;
  }

  const workingDirectory = process.cwd();
  const backendDirectory = fs.existsSync(path.resolve(workingDirectory, 'backend', 'prisma'))
    ? path.resolve(workingDirectory, 'backend')
    : workingDirectory;
  const schemaDirectory = path.resolve(backendDirectory, 'prisma');
  const databaseCandidates = [
    path.resolve(schemaDirectory, 'dev.db'),
    path.resolve(schemaDirectory, 'prisma', 'dev.db'),
    path.resolve(workingDirectory, 'prisma', 'dev.db'),
    path.resolve(workingDirectory, 'prisma', 'prisma', 'dev.db'),
  ];
  const databasePath = databaseCandidates.find((candidate) => fs.existsSync(candidate)) || databaseCandidates[0];
  const relativePath = path.relative(schemaDirectory, databasePath).replace(/\\/g, '/');
  const sqliteUrl = `file:${relativePath.startsWith('.') ? relativePath : `./${relativePath}`}`;
  process.env.DATABASE_URL = process.env.DATABASE_URL?.startsWith('file:')
    ? process.env.DATABASE_URL
    : sqliteUrl;
  delete process.env.DIRECT_URL;
  return sqliteUrl;
}
