#!/usr/bin/env node

// Simple Node.js reverse proxy for development/testing
// Runs without sudo on port 8080, proxies to backend on 3001

const http = require('http');
const httpProxy = require('http-proxy');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const proxy = httpProxy.createProxyServer({});
const PORT = 8080;
const BACKEND_URL = 'http://localhost:3001';
const STATIC_DIR = path.join(__dirname, 'build');

console.log(`🚀 Simple Proxy Server starting on port ${PORT}`);
console.log(`📁 Serving static files from: ${STATIC_DIR}`);
console.log(`🔄 Proxying /api/* to: ${BACKEND_URL}`);

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Proxy API requests to backend
  if (req.url.startsWith('/api/')) {
    console.log(`🔄 Proxying API request: ${req.method} ${req.url}`);
    proxy.web(req, res, { 
      target: BACKEND_URL,
      changeOrigin: true 
    });
    return;
  }

  // Serve static files
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Handle client-side routing (SPA)
  const fullPath = path.join(STATIC_DIR, filePath);
  
  if (!fs.existsSync(fullPath) && !filePath.includes('.')) {
    filePath = '/index.html'; // Fallback to index.html for SPA routes
  }
  
  const staticFilePath = path.join(STATIC_DIR, filePath);
  
  fs.readFile(staticFilePath, (err, data) => {
    if (err) {
      console.log(`❌ File not found: ${staticFilePath}`);
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    const mimeType = mime.lookup(staticFilePath) || 'text/plain';
    console.log(`📄 Serving: ${req.url} -> ${staticFilePath} (${mimeType})`);
    
    res.setHeader('Content-Type', mimeType);
    res.writeHead(200);
    res.end(data);
  });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('❌ Proxy error:', err.message);
  res.writeHead(500);
  res.end('Proxy error');
});

server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🌐 Your app should be accessible at: http://206.189.187.202:${PORT}`);
  console.log('');
  console.log('Test URLs:');
  console.log(`  Frontend: http://206.189.187.202:${PORT}/`);
  console.log(`  API: http://206.189.187.202:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});