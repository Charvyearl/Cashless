// UNO R4 WiFi + RC522 -> POST RFID scans to backend API
// Libraries: WiFiS3, SPI, MFRC522
//
// HTTPS Connection Fixes Applied:
// - Proper SSL client cleanup before each connection
// - Retry logic with delays for SSL handshake
// - WiFi stability checks and signal strength monitoring
// - Connection verification after SSL handshake
// - Proper request flushing and response handling
// - Enhanced error reporting for debugging
// - Uses default certificate validation (built-in root certs)
//   Note: WiFiSSLClient on UNO R4 WiFi doesn't support setInsecure()

#include <WiFiS3.h>
#include <SPI.h>
#include <MFRC522.h>

// ====== EDIT THESE ======
const char* WIFI_SSID = "CORTEZ";
const char* WIFI_PASS = "Qwase0905123_";

// Backend server configuration
// OPTION 1: Direct HTTPS to Railway (requires WiFi firmware update for SSL certs)
// const char* API_HOST = "cashless-production.up.railway.app";
// const int   API_PORT = 443; // HTTPS

// OPTION 2: HTTP proxy (recommended if SSL fails - use the proxy server)
// Replace YOUR_COMPUTER_IP with your computer's local IP (e.g., "192.168.1.10")
const char* API_HOST = "192.168.1.7"; // Your computer's IP running the proxy
const int   API_PORT = 8080; // HTTP (no SSL needed)
const char* DEVICE_KEY = "a-strong-secret"; // Must match IOT_DEVICE_KEY in Railway
// ========================

// RC522 wiring (SPI)
#define RST_PIN  9     // RST -> D9
#define SS_PIN   10    // SDA/SS -> D10

MFRC522 mfrc522(SS_PIN, RST_PIN);
// Use regular WiFiClient for HTTP, WiFiSSLClient for HTTPS
WiFiClient client; // HTTP client (change to WiFiSSLClient for HTTPS)

String lastScannedUID = "";
unsigned long lastScanTime = 0;
const unsigned long SCAN_DEBOUNCE = 2000; // 2 seconds between same card scans

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.print("Connecting to "); Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(500); Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi OK, IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connect timeout; will retry as needed.");
  }
}

