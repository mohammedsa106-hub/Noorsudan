import { useEffect, useState } from 'react';
import { supabase, type Category } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { Sparkles, MessageCircle } from 'lucide-react';

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'الفنادق والإقامات', slug: 'hotels', icon: 'BedDouble', sort_order: 1, created_at: '' },
  { id: '2', name: 'المطاعم والكافيهات', slug: 'restaurants', icon: 'UtensilsCrossed', sort_order: 2, created_at: '' },
  { id: '3', name: 'السفر والسياحة', slug: 'travel', icon: 'Plane', sort_order: 3, created_at: '' },
  { id: '4', name: 'الدعايا والتسويق', slug: 'marketing', icon: 'Megaphone', sort_order: 4, created_at: '' },
  { id: '5', name: 'السائقون والتوصيل والسطحات', slug: 'drivers', icon: 'Truck', sort_order: 5, created_at: '' },
  { id: '6', name: 'البقالات والسوبرماركت والتسوق', slug: 'groceries', icon: 'ShoppingCart', sort_order: 6, created_at: '' },
  { id: '7', name: 'السيارات والمركبات', slug: 'cars', icon: 'Car', sort_order: 7, created_at: '' },
  { id: '8', name: 'العقارات والإنشاءات', slug: 'real-estate', icon: 'Building2', sort_order: 8, created_at: '' },
  { id: '9', name: 'الصحة والطب', slug: 'health', icon: 'Stethoscope', sort_order: 9, created_at: '' },
  { id: '10', name: 'الشركات ودليل الأعمال والوظائف', slug: 'business-jobs', icon: 'Briefcase', sort_order: 10, created_at: '' },
  { id: '11', name: 'الحرفيون والصيانة والمهن الحرة', slug: 'craftsmen', icon: 'Hammer', sort_order: 11, created_at: '' },
  { id: '12', name: 'الخدمات الحكومية والقانونية', slug: 'government', icon: 'Scale', sort_order: 12, created_at: '' },
  { id: '13', name: 'التعليم والتدريب', slug: 'education', icon: 'GraduationCap', sort_order: 13, created_at: '' },
  { id: '14', name: 'الخدمات المالية والمصرفية', slug: 'finance', icon: 'Landmark', sort_order: 14, created_at: '' },
  { id: '15', name: 'المناسبات والفعاليات', slug: 'events', icon: 'PartyPopper', sort_order: 15, created_at: '' },
  { id: '16', name: 'الجمال والعناية والملابس', slug: 'beauty', icon: 'Scissors', sort_order: 16, created_at: '' },
  { id: '17', name: 'الزراعة والإنتاج الحيواني', slug: 'agriculture', icon: 'Wheat', sort_order: 17, created_at: '' },
  { id: '18', name: 'المجتمع والدعم والسوق المفتوح', slug: 'community', icon: 'HeartHandshake', sort_order: 18, created_at: '' },
];

export function HomePage({ searchQuery }: { searchQuery: string }) {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data }) => {
        if (data && data.length > 0) setCategories(data as Category[]);
      });
  }, []);

  const filtered = searchQuery.trim()
    ? categories.filter((c) => c.name.includes(searchQuery.trim()))
    : categories;

  const QUICK_PROMPTS = [
    'أحتاج فندق في الخرطوم',
    'دور حداد',
    'سيارة للبيع',
    'صيدلية مفتوحة',
    'أبحث عن وظيفة',
    'سطحة لنقل أثاث',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 sm:py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold-400/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gold-400/5 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center px-4 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card gold-border mb-6">
            <Sparkles size={14} className="gold-text" />
            <span className="text-xs text-gold-200">دليل الخدمات والأعمال الأول في السودان</span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-bold mb-4">
            <span className="gold-gradient-text">اسأل نور...</span>
            <br />
            <span className="text-gold-50">وحياتك أسهل</span>
          </h1>
          <p className="text-gold-200/60 text-lg max-w-2xl mx-auto">
            كل ما تحتاجه في مكان واحد: فنادق، مطاعم، توصيل، صحة، عقارات، وظائف، وكل خدمات السودان
          </p>
        </div>
      </section>

      {/* Ask Nour AI — prominent home widget */}
      <section className="max-w-3xl mx-auto px-4 mb-16">
        <div className="glass-card rounded-2xl p-6 sm:p-8 gold-glow animate-fade-up text-center">
          <div className="w-16 h-16 rounded-2xl bg-gold-400/15 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
            <MessageCircle size={32} className="gold-text" />
          </div>
          <h2 className="font-display text-2xl font-bold gold-gradient-text mb-2">اسأل نور</h2>
          <p className="text-gold-200/60 text-sm mb-5 max-w-md mx-auto">
            مساعدك الذكي للإجابة الفورية وتوجيهك للخدمات. اسأل عن أي شيء: فندق، حداد، سيارة، صيدلية، وظيفة...
          </p>

          <button
            onClick={() => {
              const event = new CustomEvent('open-ask-nour');
              window.dispatchEvent(event);
            }}
            className="btn-gold rounded-xl px-8 py-3.5 inline-flex items-center gap-2 text-sm font-bold"
          >
            <Sparkles size={18} /> ابدأ المحادثة مع نور
          </button>

          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {QUICK_PROMPTS.map((q) => (
              <button
                key={q}
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-ask-nour', { detail: q }));
                }}
                className="glass-card-hover rounded-full px-3.5 py-2 text-xs text-gold-100 border border-gold-400/15 hover:border-gold-400/40 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-gold-50">الأقسام الرئيسية</h2>
          <span className="text-sm text-gold-200/50">{filtered.length} قسم</span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gold-200/40">لا توجد أقسام مطابقة لبحثك</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((cat, i) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/category/${cat.slug}`)}
                className="glass-card glass-card-hover ambient-glow rounded-2xl p-5 text-center group relative animate-fade-up"
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gold-400/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold-400/20 transition-all">
                  <Icon name={cat.icon} size={28} className="gold-text" />
                </div>
                <h3 className="text-sm font-bold text-gold-100 leading-tight line-clamp-2">
                  {cat.name}
                </h3>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gold-400/10 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles size={16} className="gold-text" />
          <span className="font-display font-bold gold-gradient-text">نور السودان</span>
        </div>
        <p className="text-xs text-gold-200/40">جميع الحقوق محفوظة لـ نور السودان © 2026</p>
      </footer>
    </div>
  );
}
