import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { configureDatabaseUrl } from './backend/src/config/databaseUrl';

dotenv.config();
configureDatabaseUrl();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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