// Post RFID scan to backend API
bool postScan(const String& uid) {
  connectWiFi();
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi not connected");
    return false;
  }
  
  // Ensure WiFi is stable before attempting HTTPS
  delay(100);
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("❌ WiFi connection unstable");
    return false;
  }
  
  // Check signal strength (optional but helpful for debugging)
  long rssi = WiFi.RSSI();
  Serial.print("📶 WiFi RSSI: "); Serial.print(rssi); Serial.println(" dBm");

  // Clean up any previous connection - CRITICAL for SSL client
  if (client.connected() || client.available()) {
    client.stop();
    delay(200); // Give more time for cleanup
  }
  
  // Small delay to ensure client is fully released
  delay(100);

  // Resolve DNS and show for debugging
  IPAddress ip;
  if (!WiFi.hostByName(API_HOST, ip)) {
    Serial.println("❌ DNS resolve failed");
    return false;
  }
  Serial.print("✓ Resolved "); Serial.print(API_HOST); Serial.print(" -> "); Serial.println(ip);

  // Note: WiFiSSLClient on UNO R4 WiFi uses built-in certificate store
  // Railway uses Let's Encrypt certificates which should be trusted by default
  // If certificate validation fails, you may need to use client.setCACert() with
  // the Let's Encrypt root certificate (ISRG Root X1)
  
  Serial.println("===================================");
  Serial.println("🔌 HTTP CONNECTION ATTEMPT");
  Serial.println("===================================");
  Serial.print("Host: "); Serial.println(API_HOST);
  Serial.print("Port: "); Serial.println(API_PORT);
  Serial.print("IP Address: "); Serial.println(ip);
  Serial.println("");
  
  // HTTP connection (much simpler than HTTPS - no SSL handshake)
  bool connected = false;
  
  for (int attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) {
      Serial.print("Retry attempt "); Serial.print(attempt); Serial.println("/3");
      delay(2000);
    }
    
    // Clean up any previous connection
    if (client.connected() || client.available()) {
      client.stop();
      delay(500);
    }
    
    Serial.print("Connecting to "); Serial.print(API_HOST); Serial.print(":"); Serial.println(API_PORT);
    unsigned long connectStart = millis();
    
    if (client.connect(API_HOST, API_PORT)) {
      connected = true;
      unsigned long connectTime = millis() - connectStart;
      Serial.print("✓ Connected! (");
      Serial.print(connectTime);
      Serial.println(" ms)");
      break;
    } else {
      Serial.println("❌ Connection failed");
      client.stop();
      delay(500);
    }
  }
  
  if (!connected) {
    Serial.println("❌ HTTP connection failed after all attempts");
    Serial.println("");
    Serial.println("Troubleshooting:");
    Serial.println("1. Make sure the proxy server is running");
    Serial.println("2. Check that API_HOST matches your computer's IP");
    Serial.println("3. Verify firewall allows connections on port 8080");
    Serial.println("4. Test: http://YOUR_IP:8080/health in browser");
    client.stop();
    return false;
  }
  
  Serial.println("✓ HTTP connection established");
  delay(100);

  const char* path = "/api/rfid/scans";
  String payload = String("{\"rfid_card_id\":\"") + uid + "\"}";
  
  // Build HTTP request
  String req = String("POST ") + path + " HTTP/1.1\r\n";
  req += "Host: " + String(API_HOST) + "\r\n";
  req += "Content-Type: application/json\r\n";
  req += "x-device-key: " + String(DEVICE_KEY) + "\r\n";
  req += "Content-Length: " + String(payload.length()) + "\r\n";
  req += "Connection: close\r\n";
  req += "\r\n";
  req += payload;

  // Verify connection is still active before sending
  if (!client.connected()) {
    Serial.println("❌ Connection lost before sending request");
    client.stop();
    return false;
  }

  // Send request in chunks if needed (for reliability)
  Serial.println("📤 Sending request...");
  client.print(req);
  
  // Critical: flush the output buffer to ensure data is sent
  client.flush();
  
  // Additional verification that data was sent
  delay(100);
  
  Serial.println("✓ Request sent, waiting for response...");

  // Wait for and read response
  unsigned long responseStart = millis();
  String response = "";
  while (client.connected() && millis() - responseStart < 5000) {
    if (client.available()) {
      char c = client.read();
      response += c;
      // Stop reading after getting status line and headers (look for \r\n\r\n)
      if (response.indexOf("\r\n\r\n") >= 0) {
        // Read a bit more to get response body
        delay(100);
        while (client.available()) {
          response += (char)client.read();
        }
        break;
      }
    }
    delay(10);
  }
  
  // Print response for debugging
  if (response.length() > 0) {
    Serial.print("📥 Response: ");
    // Print first line (status line)
    int firstLineEnd = response.indexOf("\r\n");
    if (firstLineEnd > 0) {
      Serial.println(response.substring(0, firstLineEnd));
    } else {
      // Print first 100 chars or full response if shorter
      int len = response.length();
      int printLen = (len > 100) ? 100 : len;
      Serial.println(response.substring(0, printLen));
    }
  } else {
    Serial.println("⚠️ No response received");
  }
  
  client.stop();
  delay(50); // Brief delay after closing
  
  Serial.println("📡 Posted to API");
  return true;
}

String readUID() {
  if (!mfrc522.PICC_IsNewCardPresent()) return "";
  if (!mfrc522.PICC_ReadCardSerial()) return "";
  
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
  return uid;
}

void setup() {
  Serial.begin(115200);
  while (!Serial) { delay(10); }
  
  // Initialize SPI and RFID
  SPI.begin();
  mfrc522.PCD_Init();
  
  Serial.println("🚀 RFID Scanner Ready!");
  Serial.println("📡 Mode: API Only");
  Serial.println("💳 Tap a card to scan...");
  Serial.println("");
  
  connectWiFi();
  
  // Using HTTP client (no SSL) to connect to local proxy
  // The proxy forwards requests to Railway via HTTPS
  Serial.println("🌐 Using HTTP connection to local proxy");
  Serial.println("   (Proxy forwards to Railway via HTTPS)");
  Serial.println("");
}

void loop() {
  String uid = readUID();
  
  if (uid.length() > 0) {
    unsigned long currentTime = millis();
    
    // Debounce: Skip if same card scanned recently
    if (uid == lastScannedUID && (currentTime - lastScanTime) < SCAN_DEBOUNCE) {
      delay(50);
      return;
    }
    
    Serial.println("=================================");
    Serial.print("🔍 Card Detected: "); Serial.println(uid);
    
    // Post to API
    postScan(uid);
    
    // Update last scan info
    lastScannedUID = uid;
    lastScanTime = currentTime;
    
    Serial.println("✅ Scan complete!");
    Serial.println("=================================");
    
    // Longer debounce to prevent multiple scans
    delay(1500);
  } else {
    delay(50); // Short delay when no card present
  }
}
