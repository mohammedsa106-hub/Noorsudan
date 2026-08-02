import { useEffect, useRef, useState } from 'react';
import { supabase, type Category, type Listing, type Subcategory } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { Sparkles, Send, X, MessageCircle, ArrowLeft, Phone, Navigation, Truck, MessageCircle as WhatsApp } from 'lucide-react';

export interface ChatMsg {
  role: 'user' | 'assistant';
  text: string;
  results?: SearchResult[];
  category?: Category | null;
  suggestions?: string[];
}

interface SearchResult {
  listing: Listing;
  categoryName?: string;
  subName?: string;
}

const QUICK_PROMPTS = [
  'صيدلية مفتوحة الآن',
  'حداد متاح',
  'سائق توصيل',
  'فندق في الخرطوم',
  'مطعم مفتوح',
  'وظائف شاغرة',
];

const FALLBACK_CATEGORIES: Category[] = [
  { id: '1', name: 'الفنادق والإقامات', slug: 'hotels', icon: 'BedDouble', sort_order: 1, created_at: '' },
  { id: '2', name: 'المطاعم والكافيهات', slug: 'restaurants', icon: 'UtensilsCrossed', sort_order: 2, created_at: '' },
  { id: '3', name: 'السفر والسياحة', slug: 'travel', icon: 'Plane', sort_order: 3, created_at: '' },
  { id: '4', name: 'الدعايا والتسويق', slug: 'marketing', icon: 'Megaphone', sort_order: 4, created_at: '' },
  { id: '5', name: 'السائقون والتوصيل', slug: 'drivers', icon: 'Truck', sort_order: 5, created_at: '' },
  { id: '6', name: 'البقالات والسوبرماركت', slug: 'groceries', icon: 'ShoppingCart', sort_order: 6, created_at: '' },
  { id: '7', name: 'السيارات والمركبات', slug: 'cars', icon: 'Car', sort_order: 7, created_at: '' },
  { id: '8', name: 'العقارات والإنشاءات', slug: 'real-estate', icon: 'Building2', sort_order: 8, created_at: '' },
  { id: '9', name: 'الصحة والطب', slug: 'health', icon: 'Stethoscope', sort_order: 9, created_at: '' },
  { id: '10', name: 'الشركات والوظائف', slug: 'business-jobs', icon: 'Briefcase', sort_order: 10, created_at: '' },
  { id: '11', name: 'الحرفيون والصيانة', slug: 'craftsmen', icon: 'Hammer', sort_order: 11, created_at: '' },
  { id: '12', name: 'الخدمات الحكومية', slug: 'government', icon: 'Scale', sort_order: 12, created_at: '' },
  { id: '13', name: 'التعليم والتدريب', slug: 'education', icon: 'GraduationCap', sort_order: 13, created_at: '' },
  { id: '14', name: 'الخدمات المالية', slug: 'finance', icon: 'Landmark', sort_order: 14, created_at: '' },
  { id: '15', name: 'المناسبات والفعاليات', slug: 'events', icon: 'PartyPopper', sort_order: 15, created_at: '' },
  { id: '16', name: 'الجمال والعناية', slug: 'beauty', icon: 'Scissors', sort_order: 16, created_at: '' },
  { id: '17', name: 'الزراعة والإنتاج الحيواني', slug: 'agriculture', icon: 'Wheat', sort_order: 17, created_at: '' },
  { id: '18', name: 'المجتمع والدعم', slug: 'community', icon: 'HeartHandshake', sort_order: 18, created_at: '' },
];

