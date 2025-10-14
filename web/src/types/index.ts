export interface User {
  id: number;
  rfid_card_id: string;
  student_id?: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  user_type: 'student' | 'staff' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface Wallet {
  id: number;
  user_id: number;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  transaction_id: string;
  user_id: number;
  transaction_type_id: number;
  amount: number;
  balance_before: number;
  balance_after: number;
  description?: string;
  reference_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
  transaction_type_name?: string;
  first_name?: string;
  last_name?: string;
  rfid_card_id?: string;
}

export interface MenuCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MenuItem {
  id: number;
  category_id: number;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
}

export interface Order {
  id: number;
  order_id: string;
  user_id: number;
  total_amount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  payment_method: 'rfid' | 'cash';
  created_at: string;
  updated_at: string;
  item_count?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    wallet: Wallet;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface Pagination {
  page: number;
  limit: number;
  total?: number;
  totalPages?: number;
}

export interface Student {
  user_id: number;
  rfid_card_id: string;
  first_name: string;
  last_name: string;
  balance: number;
  created_at: string;
  email?: string;
  is_active: boolean;
  updated_at: string;
}

export interface Personnel {
  personnel_id: number;
  rfid_card_id: string;
  first_name: string;
  last_name: string;
  balance: number;
  created_at: string;
  email?: string;
  is_active: boolean;
  updated_at: string;
}

export interface CreateStudentRequest {
  rfid_card_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  password: string;
  balance?: number;
}

export interface CreatePersonnelRequest {
  rfid_card_id: string;
  first_name: string;
  last_name: string;
  email?: string;
  password: string;
  balance?: number;
}

export interface DashboardStats {
  total_users: number;
  total_transactions: number;
  total_revenue: number;
  active_wallets: number;
  daily_transactions: number;
  daily_revenue: number;
  active_users: number;
  new_users_today: number;
}
