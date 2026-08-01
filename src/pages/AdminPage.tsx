import { useEffect, useState } from 'react';
import { supabase, type Profile, type Listing, type Category, type Subcategory, type Wallet, type Verification, type Order, type AccountType, ACCOUNT_TYPE_LABELS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import {
  ShieldCheck, Eye, EyeOff, Trash2, Check, X,
  ChevronLeft, BadgeCheck, UserX, UserCheck, Wallet, TrendingUp,
  Search, Crown, Zap, FileText, ShoppingBag
} from 'lucide-react';

type ViewMode = 'admin' | 'customer' | 'business' | 'craftsman' | 'driver';

export function AdminPage() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<'overview' | 'listings' | 'users' | 'wallets' | 'verifications' | 'orders'>('overview');
  const [viewMode, setViewMode] = useState<ViewMode>('admin');
  const [stats, setStats] = useState({ totalUsers: 0, byRole: {} as Record<string, number>, totalListings: 0, activeListings: 0, hiddenListings: 0, totalWalletBalance: 0, pendingVerifications: 0, pendingOrders: 0 });
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (profile?.account_type !== 'admin') return;
    loadAll();
  }, [profile]);

  const loadAll = async () => {
    const [usersRes, listingsRes, catsRes, subsRes, walletsRes, verifsRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
      supabase.from('wallets').select('*'),
      supabase.from('verifications').select('*').eq('status', 'pending').order('submitted_at', { ascending: false }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
    ]);

    const users = (usersRes.data as Profile[]) || [];
    const listings = (listingsRes.data as Listing[]) || [];
    const wals = (walletsRes.data as Wallet[]) || [];
    const verifs = (verifsRes.data as Verification[]) || [];

    setAllUsers(users);
    setAllListings(listings);
    setCategories((catsRes.data as Category[]) || []);
    setSubcats((subsRes.data as Subcategory[]) || []);
    setWallets(wals);
    setVerifications(verifs);
    setOrders((ordersRes.data as Order[]) || []);

    const byRole: Record<string, number> = {};
    users.forEach((u) => { byRole[u.account_type] = (byRole[u.account_type] || 0) + 1; });

    setStats({
      totalUsers: users.length,
      byRole,
      totalListings: listings.length,
      activeListings: listings.filter((l) => l.is_active && !l.is_hidden_by_admin).length,
      hiddenListings: listings.filter((l) => l.is_hidden_by_admin).length,
      totalWalletBalance: wals.reduce((sum, w) => sum + w.balance, 0),
      pendingVerifications: verifs.length,
      pendingOrders: (ordersRes.data as Order[] || []).filter((o) => o.status === 'pending').length,
    });
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold-200/50 animate-pulse">جاري التحميل...</div>;
  }

  if (!user || profile?.account_type !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <ShieldCheck size={48} className="text-gold-300/40" />
        <p className="text-gold-200/60">هذه الصفحة مخصصة للمشرف العام فقط</p>
        <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2">العودة للرئيسية</button>
      </div>
    );
  }

  const hideListing = async (l: Listing) => {
    const newHidden = !l.is_hidden_by_admin;
    await supabase.from('listings').update({ is_hidden_by_admin: newHidden }).eq('id', l.id);
    setAllListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_hidden_by_admin: newHidden } : x)));
  };

  const deleteListing = async (id: string) => {
    if (!confirm('حذف هذا التسجيل نهائياً؟')) return;
    await supabase.from('listings').delete().eq('id', id);
    setAllListings((prev) => prev.filter((l) => l.id !== id));
  };

  const blockUser = async (p: Profile) => {
    const newBlocked = !p.is_blocked;
    await supabase.from('profiles').update({ is_blocked: newBlocked }).eq('id', p.id);
    setAllUsers((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_blocked: newBlocked } : x)));
  };

  const verifyUser = async (p: Profile) => {
    const newVerified = !p.is_verified;
    await supabase.from('profiles').update({ is_verified: newVerified }).eq('id', p.id);
    setAllUsers((prev) => prev.map((x) => (x.id === p.id ? { ...x, is_verified: newVerified } : x)));
  };

  const deleteUser = async (id: string) => {
    if (!confirm('حذف هذا المستخدم نهائياً؟ سيتم حذف جميع تسجيلاته.')) return;
    await supabase.from('profiles').delete().eq('id', id);
    setAllUsers((prev) => prev.filter((p) => p.id !== id));
  };

  const approveVerification = async (v: Verification, approved: boolean) => {
    await supabase.from('verifications').update({ status: approved ? 'approved' : 'rejected', reviewed_at: new Date().toISOString() }).eq('id', v.id);
    if (approved) {
      await supabase.from('profiles').update({ is_verified: true }).eq('id', v.user_id);
      setAllUsers((prev) => prev.map((x) => (x.id === v.user_id ? { ...x, is_verified: true } : x)));
    }
    setVerifications((prev) => prev.filter((x) => x.id !== v.id));
    setStats((s) => ({ ...s, pendingVerifications: s.pendingVerifications - 1 }));
  };

  const topUpWallet = async (userId: string) => {
    const amount = prompt('مبلغ الشحن (ج.س):');
    if (!amount || isNaN(parseFloat(amount))) return;
    let wallet = wallets.find((w) => w.user_id === userId);
    if (!wallet) {
      const { data } = await supabase.from('wallets').insert({ user_id: userId, balance: 0 }).select().maybeSingle();
      wallet = data as Wallet;
      if (wallet) setWallets((prev) => [...prev, wallet]);
    }
    if (!wallet) return;
    const newBalance = wallet.balance + parseFloat(amount);
    await supabase.from('wallets').update({ balance: newBalance, updated_at: new Date().toISOString() }).eq('id', wallet.id);
    await supabase.from('wallet_transactions').insert({ wallet_id: wallet.id, amount: parseFloat(amount), type: 'topup', description: 'شحن من قبل المشرف' });
    setWallets((prev) => prev.map((w) => (w.id === wallet!.id ? { ...w, balance: newBalance } : w)));
  };

  const toggleFeatured = async (l: Listing) => {
    const newFeatured = !l.is_featured;
    await supabase.from('listings').update({ is_featured: newFeatured }).eq('id', l.id);
    setAllListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_featured: newFeatured } : x)));
  };

  const toggleSponsored = async (l: Listing) => {
    const newSponsored = !l.is_sponsored;
    await supabase.from('listings').update({ is_sponsored: newSponsored }).eq('id', l.id);
    setAllListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_sponsored: newSponsored } : x)));
  };

  const confirmOrder = async (orderId: string, status: 'confirmed' | 'rejected') => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const filteredListings = search.trim()
    ? allListings.filter((l) => l.title.includes(search.trim()) || l.description.includes(search.trim()))
    : allListings;
  const filteredUsers = search.trim()
    ? allUsers.filter((u) => u.full_name.includes(search.trim()) || u.phone.includes(search.trim()))
    : allUsers;

  const tabs = [
    { key: 'overview' as const, label: 'نظرة عامة', icon: 'LayoutDashboard' },
    { key: 'listings' as const, label: `التسجيلات (${allListings.length})`, icon: 'Tag' },
    { key: 'users' as const, label: `المستخدمون (${allUsers.length})`, icon: 'Users' },
    { key: 'orders' as const, label: `الطلبات (${stats.pendingOrders || 0})`, icon: 'ShoppingBag' },
    { key: 'wallets' as const, label: 'المحافظ', icon: 'Wallet' },
    { key: 'verifications' as const, label: `التحقق (${stats.pendingVerifications})`, icon: 'BadgeCheck' },
  ];

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-4 sm:px-6 py-8 relative">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-4">
        <ChevronLeft size={16} /> الرئيسية
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center gold-glow">
          <ShieldCheck size={24} className="gold-text" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold gold-gradient-text">لوحة مالك التطبيق</h1>
          <p className="text-sm text-gold-200/50">إدارة شاملة لجميع الأقسام والمستخدمين والمعاملات</p>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="glass-card rounded-xl p-3 mb-6 flex items-center gap-2 overflow-x-auto">
        <span className="text-xs text-gold-300/60 shrink-0 px-2">معاينة كـ:</span>
        {([
          { mode: 'admin', label: 'مشرف', icon: 'ShieldCheck' },
          { mode: 'customer', label: 'عميل', icon: 'User' },
          { mode: 'business', label: 'شركة', icon: 'Building' },
          { mode: 'craftsman', label: 'حرفي', icon: 'HardHat' },
          { mode: 'driver', label: 'سائق', icon: 'Truck' },
        ] as { mode: ViewMode; label: string; icon: string }[]).map((r) => (
          <button
            key={r.mode}
            onClick={() => setViewMode(r.mode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              viewMode === r.mode ? 'btn-gold' : 'bg-ink-600/50 text-gold-200/50 hover:text-gold-200'
            }`}
          >
            <Icon name={r.icon} size={12} /> {r.label}
          </button>
        ))}
      </div>

      {viewMode !== 'admin' && (
        <div className="glass-card rounded-xl p-4 mb-6 border border-blue-500/20 bg-blue-500/5">
          <p className="text-sm text-blue-300 flex items-center gap-2">
            <Eye size={16} /> أنت الآن تعاين التطبيق كـ: <strong>{({ customer: 'عميل', business: 'شركة', craftsman: 'حرفي', driver: 'سائق' } as Record<ViewMode, string>)[viewMode]}</strong>
          </p>
          <button onClick={() => navigate('/')} className="text-xs gold-text hover:underline mt-1">اذهب للصفحة الرئيسية للمعاينة</button>
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

      {/* Search */}
      {tab !== 'overview' && (
        <div className="relative mb-4">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="input-dark w-full rounded-xl py-2.5 pr-10 pl-4 text-sm"
          />
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="Users" label="إجمالي المستخدمين" value={stats.totalUsers} />
            <StatCard icon="Tag" label="إجمالي التسجيلات" value={stats.totalListings} />
            <StatCard icon="Eye" label="تسجيلات نشطة" value={stats.activeListings} />
            <StatCard icon="Wallet" label="رصيد المحافظ" value={stats.totalWalletBalance} suffix="ج.س" />
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="gold-text" /> المستخدمون حسب الدور
            </h3>
            <div className="space-y-3">
              {(['individual', 'business', 'professional', 'driver', 'admin'] as AccountType[]).map((role) => {
                const count = stats.byRole[role] || 0;
                const pct = stats.totalUsers > 0 ? (count / stats.totalUsers) * 100 : 0;
                const icons: Record<AccountType, string> = { individual: 'User', business: 'Building', professional: 'HardHat', driver: 'Truck', admin: 'ShieldCheck' };
                return (
                  <div key={role} className="flex items-center gap-3">
                    <Icon name={icons[role]} size={16} className="gold-text shrink-0" />
                    <span className="text-sm text-gold-100 w-24 shrink-0">{ACCOUNT_TYPE_LABELS[role]}</span>
                    <div className="flex-1 h-2 rounded-full bg-ink-600 overflow-hidden">
                      <div className="h-full bg-gold-400/40 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gold-300 font-bold w-8 text-left">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff size={18} className="text-gold-300/60" />
                <span className="text-sm text-gold-200/60">تسجيلات مخفية</span>
              </div>
              <p className="font-display text-2xl font-bold text-gold-100">{stats.hiddenListings}</p>
            </div>
            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <BadgeCheck size={18} className="text-gold-300/60" />
                <span className="text-sm text-gold-200/60">طلبات تحقق معلقة</span>
              </div>
              <p className="font-display text-2xl font-bold text-gold-100">{stats.pendingVerifications}</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'listings' && (
        <div className="space-y-3">
          {filteredListings.length === 0 ? (
            <p className="text-center py-12 text-gold-200/40">لا توجد تسجيلات</p>
          ) : (
            filteredListings.map((l) => {
              const cat = categories.find((c) => c.id === l.category_id);
              const sub = subcats.find((s) => s.id === l.subcategory_id);
              const owner = allUsers.find((u) => u.id === l.owner_id);
              return (
                <div key={l.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    {l.image_url && <img src={l.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {cat && <Icon name={cat.icon} size={12} className="gold-text" />}
                        <span className="text-[10px] text-gold-300/50">{cat?.name}</span>
                        {sub && <span className="text-[10px] text-gold-300/40">· {sub.name}</span>}
                        {l.is_hidden_by_admin && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">مخفي</span>}
                        {!l.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">غير منشور</span>}
                        {l.is_open && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">مفتوح</span>}
                      </div>
                      <h3 className="font-bold text-gold-50 text-sm cursor-pointer hover:text-gold-200" onClick={() => navigate(`/listing/${l.id}`)}>{l.title}</h3>
                      <p className="text-xs text-gold-200/50 line-clamp-1">{l.description}</p>
                      {owner && <p className="text-[10px] text-gold-300/40 mt-1">بواسطة: {owner.full_name}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => toggleFeatured(l)} className={`p-2 rounded-lg hover:bg-gold-400/10 ${l.is_featured ? 'text-gold-300' : 'text-gold-300/30'}`} title="مميز">
                        <Crown size={15} />
                      </button>
                      <button onClick={() => toggleSponsored(l)} className={`p-2 rounded-lg hover:bg-gold-400/10 ${l.is_sponsored ? 'text-purple-400' : 'text-gold-300/30'}`} title="إعلان ممول">
                        <Zap size={15} />
                      </button>
                      <button onClick={() => hideListing(l)} className="p-2 rounded-lg hover:bg-gold-400/10" title={l.is_hidden_by_admin ? 'إظهار' : 'إخفاء'}>
                        {l.is_hidden_by_admin ? <Eye size={15} className="gold-text" /> : <EyeOff size={15} className="text-gold-300/60" />}
                      </button>
                      <button onClick={() => deleteListing(l.id)} className="p-2 rounded-lg hover:bg-red-500/10" title="حذف">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'users' && (
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="text-center py-12 text-gold-200/40">لا يوجد مستخدمون</p>
          ) : (
            filteredUsers.map((p) => (
              <div key={p.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                  <Icon name={p.account_type === 'business' ? 'Building' : p.account_type === 'professional' ? 'HardHat' : p.account_type === 'driver' ? 'Truck' : p.account_type === 'admin' ? 'ShieldCheck' : 'User'} size={18} className="gold-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gold-50 text-sm truncate">{p.full_name || 'بدون اسم'}</h3>
                    {p.is_verified && <BadgeCheck size={14} className="text-blue-400 shrink-0" />}
                    {p.is_blocked && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">محظور</span>}
                  </div>
                  <p className="text-xs text-gold-300/50">{ACCOUNT_TYPE_LABELS[p.account_type]} · {p.phone || 'لا هاتف'}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => verifyUser(p)} className={`p-2 rounded-lg hover:bg-gold-400/10 ${p.is_verified ? 'text-blue-400' : 'text-gold-300/60'}`} title={p.is_verified ? 'إزالة التحقق' : 'توثيق'}>
                    <BadgeCheck size={15} />
                  </button>
                  <button onClick={() => blockUser(p)} className="p-2 rounded-lg hover:bg-gold-400/10" title={p.is_blocked ? 'رفع الحظر' : 'حظر'}>
                    {p.is_blocked ? <UserCheck size={15} className="text-green-400" /> : <UserX size={15} className="text-gold-300/60" />}
                  </button>
                  <button onClick={() => deleteUser(p.id)} className="p-2 rounded-lg hover:bg-red-500/10" title="حذف">
                    <Trash2 size={15} className="text-red-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <p className="text-center py-12 text-gold-200/40">لا توجد طلبات بعد</p>
          ) : (
            orders.map((o) => {
              const listing = allListings.find((l) => l.id === o.listing_id);
              return (
                <div key={o.id} className="glass-card rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                      <ShoppingBag size={18} className="gold-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gold-50 text-sm">{listing?.title || 'طلب'}</h3>
                      <p className="text-xs text-gold-300/50">العميل: {o.customer_name} · {o.customer_phone}</p>
                      {o.notes && <p className="text-xs text-gold-200/50 mt-1">{o.notes}</p>}
                      {o.receipt_url ? (
                        <a href={o.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs gold-text hover:underline flex items-center gap-1 mt-1">
                          <FileText size={11} /> عرض الإيصال
                        </a>
                      ) : (
                        <p className="text-xs text-gold-300/40 mt-1">لم يتم رفع إيصال</p>
                      )}
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                        o.status === 'pending' ? 'bg-gold-400/15 text-gold-300' : o.status === 'confirmed' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {o.status === 'pending' ? 'بانتظار التأكيد' : o.status === 'confirmed' ? 'مؤكد' : 'مرفوض'}
                      </span>
                    </div>
                    {o.status === 'pending' && (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => confirmOrder(o.id, 'confirmed')} className="p-2 rounded-lg bg-green-500/15 hover:bg-green-500/25" title="تأكيد">
                          <Check size={16} className="text-green-400" />
                        </button>
                        <button onClick={() => confirmOrder(o.id, 'rejected')} className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25" title="رفض">
                          <X size={16} className="text-red-400" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'wallets' && (
        <div className="space-y-3">
          {wallets.length === 0 ? (
            <p className="text-center py-12 text-gold-200/40">لا توجد محافظ بعد</p>
          ) : (
            wallets.map((w) => {
              const owner = allUsers.find((u) => u.id === w.user_id);
              if (!owner) return null;
              return (
                <div key={w.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                    <Wallet size={18} className="gold-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gold-50 text-sm truncate">{owner.full_name}</h3>
                    <p className="text-xs text-gold-300/50">{ACCOUNT_TYPE_LABELS[owner.account_type]}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="font-bold gold-text">{w.balance.toLocaleString()} ج.س</p>
                  </div>
                  <button onClick={() => topUpWallet(w.user_id)} className="btn-gold rounded-lg px-3 py-1.5 text-xs flex items-center gap-1 shrink-0">
                    <Wallet size={12} /> شحن
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'verifications' && (
        <div className="space-y-3">
          {verifications.length === 0 ? (
            <p className="text-center py-12 text-gold-200/40">لا توجد طلبات تحقق معلقة</p>
          ) : (
            verifications.map((v) => {
              const owner = allUsers.find((u) => u.id === v.user_id);
              return (
                <div key={v.id} className="glass-card rounded-xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                    <BadgeCheck size={18} className="gold-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gold-50 text-sm truncate">{owner?.full_name || 'مستخدم'}</h3>
                    <p className="text-xs text-gold-300/50">{owner ? ACCOUNT_TYPE_LABELS[owner.account_type] : ''}</p>
                    <a href={v.id_document_url} target="_blank" rel="noopener noreferrer" className="text-xs gold-text hover:underline">عرض الوثيقة</a>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => approveVerification(v, true)} className="p-2 rounded-lg bg-green-500/15 hover:bg-green-500/25" title="موافقة">
                      <Check size={16} className="text-green-400" />
                    </button>
                    <button onClick={() => approveVerification(v, false)} className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25" title="رفض">
                      <X size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Floating role switcher */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-1.5">
        {([
          { mode: 'admin', icon: 'ShieldCheck', color: 'gold-text' },
          { mode: 'customer', icon: 'User', color: 'text-gold-200' },
          { mode: 'business', icon: 'Building', color: 'text-gold-200' },
          { mode: 'craftsman', icon: 'HardHat', color: 'text-gold-200' },
          { mode: 'driver', icon: 'Truck', color: 'text-gold-200' },
        ] as { mode: ViewMode; icon: string; color: string }[]).map((r) => (
          <button
            key={r.mode}
            onClick={() => setViewMode(r.mode)}
            className={`w-11 h-11 rounded-full glass-card-hover flex items-center justify-center transition-all ${
              viewMode === r.mode ? 'btn-gold scale-110' : 'border border-gold-400/15'
            }`}
            title={r.mode}
          >
            <Icon name={r.icon} size={18} className={viewMode === r.mode ? 'text-ink-900' : r.color} />
          </button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, suffix }: { icon: string; label: string; value: number; suffix?: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon name={icon} size={18} className="gold-text" />
        <span className="text-xs text-gold-200/60">{label}</span>
      </div>
      <p className="font-display text-2xl font-bold gold-gradient-text">
        {value.toLocaleString()} {suffix && <span className="text-sm">{suffix}</span>}
      </p>
    </div>
  );
}
