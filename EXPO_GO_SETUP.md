# 📱 Expo Go Setup Guide

This guide will help you connect your Expo Go mobile app to the backend server.

## 🔧 Prerequisites

1. **Backend server** running on your computer
2. **Expo Go app** installed on your phone
3. **Same Wi-Fi network** - Your phone and computer must be on the same network

## 🚀 Quick Start

### Step 1: Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see output like:
```
🚀 Server running on port 3000
📊 Environment: development
🔗 Local: http://localhost:3000/health
🌐 Network: http://<your-ip>:3000/health
📱 For Expo Go: Make sure your phone and computer are on the same network
```

### Step 2: Start the Mobile App

```bash
cd mobile
npm install
npm start
```

This will open the Expo Dev Tools. You'll see a QR code.

### Step 3: Connect with Expo Go

1. Open **Expo Go** app on your phone
2. Scan the QR code
3. The app will automatically detect your computer's IP address and connect to the backend

## 🔍 How It Works

The mobile app now **automatically detects your computer's IP address** when running in Expo Go. No manual configuration needed!

The detection happens in `mobile/src/api/client.js`:
- Extracts IP from Expo's debugger connection
- Automatically uses that IP for API calls
- Falls back to localhost for emulators/simulators

## 🐛 Troubleshooting

### Problem: "Network connection failed"

**Possible Causes:**
1. Backend server is not running
2. Phone and computer are on different networks
3. Firewall blocking connections

**Solutions:**
1. Check backend server is running: `http://localhost:3000/health`
2. Verify both devices are on the same Wi-Fi network
3. Try temporarily disabling your firewall
4. Check Windows Firewall allows Node.js

### Problem: "CORS blocked" in console

**Solution:**
The backend is configured to accept connections from all local network IPs in development mode. If you still see this error:

1. Restart the backend server
2. Check the backend console for CORS warnings
3. Verify `NODE_ENV=development` in your backend `.env` file

### Problem: App shows old/wrong IP

**Solution:**
1. Close Expo Go completely
2. Stop `npm start` in the mobile folder (Ctrl+C)
3. Restart `npm start`
4. Scan the QR code again

### Manual IP Configuration (Advanced)

If auto-detection doesn't work, you can manually set the API URL:

**Option 1: Via app.json**
```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.10:3000"
    }
  }
}
```

**Option 2: Via environment variable**
Create `.env` file in `mobile/` folder:
```
EXPO_PUBLIC_CASHLESS_API_URL=http://192.168.1.10:3000
```

Replace `192.168.1.10` with your computer's actual IP address.

## 🌐 Finding Your Computer's IP Address

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your Wi-Fi adapter (usually starts with 192.168.x.x)

### macOS/Linux
```bash
ifconfig
```
Look for "inet" under your Wi-Fi interface (en0 on Mac)

## ✅ Verify Connection

Once the app loads, check the mobile app console logs. You should see:
```
📡 API Base URL: http://192.168.x.x:3000
```

## 🔒 Security Notes

- The server listens on `0.0.0.0` in development (allows network connections)
- CORS is open for local network IPs in development
- In production, both would be locked down
- Never commit `.env` files with sensitive data

## 📚 Additional Resources

- [Expo Go Documentation](https://docs.expo.dev/get-started/expo-go/)
- [Networking in Expo](https://docs.expo.dev/guides/using-expo-modules-with-react-native/)
- [Backend API Documentation](backend/README.md)

## 💡 Development Tips

1. **Keep terminal visible**: Watch for API logs showing requests from your phone
2. **Network changes**: If you switch Wi-Fi networks, restart both backend and Expo
3. **Testing**: Use the backend health endpoint to verify connectivity: `http://<your-ip>:3000/health`
4. **Debugging**: Check "Remote JS Debugging" in Expo Go for detailed error logs

