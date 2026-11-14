/**
 * Health check – works on Vercel (function), Netlify (function), and plain Node.
 */
function handler(req, res) {
  const payload = {
    status: 'ok',
    name: 'mamatharun-wedding',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
    uptime: typeof process.uptime === 'function' ? process.uptime() : undefined,
    site: 'Mamatha & Tarun Kumar — Where Forever Begins',
    date: '2026-12-03T12:13:00+05:30',
    venue: 'Shri Manikeshwari Function Hall, Yanagundi'
  };

  // CORS
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store');
  }

  // Vercel / Express compat: res.json vs res.end
  if (res.json) return res.json(payload);
  if (res.setHeader) res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = 200;
  res.end(JSON.stringify(payload));
}

module.exports = handler;