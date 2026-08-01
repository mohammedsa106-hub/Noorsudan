import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, matchRoute, navigate } from '@/lib/router';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage, SettingsPage, HelpPage } from '@/pages/ProfilePages';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { AskNourDrawer } from '@/components/AskNour';
import { Sparkles } from 'lucide-react';

function AppRoutes() {
  const route = useRouter();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [askOpen, setAskOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      setAskOpen(true);
      const detail = (e as CustomEvent).detail;
      if (detail) {
        window.dispatchEvent(new CustomEvent('ask-nour-prefill', { detail }));
      }
    };
    window.addEventListener('open-ask-nour', handler);
    return () => window.removeEventListener('open-ask-nour', handler);
  }, []);

  // Redirect away from /auth if already logged in
  useEffect(() => {
    if (user && route.path === '/auth') navigate('/');
  }, [route.path, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gold-200/50 animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  // Strict auth guard: if not logged in, show ONLY the auth screen
  if (!user) {
    return <AuthPage />;
  }


  const wrap = (el: React.ReactNode) => <ErrorBoundary key={route.path}>{el}</ErrorBoundary>;

  let content: React.ReactNode;

  if (route.path === '/' || route.path === '') {
    content = wrap(<HomePage searchQuery={searchQuery} />);
  } else if (matchRoute(route.path, '/category/:slug')) {
    const { slug } = matchRoute(route.path, '/category/:slug')!;
    content = wrap(<CategoryPage slug={slug} />);
  } else if (matchRoute(route.path, '/listing/:id')) {
    const { id } = matchRoute(route.path, '/listing/:id')!;
    content = wrap(<ListingDetailPage id={id} />);
  } else if (route.path === '/dashboard') {
    content = wrap(<DashboardPage />);
  } else if (route.path === '/admin') {
    content = wrap(<AdminPage />);
  } else if (route.path === '/profile') {
    content = wrap(<ProfilePage />);
  } else if (route.path === '/settings') {
    content = wrap(<SettingsPage />);
  } else if (route.path === '/help') {
    content = wrap(<HelpPage />);
  } else {
    content = (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60 text-lg">الصفحة غير موجودة</p>
        <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        <Header onSearch={setSearchQuery} />
        {content}

        {/* Floating Ask Nour button */}
        <button
          onClick={() => setAskOpen(true)}
          className="fixed bottom-6 left-6 z-[80] w-14 h-14 rounded-full btn-gold flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-pulse-glow"
          aria-label="اسأل نور"
        >
          <Sparkles size={26} />
        </button>

        <AskNourDrawer open={askOpen} onClose={() => setAskOpen(false)} />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
