import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaDir = path.resolve(__dirname, 'backend', 'prisma');
const candidateDbPaths = [
  path.resolve(schemaDir, 'dev.db'),
  path.resolve(schemaDir, 'prisma', 'dev.db'),
  path.resolve(__dirname, 'prisma', 'dev.db'),
  path.resolve(__dirname, 'prisma', 'prisma', 'dev.db'),
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
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);
const frontendRoot = path.resolve(__dirname, 'frontend');
const frontendDistPath = path.resolve(__dirname, 'frontend', 'dist');

async function startServer() {
  const { default: app } = await import('./backend/src/app');
  app.set('trust proxy', true);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      root: frontendRoot,
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
      },
      appType: 'spa',
      logLevel: 'error',
    });
    app.use(vite.middlewares);
  } else {
    const express = (await import('express')).default;
    app.use(express.static(frontendDistPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  EventFlow Fullstack App running on port ${PORT}!`);
    console.log(`  Dev/App URL: http://localhost:${PORT}`);
    console.log(`  Healthcheck: http://localhost:${PORT}/api/health`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
