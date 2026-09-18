/**
 * Lightweight Zero-Dependency Server & High-Speed CORS API Proxy
 * For RollDek AI Canvas Studio
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { URL, fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3002;
const STATIC_ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

/**
 * High-speed Streaming Reverse Proxy to eliminate browser CORS restrictions
 */
function handleProxy(req, res) {
  sendCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host}`);
  const target = reqUrl.searchParams.get('target');

  if (!target) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing target query param' }));
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(target);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid target URL' }));
    return;
  }

  const client = targetUrl.protocol === 'https:' ? https : http;

  // Prepare outgoing headers
  const forwardHeaders = { ...req.headers };
  delete forwardHeaders.host;
  delete forwardHeaders.origin;
  delete forwardHeaders.referer;
  delete forwardHeaders['content-length'];

  const proxyReq = client.request(
    targetUrl,
    {
      method: req.method,
      headers: forwardHeaders
    },
    (proxyRes) => {
      sendCorsHeaders(res);
      // Copy response headers
      for (const [key, value] of Object.entries(proxyRes.headers)) {
        if (!['access-control-allow-origin', 'access-control-allow-methods'].includes(key.toLowerCase())) {
          res.setHeader(key, value);
        }
      }
      res.writeHead(proxyRes.statusCode || 200);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on('error', (err) => {
    console.error('Proxy request error:', err);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy request failed: ' + err.message }));
    }
  });

  req.pipe(proxyReq);
}

/**
 * Static file server
 */
function serveStatic(req, res) {
  sendCorsHeaders(res);

  let reqPath = new URL(req.url, `http://${req.headers.host}`).pathname;
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.normalize(path.join(STATIC_ROOT, reqPath));

  // Security check: ensure path is within STATIC_ROOT
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': mime,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache'
    });

    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api/proxy')) {
    handleProxy(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 RollDek AI Canvas Studio 正在运行`);
  console.log(`👉 画布访问地址: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
});
