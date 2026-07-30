import { useState } from 'react';
import { supabase, type AccountType, ACCOUNT_TYPE_LABELS } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { Sparkles, Phone, Mail, Lock, User, Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';

type Mode = 'signin' | 'signup';
type Step = 'form' | 'otp';

const accountTypes: { value: AccountType; icon: string; desc: string }[] = [
  { value: 'individual', icon: 'User', desc: 'تصفح، اطلب، ابحث عن وظائف' },
  { value: 'business', icon: 'Store', desc: 'أدر خدماتك ومحلك وانشر الوظائف' },
  { value: 'professional', icon: 'HardHat', desc: 'حرفي: اعرض خدماتك المهنية' },
  { value: 'driver', icon: 'Truck', desc: 'سائق أو ناقل: اعرض خدمات النقل' },
];

export function AuthPage() {
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<Step>('form');
  const [identifier, setIdentifier] = useState(''); // email or phone
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [otpCode, setOtpCode] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const isEmail = (s: string) => /@/.test(s);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!identifier.trim() || !password.trim()) {
      setError('الرجاء إدخال البريد/الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        if (!fullName.trim()) {
          setError('الرجاء إدخال الاسم');
          setLoading(false);
          return;
        }
        // Supabase auth works with email. If user entered a phone, we still
        // create an auth record using a synthetic email so OTP can be simulated.
        const emailForAuth = isEmail(identifier) ? identifier : `${identifier}@phone.nour.sd`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: emailForAuth,
          password,
          options: { data: { full_name: fullName, account_type: accountType } },
        });

        if (signUpError) throw signUpError;

        // Create profile row
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName,
            account_type: accountType,
            phone: isEmail(identifier) ? '' : identifier,
            email_contact: isEmail(identifier) ? identifier : '',
          });
        }

        setInfo('تم إرسال رمز التحقق (OTP) إلى بريدك. للتجربة استخدم الرمز: 123456');
        setStep('otp');
      } else {
        const emailForAuth = isEmail(identifier) ? identifier : `${identifier}@phone.nour.sd`;
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailForAuth,
          password,
        });
        if (signInError) throw signInError;
        await refreshProfile();
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  const handleOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (otpCode.trim() !== '123456') {
      setError('رمز التحقق غير صحيح. استخدم 123456 للتجربة');
      return;
    }
    setLoading(true);
    try {
      await refreshProfile();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gold-400/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gold-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl glass-card gold-glow mb-4 animate-pulse-glow">
            <Sparkles size={40} className="gold-text" />
          </div>
          <h1 className="font-display text-3xl font-bold gold-gradient-text">نور السودان</h1>
          <p className="text-gold-200/60 text-sm mt-2">اسأل نور... وحياتك أسهل</p>
        </div>

        <div className="glass-card rounded-2xl p-8 gold-glow">
          {step === 'otp' ? (
            <form onSubmit={handleOtp} className="space-y-5">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gold-400/10 mb-3">
                  <ShieldCheck size={28} className="gold-text" />
                </div>
                <h2 className="text-xl font-bold text-gold-100">رمز التحقق</h2>
                <p className="text-sm text-gold-200/50 mt-1">أدخل الرمز المرسل إليك</p>
              </div>
              {info && (
                <div className="text-xs text-gold-300 bg-gold-400/10 rounded-lg p-3 text-center">
                  {info}
                </div>
              )}
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="input-dark w-full rounded-xl px-4 py-3 text-center text-2xl tracking-[0.5em] font-bold"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full rounded-xl py-3 disabled:opacity-50"
              >
                {loading ? 'جاري التحقق...' : 'تأكيد الرمز'}
              </button>
              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full text-sm text-gold-200/60 hover:text-gold-200 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={14} /> رجوع
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode toggle */}
              <div className="flex gap-2 p-1 rounded-xl bg-ink-600/50 border border-gold-400/10">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'signup'
                      ? 'btn-gold'
                      : 'text-gold-200/50 hover:text-gold-200'
                  }`}
                >
                  حساب جديد
                </button>
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                    mode === 'signin'
                      ? 'btn-gold'
                      : 'text-gold-200/50 hover:text-gold-200'
                  }`}
                >
                  تسجيل الدخول
                </button>
              </div>

              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-sm text-gold-200/70 mb-2">نوع الحساب</label>
                    <div className="grid grid-cols-3 gap-2">
                      {accountTypes.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setAccountType(t.value)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            accountType === t.value
                              ? 'border-gold-400/60 bg-gold-400/10 gold-glow'
                              : 'border-gold-400/15 bg-ink-600/40 hover:border-gold-400/30'
                          }`}
                        >
                          <Icon name={t.icon} size={22} className="gold-text mx-auto mb-1" />
                          <span className="text-[11px] font-bold text-gold-100 block">
                            {ACCOUNT_TYPE_LABELS[t.value]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="الاسم الكامل / اسم النشاط"
                      className="input-dark w-full rounded-xl py-3 pr-10 pl-4"
                    />
                  </div>
                </>
              )}

              <div className="relative">
                {isEmail(identifier) || !identifier ? (
                  <Mail size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
                ) : (
                  <Phone size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
                )}
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="البريد الإلكتروني أو رقم الهاتف"
                  className="input-dark w-full rounded-xl py-3 pr-10 pl-4"
                />
              </div>

              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
                <input
                  type={password ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="input-dark w-full rounded-xl py-3 pr-10 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/50 hover:text-gold-300"
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              {info && (
                <div className="text-xs text-gold-300 bg-gold-400/10 rounded-lg p-3 text-center">
                  {info}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full rounded-xl py-3 disabled:opacity-50"
              >
                {loading
                  ? 'جاري المعالجة...'
                  : mode === 'signup'
                    ? 'إنشاء الحساب'
                    : 'دخول'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gold-200/40 mt-6">
          بتسجيلك فإنك توافق على شروط استخدام نور السودان
        </p>
      </div>
    </div>
  );
}
