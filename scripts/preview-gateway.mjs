import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const PORT = 4173;
const VITE_PORT = 4172;

const certPath = '/home/dev/Projects/agentic-gateway/packages/term-web/cert.pem';
const keyPath = '/home/dev/Projects/agentic-gateway/packages/term-web/key.pem';

const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

function proxyRequest(req, res) {
  const isHttps = Boolean(req.socket.encrypted);
  const options = {
    hostname: '127.0.0.1',
    port: VITE_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: req.headers.host || `localhost:${PORT}`,
      'x-forwarded-proto': isHttps ? 'https' : 'http',
      'x-forwarded-for': req.socket.remoteAddress
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: Vite preview is starting up...');
    }
  });

  req.pipe(proxyReq);
}

function proxyUpgrade(req, socket, head) {
  const options = {
    hostname: '127.0.0.1',
    port: VITE_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers
  };

  const proxyReq = http.request(options);
  proxyReq.on('upgrade', (proxyRes, proxySocket, proxyHead) => {
    socket.write(`HTTP/${proxyRes.httpVersion} ${proxyRes.statusCode} ${proxyRes.statusMessage}\r\n`);
    for (const [key, value] of Object.entries(proxyRes.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) socket.write(`${key}: ${v}\r\n`);
      } else {
        socket.write(`${key}: ${value}\r\n`);
      }
    }
    socket.write('\r\n');

    if (proxyHead && proxyHead.length) socket.write(proxyHead);
    if (head && head.length) proxySocket.write(head);

    proxySocket.pipe(socket);
    socket.pipe(proxySocket);
  });

  proxyReq.on('error', () => {
    socket.destroy();
  });

  proxyReq.end();
}

let httpsServer = null;
if (hasCerts) {
  httpsServer = https.createServer(
    {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath)
    },
    proxyRequest
  );
  httpsServer.on('upgrade', proxyUpgrade);
}

const httpServer = http.createServer(proxyRequest);
httpServer.on('upgrade', proxyUpgrade);

const gateway = net.createServer((socket) => {
  socket.once('data', (buffer) => {
    socket.pause();
    socket.unshift(buffer);

    // 0x16 indicates TLS ClientHello
    if (buffer[0] === 0x16 && httpsServer) {
      httpsServer.emit('connection', socket);
    } else {
      httpServer.emit('connection', socket);
    }

    process.nextTick(() => socket.resume());
  });
});

// Spawn vite preview on VITE_PORT (4172)
const viteProc = spawn('npx', ['vite', 'preview', '--port', String(VITE_PORT), '--host', '127.0.0.1'], {
  stdio: 'inherit',
  env: process.env
});

process.on('SIGTERM', () => {
  try { viteProc.kill(); } catch {}
  process.exit();
});
process.on('SIGINT', () => {
  try { viteProc.kill(); } catch {}
  process.exit();
});

gateway.listen(PORT, '0.0.0.0', () => {
  console.log(`[Gateway] Listening on 0.0.0.0:${PORT}`);
  console.log(`[Gateway] HTTP:  http://nur:${PORT}/`);
  if (hasCerts) {
    console.log(`[Gateway] HTTPS: https://nur:${PORT}/ (Secure Context: mic enabled for Tailscale)`);
  }
});
