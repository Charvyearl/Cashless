# 🔧 Arduino HTTP Proxy Setup Guide

## Problem

The Arduino UNO R4 WiFi's `WiFiSSLClient` is failing to connect to Railway's HTTPS endpoint due to certificate validation issues. This is a common problem with embedded devices and SSL certificates.

## Solution

Use an HTTP proxy server that runs on your computer. The Arduino connects via HTTP (no SSL), and the proxy forwards requests to Railway via HTTPS.

## Setup Instructions

### Step 1: Start the Proxy Server

1. Open a terminal in the project directory
2. Run the proxy server:
   ```bash
   node arduino_http_proxy.js
   ```

3. You should see:
   ```
   ============================================================
   🚀 Arduino HTTP Proxy Server
   ============================================================
   Listening on: http://0.0.0.0:8080
   Forwarding to: https://cashless-production.up.railway.app
   ```

### Step 2: Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your WiFi adapter (e.g., `192.168.1.12`)

**Mac/Linux:**
```bash
ifconfig
```
Look for your WiFi interface (e.g., `192.168.1.12`)

### Step 3: Update Arduino Code

In `updated_arduino_code.ino`, make sure these settings are correct:

```cpp
const char* API_HOST = "192.168.1.12"; // Your computer's IP
const int   API_PORT = 8080; // HTTP proxy port
WiFiClient client; // HTTP client (not WiFiSSLClient)
```

### Step 4: Test the Proxy

1. Test from your browser:
   ```
   http://YOUR_IP:8080/health
   ```
   Should return: `{"status":"OK",...}`

2. Test from Arduino:
   - Upload the code
   - Scan an RFID card
   - Check Serial Monitor for connection status

## How It Works

```
Arduino (HTTP) → Your Computer (Proxy) → Railway (HTTPS)
     ↑                    ↑                      ↑
  No SSL            HTTP to HTTPS         Secure connection
```

1. Arduino sends HTTP request to your computer (port 8080)
2. Proxy server receives HTTP request
3. Proxy forwards request to Railway via HTTPS
4. Proxy receives HTTPS response from Railway
5. Proxy sends HTTP response back to Arduino

## Advantages

✅ **No SSL certificate issues** - Arduino uses plain HTTP
✅ **Works immediately** - No firmware updates needed
✅ **Secure** - Final connection to Railway is still HTTPS
✅ **Easy to debug** - Can see all requests in proxy logs

## Disadvantages

⚠️ **Requires computer running** - Proxy must be running for Arduino to work
⚠️ **Local network only** - Arduino and computer must be on same network
⚠️ **Not ideal for production** - But works great for development/testing

## Troubleshooting

### ❌ "Connection failed"
- **Check:** Proxy server is running
- **Check:** Arduino and computer on same WiFi network
- **Check:** Firewall allows port 8080
- **Check:** API_HOST matches your computer's IP

### ❌ "Proxy Error"
- **Check:** Railway server is accessible
- **Check:** Internet connection
- **Check:** Railway server is running

### ❌ Port 8080 already in use
- **Fix:** Change `PROXY_PORT` in `arduino_http_proxy.js`
- **Fix:** Update `API_PORT` in Arduino code to match

## Alternative: Fix HTTPS Directly

If you want to connect directly to Railway via HTTPS:

1. **Update WiFi firmware:**
   - Arduino IDE → Tools → Firmware Updater
   - Check for updates and install latest

2. **Change Arduino code:**
   ```cpp
   const char* API_HOST = "cashless-production.up.railway.app";
   const int   API_PORT = 443;
   WiFiSSLClient client; // HTTPS client
   ```

3. **Test connection:**
   - Upload code
   - Check Serial Monitor for SSL errors

## Production Deployment

For production, consider:
- Running proxy on a Raspberry Pi or small server
- Using a cloud proxy service
- Updating Arduino firmware to support Let's Encrypt certificates
- Using a different IoT board with better SSL support

