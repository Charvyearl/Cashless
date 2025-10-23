import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get the local network IP automatically when using Expo Go
// This works for both Android and iOS on physical devices
const getDeviceBaseUrl = () => {
  // For Expo Go on physical devices, use the debuggerHost to get your computer's IP
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    // Extract IP from "192.168.1.10:8081" format
    const ip = debuggerHost.split(':')[0];
    return `http://${ip}:3000`;
  }
  return null;
};

// Determine sensible defaults for emulator/simulator vs device
// - Android emulator: 10.0.2.2 maps to host localhost
// - iOS simulator: localhost works
// - Expo Go on physical device: automatically detect network IP
// - Production: use environment variable
const DEFAULT_BASE_URL = Platform.select({
  ios: getDeviceBaseUrl() || 'http://localhost:3000',
  android: getDeviceBaseUrl() || 'http://10.0.2.2:3000',
  default: 'http://localhost:3000',
});

// Allow override via Expo config env or process.env
// Priority: 1. Environment variable, 2. Expo extra config, 3. Auto-detected IP, 4. Default
const BASE_URL =
  (typeof process !== 'undefined' && process.env && (process.env.CASHLESS_API_URL || process.env.EXPO_PUBLIC_CASHLESS_API_URL)) ||
  Constants.expoConfig?.extra?.apiUrl ||
  DEFAULT_BASE_URL;

console.log('📡 API Base URL:', BASE_URL);

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const authAPI = {
  loginWithRfid: async (rfidCardId) => {
    const res = await api.post('/auth/login', { rfid_card_id: rfidCardId });
    return res.data;
  },
  loginWithEmail: async (email, password) => {
    // Explicitly POST with json and no auth header
    const res = await api.post('/auth/email-login', { email, password }, { headers: { Authorization: undefined } });
    return res.data;
  },
  verify: async () => {
    const res = await api.get('/auth/verify');
    return res.data;
  },
};

export const walletAPI = {
  getBalance: async () => {
    const res = await api.get('/wallets/balance');
    return res.data;
  },
  getTransactions: async (params = {}) => {
    const res = await api.get('/wallets/transactions', { params });
    return res.data;
  },
  // Server-Sent Events stream for live updates (development use)
  streamTransactions: (onMessage, onError) => {
    try {
      // Include token via query param to avoid CORS preflight complexity
      const token = (api.defaults.headers.common.Authorization || '').replace('Bearer ', '');
      const url = `${api.defaults.baseURL}/wallets/transactions/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      es.onmessage = (e) => {
        try { onMessage && onMessage(JSON.parse(e.data)); } catch (_) {}
      };
      es.onerror = (e) => { onError && onError(e); es.close(); };
      return () => es.close();
    } catch (e) {
      onError && onError(e);
      return () => {};
    }
  },
};

export const menuAPI = {
  getItems: async (params = {}) => {
    const res = await api.get('/menu/items', { params });
    return res.data;
  },
  getProducts: async (params = {}) => {
    const res = await api.get('/menu/products', { params });
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/menu/categories');
    return res.data;
  },
};

export const getBaseUrl = () => BASE_URL;

export const ordersAPI = {
  createOrder: async (items) => {
    // items: [{ product_id, quantity }]
    const res = await api.post('/canteen-orders/create', { items });
    return res.data;
  },
  listOrders: async (params = {}) => {
    const res = await api.get('/canteen-orders', { params });
    return res.data;
  },
  getOrder: async (transactionId) => {
    const res = await api.get(`/canteen-orders/${transactionId}`);
    return res.data;
  },
};


