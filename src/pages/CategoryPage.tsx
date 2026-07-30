import { useEffect, useState } from 'react';
import { supabase, type Category, type Subcategory, type Listing, type Product, PAYMENT_METHOD_OPTIONS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import {
  Phone, MapPin, X, Tag, DollarSign,
  ChevronLeft, Edit2, Trash2,
  MapPinned, Navigation, ExternalLink, LayoutGrid,
  Plus, Truck, MessageCircle, Clock, CreditCard,
  ShoppingBag, Star
} from 'lucide-react';
import { MapPicker } from '@/components/MapPicker';
import { ImageUploader, type ImageItem } from '@/components/ImageUploader';
import { supabase as supaClient } from '@/lib/supabase';
import type { ListingImage } from '@/lib/supabase';

export function CategoryPage({ slug }: { slug: string }) {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<Subcategory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [listingImages, setListingImages] = useState<Record<string, string[]>>({});
  const [listingProducts, setListingProducts] = useState<Record<string, Product[]>>({});

  useEffect(() => {
    setLoading(true);
    setActiveSub(null);
    supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data: cat }) => {
        if (!cat) {
          setCategory(null);
          setLoading(false);
          return;
        }
        setCategory(cat as Category);
        const [subsRes, listsRes] = await Promise.all([
          supabase.from('subcategories').select('*').eq('category_id', (cat as Category).id).order('sort_order'),
          supabase.from('listings').select('*').eq('category_id', (cat as Category).id).eq('is_active', true).eq('is_hidden_by_admin', false).order('created_at', { ascending: false }),
        ]);
        setSubcats((subsRes.data as Subcategory[]) || []);
        const lists = (listsRes.data as Listing[]) || [];
        setListings(lists);
        setLoading(false);
        if (lists.length > 0) {
          const [imgsRes, prodsRes] = await Promise.all([
            supaClient.from('listing_images').select('*').in('listing_id', lists.map((l) => l.id)).order('sort_order'),
            supaClient.from('products').select('*').in('listing_id', lists.map((l) => l.id)).order('created_at', { ascending: false }),
          ]);
          const imgMap: Record<string, string[]> = {};
          (imgsRes.data as ListingImage[] || []).forEach((img) => {
            if (!imgMap[img.listing_id]) imgMap[img.listing_id] = [];
            imgMap[img.listing_id].push(img.url);
          });
          setListingImages(imgMap);
          const prodMap: Record<string, Product[]> = {};
          (prodsRes.data as Product[] || []).forEach((p) => {
            if (!prodMap[p.listing_id]) prodMap[p.listing_id] = [];
            prodMap[p.listing_id].push(p);
          });
          setListingProducts(prodMap);
        }
      });
  }, [slug]);

  const visibleListings = activeSub
    ? listings.filter((l) => l.subcategory_id === activeSub.id)
    : listings;

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleSave = (saved: Listing, isEdit: boolean) => {
    if (isEdit) {
      setListings((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
    } else {
      setListings((prev) => [saved, ...prev]);
    }
    setEditing(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-gold-200/50 animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60">القسم غير موجود</p>
        <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb + header */}
      <div className="glass-card border-b border-gold-400/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-4"
          >
            <ChevronLeft size={16} /> الرئيسية
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gold-400/10 flex items-center justify-center gold-glow">
              <Icon name={category.icon} size={32} className="gold-text" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold gold-gradient-text">
                {category.name}
              </h1>
              <p className="text-sm text-gold-200/50 mt-1">
                {subcats.length} قسم فرعي · {listings.length} مسجل
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Subcategories as cards with Register buttons */}
        {subcats.length > 0 && (
          <div className="mb-10">
            <h2 className="font-display text-lg font-bold text-gold-100 mb-4">الخدمات المتاحة</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* "All" card */}
              <button
                onClick={() => setActiveSub(null)}
                className={`glass-card glass-card-hover rounded-2xl p-4 text-center transition-all animate-fade-up ${
                  !activeSub
                    ? 'gold-border gold-glow'
                    : 'border border-gold-400/10 hover:border-gold-400/30'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${
                  !activeSub ? 'bg-gold-400/20' : 'bg-gold-400/10'
                }`}>
                  <LayoutGrid size={22} className="gold-text" />
                </div>
                <h3 className="text-xs font-bold text-gold-100 leading-tight">الكل</h3>
                <p className="text-[10px] text-gold-200/40 mt-0.5">{listings.length} مسجل</p>
              </button>
              {subcats.map((s, i) => {
                const count = listings.filter((l) => l.subcategory_id === s.id).length;
                const isActive = activeSub?.id === s.id;
                return (
                  <div
                    key={s.id}
                    className={`glass-card rounded-2xl p-4 text-center transition-all animate-fade-up ${
                      isActive
                        ? 'gold-border gold-glow'
                        : 'border border-gold-400/10 hover:border-gold-400/30'
                    }`}
                    style={{ animationDelay: `${i * 0.04}s` }}
                  >
                    <button
                      onClick={() => setActiveSub(isActive ? null : s)}
                      className="w-full"
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${
                        isActive ? 'bg-gold-400/20' : 'bg-gold-400/10'
                      }`}>
                        <Icon name={s.icon} size={22} className="gold-text" />
                      </div>
                      <h3 className="text-xs font-bold text-gold-100 leading-tight line-clamp-2">{s.name}</h3>
                      <p className="text-[10px] text-gold-200/40 mt-0.5">{count} مسجل</p>
                    </button>
                    {user && (
                      <button
                        onClick={() => {
                          setEditing(null);
                          setShowForm(true);
                        }}
                        className="mt-2 w-full text-[10px] gold-text border border-gold-400/20 hover:border-gold-400/50 hover:bg-gold-400/10 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1"
                      >
                        <Plus size={11} /> تسجيل: {s.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active subcategory label */}
        {activeSub && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gold-200/60">
            <Icon name={activeSub.icon} size={16} className="gold-text" />
            <span>عرض: {activeSub.name}</span>
            <button onClick={() => setActiveSub(null)} className="text-gold-300 hover:underline text-xs mr-2">
              عرض الكل
            </button>
          </div>
        )}

        {/* Listings */}
        {visibleListings.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gold-400/10 items-center justify-center mb-4">
              <Tag size={28} className="gold-text" />
            </div>
            <p className="text-gold-200/60 mb-2">لا توجد تسجيلات في هذا القسم حالياً</p>
            {user && (
              <button
                onClick={() => { setEditing(null); setShowForm(true); }}
                className="text-sm gold-text hover:underline"
              >
                كن أول من يسجل هنا
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleListings.map((l, i) => (
              <ListingCard
                key={l.id}
                listing={l}
                subName={subcats.find((s) => s.id === l.subcategory_id)?.name}
                isOwner={l.owner_id === user?.id}
                isAdmin={profile?.account_type === 'admin'}
                onEdit={() => { setEditing(l); setShowForm(true); }}
                onDelete={handleDelete}
                index={i}
                images={listingImages[l.id] || (l.image_url ? [l.image_url] : [])}
                products={listingProducts[l.id] || []}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && category && (
        <EntityFormModal
          categoryId={category.id}
          categoryName={category.name}
          subcats={subcats}
          preselectedSub={activeSub}
          existing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={handleSave}
        />
      )}
    </div>
  );
}

function ListingCard({
  listing,
  subName,
  isOwner,
  isAdmin,
  onEdit,
  onDelete,
  index,
  images,
  products,
}: {
  listing: Listing;
  subName?: string;
  isOwner: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: (id: string) => void;
  index: number;
  images: string[];
  products: Product[];
}) {
  const hasGps = listing.lat != null && listing.lng != null;
  const coverImage = images[0] || listing.image_url;
  const offers = products.filter((p) => p.is_offer);
  return (
    <div
      className="glass-card glass-card-hover rounded-2xl overflow-hidden animate-fade-up relative"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {coverImage && (
        <button
          onClick={() => navigate(`/listing/${listing.id}`)}
          className="block w-full h-40 overflow-hidden bg-ink-600 relative"
        >
          <img
            src={coverImage}
            alt={listing.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          {/* Status badge */}
          <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur ${
            listing.is_open ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
          }`}>
            {listing.is_open ? 'مفتوح الآن' : 'مغلق'}
          </div>
        </button>
      )}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            {subName && (
              <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300 mb-1">
                {subName}
              </span>
            )}
            <h3 className="font-bold text-gold-50 line-clamp-1">{listing.title}</h3>
          </div>
          {listing.price != null && (
            <div className="flex items-center gap-1 text-gold-300 font-bold text-sm shrink-0">
              <DollarSign size={14} />
              {listing.price.toLocaleString()}
            </div>
          )}
        </div>

        {listing.description && (
          <p className="text-sm text-gold-200/60 mb-3 line-clamp-2 min-h-[2.5rem]">
            {listing.description}
          </p>
        )}

        {/* Operational badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {listing.delivery_available && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
              <Truck size={10} /> توصيل متاح
            </span>
          )}
          {listing.service_radius != null && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
              <MapPin size={10} /> نطاق {listing.service_radius} كم
            </span>
          )}
          {listing.payment_methods.length > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
              <CreditCard size={10} /> {listing.payment_methods.map((m) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label || m).join(' · ')}
            </span>
          )}
        </div>

        {/* Products preview */}
        {products.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 text-[10px] text-gold-300/60 mb-1.5">
              <ShoppingBag size={11} /> {products.length} منتج/خدمة
              {offers.length > 0 && (
                <span className="text-green-400 flex items-center gap-0.5">
                  · <Star size={9} /> {offers.length} عرض خاص
                </span>
              )}
            </div>
          </div>
        )}

        {/* Contact info */}
        <div className="space-y-2 text-xs text-gold-200/80 border-t border-gold-400/10 pt-3">
          {listing.phone ? (
            <a href={`tel:${listing.phone}`} className="flex items-center gap-2 hover:text-gold-200 transition-colors group">
              <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-all">
                <Phone size={13} className="gold-text" />
              </span>
              <span dir="ltr">{listing.phone}</span>
            </a>
          ) : null}

          {listing.whatsapp ? (
            <a
              href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-green-400 transition-colors group"
            >
              <span className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-all">
                <MessageCircle size={13} className="text-green-400" />
              </span>
              <span>واتساب مباشر</span>
            </a>
          ) : null}

          {listing.location_text && (
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <MapPin size={13} className="gold-text" />
              </span>
              <span className="line-clamp-1">{listing.location_text}</span>
            </div>
          )}

          {hasGps && (
            <button
              onClick={() => navigate(`/listing/${listing.id}`)}
              className="flex items-center gap-2 gold-text hover:underline transition-all group w-full"
            >
              <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-all shrink-0">
                <Navigation size={13} />
              </span>
              <span className="flex items-center gap-1">
                عرض الموقع على الخريطة <ExternalLink size={11} />
              </span>
            </button>
          )}
        </div>

        {/* Owner/Admin controls */}
        {(isOwner || isAdmin) && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gold-400/10">
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs gold-text border border-gold-400/20 hover:border-gold-400/50 hover:bg-gold-400/10 rounded-lg py-2 transition-all"
            >
              <Edit2 size={13} /> تعديل
            </button>
            <button
              onClick={() => onDelete(listing.id)}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg py-2 transition-all"
            >
              <Trash2 size={13} /> حذف
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function EntityFormModal({
  categoryId,
  categoryName,
  subcats,
  preselectedSub,
  existing,
  onClose,
  onSaved,
}: {
  categoryId: string;
  categoryName: string;
  subcats: Subcategory[];
  preselectedSub: Subcategory | null;
  existing?: Listing;
  onClose: () => void;
  onSaved: (l: Listing, isEdit: boolean) => void;
}) {
  const { user } = useAuth();
  const isEdit = !!existing;
  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    phone: existing?.phone || '',
    business_phone: existing?.business_phone || '',
    email_contact: existing?.email_contact || '',
    price: existing?.price?.toString() || '',
    location_text: existing?.location_text || '',
    subcategory_id: existing?.subcategory_id || preselectedSub?.id || '',
    lat: existing?.lat?.toString() || '',
    lng: existing?.lng?.toString() || '',
    is_open: existing?.is_open ?? true,
    delivery_available: existing?.delivery_available ?? false,
    service_radius: existing?.service_radius?.toString() || '',
    payment_methods: existing?.payment_methods || [],
    whatsapp: existing?.whatsapp || '',
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', is_offer: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);

  useEffect(() => {
    if (!existing) return;
    Promise.all([
      supaClient.from('listing_images').select('*').eq('listing_id', existing.id).order('sort_order'),
      supaClient.from('products').select('*').eq('listing_id', existing.id).order('created_at', { ascending: false }),
    ]).then(([imgsRes, prodsRes]) => {
      if (imgsRes.data) setImages((imgsRes.data as ListingImage[]).map((i) => ({ id: i.id, url: i.url })));
      if (prodsRes.data) setProducts(prodsRes.data as Product[]);
    });
  }, [existing]);

  const togglePayment = (val: string) => {
    setForm((f) => ({
      ...f,
      payment_methods: f.payment_methods.includes(val)
        ? f.payment_methods.filter((m) => m !== val)
        : [...f.payment_methods, val],
    }));
  };

  const addProduct = () => {
    if (!newProduct.name.trim()) return;
    setProducts((prev) => [...prev, {
      id: `temp-${Date.now()}`,
      listing_id: existing?.id || '',
      name: newProduct.name,
      description: newProduct.description,
      price: newProduct.price ? parseFloat(newProduct.price) : null,
      image_url: null,
      is_offer: newProduct.is_offer,
      created_at: new Date().toISOString(),
    }]);
    setNewProduct({ name: '', description: '', price: '', is_offer: false });
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.title.trim()) { setError('العنوان مطلوب'); return; }
    if (!form.phone.trim()) { setError('رقم الهاتف مطلوب'); return; }
    setSaving(true);

    const payload = {
      category_id: categoryId,
      subcategory_id: form.subcategory_id || null,
      title: form.title,
      description: form.description,
      phone: form.phone,
      business_phone: form.business_phone,
      email_contact: form.email_contact,
      price: form.price ? parseFloat(form.price) : null,
      location_text: form.location_text,
      image_url: images[0]?.url || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      is_open: form.is_open,
      delivery_available: form.delivery_available,
      service_radius: form.service_radius ? parseFloat(form.service_radius) : null,
      payment_methods: form.payment_methods,
      whatsapp: form.whatsapp,
    };

    let data: Listing | null = null;
    let dbError: { message?: string } | null = null;

    if (isEdit && existing) {
      const res = await supabase.from('listings').update(payload).eq('id', existing.id).select().maybeSingle();
      data = res.data as Listing | null;
      dbError = res.error;
    } else {
      const res = await supabase.from('listings').insert({ ...payload, owner_id: user!.id }).select().maybeSingle();
      data = res.data as Listing | null;
      dbError = res.error;
    }

    if (dbError || !data) {
      setSaving(false);
      setError(dbError?.message || 'فشل الحفظ');
      return;
    }

    // Sync images
    if (isEdit && existing) {
      await supaClient.from('listing_images').delete().eq('listing_id', existing.id);
    }
    if (images.length > 0) {
      await supaClient.from('listing_images').insert(images.map((img, i) => ({ listing_id: data!.id, url: img.url, sort_order: i })));
    }

    // Sync products
    if (isEdit && existing) {
      await supaClient.from('products').delete().eq('listing_id', existing.id);
    }
    const newProducts = products.filter((p) => p.name.trim());
    if (newProducts.length > 0) {
      await supaClient.from('products').insert(newProducts.map((p) => ({
        listing_id: data!.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image_url: p.image_url,
        is_offer: p.is_offer,
      })));
    }

    setSaving(false);
    onSaved(data, isEdit);
  };

  const fields: { key: keyof typeof form; label: string; placeholder?: string; icon: string; required?: boolean; textarea?: boolean; type?: string }[] = [
    { key: 'title', label: 'الاسم / العنوان', placeholder: 'مثال: مطعم النخلة الذهبي', icon: 'Tag', required: true },
    { key: 'description', label: 'الوصف', icon: 'FileText', textarea: true },
    { key: 'phone', label: 'رقم الهاتف المباشر', icon: 'Phone', required: true },
    { key: 'business_phone', label: 'هاتف الشركة', icon: 'Phone' },
    { key: 'whatsapp', label: 'رقم واتساب', icon: 'MessageCircle' },
    { key: 'email_contact', label: 'البريد الإلكتروني', icon: 'Mail' },
    { key: 'price', label: 'السعر الأساسي (ج.س) - اختياري', icon: 'DollarSign', type: 'number' },
    { key: 'location_text', label: 'الموقع (نصي)', icon: 'MapPin' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up">
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto gold-glow">
        <div className="flex items-center justify-between p-5 border-b border-gold-400/15 sticky top-0 bg-ink-500/95 backdrop-blur z-10">
          <div>
            <h2 className="font-display text-lg font-bold gold-gradient-text">
              {isEdit ? 'تعديل التسجيل' : `تسجيل في: ${categoryName}`}
            </h2>
            <p className="text-xs text-gold-200/50 mt-0.5">أدخل بياناتك التشغيلية الكاملة</p>
          </div>
          <button onClick={onClose} className="text-gold-200/60 hover:text-gold-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          {/* Subcategory */}
          {subcats.length > 0 && (
            <div>
              <label className="block text-sm text-gold-200/70 mb-2">القسم الفرعي</label>
              <select
                value={form.subcategory_id}
                onChange={(e) => setForm({ ...form, subcategory_id: e.target.value })}
                className="input-dark w-full rounded-xl px-4 py-3"
              >
                <option value="">بدون قسم فرعي</option>
                {subcats.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Basic fields */}
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm text-gold-200/70 mb-2">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.textarea ? (
                <textarea
                  value={form[f.key] as string}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="input-dark w-full rounded-xl px-4 py-3 resize-none"
                />
              ) : (
                <input
                  type={f.type || 'text'}
                  value={form[f.key] as string}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="input-dark w-full rounded-xl px-4 py-3"
                />
              )}
            </div>
          ))}

          {/* Operational Status Toggle */}
          <div className="glass-card rounded-xl p-4 border border-gold-400/15">
            <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
              <Clock size={14} className="gold-text" /> الحالة التشغيلية
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setForm({ ...form, is_open: true })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  form.is_open ? 'bg-green-500/20 text-green-400 border border-green-500/40' : 'bg-ink-600/50 text-gold-200/40 border border-gold-400/10'
                }`}
              >
                مفتوح / متاح
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_open: false })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  !form.is_open ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-ink-600/50 text-gold-200/40 border border-gold-400/10'
                }`}
              >
                مغلق / غير متاح
              </button>
            </div>
          </div>

          {/* Delivery Toggle */}
          <div className="glass-card rounded-xl p-4 border border-gold-400/15">
            <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
              <Truck size={14} className="gold-text" /> التوصيل ونطاق الخدمة
            </label>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gold-100">توصيل متاح</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, delivery_available: !form.delivery_available })}
                className={`w-12 h-6 rounded-full transition-all relative ${form.delivery_available ? 'bg-gold-400/40' : 'bg-ink-600'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${form.delivery_available ? 'right-0.5 bg-gold-300' : 'right-6 bg-gold-200/40'}`} />
              </button>
            </div>
            <input
              type="number"
              value={form.service_radius}
              onChange={(e) => setForm({ ...form, service_radius: e.target.value })}
              placeholder="نطاق الخدمة (كم) - اختياري"
              className="input-dark w-full rounded-xl px-4 py-3"
            />
          </div>

          {/* Payment Methods */}
          <div className="glass-card rounded-xl p-4 border border-gold-400/15">
            <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
              <CreditCard size={14} className="gold-text" /> طرق الدفع المقبولة
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => togglePayment(opt.value)}
                  className={`py-2.5 rounded-xl text-sm transition-all border ${
                    form.payment_methods.includes(opt.value)
                      ? 'bg-gold-400/15 text-gold-200 border-gold-400/40'
                      : 'bg-ink-600/50 text-gold-200/40 border-gold-400/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm text-gold-200/70 mb-2">معرض الصور / المستندات</label>
            <ImageUploader images={images} onChange={setImages} />
          </div>

          {/* GPS Location */}
          <div>
            <label className="block text-sm text-gold-200/70 mb-2 flex items-center gap-1.5">
              <MapPinned size={14} className="gold-text" /> الموقع الجغرافي (GPS)
            </label>
            <MapPicker
              lat={form.lat}
              lng={form.lng}
              onChange={(newLat, newLng) => setForm((f) => ({ ...f, lat: newLat, lng: newLng }))}
            />
          </div>

          {/* Products / Offers Catalog */}
          <div className="glass-card rounded-xl p-4 border border-gold-400/15">
            <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
              <ShoppingBag size={14} className="gold-text" /> كتالوج المنتجات / الخدمات / العروض
            </label>
            {products.length > 0 && (
              <div className="space-y-2 mb-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-600/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-gold-100 truncate">{p.name}</span>
                        {p.is_offer && <Star size={11} className="text-green-400 shrink-0" />}
                      </div>
                      {p.price != null && <span className="text-xs text-gold-300/60">{p.price} ج.س</span>}
                    </div>
                    <button type="button" onClick={() => removeProduct(p.id)} className="p-1 rounded hover:bg-red-500/10">
                      <X size={14} className="text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="space-y-2">
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="اسم المنتج/الخدمة/العرض"
                className="input-dark w-full rounded-lg px-3 py-2 text-sm"
              />
              <input
                value={newProduct.description}
                onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                placeholder="وصف مختصر (اختياري)"
                className="input-dark w-full rounded-lg px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="السعر (ج.س)"
                  className="input-dark flex-1 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setNewProduct({ ...newProduct, is_offer: !newProduct.is_offer })}
                  className={`px-3 rounded-lg text-sm transition-all border ${
                    newProduct.is_offer ? 'bg-green-500/15 text-green-400 border-green-500/40' : 'bg-ink-600/50 text-gold-200/40 border-gold-400/10'
                  }`}
                >
                  <Star size={14} />
                </button>
                <button
                  type="button"
                  onClick={addProduct}
                  className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-1"
                >
                  <Plus size={14} /> إضافة
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <div className="flex gap-3 pt-2 sticky bottom-0 bg-ink-500/95 backdrop-blur -mx-5 px-5 py-3 border-t border-gold-400/15">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 glass-card border border-gold-400/20 rounded-xl py-3 text-gold-200/70 hover:border-gold-400/40"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 btn-gold rounded-xl py-3 disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'نشر التسجيل'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
