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

// Determine environment (Expo defines __DEV__ globally)
const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

// Normalize environment variable overrides (highest priority)
const envApiUrl = (() => {
  if (typeof process === 'undefined' || !process.env) return '';
  const candidates = [process.env.CASHLESS_API_URL, process.env.EXPO_PUBLIC_CASHLESS_API_URL];
  const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
  return found ? found.trim() : '';
})();

// Read Expo extra config (supports separate prod/dev overrides)
const extraConfig = Constants.expoConfig?.extra ?? {};
const extraProdApiUrl =
  typeof extraConfig.apiUrl === 'string' && extraConfig.apiUrl.trim().length > 0
    ? extraConfig.apiUrl.trim()
    : '';
const extraDevApiUrl =
  typeof extraConfig.devApiUrl === 'string' && extraConfig.devApiUrl.trim().length > 0
    ? extraConfig.devApiUrl.trim()
    : '';
const useProdApiInDev = Boolean(extraConfig.useProdApiInDev);

// Resolve preferred extra URL: dev-specific first, optional opt-in to prod URL during dev builds
const resolvedExtraApiUrl = isDev
  ? (extraDevApiUrl || (useProdApiInDev ? extraProdApiUrl : ''))
  : extraProdApiUrl;

// Final priority order:
// 1) explicit env override
// 2) expo extra override (dev/prod aware)
// 3) automatic detection / platform default
const BASE_URL = envApiUrl || resolvedExtraApiUrl || DEFAULT_BASE_URL;

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
  // Note: EventSource is only available in web environments, not React Native
  streamTransactions: (onMessage, onError) => {
    // Check if EventSource is available (web only)
    if (typeof EventSource === 'undefined') {
      if (onError) onError(new Error('EventSource not available in React Native'));
      return () => {};
    }
    
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
      if (onError) onError(e);
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


