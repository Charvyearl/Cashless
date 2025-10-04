import axios, { AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  ApiResponse, 
  User, 
  MenuItem, 
  Wallet,
  DashboardStats,
  Student,
  Personnel,
  CreateStudentRequest,
  CreatePersonnelRequest
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (rfidCardId: string): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', { rfid_card_id: rfidCardId }),
  
  register: (userData: Partial<User>): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', userData),
  
  verify: (): Promise<AxiosResponse<ApiResponse<{ user: User; wallet: Wallet }>>> =>
    api.get('/auth/verify'),
  
  getProfile: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/auth/profile'),
};

// Users API
export const usersAPI = {
  getAll: (params?: { page?: number; limit?: number; user_type?: string; is_active?: boolean }) =>
    api.get('/users', { params }),
  
  getById: (id: number) =>
    api.get(`/users/${id}`),
  
  update: (id: number, data: Partial<User>) =>
    api.put(`/users/${id}`, data),
  
  delete: (id: number) =>
    api.delete(`/users/${id}`),
};

// Wallets API
export const walletsAPI = {
  getBalance: (): Promise<AxiosResponse<ApiResponse<{ balance: number; user_id: number; rfid_card_id: string }>>> =>
    api.get('/wallets/balance'),
  
  getSummary: (): Promise<AxiosResponse<ApiResponse<any>>> =>
    api.get('/wallets/summary'),
  
  getTransactions: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; type?: string }) =>
    api.get('/wallets/transactions', { params }),
  
  topUp: (userId: number, amount: number, description?: string, accountType: 'student' | 'personnel' = 'student') =>
    api.post(`/admin/${accountType === 'student' ? 'students' : 'personnel'}/${userId}/add-money`, { amount, description }),
  
  transfer: (recipientRfid: string, amount: number, description?: string) =>
    api.post('/wallets/transfer', { recipient_rfid: recipientRfid, amount, description }),
  
  getByRfid: (rfidCardId: string) =>
    api.get(`/wallets/rfid/${rfidCardId}`),
  
  processPayment: (rfidCardId: string, amount: number, description?: string, referenceId?: string) =>
    api.post('/wallets/payment', { rfid_card_id: rfidCardId, amount, description, reference_id: referenceId }),
};

// Menu API
export const menuAPI = {
  getFullMenu: () =>
    api.get('/menu'),
  
  getItems: (params?: { category_id?: number; available_only?: boolean; page?: number; limit?: number }) =>
    api.get('/menu/items', { params }),
  
  searchItems: (searchTerm: string, params?: { category_id?: number; available_only?: boolean; page?: number; limit?: number }) =>
    api.get('/menu/search', { params: { q: searchTerm, ...params } }),
  
  getCategories: (activeOnly?: boolean) =>
    api.get('/menu/categories', { params: { active_only: activeOnly } }),
  
  getItem: (id: number) =>
    api.get(`/menu/items/${id}`),
  
  createCategory: (data: { name: string; description?: string }) =>
    api.post('/menu/categories', data),
  
  updateCategory: (id: number, data: { name: string; description?: string }) =>
    api.put(`/menu/categories/${id}`, data),
  
  deleteCategory: (id: number) =>
    api.delete(`/menu/categories/${id}`),
  
  createItem: (data: Partial<MenuItem>) =>
    api.post('/menu/items', data),
  
  updateItem: (id: number, data: Partial<MenuItem>) =>
    api.put(`/menu/items/${id}`, data),
  
  toggleAvailability: (id: number) =>
    api.patch(`/menu/items/${id}/availability`),
  
  deleteItem: (id: number) =>
    api.delete(`/menu/items/${id}`),
  // Products (canteen)
  createProduct: (data: { product_name: string; description?: string; price: number; category: string; stock_quantity: number; is_available?: boolean }) =>
    api.post('/menu/products', data),
  getProducts: (params?: { category?: string; available_only?: boolean }) =>
    api.get('/menu/products', { params }),
  getProduct: (id: number) =>
    api.get(`/menu/products/${id}`),
  updateProduct: (id: number, data: Partial<{ product_name: string; description: string; price: number; category: string; stock_quantity: number; is_available: boolean }>) =>
    api.put(`/menu/products/${id}`, data),
  toggleProductAvailability: (id: number) =>
    api.patch(`/menu/products/${id}/availability`),
  deleteProduct: (id: number) =>
    api.delete(`/menu/products/${id}`),
};

