import app from './app';
import { config } from './config';

const PORT = config.port || 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`  EventFlow Backend API Server is running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
