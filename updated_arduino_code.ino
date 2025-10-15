// UNO R4 WiFi + RC522 -> POST RFID scans to backend API
// Libraries: WiFiS3, SPI, MFRC522

#include <WiFiS3.h>
#include <SPI.h>
#include <MFRC522.h>

// ====== EDIT THESE ======
const char* WIFI_SSID = "CORTEZ";
const char* WIFI_PASS = "Qwase0905123_";

// Backend server (your PC's LAN IP and port)
const char* API_HOST = "192.168.1.3"; // Update to your PC's IP
const int   API_PORT = 3000;
// ========================

// RC522 wiring (SPI)
#define RST_PIN  9     // RST -> D9
#define SS_PIN   10    // SDA/SS -> D10

MFRC522 mfrc522(SS_PIN, RST_PIN);
WiFiClient client;

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
  if (WiFi.status() != WL_CONNECTED) return false;

  if (!client.connect(API_HOST, API_PORT)) {
    Serial.println("HTTP connect failed");
    return false;
  }

  const char* path = "/api/rfid/scans";
  String payload = String("{\"rfid_card_id\":\"") + uid + "\"}";
  String req =
    String("POST ") + path + " HTTP/1.1\r\n" +
    "Host: " + String(API_HOST) + "\r\n" +
    "Content-Type: application/json\r\n" +
    "Content-Length: " + String(payload.length()) + "\r\n" +
    "Connection: close\r\n\r\n" +
    payload;

  client.print(req);

  // Brief response consumption
  unsigned long t0 = millis();
  while (client.connected() && millis() - t0 < 2000) {
    while (client.available()) client.read();
  }
  client.stop();
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
  
  connectWiFi();
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