// Transactions API
export const transactionsAPI = {
  getMyTransactions: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; type?: string; status?: string }) =>
    api.get('/transactions/my-transactions', { params }),
  
  getAll: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; type?: string; status?: string; user_id?: number }) =>
    api.get('/transactions', { params }),
  
  getById: (id: number) =>
    api.get(`/transactions/${id}`),
  
  getStatistics: (params?: { start_date?: string; end_date?: string; type?: string; user_id?: number }) =>
    api.get('/transactions/stats/overview', { params }),
  
  getDailySummary: (date: string) =>
    api.get(`/transactions/stats/daily/${date}`),
  
  updateStatus: (id: number, status: string) =>
    api.patch(`/transactions/${id}/status`, { status }),
  
  getByTransactionId: (transactionId: string) =>
    api.get(`/transactions/transaction/${transactionId}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (): Promise<AxiosResponse<ApiResponse<DashboardStats>>> =>
    api.get('/dashboard/stats'),
};

// RFID API
export const rfidAPI = {
  createSession: () => api.post('/rfid/sessions'),
  getSession: (id: string) => api.get(`/rfid/sessions/${id}`),
  getLatest: () => api.get('/rfid/latest'),
};

// Admin API
export const adminAPI = {
  // Student Management
  createStudent: (data: CreateStudentRequest): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.post('/admin/students', data),
  
  getStudents: (params?: { page?: number; limit?: number; is_active?: boolean }) =>
    api.get('/admin/students', { params }),
  
  getStudent: (id: number): Promise<AxiosResponse<ApiResponse<Student>>> =>
    api.get(`/admin/students/${id}`),
  
  updateStudent: (id: number, data: Partial<Student>) =>
    api.put(`/admin/students/${id}`, data),
  
  updateStudentPassword: (id: number, password: string) =>
    api.put(`/admin/students/${id}/password`, { password }),
  
  deleteStudent: (id: number) =>
    api.delete(`/admin/students/${id}`),
  
  // Personnel Management
  createPersonnel: (data: CreatePersonnelRequest): Promise<AxiosResponse<ApiResponse<Personnel>>> =>
    api.post('/admin/personnel', data),
  
  getPersonnel: (params?: { page?: number; limit?: number; is_active?: boolean }) =>
    api.get('/admin/personnel', { params }),
  
  getPersonnelById: (id: number): Promise<AxiosResponse<ApiResponse<Personnel>>> =>
    api.get(`/admin/personnel/${id}`),
  
  updatePersonnel: (id: number, data: Partial<Personnel>) =>
    api.put(`/admin/personnel/${id}`, data),
  
  updatePersonnelPassword: (id: number, password: string) =>
    api.put(`/admin/personnel/${id}/password`, { password }),
  
  deletePersonnel: (id: number) =>
    api.delete(`/admin/personnel/${id}`),
};

// Canteen Orders API
export const canteenOrdersAPI = {
  createOrder: (data: { items: Array<{ product_id: number; quantity: number }>; customer_rfid?: string }) =>
    api.post('/canteen-orders/create', data),
  
  completeOrder: (transactionId: number, data: { customer_rfid: string }) =>
    api.post(`/canteen-orders/${transactionId}/complete`, data),
  
  getOrders: (params?: { page?: number; limit?: number; start_date?: string; end_date?: string; status?: string; user_id?: number; personnel_id?: number }) =>
    api.get('/canteen-orders', { params }),
  
  getOrderDetails: (transactionId: number) =>
    api.get(`/canteen-orders/${transactionId}`),
  
  cancelOrder: (transactionId: number) =>
    api.post(`/canteen-orders/${transactionId}/cancel`),
  
  verifyRFID: (rfidCardId: string) =>
    api.post('/canteen-orders/verify-rfid', { rfid_card_id: rfidCardId }),
};

export default api;
