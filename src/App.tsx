import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useRouter, matchRoute, navigate } from '@/lib/router';
import { Header } from '@/components/Header';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { CategoryPage } from '@/pages/CategoryPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminPage } from '@/pages/AdminPage';
import { ProfilePage, SettingsPage, HelpPage } from '@/pages/ProfilePages';
import { ListingDetailPage } from '@/pages/ListingDetailPage';
import { AskNourDrawer } from '@/components/AskNour';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Sparkles } from 'lucide-react';

function AppRoutes() {
  const route = useRouter();
  const { user, loading } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [askPrefill, setAskPrefill] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as string | undefined;
      setAskPrefill(detail);
      setAskOpen(true);
    };
    window.addEventListener('open-ask-nour', handler);
    return () => window.removeEventListener('open-ask-nour', handler);
  }, []);

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

  if (!user) {
    return <AuthPage />;
  }

  let content: React.ReactNode;
  const catMatch = matchRoute(route.path, '/category/:slug');
  const listMatch = matchRoute(route.path, '/listing/:id');

  if (route.path === '/' || route.path === '') {
    content = <HomePage searchQuery={searchQuery} />;
  } else if (catMatch) {
    content = <CategoryPage slug={catMatch.slug} />;
  } else if (listMatch) {
    content = <ListingDetailPage id={listMatch.id} />;
  } else if (route.path === '/dashboard') {
    content = <DashboardPage />;
  } else if (route.path === '/admin') {
    content = <AdminPage />;
  } else if (route.path === '/profile') {
    content = <ProfilePage />;
  } else if (route.path === '/settings') {
    content = <SettingsPage />;
  } else if (route.path === '/help') {
    content = <HelpPage />;
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
    <div className="min-h-screen">
      <Header onSearch={setSearchQuery} />
      <ErrorBoundary key={route.path} resetKey={route.path}>
        {content}
      </ErrorBoundary>

      <button
        onClick={() => { setAskPrefill(undefined); setAskOpen(true); }}
        className="fixed bottom-6 left-6 z-[80] w-14 h-14 rounded-full btn-gold flex items-center justify-center shadow-2xl hover:scale-110 transition-transform animate-pulse-glow"
        aria-label="اسأل نور"
      >
        <Sparkles size={26} />
      </button>

      <AskNourDrawer
        open={askOpen}
        prefill={askPrefill}
        onClose={() => { setAskOpen(false); setAskPrefill(undefined); }}
      />
    </div>
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
