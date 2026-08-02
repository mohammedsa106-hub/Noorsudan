import { useEffect, useState } from 'react';
import { supabase, type Category, type Subcategory, type Listing, type Product, PAYMENT_METHOD_OPTIONS, FACILITY_OPTIONS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import {
  Tag,
  ChevronLeft,
  MapPinned, LayoutGrid,
  Plus, Truck, Clock, CreditCard,
  ShoppingBag, Star, Users, Wallet, CheckCircle2, Briefcase,
} from 'lucide-react';
import { MapPicker } from '@/components/MapPicker';
import { ImageUploader, type ImageItem } from '@/components/ImageUploader';
import { supabase as supaClient, sectionHasPayments } from '@/lib/supabase';
import type { ListingImage } from '@/lib/supabase';
import { SectionCard } from '@/components/SectionTemplates';

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
  const [openNowOnly, setOpenNowOnly] = useState(false);

  useEffect(() => {
    setLoading(true);
    setActiveSub(null);
    supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data: cat, error: catErr }) => {
        if (catErr || !cat) {
          setCategory(null);
          setSubcats([]);
          setListings([]);
          setLoading(false);
          return;
        }
        setCategory(cat as Category);
        try {
          const [subsRes, listsRes] = await Promise.all([
            supabase.from('subcategories').select('*').eq('category_id', (cat as Category).id).order('sort_order'),
            supabase.from('listings').select('*').eq('category_id', (cat as Category).id).eq('is_active', true).eq('is_hidden_by_admin', false).order('created_at', { ascending: false }),
          ]);
          setSubcats((subsRes.data as Subcategory[]) || []);
          const lists = (listsRes.data as Listing[]) || [];
          setListings(lists);
          setLoading(false);
          if (lists.length > 0) {
            try {
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
            } catch {
              // images/products are optional — ignore fetch errors
            }
          }
        } catch {
          setSubcats([]);
          setListings([]);
          setLoading(false);
        }
      });
  }, [slug]);

  let visibleListings = activeSub
    ? listings.filter((l) => l.subcategory_id === activeSub.id)
    : listings;
  if (openNowOnly) {
    visibleListings = visibleListings.filter((l) => l.is_open || l.is_24_7);
  }

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

        {/* Open Now filter for health category */}
        {slug === 'health' && listings.length > 0 && (
          <div className="mb-4 flex items-center gap-3">
            <button
              onClick={() => setOpenNowOnly((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                openNowOnly
                  ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : 'glass-card text-gold-200/60 border-gold-400/15 hover:border-gold-400/30'
              }`
              }
            >
              <Clock size={16} /> {openNowOnly ? 'مفتوح الآن فقط' : 'عرض المفتوح الآن فقط'}
            </button>
            {openNowOnly && (
              <span className="text-xs text-gold-300/60">{visibleListings.length} صيدلية/خدمة مفتوحة</span>
            )}
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
              <SectionCard
                key={l.id}
                listing={l}
                categorySlug={slug}
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
          categorySlug={slug}
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

function EntityFormModal({
  categoryId,
  categorySlug,
  categoryName,
  subcats,
  preselectedSub,
  existing,
  onClose,
  onSaved,
}: {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  subcats: Subcategory[];
  preselectedSub: Subcategory | null;
  existing?: Listing;
  onClose: () => void;
  onSaved: (l: Listing, isEdit: boolean) => void;
}) {
  const { user } = useAuth();
  const isEdit = !!existing;
  const isPharmacy = categorySlug === 'health';
  const isEventHall = categorySlug === 'events';
  const isCraftsman = categorySlug === 'craftsmen';
  const isDriver = categorySlug === 'drivers';
  const isCompany = categorySlug === 'business-jobs';
  const isCommunity = categorySlug === 'community';
  const hasPayments = sectionHasPayments(categorySlug);
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
    is_24_7: existing?.is_24_7 ?? false,
    capacity: existing?.capacity?.toString() || '',
    facilities: existing?.facilities || [],
    opening_time: existing?.opening_time || '',
    closing_time: existing?.closing_time || '',
    bankak_account: existing?.bankak_account || '',
    bankak_name: existing?.bankak_name || '',
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

  const toggleFacility = (val: string) => {
    setForm((f) => ({
      ...f,
      facilities: f.facilities.includes(val)
        ? f.facilities.filter((m) => m !== val)
        : [...f.facilities, val],
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
      is_24_7: form.is_24_7,
      capacity: form.capacity ? parseInt(form.capacity) : null,
      facilities: form.facilities,
      opening_time: form.opening_time || null,
      closing_time: form.closing_time || null,
      bankak_account: form.bankak_account,
      bankak_name: form.bankak_name,
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

          {/* Working Hours (restaurants and similar) */}
          {(categorySlug === 'restaurants' || categorySlug === 'health' || categorySlug === 'beauty') && (
            <div className="glass-card rounded-xl p-4 border border-gold-400/15">
              <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
                <Clock size={14} className="gold-text" /> ساعات العمل
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-xs text-gold-300/50 mb-1 block">وقت الفتح</span>
                  <input type="time" value={form.opening_time} onChange={(e) => setForm({ ...form, opening_time: e.target.value })}
                    className="input-dark w-full rounded-xl px-4 py-3" />
                </div>
                <div>
                  <span className="text-xs text-gold-300/50 mb-1 block">وقت الإغلاق</span>
                  <input type="time" value={form.closing_time} onChange={(e) => setForm({ ...form, closing_time: e.target.value })}
                    className="input-dark w-full rounded-xl px-4 py-3" />
                </div>
              </div>
            </div>
          )}

          {/* Payment Methods — only for payment-enabled sections */}
          {hasPayments && !isCommunity && (
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
          )}

          {/* Bankak P2P Payment — only for payment-enabled sections */}
          {hasPayments && !isCommunity && (
            <div className="glass-card rounded-xl p-4 border border-gold-400/20">
              <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
                <Wallet size={14} className="gold-text" /> بيانات بنكاك للاستلام
              </label>
              <p className="text-xs text-gold-200/40 mb-3">أدخل بيانات حسابك في بنكاك لكي يتمكن العملاء من تحويل المبلغ مباشرة عند الطلب</p>
              <div className="space-y-2">
                <input value={form.bankak_name} onChange={(e) => setForm({ ...form, bankak_name: e.target.value })}
                  placeholder="اسم صاحب الحساب" className="input-dark w-full rounded-xl px-4 py-3" />
                <input value={form.bankak_account} onChange={(e) => setForm({ ...form, bankak_account: e.target.value })}
                  placeholder="رقم/حساب بنكاك" className="input-dark w-full rounded-xl px-4 py-3" dir="ltr" />
              </div>
            </div>
          )}

          {/* Community section: no payments notice */}
          {isCommunity && (
            <div className="glass-card rounded-xl p-4 border border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-2">
                <Icon name="Heart" size={16} className="text-red-400" />
                <span className="text-sm text-red-400">هذا القسم مخصص للعمل الإنساني والتطوع والتبرع بالعين فقط</span>
              </div>
              <p className="text-xs text-gold-200/40 mt-1">لا توجد مدفوعات أو حسابات بنكية في هذا القسم</p>
            </div>
          )}

          {/* Pharmacy: 24/7 toggle */}
          {isPharmacy && (
            <div className="glass-card rounded-xl p-4 border border-blue-500/20">
              <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
                <Clock size={14} className="text-blue-400" /> متاح 24 ساعة / 7 أيام
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gold-100">صيدلية تعمل على مدار الساعة</span>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_24_7: !form.is_24_7 })}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.is_24_7 ? 'bg-blue-500/40' : 'bg-ink-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${form.is_24_7 ? 'right-0.5 bg-blue-400' : 'right-6 bg-gold-200/40'}`} />
                </button>
              </div>
            </div>
          )}

          {/* Event Hall: capacity & facilities */}
          {isEventHall && (
            <>
              <div>
                <label className="block text-sm text-gold-200/70 mb-2 flex items-center gap-1.5">
                  <Users size={14} className="gold-text" /> السعة (عدد الأشخاص)
                </label>
                <input
                  type="number"
                  value={form.capacity}
                  onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                  placeholder="مثال: 300"
                  className="input-dark w-full rounded-xl px-4 py-3"
                />
              </div>
              <div className="glass-card rounded-xl p-4 border border-gold-400/15">
                <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="gold-text" /> المرافق والخدمات
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FACILITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleFacility(opt.value)}
                      className={`py-2.5 rounded-xl text-sm transition-all border ${
                        form.facilities.includes(opt.value)
                          ? 'bg-gold-400/15 text-gold-200 border-gold-400/40'
                          : 'bg-ink-600/50 text-gold-200/40 border-gold-400/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Craftsmen/Drivers: estimated pricing note */}
          {(isCraftsman || isDriver) && (
            <div className="glass-card rounded-xl p-4 border border-gold-400/15">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={14} className="gold-text" />
                <span className="text-sm text-gold-200/70">نظام رسوم المنصة</span>
              </div>
              <p className="text-xs text-gold-200/50 leading-relaxed">
                يتم خصم رسوم رمزية (5-10%) من رصيد المحفظة عند إتمام كل طلب. تأكد من شحن محفظتك من لوحة التحكم.
              </p>
              {form.price && (
                <div className="mt-2 pt-2 border-t border-gold-400/10 flex items-center justify-between text-xs">
                  <span className="text-gold-300/60">السعر التقديري: {parseFloat(form.price).toLocaleString()} ج.س</span>
                  <span className="text-gold-300/60">رسوم المنصة (~7%): {Math.round(parseFloat(form.price) * 0.07)} ج.س</span>
                </div>
              )}
            </div>
          )}

          {/* Companies: jobs & training note */}
          {isCompany && (
            <div className="glass-card rounded-xl p-4 border border-gold-400/15">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase size={14} className="gold-text" />
                <span className="text-sm text-gold-200/70">وظائف وتدريب</span>
              </div>
              <p className="text-xs text-gold-200/50 leading-relaxed">
                يمكنك إضافة وظائف وبرامج تدريبية لشركتك من صفحة التفاصيل بعد نشر التسجيل. سيتمكن المتقدمون من رفع سيرتهم الذاتية (CV) مباشرة.
              </p>
            </div>
          )}

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

          {/* Products / Menu / Offers Catalog */}
          <div className="glass-card rounded-xl p-4 border border-gold-400/15">
            <label className="text-sm text-gold-200/70 mb-3 block flex items-center gap-1.5">
              <ShoppingBag size={14} className="gold-text" /> {categorySlug === 'restaurants' ? 'منيو الطعام' : 'كتالوج المنتجات / الخدمات / العروض'}
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
