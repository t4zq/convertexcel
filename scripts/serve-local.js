const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'public');
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || '127.0.0.1';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.wasm': 'application/wasm',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url, `http://${host}:${port}`);
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  const filePath = path.resolve(root, `.${decodeURIComponent(pathname)}`);

  if (!filePath.startsWith(root)) {
    response.writeHead(403);
    response.end('forbidden');
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end('not found');
      return;
    }

    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    response.end(data);
  });
});

server.listen(port, host, () => {
  console.log(`http://${host}:${port}`);
});
