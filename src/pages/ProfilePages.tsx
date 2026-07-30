import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { MapPreview } from '@/components/MapPreview';
import { Settings, HelpCircle, ShieldCheck, ChevronLeft, BadgeCheck, AlertTriangle, UserX } from 'lucide-react';
import { ACCOUNT_TYPE_LABELS, supabase } from '@/lib/supabase';

export function ProfilePage() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold-200/50 animate-pulse">جاري التحميل...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60">يجب تسجيل الدخول</p>
        <button onClick={() => navigate('/auth')} className="btn-gold rounded-xl px-6 py-2">دخول</button>
      </div>
    );
  }

  const typeIcon = profile.account_type === 'business' ? 'Store' : profile.account_type === 'professional' ? 'HardHat' : profile.account_type === 'admin' ? 'ShieldCheck' : 'User';

  const contactItems = [
    { label: 'الاسم', value: profile.full_name, icon: 'User', action: null },
    { label: 'نوع الحساب', value: ACCOUNT_TYPE_LABELS[profile.account_type], icon: typeIcon, action: null },
    { label: 'الهاتف الشخصي', value: profile.phone || 'غير محدد', icon: 'Phone', action: profile.phone ? `tel:${profile.phone}` : null },
    { label: 'هاتف الشركة', value: profile.business_phone || 'غير محدد', icon: 'Phone', action: profile.business_phone ? `tel:${profile.business_phone}` : null },
    { label: 'البريد الإلكتروني', value: profile.email_contact || 'غير محدد', icon: 'Mail', action: profile.email_contact ? `mailto:${profile.email_contact}` : null },
    { label: 'الموقع', value: profile.location_text || 'غير محدد', icon: 'MapPin', action: null },
  ];

  return (
    <div className="min-h-screen max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-6">
        <ChevronLeft size={16} /> الرئيسية
      </button>

      <div className="glass-card rounded-2xl p-6 mb-6 gold-glow">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gold-400/10 flex items-center justify-center gold-glow">
            <Icon name={typeIcon} size={36} className="gold-text" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold gold-gradient-text">{profile.full_name}</h1>
            <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-gold-400/10 text-gold-300">
              {ACCOUNT_TYPE_LABELS[profile.account_type]}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {contactItems.map((item) => {
            const content = (
              <>
                <div className="w-9 h-9 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                  <Icon name={item.icon} size={16} className="gold-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gold-300/60">{item.label}</div>
                  <div className="text-sm text-gold-100 truncate" dir={item.action?.startsWith('tel:') ? 'ltr' : undefined}>{item.value}</div>
                </div>
              </>
            );
            return item.action ? (
              <a
                key={item.label}
                href={item.action}
                className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
              >
                {content}
              </a>
            ) : (
              <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
                {content}
              </div>
            );
          })}
          {profile.lat != null && profile.lng != null && (
            <div className="mt-2">
              <MapPreview lat={profile.lat} lng={profile.lng} label={profile.location_text} />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center gap-2"
        >
          <Settings size={24} className="gold-text" />
          <span className="text-sm text-gold-100">لوحة التحكم</span>
        </button>
        <button
          onClick={() => navigate('/help')}
          className="glass-card glass-card-hover rounded-xl p-4 flex flex-col items-center gap-2"
        >
          <HelpCircle size={24} className="gold-text" />
          <span className="text-sm text-gold-100">المساعدة والدعم</span>
        </button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [adminCode, setAdminCode] = useState('');
  const [adminError, setAdminError] = useState('');
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const tryAdminAccess = async () => {
    setAdminError('');
    if (adminCode.trim() === 'nour-admin-2026') {
      const { error } = await supabase.from('profiles').update({ account_type: 'admin' }).eq('id', user!.id);
      if (error) {
        setAdminError('فشل الترقية');
      } else {
        setShowAdminPrompt(false);
        navigate('/admin');
      }
    } else {
      setAdminError('رمز المشرف غير صحيح');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('هل أنت متأكد تماماً؟ سيتم حذف حسابك وجميع تسجيلاتك نهائياً ولا يمكن التراجع.')) return;
    await supabase.from('listings').delete().eq('owner_id', user!.id);
    await supabase.from('profiles').delete().eq('id', user!.id);
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-6">
        <ChevronLeft size={16} /> الرئيسية
      </button>
      <h1 className="font-display text-2xl font-bold gold-gradient-text mb-6">الإعدادات</h1>
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-ink-600/40">
          <span className="text-sm text-gold-100">إشعارات التطبيق</span>
          <ToggleSwitch />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-ink-600/40">
          <span className="text-sm text-gold-100">إشعارات الرسائل</span>
          <ToggleSwitch defaultOn />
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-ink-600/40">
          <span className="text-sm text-gold-100">الوضع الليلي</span>
          <div className="text-xs gold-text">مفعّل دائماً</div>
        </div>
      </div>

      {/* Verification status */}
      {profile && (
        <div className="glass-card rounded-2xl p-5 mt-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${profile.is_verified ? 'bg-blue-500/15' : 'bg-gold-400/10'}`}>
              {profile.is_verified ? <BadgeCheck size={20} className="text-blue-400" /> : <ShieldCheck size={20} className="gold-text" />}
            </div>
            <div>
              <h3 className="font-bold text-gold-100 text-sm">حالة التحقق</h3>
              <p className="text-xs text-gold-200/50">
                {profile.is_verified ? 'حسابك موثّق — لديك شارة الزرقاء' : 'حسابك غير موثّق بعد. تقدم بطلب من لوحة التحكم.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin access toggle */}
      {profile && profile.account_type !== 'admin' && (
        <div className="mt-4">
          {showAdminPrompt ? (
            <div className="glass-card rounded-2xl p-5 border border-gold-400/20">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={18} className="gold-text" />
                <h3 className="font-bold text-gold-100 text-sm">دخول المشرف العام</h3>
              </div>
              <p className="text-xs text-gold-200/50 mb-3">أدخل رمز المشرف للوصول إلى لوحة الإدارة الكاملة</p>
              <input
                type="password"
                value={adminCode}
                onChange={(e) => setAdminCode(e.target.value)}
                placeholder="رمز المشرف"
                className="input-dark w-full rounded-xl px-4 py-3 mb-3"
                onKeyDown={(e) => e.key === 'Enter' && tryAdminAccess()}
              />
              {adminError && <p className="text-red-400 text-xs mb-2">{adminError}</p>}
              <div className="flex gap-2">
                <button onClick={tryAdminAccess} className="flex-1 btn-gold rounded-xl py-2.5 text-sm">
                  تأكيد
                </button>
                <button onClick={() => setShowAdminPrompt(false)} className="flex-1 glass-card border border-gold-400/20 rounded-xl py-2.5 text-sm text-gold-200/70">
                  إلغاء
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdminPrompt(true)}
              className="w-full glass-card rounded-2xl p-4 border border-gold-400/15 hover:border-gold-400/40 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="gold-text" />
                <span className="text-sm text-gold-100">دخول المشرف العام</span>
              </div>
              <ChevronLeft size={16} className="text-gold-300/40 rotate-180" />
            </button>
          )}
        </div>
      )}

      {/* Delete Account */}
      <div className="mt-4">
        {showDeleteAccount ? (
          <div className="glass-card rounded-2xl p-5 border border-red-500/30">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-red-400" />
              <h3 className="font-bold text-red-400 text-sm">حذف الحساب نهائياً</h3>
            </div>
            <p className="text-sm text-gold-200/60 mb-4">
              سيتم حذف حسابك وجميع تسجيلاتك ومنتجاتك نهائياً. لا يمكن التراجع.
            </p>
            <div className="flex gap-2">
              <button onClick={handleDeleteAccount} className="flex-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl py-2.5 font-bold hover:bg-red-500/30 transition-all text-sm">
                نعم، احذف حسابي
              </button>
              <button onClick={() => setShowDeleteAccount(false)} className="flex-1 glass-card border border-gold-400/20 rounded-xl py-2.5 text-sm text-gold-200/70">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="w-full glass-card rounded-2xl p-4 border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2 text-red-400/70 hover:text-red-400 text-sm"
          >
            <UserX size={18} /> حذف الحساب / Delete Account
          </button>
        )}
      </div>

      <div className="mt-4 text-center">
        <p className="text-xs text-gold-200/40">نور السودان — الإصدار 2.0</p>
      </div>
    </div>
  );
}

export function HelpPage() {
  const faqs = [
    { q: 'كيف أضيف إعلاناً؟', a: 'سجل كحساب شركة أو مهني، ادخل القسم المناسب واضغط "أضف إعلان".' },
    { q: 'كيف أبحث عن خدمة؟', a: 'استخدم شريط البحث في الأعلى أو اسأل نور في الصفحة الرئيسية.' },
    { q: 'كيف أحدد موقعي الجغرافي؟', a: 'من لوحة التحكم > بيانات التواصل، اضغط "تحديد موضعي" لاستخدام GPS.' },
    { q: 'كيف أصبح مشرفاً؟', a: 'حساب المشرف العام يُمنح من إدارة التطبيق.' },
  ];
  return (
    <div className="min-h-screen max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-6">
        <ChevronLeft size={16} /> الرئيسية
      </button>
      <h1 className="font-display text-2xl font-bold gold-gradient-text mb-6">مركز المساعدة والدعم</h1>
      <div className="space-y-3">
        {faqs.map((f, i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-gold-100 mb-2 flex items-center gap-2">
              <HelpCircle size={18} className="gold-text shrink-0" /> {f.q}
            </h3>
            <p className="text-sm text-gold-200/60 pr-7">{f.a}</p>
          </div>
        ))}
      </div>
      <div className="glass-card rounded-2xl p-5 mt-6 text-center">
        <p className="text-sm text-gold-200/60 mb-2">للتواصل المباشر مع الدعم</p>
        <a href="mailto:support@noursudan.sd" className="gold-text text-sm hover:underline">support@noursudan.sd</a>
      </div>
    </div>
  );
}

import { useState } from 'react';

function ToggleSwitch({ defaultOn }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`w-12 h-6 rounded-full transition-all relative ${on ? 'bg-gold-400/40' : 'bg-ink-600'}`}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${on ? 'right-0.5 bg-gold-300' : 'right-6 bg-gold-200/40'}`}
      />
    </button>
  );
}
