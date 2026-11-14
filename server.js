/**
 * Mamatha & Tarun Kumar — Wedding Site Server
 * Production-ready, zero-dependency static server + CDN proxy for film frames
 *
 * Env:
 *   PORT        - port to listen (default: 3000)
 *   HOST        - host to bind (default: 0.0.0.0)
 *   NODE_ENV    - production|development
 *   CDN_BASE    - override CDN origin (default: https://cdn.riwaaz.in/wedding-websites/themes/rameswaram)
 *   LOG_LEVEL   - silent|info|debug (default: info in dev, silent in prod unless DEBUG)
 *
 * Endpoints:
 *   GET /              -> index.html
 *   GET /health        -> {status, uptime, version}
 *   GET /api/cdn/*     -> proxies to CDN_BASE/* (fixes CORS for film frames)
 *   GET /*             -> static file from project root (public/, js/, etc)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PKG = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8')); }
  catch { return { name: 'mamatharun-wedding', version: '1.0.0' }; }
})();

const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';
const IS_PROD = process.env.NODE_ENV === 'production';
const CDN_BASE = (process.env.CDN_BASE || 'https://cdn.riwaaz.in/wedding-websites/themes/rameswaram').replace(/\/$/, '');
const LOG_LEVEL = process.env.LOG_LEVEL || (IS_PROD ? 'silent' : 'info');

function log(...args) { if (LOG_LEVEL !== 'silent') console.log(...args); }
function logError(...args) { console.error(...args); }

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ics': 'text/calendar; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.map': 'application/json',
  '.txt': 'text/plain; charset=utf-8'
};

const root = __dirname;
const rootResolved = path.resolve(root);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '0',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

const STATIC_CACHE = IS_PROD
  ? 'public, max-age=31536000, immutable'
  : 'no-cache';

const HTML_CACHE = 'public, max-age=0, must-revalidate';

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    ...SECURITY_HEADERS
  });
  res.end(body);
}

function proxyToCDN(targetPathWithQs, clientRes) {
  const targetUrl = `${CDN_BASE}${targetPathWithQs}`;
  if (LOG_LEVEL === 'debug') log(`[proxy] ${targetPathWithQs} -> ${targetUrl}`);

  let parsed;
  try { parsed = new URL(targetUrl); }
  catch (e) {
    clientRes.writeHead(400, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    clientRes.end('Bad CDN path');
    return;
  }

  const req = https.request({
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (MamathaTarunWeddingBot/1.0)',
      'Accept': '*/*',
      'Referer': 'https://demos.riwaaz.in/rameswaram/'
    },
    timeout: 15000
  }, (cdnRes) => {
    // Forward status; on 404 from CDN, try serve local fallback for manifest/poster if available
    if (cdnRes.statusCode === 404 && targetPathWithQs.includes('manifest.json')) {
      cdnRes.resume();
      const localManifest = path.join(rootResolved, 'public', 'assets', 'frames-manifest.json');
      fs.readFile(localManifest, (err, data) => {
        if (err) {
          clientRes.writeHead(502, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS });
          clientRes.end('CDN miss and no local fallback');
          return;
        }
        clientRes.writeHead(200, {
          'Content-Type': 'application/json; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': HTML_CACHE,
          ...SECURITY_HEADERS
        });
        clientRes.end(data);
      });
      return;
    }

    const ct = cdnRes.headers['content-type'] || mime[path.extname(parsed.pathname).toLowerCase()] || 'application/octet-stream';
    clientRes.writeHead(cdnRes.statusCode, {
      'Content-Type': ct,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Cache-Control': cdnRes.headers['cache-control'] || STATIC_CACHE,
      ...(cdnRes.headers['content-length'] ? { 'Content-Length': cdnRes.headers['content-length'] } : {}),
      ...SECURITY_HEADERS
    });
    cdnRes.pipe(clientRes);
  });

  req.on('timeout', () => {
    req.destroy(new Error('CDN proxy timeout'));
  });

  req.on('error', (e) => {
    logError('[proxy error]', targetUrl, e.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, {
        'Content-Type': 'text/plain',
        'Access-Control-Allow-Origin': '*',
        ...SECURITY_HEADERS
      });
    }
    clientRes.end('CDN proxy error: ' + e.message);
  });

  req.end();
}

