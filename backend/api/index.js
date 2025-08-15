// Single entry for all /api/* requests on Vercel
// Dispatches to specific handlers based on req.url
import healthHandler from './health.js';

function sendJSON(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function setCORS(res) {
  const origin = process.env.CORS_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCORS(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  // Normalize path (Vercel passes full path incl. /api/...)
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname || '/';

  try {
    if (pathname === '/api/health') {
      return healthHandler(req, res);
    }

    // Add additional dispatch cases here, e.g. /api/auth, etc.

    return sendJSON(res, 404, { error: 'Not Found', path: pathname });
  } catch (err) {
    console.error('API error:', err);
    return sendJSON(res, 500, { error: 'Internal Server Error', message: err?.message });
  }
}
