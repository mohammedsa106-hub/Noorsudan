import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AccountType = 'individual' | 'business' | 'professional' | 'driver' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  account_type: AccountType;
  phone: string;
  business_phone: string;
  email_contact: string;
  location_text: string;
  lat: number | null;
  lng: number | null;
  avatar_url: string | null;
  is_verified: boolean;
  is_blocked: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  created_at: string;
}

export interface Listing {
  id: string;
  category_id: string;
  subcategory_id: string | null;
  owner_id: string;
  title: string;
  description: string;
  phone: string;
  business_phone: string;
  email_contact: string;
  price: number | null;
  location_text: string;
  lat: number | null;
  lng: number | null;
  image_url: string | null;
  is_active: boolean;
  is_open: boolean;
  delivery_available: boolean;
  service_radius: number | null;
  payment_methods: string[];
  whatsapp: string;
  is_hidden_by_admin: boolean;
  created_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  listing_id: string;
  name: string;
  description: string;
  price: number | null;
  image_url: string | null;
  is_offer: boolean;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'topup' | 'fee' | 'adjustment';
  description: string;
  created_at: string;
}

export interface Verification {
  id: string;
  user_id: string;
  id_document_url: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted_at: string;
  reviewed_at: string | null;
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'مستخدم فردي',
  business: 'شركات وأعمال',
  professional: 'مهني وحرفي',
  driver: 'سائق ونقل',
  admin: 'مشرف عام',
};

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'cash', label: 'نقداً' },
  { value: 'card', label: 'بطاقة بنكية' },
  { value: 'wallet', label: 'محفظة رقمية' },
  { value: 'bank', label: 'تحويل بنكي' },
];
