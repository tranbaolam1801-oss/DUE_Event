import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: process.env.JWT_SECRET || 'eventflow-jwt-secret-key-due-danang-2026',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  uploadDir: process.env.UPLOAD_DIR || './uploads',
  maxFileSize: Math.min(parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), process.env.VERCEL ? 4000000 : 10485760),
  aiApiKey: process.env.AI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'rule-based',
  jwtExpiresIn: '30d',
};
