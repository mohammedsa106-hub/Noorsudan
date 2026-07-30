import { useEffect, useState } from 'react';
import { supabase, type Listing, type ListingImage, type Category, type Subcategory, type Profile, type Product, PAYMENT_METHOD_OPTIONS } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { ImageGallery } from '@/components/ImageGallery';
import { MapPreview } from '@/components/MapPreview';
import {
  ChevronLeft, Phone, Mail, MapPin, DollarSign, Building,
  Navigation, User, MessageCircle, Truck,
  CreditCard, Clock, ShoppingBag, Star, BadgeCheck,
  Users, Calendar, Wallet, CheckCircle2,
} from 'lucide-react';
import { FACILITY_OPTIONS } from '@/lib/supabase';

export function ListingDetailPage({ id }: { id: string }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: l } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!l) {
        setLoading(false);
        return;
      }
      const lst = l as Listing;
      setListing(lst);

      const [imgsRes, catRes, subRes, ownerRes, prodsRes] = await Promise.all([
        supabase.from('listing_images').select('*').eq('listing_id', id).order('sort_order'),
        supabase.from('categories').select('*').eq('id', lst.category_id).maybeSingle(),
        lst.subcategory_id
          ? supabase.from('subcategories').select('*').eq('id', lst.subcategory_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('profiles').select('*').eq('id', lst.owner_id).maybeSingle(),
        supabase.from('products').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
      ]);

      const imgUrls = (imgsRes.data as ListingImage[] || []).map((i) => i.url);
      if (lst.image_url && !imgUrls.includes(lst.image_url)) {
        imgUrls.unshift(lst.image_url);
      }
      setImages(imgUrls);

      setCategory((catRes.data as Category) || null);
      setSubcategory((subRes.data as Subcategory) || null);
      setOwner((ownerRes.data as Profile) || null);
      setProducts((prodsRes.data as Product[]) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gold-200/50 animate-pulse">
        جاري التحميل...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60">الإعلان غير موجود</p>
        <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const hasGps = listing.lat != null && listing.lng != null;

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-6"
      >
        <ChevronLeft size={16} /> رجوع
      </button>

      {images.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={images} title={listing.title} />
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {category && (
              <div className="flex items-center gap-2 mb-2">
                <Icon name={category.icon} size={16} className="gold-text" />
                <span className="text-sm text-gold-300/70">{category.name}</span>
                {subcategory && (
                  <>
                    <span className="text-gold-300/30">·</span>
                    <span className="text-sm text-gold-300/70">{subcategory.name}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold-50">
                {listing.title}
              </h1>
              {owner?.is_verified && (
                <BadgeCheck size={22} className="text-blue-400 shrink-0" />
              )}
            </div>
          </div>
          {listing.price != null && (
            <div className="flex items-center gap-1.5 text-gold-300 font-bold text-xl shrink-0">
              <DollarSign size={20} />
              {listing.price.toLocaleString()}
            </div>
          )}
        </div>

        {/* Operational status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${listing.is_open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            <Clock size={12} /> {listing.is_open ? 'مفتوح الآن' : 'مغلق'}
          </span>
          {listing.is_24_7 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
              <Clock size={12} /> متاح 24/7
            </span>
          )}
          {listing.delivery_available && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
              <Truck size={12} /> توصيل متاح
            </span>
          )}
          {listing.service_radius != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/10 text-gold-300">
              <MapPin size={12} /> نطاق {listing.service_radius} كم
            </span>
          )}
          {listing.payment_methods.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/10 text-gold-300">
              <CreditCard size={12} /> {listing.payment_methods.map((m) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label || m).join(' · ')}
            </span>
          )}
        </div>

        {/* Rating for craftsmen/drivers */}
        {(category?.slug === 'craftsmen' || category?.slug === 'drivers') && listing.rating_count > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={16} className={n <= Math.round(listing.rating_avg) ? 'text-gold-400 fill-gold-400' : 'text-gold-400/20'} />
              ))}
            </div>
            <span className="text-sm text-gold-100 font-bold">{listing.rating_avg.toFixed(1)}</span>
            <span className="text-xs text-gold-300/50">({listing.rating_count} تقييم)</span>
          </div>
        )}

        {/* Event hall capacity & facilities */}
        {category?.slug === 'events' && (listing.capacity != null || listing.facilities.length > 0) && (
          <div className="mb-4 p-4 rounded-xl bg-ink-600/40 border border-gold-400/10 space-y-3">
            {listing.capacity != null && (
              <div className="flex items-center gap-2 text-sm text-gold-100">
                <Users size={16} className="gold-text" />
                السعة: <span className="font-bold">{listing.capacity} شخص</span>
              </div>
            )}
            {listing.facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {listing.facilities.map((f) => {
                  const label = FACILITY_OPTIONS.find((o) => o.value === f)?.label || f;
                  return (
                    <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-300">
                      <CheckCircle2 size={11} /> {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Craftsmen/Drivers wallet fee info */}
        {(category?.slug === 'craftsmen' || category?.slug === 'drivers') && listing.price != null && (
          <div className="mb-4 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gold-200/60 flex items-center gap-1.5">
                <DollarSign size={14} className="gold-text" /> السعر التقديري
              </span>
              <span className="text-gold-100 font-bold">{listing.price.toLocaleString()} ج.س</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gold-400/10">
              <span className="text-gold-300/50 flex items-center gap-1">
                <Wallet size={12} /> رسوم المنصة (7%)
              </span>
              <span className="text-gold-300/70">{Math.round(listing.price * 0.07)} ج.س</span>
            </div>
          </div>
        )}

        {listing.description && (
          <p className="text-gold-200/70 leading-relaxed mb-6 whitespace-pre-wrap">
            {listing.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Phone size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">الهاتف المباشر</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.phone}</div>
              </div>
            </a>
          )}

          {listing.business_phone && (
            <a
              href={`tel:${listing.business_phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Building size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">هاتف الشركة</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.business_phone}</div>
              </div>
            </a>
          )}

          {listing.email_contact && (
            <a
              href={`mailto:${listing.email_contact}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Mail size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">البريد الإلكتروني</div>
                <div className="text-sm text-gold-100 truncate">{listing.email_contact}</div>
              </div>
            </a>
          )}

          {listing.location_text && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">الموقع</div>
                <div className="text-sm text-gold-100">{listing.location_text}</div>
              </div>
            </div>
          )}

          {listing.whatsapp && (
            <a
              href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-green-400" />
              </span>
              <div>
                <div className="text-xs text-green-400/70">واتساب مباشر</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.whatsapp}</div>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Products / Offers Catalog */}
      {products.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="gold-text" /> المنتجات والخدمات والعروض
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gold-100 text-sm truncate">{p.name}</span>
                    {p.is_offer && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 shrink-0">
                        <Star size={9} /> عرض
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-gold-200/50 line-clamp-1">{p.description}</p>}
                  {p.price != null && (
                    <div className="flex items-center gap-1 text-gold-300 font-bold text-sm mt-0.5">
                      <DollarSign size={12} /> {p.price.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event hall booking button */}
      {category?.slug === 'events' && (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <button
            onClick={() => alert('سيتم تحويلك لصفحة الحجز — تواصل مع القاعة مباشرة عبر الهاتف أو واتساب')}
            className="btn-gold rounded-xl px-8 py-3.5 inline-flex items-center gap-2 text-sm font-bold"
          >
            <Calendar size={18} /> طلب حجز هذه القاعة
          </button>
          <p className="text-xs text-gold-200/40 mt-2">سيتم التواصل معك لتأكيد الحجز والتاريخ</p>
        </div>
      )}

      {hasGps && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <Navigation size={18} className="gold-text" /> الموقع على الخريطة
          </h2>
          <MapPreview lat={listing.lat!} lng={listing.lng!} label={listing.location_text} />
        </div>
      )}

      {owner && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <User size={18} className="gold-text" /> مقدم الخدمة
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-400/10 flex items-center justify-center shrink-0">
              <Icon name="User" size={24} className="gold-text" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gold-100">{owner.full_name}</span>
                {owner.is_verified && <BadgeCheck size={16} className="text-blue-400" />}
              </div>
              {owner.location_text && (
                <div className="text-sm text-gold-200/50 flex items-center gap-1">
                  <MapPin size={12} className="gold-text" /> {owner.location_text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
