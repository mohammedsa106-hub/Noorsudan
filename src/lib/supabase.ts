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
  is_24_7: boolean;
  capacity: number | null;
  facilities: string[];
  rating_avg: number;
  rating_count: number;
  opening_time: string | null;
  closing_time: string | null;
  bankak_account: string;
  bankak_name: string;
  is_featured: boolean;
  featured_until: string | null;
  is_sponsored: boolean;
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

export interface Order {
  id: string;
  listing_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  notes: string;
  receipt_url: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

export interface Job {
  id: string;
  listing_id: string;
  title: string;
  description: string;
  requirements: string;
  created_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_phone: string;
  cv_url: string;
  created_at: string;
}

export interface TrainingProgram {
  id: string;
  listing_id: string;
  title: string;
  description: string;
  duration: string;
  created_at: string;
}

export interface TrainingApplication {
  id: string;
  training_id: string;
  applicant_id: string;
  applicant_name: string;
  applicant_phone: string;
  cv_url: string;
  created_at: string;
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

export const FACILITY_OPTIONS = [
  { value: 'parking', label: 'موقف سيارات' },
  { value: 'ac', label: 'تكييف مركزي' },
  { value: 'catering', label: 'ضيافة وتموين' },
  { value: 'sound', label: 'نظام صوتي' },
  { value: 'stage', label: 'مسرح' },
  { value: 'lighting', label: 'إضاءة احترافية' },
  { value: 'garden', label: 'حديقة خارجية' },
  { value: 'bridal_room', label: 'غرفة العروس' },
  { value: 'projector', label: 'شاشة عرض' },
  { value: 'generator', label: 'مولد كهرباء' },
];

export const SECTIONS_WITH_PAYMENTS = [
  'restaurants', 'hotels', 'travel', 'groceries', 'cars', 'real-estate',
  'events', 'beauty', 'agriculture', 'drivers',
];

export const SECTIONS_WITHOUT_PAYMENTS = [
  'community', 'craftsmen', 'business-jobs', 'government', 'education', 'finance', 'marketing',
];

export function sectionHasPayments(slug: string): boolean {
  return SECTIONS_WITH_PAYMENTS.includes(slug);
}

export function formatTime(t: string | null): string {
  if (!t) return '';
  const parts = t.split(':');
  if (parts.length < 2) return t;
  const h = parseInt(parts[0]);
  const m = parts[1];
  const period = h >= 12 ? 'م' : 'ص';
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${displayH}:${m} ${period}`;
}

export function isOpenNow(listing: Listing): boolean {
  if (listing.is_24_7) return true;
  if (!listing.is_open) return false;
  if (!listing.opening_time || !listing.closing_time) return listing.is_open;
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const [oh, om] = listing.opening_time.split(':').map(Number);
  const [ch, cm] = listing.closing_time.split(':').map(Number);
  const open = oh * 60 + om;
  const close = ch * 60 + cm;
  if (close > open) return cur >= open && cur < close;
  return cur >= open || cur < close;
}
