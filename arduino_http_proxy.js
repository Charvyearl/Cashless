// Arduino HTTP Proxy Server
// This proxy allows Arduino to connect via HTTP (no SSL) and forwards to Railway HTTPS
// Run this on your computer: node arduino_http_proxy.js

const http = require('http');
const https = require('https');

const PROXY_PORT = 8080; // Local HTTP port for Arduino
const RAILWAY_HOST = 'cashless-production.up.railway.app';
const RAILWAY_PORT = 443;

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // CORS headers for Arduino
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-device-key, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Collect request body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', () => {
    // Forward request to Railway
    const options = {
      hostname: RAILWAY_HOST,
      port: RAILWAY_PORT,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: RAILWAY_HOST,
        'Content-Length': body.length
      }
    };
    
    // Remove headers that shouldn't be forwarded
    delete options.headers['connection'];
    delete options.headers['host'];
    options.headers['host'] = RAILWAY_HOST;
    
    console.log(`Forwarding to: https://${RAILWAY_HOST}${req.url}`);
    
    const proxyReq = https.request(options, (proxyRes) => {
      console.log(`Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`);
      
      // Copy response headers
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      
      // Pipe response
      proxyRes.pipe(res);
    });
    
    proxyReq.on('error', (error) => {
      console.error('Proxy request error:', error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Proxy Error: ' + error.message);
    });
    
    // Send request body
    if (body) {
      proxyReq.write(body);
    }
    proxyReq.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 Arduino HTTP Proxy Server');
  console.log('='.repeat(60));
  console.log(`Listening on: http://0.0.0.0:${PROXY_PORT}`);
  console.log(`Forwarding to: https://${RAILWAY_HOST}`);
  console.log('');
  console.log('📝 Update your Arduino code:');
  console.log(`   API_HOST = "YOUR_COMPUTER_IP"`);
  console.log(`   API_PORT = ${PROXY_PORT}`);
  console.log('');
  console.log('To find your IP: ipconfig (Windows) or ifconfig (Mac/Linux)');
  console.log('='.repeat(60));
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PROXY_PORT} is already in use!`);
    console.error('   Try changing PROXY_PORT in this file or stop the other service');
  } else {
    console.error('Server error:', error);
  }
  process.exit(1);
});

