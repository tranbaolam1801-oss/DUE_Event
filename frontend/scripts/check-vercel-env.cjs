function validateApiUrl(value) {
  if (!value) {
    throw new Error('VITE_API_URL must be set in the Vercel frontend project');
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_URL must be a valid HTTPS backend API URL ending in /api');
  }

  if (url.protocol !== 'https:' || url.pathname.replace(/\/+$/, '') !== '/api' || url.search || url.hash) {
    throw new Error('VITE_API_URL must be a valid HTTPS backend API URL ending in /api');
  }
}

if (require.main === module) {
  try {
    validateApiUrl(process.env.VITE_API_URL);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { validateApiUrl };
