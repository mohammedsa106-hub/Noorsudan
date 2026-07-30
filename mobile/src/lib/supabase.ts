export const SUPABASE_URL = 'https://ryytjqkqgmnosfifqumg.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ5eXRqcWtxZ21ub3NmaWZxdW1nIiwicm9sIjoiYW5vbiIsImlhdCI6MTc4NTIzMTIzMywiZXhwIjoyMTAwODA3MjMzfQ.89KmrT28giZmNFhaG_GjQjkMp9wI9HKuurX26SmTfaw';
export const STORAGE_BUCKET = 'listing-images';

export type AccountType = 'individual' | 'business' | 'professional' | 'admin';

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
  created_at: string;
}

export interface ListingImage {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  category?: Category | null;
  suggestions?: string[];
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'مستخدم فردي',
  business: 'شركات وأعمال',
  professional: 'مهني أو سائق',
  admin: 'مشرف عام',
};

export const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'فنادق وإقامة', slug: 'hotels', icon: 'BedDouble', sort_order: 1, created_at: '' },
  { id: '2', name: 'مطاعم وكافيهات', slug: 'restaurants', icon: 'UtensilsCrossed', sort_order: 2, created_at: '' },
  { id: '3', name: 'سفر وسياحة', slug: 'travel', icon: 'Plane', sort_order: 3, created_at: '' },
  { id: '4', name: 'إعلانات ودعاية', slug: 'advertising', icon: 'Megaphone', sort_order: 4, created_at: '' },
  { id: '5', name: 'نقل وشحن', slug: 'transport', icon: 'Truck', sort_order: 5, created_at: '' },
  { id: '6', name: 'تسوق ومنتجات', slug: 'shopping', icon: 'ShoppingCart', sort_order: 6, created_at: '' },
  { id: '7', name: 'سيارات', slug: 'cars', icon: 'Car', sort_order: 7, created_at: '' },
  { id: '8', name: 'عقارات', slug: 'real-estate', icon: 'Building2', sort_order: 8, created_at: '' },
  { id: '9', name: 'صحة وطب', slug: 'health', icon: 'Stethoscope', sort_order: 9, created_at: '' },
  { id: '10', name: 'أعمال ووظائف', slug: 'business-jobs', icon: 'Briefcase', sort_order: 10, created_at: '' },
  { id: '11', name: 'حرفيون', slug: 'craftsmen', icon: 'Hammer', sort_order: 11, created_at: '' },
  { id: '12', name: 'محاماة وقانون', slug: 'legal', icon: 'Scale', sort_order: 12, created_at: '' },
  { id: '13', name: 'تعليم وتدريب', slug: 'education', icon: 'GraduationCap', sort_order: 13, created_at: '' },
  { id: '14', name: 'خدمات حكومية', slug: 'government', icon: 'Landmark', sort_order: 14, created_at: '' },
  { id: '15', name: 'مناسبات وفعاليات', slug: 'events', icon: 'PartyPopper', sort_order: 15, created_at: '' },
  { id: '16', name: 'صالونات وتجميل', slug: 'beauty', icon: 'Scissors', sort_order: 16, created_at: '' },
  { id: '17', name: 'زراعة وثروة حيوانية', slug: 'agriculture', icon: 'Wheat', sort_order: 17, created_at: '' },
  { id: '18', name: 'خدمات مجتمعية', slug: 'community', icon: 'HeartHandshake', sort_order: 18, created_at: '' },
];

export const CATEGORY_ACCESS: Record<string, AccountType[]> = {
  cars: ['individual', 'business', 'professional'],
  'real-estate': ['individual', 'business', 'professional'],
  community: ['individual', 'business', 'professional'],
  'business-jobs': ['business'],
  craftsmen: ['professional'],
  drivers: ['professional'],
};

export const DEFAULT_ALLOWED: AccountType[] = ['business', 'professional'];

export function getAllowedTypes(slug: string): AccountType[] {
  return CATEGORY_ACCESS[slug] || DEFAULT_ALLOWED;
}

export type { RootStackParamList } from './navigation';
export const QUICK_PROMPTS = [
  'محتاج فندق في الخرطوم',
  'عايز مطعم كويس',
  'محتاج سباك',
  'أبحث عن سيارة مستعملة',
  'محتاج محامي',
  'عايز نقل بضاعة',
];
