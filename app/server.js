const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT || 3000);
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.json.log');

fs.mkdirSync(LOG_DIR, { recursive: true });

let failureMode = false;

function writeLog(level, message, fields = {}) {
  const event = {
    '@timestamp': new Date().toISOString(),
    'log.level': level,
    message,
    'service.name': 'practice-api',
    environment: process.env.APP_ENV || 'dev',
    ...fields
  };
  const line = JSON.stringify(event);
  console.log(line);
  fs.appendFile(LOG_FILE, line + '\n', () => {});
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

const server = http.createServer((req, res) => {
  const requestId = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (url.pathname === '/health') {
    writeLog('INFO', 'Health check requested', { requestId, route: '/health', status_code: 200 });
    return sendJson(res, 200, { status: 'ok', failureMode });
  }

  if (url.pathname === '/admin/failure-mode/on' && req.method === 'POST') {
    failureMode = true;
    writeLog('WARN', 'Failure mode enabled', { requestId, route: url.pathname, status_code: 200 });
    return sendJson(res, 200, { failureMode });
  }

  if (url.pathname === '/admin/failure-mode/off' && req.method === 'POST') {
    failureMode = false;
    writeLog('INFO', 'Failure mode disabled', { requestId, route: url.pathname, status_code: 200 });
    return sendJson(res, 200, { failureMode });
  }

  if (url.pathname === '/fail' || failureMode) {
    writeLog('ERROR', 'Simulated database connection failure', {
      requestId,
      route: url.pathname,
      status_code: 500,
      error_type: 'DatabaseConnectionError',
      error_detail: 'Practice-only simulated failure; no real database is used'
    });
    return sendJson(res, 500, {
      error: 'Internal Server Error',
      message: 'Simulated database connection failure',
      requestId
    });
  }

  if (url.pathname === '/') {
    writeLog('INFO', 'Request completed', { requestId, route: '/', status_code: 200 });
    return sendJson(res, 200, {
      service: 'practice-api',
      message: 'Hello from the ELK DevOps practice project',
      endpoints: ['/health', '/fail', 'POST /admin/failure-mode/on', 'POST /admin/failure-mode/off']
    });
  }

  writeLog('WARN', 'Route not found', { requestId, route: url.pathname, status_code: 404 });
  return sendJson(res, 404, { error: 'Not Found', requestId });
});

server.listen(PORT, '0.0.0.0', () => {
  writeLog('INFO', 'Server started', { port: PORT });
});

function shutdown() {
  writeLog('INFO', 'Server shutting down');
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
