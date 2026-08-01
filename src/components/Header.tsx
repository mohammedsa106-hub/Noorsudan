import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { ACCOUNT_TYPE_LABELS } from '@/lib/supabase';
import { Icon } from '@/components/Icon';
import { Sparkles, Search, ChevronDown, User, LogOut, X } from 'lucide-react';

export function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [q, setQ] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { label: 'تعديل الملف وبيانات التواصل', icon: 'User', path: '/profile' },
    { label: 'الإعدادات', icon: 'Settings', path: '/settings' },
    { label: 'لوحة التحكم', icon: 'LayoutDashboard', path: '/dashboard' },
    { label: 'مركز المساعدة والدعم', icon: 'HelpCircle', path: '/help' },
    ...(profile?.account_type === 'admin' ? [{ label: 'لوحة مالك التطبيق', icon: 'ShieldCheck', path: '/admin' }] : []),
  ];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-card border-b border-gold-400/15 shadow-lg shadow-black/40' : 'bg-transparent border-b border-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 shrink-0 group"
          >
            <div className="w-10 h-10 rounded-xl glass-card gold-glow flex items-center justify-center group-hover:animate-pulse-glow transition-all">
              <Sparkles size={22} className="gold-text" />
            </div>
            <div className="text-right hidden sm:block">
              <div className="font-display font-bold gold-gradient-text text-lg leading-none">نور السودان</div>
              <div className="text-[10px] text-gold-200/50 mt-0.5">اسأل نور... وحياتك أسهل</div>
            </div>
          </button>

          {/* Search - desktop */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full group">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50 group-focus-within:text-gold-300 transition-colors" />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="ابحث في كل الأقسام والمناطق والخدمات..."
                className="input-dark w-full rounded-full py-2.5 pr-10 pl-4 text-sm"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl glass-card-hover border border-gold-400/15 hover:border-gold-400/40 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold-400/15 flex items-center justify-center">
                    <User size={16} className="gold-text" />
                  </div>
                  <div className="text-right hidden lg:block">
                    <div className="text-sm font-bold text-gold-100 leading-none max-w-[140px] truncate">
                      {profile?.full_name || 'مستخدم'}
                    </div>
                    <div className="text-[10px] text-gold-300/60 mt-0.5">
                      {profile ? ACCOUNT_TYPE_LABELS[profile.account_type] : ''}
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-gold-300/60 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-64 glass-card rounded-xl p-2 gold-glow animate-scale-in z-50 origin-top">
                    <div className="px-3 py-2 border-b border-gold-400/10 mb-1">
                      <div className="text-sm font-bold text-gold-100 truncate">
                        {profile?.full_name || 'مستخدم'}
                      </div>
                      <div className="text-xs text-gold-300/60">
                        {profile ? ACCOUNT_TYPE_LABELS[profile.account_type] : ''}
                      </div>
                    </div>
                    {menuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-400/10 transition-colors text-right"
                      >
                        <Icon name={item.icon} size={18} className="gold-text" />
                        <span className="text-sm text-gold-100">{item.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-gold-400/10 mt-1 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-colors text-right"
                      >
                        <LogOut size={18} className="text-red-400" />
                        <span className="text-sm text-red-400">تسجيل الخروج</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="btn-gold rounded-xl px-5 py-2 text-sm"
              >
                دخول / تسجيل
              </button>
            )}

            {/* Mobile search toggle */}
            <button
              onClick={() => setMobileSearch(!mobileSearch)}
              className="md:hidden w-10 h-10 rounded-xl glass-card flex items-center justify-center"
            >
              {mobileSearch ? <X size={18} className="gold-text" /> : <Search size={18} className="gold-text" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {mobileSearch && (
          <div className="md:hidden pb-3 animate-fade-up">
            <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
              <input
                type="text"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  onSearch?.(e.target.value);
                }}
                placeholder="ابحث..."
                className="input-dark w-full rounded-full py-2.5 pr-10 pl-4 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