// Keyword → category slug mapping for internal search
const KEYWORD_MAP: Record<string, string> = {
  'فندق': 'hotels', 'فنادق': 'hotels', 'إقامة': 'hotels', 'مبيت': 'hotels', 'منتجع': 'hotels',
  'مطعم': 'restaurants', 'مطاعم': 'restaurants', 'كافي': 'restaurants', 'كافيه': 'restaurants', 'مقهى': 'restaurants', 'حلويات': 'restaurants', 'طعام': 'restaurants', 'وجبات': 'restaurants',
  'سفر': 'travel', 'سياحة': 'travel', 'تذاكر': 'travel', 'طيران': 'travel', 'فيزا': 'travel', 'تأشيرة': 'travel', 'مطار': 'travel',
  'دعاية': 'marketing', 'تسويق': 'marketing', 'إعلان': 'marketing', 'سوشيال': 'marketing', 'تصميم': 'marketing', 'تصوير': 'marketing', 'طباعة': 'marketing',
  'سائق': 'drivers', 'توصيل': 'drivers', 'سطح': 'drivers', 'سطحة': 'drivers', 'شحن': 'drivers', 'نقل': 'drivers', 'تكسي': 'drivers', 'ليموزين': 'drivers', 'دفارة': 'drivers',
  'بقالة': 'groceries', 'سوبرماركت': 'groceries', 'تسوق': 'groceries', 'إلكترونيات': 'groceries', 'ملابس': 'groceries',
  'سيارة': 'cars', 'سيارات': 'cars', 'مركبة': 'cars', 'بيع': 'cars', 'تأجير': 'cars', 'قطع غيار': 'cars', 'معرض': 'cars',
  'عقار': 'real-estate', 'عقارات': 'real-estate', 'شقة': 'real-estate', 'شقق': 'real-estate', 'فيلا': 'real-estate', 'أرض': 'real-estate', 'إيجار': 'real-estate', 'بناء': 'real-estate', 'مقاولات': 'real-estate', 'ديكور': 'real-estate',
  'صحة': 'health', 'مستشفى': 'health', 'مستشفيات': 'health', 'عيادة': 'health', 'طبيب': 'health', 'أطباء': 'health', 'صيدلية': 'health', 'صيدليات': 'health', 'مختبر': 'health', 'تحاليل': 'health', 'أسنان': 'health', 'طوارئ': 'health', 'إسعاف': 'health', 'دواء': 'health',
  'وظيفة': 'business-jobs', 'وظائف': 'business-jobs', 'شغل': 'business-jobs', 'شركة': 'business-jobs', 'شركات': 'business-jobs', 'استشار': 'business-jobs', 'تدريب': 'business-jobs', 'سيرة': 'business-jobs', 'cv': 'business-jobs',
  'حداد': 'craftsmen', 'كهربائي': 'craftsmen', 'سباك': 'craftsmen', 'نجار': 'craftsmen', 'تكييف': 'craftsmen', 'صيانة': 'craftsmen', 'حرفي': 'craftsmen', 'حرفيين': 'craftsmen', 'مهن': 'craftsmen',
  'محامي': 'government', 'قانون': 'government', 'ترجمة': 'government', 'حكومي': 'government', 'جواز': 'government', 'عدل': 'government', 'شهادة': 'government',
  'جامعة': 'education', 'جامعات': 'education', 'دورة': 'education', 'دورات': 'education', 'دروس': 'education', 'خصوصي': 'education', 'مدرسة': 'education', 'مدارس': 'education', 'مركز تدريب': 'education',
  'بنك': 'finance', 'مصرف': 'finance', 'صرافة': 'finance', 'تحويل': 'finance', 'تأمين': 'finance', 'محاسبة': 'finance', 'ضرائب': 'finance', 'مالية': 'finance',
  'قاعة': 'events', 'أفراح': 'events', 'مناسبات': 'events', 'فعالية': 'events', 'حفل': 'events', 'تنظيم': 'events', 'ضيافة': 'events', 'تموين': 'events',
  'صالون': 'beauty', 'تجميل': 'beauty', 'عناية': 'beauty', 'أزياء': 'beauty', 'نادي رياضي': 'beauty', 'جيم': 'beauty', 'لياقة': 'beauty',
  'مزرعة': 'agriculture', 'زراعة': 'agriculture', 'مواشي': 'agriculture', 'ماشية': 'agriculture', 'دواجن': 'agriculture', 'بيطري': 'agriculture', 'بذور': 'agriculture', 'أسمدة': 'agriculture',
  'جمعية': 'community', 'خيري': 'community', 'تبرع': 'community', 'دم': 'community', 'مفقود': 'community', 'مستعمل': 'community', 'إغاثة': 'community',
};

function matchCategory(query: string, categories: Category[]): Category | null {
  const lower = query.toLowerCase();
  for (const [keyword, slug] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      const cat = categories.find((c) => c.slug === slug);
      if (cat) return cat;
    }
  }
  // Try matching category names directly
  for (const cat of categories) {
    if (lower.includes(cat.name) || cat.name.includes(query.trim())) return cat;
  }
  return null;
}

function isAskingForOpen(query: string): boolean {
  return /مفتوح|متاح|الآن|دلوقتي|حاليا/.test(query);
}

