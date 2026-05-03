#!/usr/bin/env node

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3456;
const ROOT = process.cwd();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

// Ensure CSS is built before serving
const cssPath = path.join(ROOT, 'dist/emily.min.css');
if (!fs.existsSync(cssPath)) {
  console.log('  Building CSS first...\n');
  require('./index.js').build({ keepFull: true });
}

const server = http.createServer((req, res) => {
  let urlPath = req.url.split('?')[0]; // strip query strings
  if (urlPath === '/') urlPath = '/showcase.html';

  const filePath = path.join(ROOT, urlPath);

  // Safety: don't serve files outside ROOT
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end(`Not found: ${urlPath}`);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': mime });
    res.end(data);
  });
});

server.listen(PORT, '127.0.0.1', () => {
  const url = `http://localhost:${PORT}`;

  console.log('');
  console.log('  emilyCSS showcase');
  console.log('  ' + '─'.repeat(30));
  console.log(`  Local: ${url}`);
  console.log('');
  console.log('  Press Ctrl+C to stop');
  console.log('');

  // Open in default browser
  const openCmd =
    process.platform === 'win32' ? `start "" "${url}"` :
    process.platform === 'darwin' ? `open "${url}"` :
    `xdg-open "${url}"`;

  exec(openCmd, (err) => {
    if (err) {
      console.log(`  Could not open browser automatically.`);
      console.log(`  Open manually: ${url}\n`);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use. Stop the other process and try again.\n`);
  } else {
    console.error('\n  Server error:', err.message, '\n');
  }
  process.exit(1);
});
