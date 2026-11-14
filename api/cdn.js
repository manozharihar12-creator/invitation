/**
 * Vercel serverless: /api/cdn/* -> https://cdn.riwaaz.in/wedding-websites/themes/rameswaram/*
 * Also handles ?path= query (vercel rewrite alias)
 * Falls back to local public/assets/frames-manifest.json if CDN 404s manifest.
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

const CDN_BASE = (process.env.CDN_BASE || 'https://cdn.riwaaz.in/wedding-websites/themes/rameswaram').replace(/\/$/, '');

function extractCdnPath(req) {
  // req.url examples:
  //   /api/cdn/frames/manifest.json?v=x
  //   /api/cdn/frames/desktop/000.webp?v=cors2
  //   /api/cdn?path=frames/manifest.json&...
  // Vercel may set req.query when using destination query params – check it too.
  try {
    const url = new URL(req.url, 'https://x.local');
    // Vercel query string pass-through ?path=...
    const qpPath = url.searchParams.get('path') || (req.query && req.query.path);
    let targetPath;
    let qs;
    if (qpPath) {
      targetPath = qpPath.startsWith('/') ? qpPath : '/' + qpPath;
      // keep other query params as qs after removing path
      const clone = new URL(url.toString());
      clone.searchParams.delete('path');
      qs = clone.search || '';
    } else {
      // direct – use URL pathname minus /api/cdn prefix
      let pathname = url.pathname || '/';
      if (pathname.startsWith('/api/cdn')) pathname = pathname.replace('/api/cdn', '') || '/';
      targetPath = pathname;
      qs = url.search || '';
    }
    return { targetPath, qs };
  } catch {
    // ultra fallback
    const raw = req.url || '/';
    const qi = raw.indexOf('?');
    const qs = qi >= 0 ? raw.slice(qi) : '';
    const pathOnly = qi >= 0 ? raw.slice(0, qi) : raw;
    const cleaned = pathOnly.replace(/^\/api\/cdn/, '') || '/';
    return { targetPath: cleaned, qs };
  }
}

function sendLocalManifest(res) {
  try {
    const fp = path.join(__dirname, '..', 'public', 'assets', 'frames-manifest.json');
    if (!fs.existsSync(fp)) return false;
    const data = fs.readFileSync(fp);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.setHeader('X-Fallback', 'local-manifest');
    res.statusCode = 200;
    res.end(data);
    return true;
  } catch { return false; }
}

function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.statusCode = 204;
    return res.end();
  }

  let { targetPath, qs } = extractCdnPath(req);

  if (!targetPath.startsWith('/')) targetPath = '/' + targetPath;
  if (targetPath === '/' || targetPath === '') targetPath = '/frames/manifest.json';
  if (targetPath.includes('..') || targetPath.includes('://')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.statusCode = 400;
    return res.end('Bad path');
  }

  const targetUrl = `${CDN_BASE}${targetPath}${qs}`;
  let parsed;
  try { parsed = new URL(targetUrl); }
  catch { res.setHeader('Access-Control-Allow-Origin', '*'); res.statusCode = 400; return res.end('Bad URL'); }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const creq = https.request({
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (MamathaTarunWedding/1.0)',
      'Accept': '*/*',
      'Referer': 'https://demos.riwaaz.in/rameswaram/',
    },
    timeout: 15000,
  }, (cres) => {
    if (cres.statusCode === 404 && targetPath.includes('manifest.json')) {
      cres.resume();
      if (sendLocalManifest(res)) return;
    }
    res.statusCode = cres.statusCode || 200;
    if (cres.headers['content-type']) res.setHeader('Content-Type', cres.headers['content-type']);
    else {
      if (targetPath.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
      else if (targetPath.endsWith('.webp')) res.setHeader('Content-Type', 'image/webp');
      else if (targetPath.endsWith('.jpg') || targetPath.endsWith('.jpeg')) res.setHeader('Content-Type', 'image/jpeg');
    }
    if (cres.headers['cache-control']) res.setHeader('Cache-Control', cres.headers['cache-control']);
    else res.setHeader('Cache-Control', targetPath.includes('manifest.json') ? 'public, max-age=300' : 'public, max-age=31536000, immutable');
    if (cres.headers['content-length']) res.setHeader('Content-Length', cres.headers['content-length']);
    cres.pipe(res);
  });

  creq.on('timeout', () => creq.destroy(new Error('CDN timeout')));
  creq.on('error', (e) => {
    if (targetPath.includes('manifest.json') && sendLocalManifest(res)) return;
    if (!res.headersSent) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 502;
      res.end('Proxy error: ' + e.message);
    } else res.end();
  });
  creq.end();
}

module.exports = handler;