# 🚀 Quick Start: Expo Go + Backend

## Step-by-Step Guide

### 1️⃣ Install Dependencies

```bash
# Backend
cd backend
npm install

# Mobile
cd ../mobile
npm install
```

### 2️⃣ Start Backend

```bash
cd backend
npm run dev
```

✅ **You should see:**
```
🚀 Server running on port 3000
📊 Environment: development
🔗 Local: http://localhost:3000/health
🌐 Network: http://<your-ip>:3000/health
📱 For Expo Go: Make sure your phone and computer are on the same network
```

### 3️⃣ Start Mobile App

```bash
cd mobile
npm start
```

✅ **You should see:**
- Expo Dev Tools in browser
- QR code in terminal

### 4️⃣ Connect with Expo Go

1. Open **Expo Go** app on your phone
2. **Scan the QR code**
3. Wait for app to load

✅ **You should see:**
- App loads successfully
- Can login and use features
- In console: `📡 API Base URL: http://192.168.x.x:3000`

---

## ⚠️ Troubleshooting

### ❌ "Network connection failed"

**Check:**
- [ ] Backend is running (`npm run dev`)
- [ ] Phone and computer on **same Wi-Fi**
- [ ] Windows Firewall allows Node.js
- [ ] Visit `http://localhost:3000/health` in browser (should show OK)

**Fix:**
```bash
# Restart backend
cd backend
npm run dev

# Restart Expo
cd mobile
npm start
```

### ❌ "CORS error"

**Fix:** Backend should allow all local IPs automatically. If not:
- Restart backend server
- Check `NODE_ENV=development` in backend

### ❌ Wrong IP address

**Fix:**
1. Close Expo Go app completely
2. Stop `npm start` (Ctrl+C)
3. Restart `npm start`
4. Scan QR code again

---

## 🔍 Quick Checks

### Is backend accessible?
```bash
# From your computer browser:
http://localhost:3000/health

# From your phone browser (replace with your IP):
http://192.168.1.10:3000/health
```

Both should show: `{"status":"OK",...}`

### Find your computer's IP
```bash
# Windows
ipconfig
# Look for "IPv4 Address" (starts with 192.168.x.x)

# Mac/Linux
ifconfig
# Look for "inet" (starts with 192.168.x.x)
```

---

## 📱 Requirements

- ✅ Backend running on computer
- ✅ Expo Go app on phone
- ✅ **Both on same Wi-Fi network**
- ✅ No VPN active
- ✅ Firewall allows Node.js

---

## 💡 What's New?

✨ **Auto IP Detection**: The app now automatically finds your backend server!

- No manual IP configuration needed
- Works on any Wi-Fi network
- Automatically uses your computer's local IP
- Falls back to emulator addresses when needed

---

## 🎯 Next Steps

Once connected, you can:
- Login with student/personnel accounts
- Browse menu items
- Place orders
- View transaction history

For detailed troubleshooting, see: **EXPO_GO_SETUP.md**

For technical details, see: **BACKEND_CONNECTION_FIX.md**

---

**Need Help?** Check the console logs:
- **Backend console**: Shows incoming API requests
- **Expo console**: Shows API URL being used (`📡 API Base URL: ...`)

