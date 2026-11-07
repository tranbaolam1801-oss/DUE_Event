import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { isProductionRuntime } from './runtime';
dotenv.config();

const workingDirectory = process.cwd();
const workspaceRoot = fs.existsSync(path.resolve(workingDirectory, 'backend', 'prisma'))
  ? workingDirectory
  : path.resolve(workingDirectory, '..');

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || (isProductionRuntime() ? '' : 'eventflow-local-development-secret'),
  corsOrigin: process.env.CORS_ORIGIN || (isProductionRuntime() ? '' : '*'),
  uploadDir: path.resolve(workspaceRoot, process.env.UPLOAD_DIR || 'uploads'),
  maxFileSize: Math.min(parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), process.env.VERCEL ? 4000000 : 10485760),
  aiApiKey: process.env.AI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'rule-based',
  jwtExpiresIn: '30d',
};

if (!config.jwtSecret) {
  throw new Error('JWT_SECRET must be configured before starting in production');
}

if (isProductionRuntime()) {
  if (Buffer.byteLength(config.jwtSecret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes in production');
  }
  if (!config.corsOrigin || config.corsOrigin.split(',').some((origin) => origin.trim() === '*')) {
    throw new Error('CORS_ORIGIN must explicitly list the frontend origins in production');
  }
}