export function AskNourDrawer({ open, prefill, onClose }: { open: boolean; prefill?: string; onClose: () => void }) {
  const [chat, setChat] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [subcats, setSubcats] = useState<Record<string, Subcategory>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const prefillHandled = useRef<string | undefined>(undefined);

  useEffect(() => {
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => {
      if (data && data.length > 0) setCategories(data as Category[]);
    });
    supabase.from('subcategories').select('*').then(({ data }) => {
      const map: Record<string, Subcategory> = {};
      (data as Subcategory[] || []).forEach((s) => { map[s.id] = s; });
      setSubcats(map);
    });
    supabase.from('listings').select('*').eq('is_active', true).eq('is_hidden_by_admin', false).order('created_at', { ascending: false }).then(({ data }) => {
      setAllListings((data as Listing[]) || []);
    });
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat, thinking]);

  useEffect(() => {
    if (open && prefill && prefill !== prefillHandled.current) {
      prefillHandled.current = prefill;
      const timer = setTimeout(() => askNour(prefill), 300);
      return () => clearTimeout(timer);
    }
  }, [open, prefill]);

  const askNour = async (question: string) => {
    if (!question.trim() || thinking) return;
    const userMsg: ChatMsg = { role: 'user', text: question };
    setChat((prev) => [...prev, userMsg]);
    setInput('');
    setThinking(true);

    // Simulate brief thinking delay for UX
    await new Promise((r) => setTimeout(r, 500));

    const matchedCat = matchCategory(question, categories);
    const wantOpen = isAskingForOpen(question);

    // Filter listings based on match
    let results: SearchResult[] = [];
    if (matchedCat) {
      let filtered = allListings.filter((l) => l.category_id === matchedCat.id);
      if (wantOpen) {
        filtered = filtered.filter((l) => l.is_open);
      }
      // Also try to match keywords in title/description
      const queryWords = question.trim().split(/\s+/).filter((w) => w.length > 2);
      if (queryWords.length > 0) {
        const textMatched = filtered.filter((l) =>
          queryWords.some((w) => l.title.includes(w) || l.description.includes(w) || (l.location_text || '').includes(w))
        );
        if (textMatched.length > 0) filtered = textMatched;
      }
      results = filtered.slice(0, 5).map((l) => ({
        listing: l,
        categoryName: matchedCat.name,
        subName: l.subcategory_id ? subcats[l.subcategory_id]?.name : undefined,
      }));
    } else {
      // No category match — search all listings by text
      const queryWords = question.trim().split(/\s+/).filter((w) => w.length > 2);
      if (queryWords.length > 0) {
        const textMatched = allListings.filter((l) =>
          queryWords.some((w) => l.title.includes(w) || l.description.includes(w) || (l.location_text || '').includes(w))
        );
        results = textMatched.slice(0, 5).map((l) => ({
          listing: l,
          subName: l.subcategory_id ? subcats[l.subcategory_id]?.name : undefined,
        }));
      }
    }

    let reply: string;
    let suggestions: string[];

    if (results.length > 0) {
      const openNote = wantOpen ? ' (مفتوحين دلوقتي)' : '';
      reply = `لا حولك يا زول! لقيت ليك ${results.length} نتيجة${openNote} في "${matchedCat?.name || 'بحثك'}". ده اللي عندي، تقدر تصل بيهم مباشرة:`;
      suggestions = matchedCat
        ? [`عرض كل ${matchedCat.name}`, results[0] ? `تفاصيل: ${results[0].listing.title}` : '']
          .filter(Boolean)
        : [];
    } else if (matchedCat) {
      reply = `ما لقيت حاجة متاحة${wantOpen ? ' ومفتوحة' : ''} في "${matchedCat.name}" دلوقتي يا زول. بس تقدر تفرج في القسم مباشرة أو تجرب كلمات تانية.`;
      suggestions = [`عرض كل ${matchedCat.name}`, 'دور في أقسام تانية'];
    } else {
      reply = `والله ما قدرت أحدد ليك القسم الصح من سؤالك. جرّب تكون أوضح شوية زي: "صيدلية مفتوحة"، "حداد متاح"، "فندق في الخرطوم"، أو "وظائف شاغرة".`;
      suggestions = QUICK_PROMPTS.slice(0, 3);
    }

    setChat((prev) => [
      ...prev,
      { role: 'assistant', text: reply, results: results.length > 0 ? results : undefined, category: matchedCat, suggestions: suggestions.filter((s) => s.length > 0) },
    ]);
    setThinking(false);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed top-0 left-0 bottom-0 z-[95] w-full max-w-md glass-card border-l border-gold-400/20 flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gold-400/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gold-400/15 flex items-center justify-center animate-pulse-glow">
              <Sparkles size={22} className="gold-text" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold gold-gradient-text">اسأل نور</h2>
              <p className="text-[11px] text-gold-200/50">مساعدك الذكي في دليل السودان</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg glass-card-hover flex items-center justify-center">
            <X size={18} className="text-gold-200/70" />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {chat.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gold-400/10 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <MessageCircle size={30} className="gold-text" />
              </div>
              <p className="text-gold-100 font-bold mb-1">أهلاً بيك يا زول في نور!</p>
              <p className="text-gold-200/50 text-sm mb-5">
                اسألني عن أي خدمة في السودان وأنا أرشدك — بدون نت خارجي
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_PROMPTS.map((q) => (
                  <button
                    key={q}
                    onClick={() => askNour(q)}
                    className="glass-card-hover rounded-full px-3.5 py-2 text-xs text-gold-100 border border-gold-400/15 hover:border-gold-400/40 transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[92%] space-y-2">
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-gold-400/10 text-gold-100 border border-gold-400/20'
                      : 'bg-ink-600/60 text-gold-50 border border-gold-400/10'
                  }`}
                >
                  {m.text}
                </div>

                {/* Search results */}
                {m.role === 'assistant' && m.results && m.results.map((r, ri) => (
                  <ResultCard key={ri} result={r} onClose={onClose} />
                ))}

                {/* Deep-link button */}
                {m.role === 'assistant' && m.category && (
                  <button
                    onClick={() => {
                      navigate(`/category/${m.category!.slug}`);
                      onClose();
                    }}
                    className="btn-gold rounded-xl px-4 py-2.5 flex items-center gap-2 text-sm w-full"
                  >
                    <Icon name={m.category.icon} size={16} />
                    <span className="flex-1 text-right">اذهب إلى: {m.category.name}</span>
                    <ArrowLeft size={16} />
                  </button>
                )}

                {/* Follow-up suggestions */}
                {m.role === 'assistant' && m.suggestions && m.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => askNour(s)}
                        className="glass-card-hover rounded-full px-3 py-1.5 text-[11px] text-gold-200 border border-gold-400/15 hover:border-gold-400/40 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex justify-start">
              <div className="bg-ink-600/60 rounded-xl px-4 py-3 text-sm text-gold-200/60 flex gap-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>•</span>
                <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>•</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            askNour(input);
          }}
          className="p-4 border-t border-gold-400/15 shrink-0"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اكتب سؤالك يا زول..."
              className="input-dark w-full rounded-xl py-3 pr-4 pl-4 text-sm"
              autoFocus
            />
            <button type="submit" disabled={thinking || !input.trim()} className="btn-gold rounded-xl px-5 py-3 disabled:opacity-40">
              <Send size={18} />
            </button>
          </div>
        </form>
      </aside>
    </>
  );
}

function ResultCard({ result, onClose }: { result: SearchResult; onClose: () => void }) {
  const { listing, categoryName, subName } = result;
  const hasGps = listing.lat != null && listing.lng != null;

  return (
    <div className="glass-card rounded-xl p-3 border border-gold-400/15 space-y-2">
      <div className="flex items-start gap-2">
        {listing.image_url && (
          <img src={listing.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
        )}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => { navigate(`/listing/${listing.id}`); onClose(); }}
            className="font-bold text-gold-50 text-sm hover:text-gold-200 transition-colors text-right block truncate"
          >
            {listing.title}
          </button>
          <div className="flex items-center gap-1.5 flex-wrap">
            {subName && <span className="text-[10px] text-gold-300/50">{subName}</span>}
            {categoryName && <span className="text-[10px] text-gold-300/40">· {categoryName}</span>}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${listing.is_open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
              {listing.is_open ? 'مفتوح' : 'مغلق'}
            </span>
          </div>
        </div>
      </div>

      {listing.description && (
        <p className="text-xs text-gold-200/60 line-clamp-2">{listing.description}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {listing.phone && (
          <a href={`tel:${listing.phone}`} className="flex items-center gap-1 text-[11px] gold-text hover:underline">
            <Phone size={11} /> اتصال
          </a>
        )}
        {listing.whatsapp && (
          <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11px] text-green-400 hover:underline">
            <WhatsApp size={11} /> واتساب
          </a>
        )}
        {hasGps && (
          <button onClick={() => { navigate(`/listing/${listing.id}`); onClose(); }} className="flex items-center gap-1 text-[11px] gold-text hover:underline">
            <Navigation size={11} /> الخريطة
          </button>
        )}
        {listing.delivery_available && (
          <span className="flex items-center gap-1 text-[11px] text-blue-400">
            <Truck size={11} /> توصيل
          </span>
        )}
      </div>
    </div>
  );
}
