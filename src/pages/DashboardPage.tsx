import { useEffect, useState } from 'react';
import { supabase, type Listing, type Category, type Subcategory, type Product, type Wallet, type WalletTransaction, type Verification } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import {
  LayoutDashboard, Plus, Phone, Trash2, Edit2,
  Check, X, Tag, DollarSign, Eye, EyeOff,
  Wallet, ShieldCheck, Star, ShoppingBag, UserX, AlertTriangle, BadgeCheck
} from 'lucide-react';

export function DashboardPage() {
  const { user, profile, loading, signOut } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [tab, setTab] = useState<'listings' | 'profile' | 'wallet' | 'verification'>('listings');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  const [products, setProducts] = useState<Record<string, Product[]>>({});
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const accountType = profile?.account_type;

  useEffect(() => {
    if (!user) return;
    supabase
      .from('listings')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setListings((data as Listing[]) || []);
        if (data && data.length > 0) {
          supabase
            .from('products')
            .select('*')
            .in('listing_id', data.map((l) => l.id))
            .order('created_at', { ascending: false })
            .then(({ data: prods }) => {
              const map: Record<string, Product[]> = {};
              (prods as Product[] || []).forEach((p) => {
                if (!map[p.listing_id]) map[p.listing_id] = [];
                map[p.listing_id].push(p);
              });
              setProducts(map);
            });
        }
      });

    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data as Category[]) || []));
    supabase.from('subcategories').select('*').order('sort_order').then(({ data }) => setSubcats((data as Subcategory[]) || []));

    if (accountType === 'driver' || accountType === 'professional') {
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle().then(({ data }) => setWallet(data as Wallet | null));
      supabase.from('wallet_transactions').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => setTransactions((data as WalletTransaction[]) || []));
    }

    supabase.from('verifications').select('*').eq('user_id', user.id).order('submitted_at', { ascending: false }).maybeSingle().then(({ data }) => setVerification(data as Verification | null));
  }, [user, accountType]);

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold-200/50 animate-pulse">جاري التحميل...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60">يجب تسجيل الدخول للوصول إلى لوحة التحكم</p>
        <button onClick={() => navigate('/auth')} className="btn-gold rounded-xl px-6 py-2">تسجيل الدخول</button>
      </div>
    );
  }

  const isAdmin = profile?.account_type === 'admin';
  const isProvider = profile?.account_type !== 'individual' && profile?.account_type !== 'admin';
  const showWallet = accountType === 'driver' || accountType === 'professional';

  const toggleActive = async (l: Listing) => {
    await supabase.from('listings').update({ is_active: !l.is_active }).eq('id', l.id);
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const toggleOpen = async (l: Listing) => {
    await supabase.from('listings').update({ is_open: !l.is_open }).eq('id', l.id);
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_open: !x.is_open } : x)));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التسجيل نهائياً؟ سيتم حذف جميع المنتجات المرتبطة به.')) return;
    await supabase.from('listings').delete().eq('id', id);
    setListings((prev) => prev.filter((l) => l.id !== id));
  };

  const handleDeleteProduct = async (productId: string, listingId: string) => {
    if (!confirm('حذف هذا المنتج؟')) return;
    await supabase.from('products').delete().eq('id', productId);
    setProducts((prev) => ({
      ...prev,
      [listingId]: (prev[listingId] || []).filter((p) => p.id !== productId),
    }));
  };

  const startEdit = (l: Listing) => {
    setEditingId(l.id);
    setEditForm(l);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { data } = await supabase
      .from('listings')
      .update({
        title: editForm.title,
        description: editForm.description,
        phone: editForm.phone,
        business_phone: editForm.business_phone,
        email_contact: editForm.email_contact,
        price: editForm.price,
        location_text: editForm.location_text,
        image_url: editForm.image_url,
        is_open: editForm.is_open,
        delivery_available: editForm.delivery_available,
        whatsapp: editForm.whatsapp,
      })
      .eq('id', editingId)
      .select()
      .maybeSingle();
    if (data) {
      setListings((prev) => prev.map((x) => (x.id === editingId ? (data as Listing) : x)));
    }
    setEditingId(null);
  };

  const handleDeleteAccount = async () => {
    if (!confirm('هل أنت متأكد تماماً؟ سيتم حذف حسابك وجميع تسجيلاتك ومنتجاتك نهائياً ولا يمكن التراجع.')) return;
    await supabase.from('listings').delete().eq('owner_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    await signOut();
    navigate('/');
  };

  const tabs = [
    { key: 'listings' as const, label: `تسجيلاتي (${listings.length})`, icon: 'Tag' },
    { key: 'profile' as const, label: 'بيانات التواصل', icon: 'User' },
    ...(showWallet ? [{ key: 'wallet' as const, label: 'المحفظة', icon: 'Wallet' }] : []),
    { key: 'verification' as const, label: 'التحقق', icon: 'BadgeCheck' },
  ];

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center gold-glow">
          <LayoutDashboard size={24} className="gold-text" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold gold-gradient-text">لوحة التحكم</h1>
          <p className="text-sm text-gold-200/50">
            مرحباً {profile?.full_name} — {profile && (
              <span className="gold-text">
                {isAdmin ? 'مشرف عام' : isProvider ? 'مزود خدمات' : 'مستخدم'}
              </span>
            )}
            {profile?.is_verified && <BadgeCheck size={14} className="text-blue-400 inline mr-1" />}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="glass-card rounded-xl p-4 mb-6 gold-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icon name="ShieldCheck" size={20} className="gold-text" />
            <span className="text-sm text-gold-100">صلاحيات المشرف العام مفعّلة</span>
          </div>
          <button onClick={() => navigate('/admin')} className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-2">
            <Icon name="Settings" size={16} /> لوحة الإدارة
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-ink-600/50 border border-gold-400/10 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center justify-center gap-1.5 ${
              tab === t.key ? 'btn-gold' : 'text-gold-200/50 hover:text-gold-200'
            }`}
          >
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-gold-400/10 items-center justify-center mb-4">
                <Tag size={28} className="gold-text" />
              </div>
              <p className="text-gold-200/60 mb-4">لا توجد تسجيلات بعد</p>
              <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2.5 inline-flex items-center gap-2">
                <Plus size={18} /> تصفح الأقسام للتسجيل
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((l) => {
                const cat = categories.find((c) => c.id === l.category_id);
                const sub = subcats.find((s) => s.id === l.subcategory_id);
                const isEditing = editingId === l.id;
                const lProducts = products[l.id] || [];
                return (
                  <div key={l.id} className="glass-card rounded-2xl p-5">
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="input-dark w-full rounded-lg px-3 py-2"
                          placeholder="العنوان"
                        />
                        <textarea
                          value={editForm.description || ''}
                          onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                          className="input-dark w-full rounded-lg px-3 py-2 resize-none"
                          rows={2}
                          placeholder="الوصف"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="input-dark rounded-lg px-3 py-2 text-sm" placeholder="الهاتف" />
                          <input value={editForm.business_phone || ''} onChange={(e) => setEditForm({ ...editForm, business_phone: e.target.value })} className="input-dark rounded-lg px-3 py-2 text-sm" placeholder="هاتف الشركة" />
                          <input value={editForm.whatsapp || ''} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} className="input-dark rounded-lg px-3 py-2 text-sm" placeholder="واتساب" />
                          <input type="number" value={editForm.price ?? ''} onChange={(e) => setEditForm({ ...editForm, price: e.target.value ? parseFloat(e.target.value) : null })} className="input-dark rounded-lg px-3 py-2 text-sm" placeholder="السعر" />
                          <input value={editForm.location_text || ''} onChange={(e) => setEditForm({ ...editForm, location_text: e.target.value })} className="input-dark rounded-lg px-3 py-2 text-sm" placeholder="الموقع" />
                          <select
                            value={editForm.is_open ? 'true' : 'false'}
                            onChange={(e) => setEditForm({ ...editForm, is_open: e.target.value === 'true' })}
                            className="input-dark rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="true">مفتوح</option>
                            <option value="false">مغلق</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-1">
                            <Check size={16} /> حفظ
                          </button>
                          <button onClick={() => setEditingId(null)} className="glass-card border border-gold-400/20 rounded-lg px-4 py-2 text-sm flex items-center gap-1">
                            <X size={16} /> إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start gap-4">
                          {l.image_url && (
                            <img src={l.image_url} alt={l.title} className="w-16 h-16 rounded-xl object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {cat && <Icon name={cat.icon} size={14} className="gold-text" />}
                              <span className="text-[10px] text-gold-300/60">{cat?.name}</span>
                              {sub && <span className="text-[10px] text-gold-300/40">· {sub.name}</span>}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.is_active ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                {l.is_active ? 'منشور' : 'مخفي'}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.is_open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                {l.is_open ? 'مفتوح' : 'مغلق'}
                              </span>
                            </div>
                            <h3 className="font-bold text-gold-50 mb-1 cursor-pointer hover:text-gold-200 transition-colors" onClick={() => navigate(`/listing/${l.id}`)}>{l.title}</h3>
                            <p className="text-sm text-gold-200/60 line-clamp-1 mb-2">{l.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gold-200/70">
                              {l.phone && <span className="flex items-center gap-1"><Phone size={12} className="gold-text" />{l.phone}</span>}
                              {l.price != null && <span className="flex items-center gap-1"><DollarSign size={12} className="gold-text" />{l.price}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5 shrink-0">
                            <button onClick={() => startEdit(l)} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors" title="تعديل">
                              <Edit2 size={16} className="gold-text" />
                            </button>
                            <button onClick={() => toggleActive(l)} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors" title={l.is_active ? 'إخفاء' : 'إظهار'}>
                              {l.is_active ? <EyeOff size={16} className="text-gold-300/60" /> : <Eye size={16} className="gold-text" />}
                            </button>
                            <button onClick={() => toggleOpen(l)} className="p-2 rounded-lg hover:bg-gold-400/10 transition-colors" title={l.is_open ? 'إغلاق' : 'فتح'}>
                              <Icon name={l.is_open ? 'Lock' : 'Unlock'} size={16} className="gold-text" />
                            </button>
                            <button onClick={() => handleDelete(l.id)} className="p-2 rounded-lg hover:bg-red-500/10 transition-colors" title="حذف">
                              <Trash2 size={16} className="text-red-400" />
                            </button>
                          </div>
                        </div>

                        {/* Products under this listing */}
                        {lProducts.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-gold-400/10">
                            <div className="flex items-center gap-1.5 text-xs text-gold-300/60 mb-2">
                              <ShoppingBag size={12} /> المنتجات / العروض ({lProducts.length})
                            </div>
                            <div className="space-y-1.5">
                              {lProducts.map((p) => (
                                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-ink-600/40">
                                  {p.image_url && <img src={p.image_url} alt={p.name} className="w-8 h-8 rounded object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <span className="text-sm text-gold-100 truncate">{p.name}</span>
                                      {p.is_offer && <Star size={10} className="text-green-400 shrink-0" />}
                                    </div>
                                    {p.price != null && <span className="text-xs text-gold-300/60">{p.price} ج.س</span>}
                                  </div>
                                  <button onClick={() => handleDeleteProduct(p.id, l.id)} className="p-1 rounded hover:bg-red-500/10">
                                    <Trash2 size={12} className="text-red-400" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'profile' && <ProfileContactEditor />}

      {tab === 'wallet' && showWallet && (
        <WalletTab wallet={wallet} transactions={transactions} />
      )}

      {tab === 'verification' && (
        <VerificationTab verification={verification} />
      )}

      {/* Delete Account */}
      <div className="mt-8 pt-6 border-t border-red-500/20">
        {showDeleteAccount ? (
          <div className="glass-card rounded-2xl p-5 border border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-red-400" />
              <h3 className="font-bold text-red-400">حذف الحساب نهائياً</h3>
            </div>
            <p className="text-sm text-gold-200/60 mb-4">
              سيتم حذف حسابك وجميع تسجيلاتك ومنتجاتك نهائياً. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl py-3 font-bold hover:bg-red-500/30 transition-all">
                نعم، احذف حسابي
              </button>
              <button onClick={() => setShowDeleteAccount(false)} className="flex-1 glass-card border border-gold-400/20 rounded-xl py-3 text-gold-200/70">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full glass-card rounded-2xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2 text-red-400/70 hover:text-red-400"
          >
            <UserX size={18} /> حذف الحساب / Delete Account
          </button>
        )}
      </div>
    </div>
  );
}

function ProfileContactEditor() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    business_phone: profile?.business_phone || '',
    email_contact: profile?.email_contact || '',
    location_text: profile?.location_text || '',
    lat: profile?.lat?.toString() || '',
    lng: profile?.lng?.toString() || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: form.full_name,
      phone: form.phone,
      business_phone: form.business_phone,
      email_contact: form.email_contact,
      location_text: form.location_text,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
    }).eq('id', user!.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const fields = [
    { key: 'full_name', label: 'الاسم / اسم النشاط', icon: 'User' },
    { key: 'phone', label: 'رقم الهاتف الشخصي', icon: 'Phone' },
    { key: 'business_phone', label: 'هاتف الشركة', icon: 'Phone' },
    { key: 'email_contact', label: 'البريد الإلكتروني', icon: 'Mail' },
    { key: 'location_text', label: 'الموقع (نصي)', icon: 'MapPin' },
  ] as const;

  return (
    <form onSubmit={save} className="glass-card rounded-2xl p-6 space-y-4">
      <h2 className="font-bold text-gold-100 mb-2">بيانات التواصل المباشرة</h2>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-sm text-gold-200/70 mb-2 flex items-center gap-1.5">
            <Icon name={f.icon} size={14} className="gold-text" /> {f.label}
          </label>
          <input
            value={form[f.key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
            className="input-dark w-full rounded-xl px-4 py-3"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm text-gold-200/70 mb-2 flex items-center gap-1.5">
          <Icon name="MapPinned" size={14} className="gold-text" /> الموقع الجغرافي (GPS)
        </label>
        <MapPickerWrapper lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
      </div>
      <button type="submit" disabled={saving} className="btn-gold w-full rounded-xl py-3 disabled:opacity-50">
        {saving ? 'جاري الحفظ...' : saved ? 'تم الحفظ' : 'حفظ البيانات'}
      </button>
    </form>
  );
}

import { MapPicker } from '@/components/MapPicker';
function MapPickerWrapper({ lat, lng, onChange }: { lat: string; lng: string; onChange: (lat: string, lng: string) => void }) {
  return <MapPicker lat={lat} lng={lng} onChange={onChange} />;
}

function WalletTab({ wallet, transactions }: { wallet: Wallet | null; transactions: WalletTransaction[] }) {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-2xl p-6 gold-glow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
            <Wallet size={24} className="gold-text" />
          </div>
          <div>
            <p className="text-sm text-gold-200/50">رصيد المحفظة</p>
            <p className="font-display text-3xl font-bold gold-gradient-text">
              {wallet?.balance?.toLocaleString() || '0'} <span className="text-lg">ج.س</span>
            </p>
          </div>
        </div>
        <p className="text-xs text-gold-200/40">
          يتم خصم رسوم المنصة (5-10%) من رصيدك عند إتمام كل طلب. يمكن للمشرف شحن المحفظة.
        </p>
      </div>

      <div>
        <h3 className="font-bold text-gold-100 mb-3">سجل المعاملات</h3>
        {transactions.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-2xl text-gold-200/40">
            لا توجد معاملات بعد
          </div>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gold-100">{t.description || (t.type === 'topup' ? 'شحن المحفظة' : t.type === 'fee' ? 'رسوم المنصة' : 'تعديل')}</p>
                  <p className="text-xs text-gold-300/50">{new Date(t.created_at).toLocaleDateString('ar')}</p>
                </div>
                <span className={`font-bold ${t.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString()} ج.س
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VerificationTab({ verification }: { verification: Verification | null }) {
  const { user } = useAuth();
  const [docUrl, setDocUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitVerification = async () => {
    if (!docUrl.trim() || !user) return;
    setSubmitting(true);
    const { data } = await supabase
      .from('verifications')
      .insert({ user_id: user.id, id_document_url: docUrl })
      .select()
      .maybeSingle();
    if (data) {
      setVerification(data as Verification);
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (verification) {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            verification.status === 'approved' ? 'bg-green-500/15' : verification.status === 'rejected' ? 'bg-red-500/15' : 'bg-gold-400/10'
          }`}>
            {verification.status === 'approved' ? <BadgeCheck size={24} className="text-green-400" /> : verification.status === 'rejected' ? <X size={24} className="text-red-400" /> : <ShieldCheck size={24} className="gold-text" />}
          </div>
          <div>
            <h3 className="font-bold text-gold-100">حالة التحقق</h3>
            <p className={`text-sm ${
              verification.status === 'approved' ? 'text-green-400' : verification.status === 'rejected' ? 'text-red-400' : 'text-gold-300'
            }`}>
              {verification.status === 'approved' ? 'تم التحقق — لديك شارة موثّق' : verification.status === 'rejected' ? 'تم رفض الطلب' : 'قيد المراجعة من قبل المشرف'}
            </p>
          </div>
        </div>
        <p className="text-xs text-gold-200/40">تم الإرسال في: {new Date(verification.submitted_at).toLocaleDateString('ar')}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center">
          <BadgeCheck size={24} className="gold-text" />
        </div>
        <div>
          <h3 className="font-bold text-gold-100">طلب شارة التحقق</h3>
          <p className="text-sm text-gold-200/50">أرفق صورة هويتك للحصول على شارة "موثّق"</p>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gold-200/70 mb-2">رابط صورة الهوية / الوثيقة</label>
        <input
          value={docUrl}
          onChange={(e) => setDocUrl(e.target.value)}
          placeholder="https://..."
          className="input-dark w-full rounded-xl px-4 py-3"
        />
      </div>
      <button
        onClick={submitVerification}
        disabled={submitting || !docUrl.trim()}
        className="btn-gold w-full rounded-xl py-3 disabled:opacity-50"
      >
        {submitting ? 'جاري الإرسال...' : submitted ? 'تم الإرسال' : 'إرسال طلب التحقق'}
      </button>
    </div>
  );
}