const handler = (req, res) => {
  const rawUrl = req.url || '/';
  const urlPath = rawUrl.split('?')[0];
  const qs = rawUrl.includes('?') ? '?' + rawUrl.split('?').slice(1).join('?') : '';

  let p;
  try { p = decodeURIComponent(urlPath); } catch { p = urlPath; }

  // --- Health check ---
  if (p === '/health' || p === '/api/health') {
    return sendJson(res, 200, {
      status: 'ok',
      name: PKG.name,
      version: PKG.version,
      uptime: process.uptime(),
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  }

  // --- CDN proxy route ---
  if (p.startsWith('/api/cdn/')) {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        ...SECURITY_HEADERS
      });
      res.end();
      return;
    }
    const cdnPath = p.replace('/api/cdn', ''); // /frames/...
    proxyToCDN(cdnPath + qs, res);
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      ...SECURITY_HEADERS
    });
    res.end();
    return;
  }

  // Allow only GET/HEAD for static
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Method Not Allowed');
    return;
  }

  if (p === '/' || p === '' || p === '/index.html') p = '/index.html';
  // Vercel serves public/ at the site root; keep local Node development compatible.
  if (p === '/assets' || p.startsWith('/assets/')) p = '/public' + p;

  // Security: prevent path traversal
  const fp = path.join(root, p.replace(/^\//, ''));
  const resolved = path.resolve(fp);

  // must stay inside root
  if (!resolved.startsWith(rootResolved + path.sep) && resolved !== rootResolved) {
    res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
    res.end('Forbidden');
    return;
  }

  // If directory, try index.html (not essential here, but safe)
  fs.stat(resolved, (err, stat) => {
    if (err) {
      // SPA fallback: if path doesn't have extension, serve index.html for client-side routing
      // For this wedding site we want 404 page to be index though (single page)
      // So only 404 if it's an asset extension, else serve index.html?
      // Safer: 404 for assets, index for non-extension was aggressive. We'll 404 all unknown for now,
      // except we let /celebrations etc fallback? No - keep strict 404.
      res.writeHead(404, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*', ...SECURITY_HEADERS });
      res.end('Not found: ' + p);
      return;
    }

    let finalPath = resolved;
    if (stat.isDirectory()) {
      finalPath = path.join(resolved, 'index.html');
      try {
        const s = fs.statSync(finalPath);
        if (!s.isFile()) throw new Error('no index');
      } catch {
        res.writeHead(403, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end('Forbidden');
        return;
      }
    } else if (!stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
      res.end('Not found');
      return;
    }

    const ext = path.extname(finalPath).toLowerCase();
    const ct = mime[ext] || 'application/octet-stream';

    // Caching strategy
    const isHtml = ext === '.html';
    const isImmutableAsset = ['.webp', '.jpg', '.jpeg', '.png', '.svg', '.woff', '.woff2', '.mp4'].includes(ext);

    const cacheControl = isHtml ? HTML_CACHE : (isImmutableAsset && IS_PROD ? STATIC_CACHE : 'public, max-age=3600');

    res.writeHead(200, {
      'Content-Type': ct,
      'Cache-Control': cacheControl,
      'Access-Control-Allow-Origin': '*',
      ...SECURITY_HEADERS
    });

    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    const stream = fs.createReadStream(finalPath);
    stream.on('error', e => {
      logError('stream error', e);
      if (!res.headersSent) res.writeHead(500, SECURITY_HEADERS);
      res.end('Server error');
    });
    stream.pipe(res);
  });
};

if (require.main === module && process.env.VERCEL !== '1') {
  const server = http.createServer(handler);

  server.on('error', e => {
    logError('Server error:', e.message);
    if (e.code === 'EADDRINUSE') {
      logError(`Port ${PORT} is in use. Try PORT=${PORT + 1} node server.js or kill the process.`);
      process.exit(1);
    }
  });

  function shutdown(signal) {
    log(`\n${signal} received — shutting down...`);
    server.close(() => {
      log('Server closed');
      process.exit(0);
    });
    setTimeout(() => process.exit(0), 10000).unref();
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  server.listen(PORT, HOST, () => {
    log(`\n  ${PKG.name} v${PKG.version} — Mamatha & Tarun Kumar`);
    log(`  → http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
    log(`  → health  http://127.0.0.1:${PORT}/health`);
    log(`  → CDN proxy /api/cdn/* → ${CDN_BASE}/*`);
    log(`  → env ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = handler;