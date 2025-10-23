# 🔧 Backend Connection Fix for Expo Go

## Problem Summary

The mobile app (Expo Go) was unable to connect to the backend server because:

1. ❌ **Wrong IP Configuration**: App was using `localhost`/`10.0.2.2` which don't work on physical devices
2. ❌ **CORS Restrictions**: Backend only allowed specific localhost ports, not network IPs
3. ❌ **Server Binding**: Backend was binding to `localhost` instead of `0.0.0.0`
4. ❌ **No Auto-Detection**: No mechanism to automatically find the backend IP

## ✅ Changes Made

### 1. Mobile App (`mobile/src/api/client.js`)

**What Changed:**
- ✅ Added automatic IP detection using Expo's `Constants.expoConfig.hostUri`
- ✅ Automatically extracts your computer's IP from the Expo connection
- ✅ Falls back to emulator/simulator addresses when needed
- ✅ Added console log to show which API URL is being used

**How It Works:**
```javascript
// Automatically detects: http://192.168.1.10:3000
const debuggerHost = Constants.expoConfig?.hostUri; // "192.168.1.10:8081"
const ip = debuggerHost.split(':')[0]; // "192.168.1.10"
const BASE_URL = `http://${ip}:3000`;
```

**Dependencies Added:**
- `expo-constants@~17.0.3` (added to package.json)

### 2. Backend Server (`backend/server.js`)

**CORS Configuration:**
- ✅ Now accepts connections from all local network IPs:
  - `192.168.x.x` (most home networks)
  - `10.x.x.x` (corporate networks)
  - `172.16-31.x.x` (some office networks)
- ✅ Still blocks external/unknown IPs for security
- ✅ Logs blocked origins for debugging

**Server Binding:**
- ✅ Now listens on `0.0.0.0` in development mode
- ✅ Allows connections from any network interface
- ✅ Shows helpful startup messages with network URL
- ✅ In production, still binds to default (secure)

### 3. App Configuration (`mobile/app.json`)

**What Added:**
- ✅ Optional `extra.apiUrl` field for manual override
- ✅ Can be set to a specific IP if auto-detection fails

### 4. Dependencies (`mobile/package.json`)

**What Added:**
- ✅ `expo-constants@~17.0.3` for accessing Expo runtime config

## 🚀 How to Use

### Quick Start

1. **Install new dependency:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```
   
   Output will show:
   ```
   🚀 Server running on port 3000
   🔗 Local: http://localhost:3000/health
   🌐 Network: http://<your-ip>:3000/health
   📱 For Expo Go: Make sure your phone and computer are on the same network
   ```

3. **Start mobile app:**
   ```bash
   cd mobile
   npm start
   ```

4. **Scan QR code** with Expo Go app

5. **Check connection** - You should see in the logs:
   ```
   📡 API Base URL: http://192.168.x.x:3000
   ```

### That's it! No manual IP configuration needed! 🎉

## 🐛 Troubleshooting

### Still getting connection errors?

1. **Verify backend is running:**
   - Visit `http://localhost:3000/health` in your browser
   - Should show `{"status":"OK",...}`

2. **Check network:**
   - Phone and computer on same Wi-Fi network
   - No VPN running on either device
   - No guest network isolation

3. **Check firewall:**
   - Windows Defender might block Node.js
   - Allow Node.js in firewall settings

4. **Restart everything:**
   ```bash
   # Stop backend (Ctrl+C)
   # Stop Expo (Ctrl+C)
   # Restart backend
   npm run dev
   # Restart Expo
   npm start
   # Close and reopen Expo Go app
   ```

5. **Manual override (if needed):**
   
   Find your computer's IP:
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```
   
   Edit `mobile/app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "http://YOUR_COMPUTER_IP:3000"
       }
     }
   }
   ```

## 🔍 Testing the Fix

### Test 1: Health Check from Phone Browser
1. Find your computer's IP (e.g., 192.168.1.10)
2. Open phone browser
3. Visit: `http://192.168.1.10:3000/health`
4. Should see: `{"status":"OK",...}`

If this works, the backend is accessible. If not, it's a network/firewall issue.

### Test 2: Login Test
1. Open Expo Go app
2. Try to login
3. Check backend console for incoming requests
4. Check mobile app console for API URL being used

## 📊 What Each File Does

| File | Purpose | Changes |
|------|---------|---------|
| `mobile/src/api/client.js` | API client | Auto-detects backend IP from Expo connection |
| `mobile/package.json` | Dependencies | Added `expo-constants` |
| `mobile/app.json` | App config | Added optional manual API URL override |
| `backend/server.js` | Server setup | CORS for local IPs, listen on `0.0.0.0` |

## 🔒 Security Notes

**Development Mode:**
- Server accepts all local network IPs
- Server listens on all interfaces (`0.0.0.0`)
- CORS is permissive for local development

**Production Mode:**
- Only specific origins allowed
- Server binding can be more restrictive
- These changes don't affect production security

## ✅ Verification Checklist

- [ ] Backend starts without errors
- [ ] Backend shows network URL on startup
- [ ] Mobile app installs `expo-constants` successfully
- [ ] Mobile app console shows correct API URL
- [ ] Login works from Expo Go
- [ ] Backend console shows incoming API requests
- [ ] No CORS errors in mobile app console

## 📚 Additional Documentation

See `EXPO_GO_SETUP.md` for a detailed user guide.

## 💡 Technical Details

**Why `0.0.0.0`?**
- By default, Node.js binds to `localhost` (127.0.0.1)
- This only accepts connections from the same machine
- `0.0.0.0` means "all network interfaces"
- Allows connections from local network (same Wi-Fi)

**Why auto-detection?**
- IPs change (different Wi-Fi networks, DHCP)
- No manual configuration needed
- Works on any network automatically
- Same mechanism Expo uses for hot reload

**Why these CORS patterns?**
- Covers all common private network ranges
- RFC 1918 private address spaces
- Safe for local development
- Doesn't allow external/public IPs

## 🎯 Next Steps

Everything should work now! If you still have issues:

1. Read `EXPO_GO_SETUP.md` for detailed troubleshooting
2. Check firewall settings
3. Try manual IP configuration as fallback
4. Verify network connectivity with health check

---

**Summary:** The app now automatically finds your backend server when using Expo Go. No manual IP configuration needed! 🚀

