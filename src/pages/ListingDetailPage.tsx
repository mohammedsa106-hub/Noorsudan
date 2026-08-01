import { useEffect, useState, useRef } from 'react';
import { supabase, type Listing, type ListingImage, type Category, type Subcategory, type Profile, type Product, type Job, type TrainingProgram, PAYMENT_METHOD_OPTIONS, FACILITY_OPTIONS, sectionHasPayments, safeArray, safeNum } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import { ImageGallery } from '@/components/ImageGallery';
import { MapPreview } from '@/components/MapPreview';
import { OrderModal } from '@/components/SectionTemplates';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronLeft, Phone, Mail, MapPin, DollarSign, Building,
  Navigation, User, MessageCircle, Truck,
  CreditCard, Clock, ShoppingBag, Star, BadgeCheck,
  Users, Calendar, Wallet, CheckCircle2, Briefcase, GraduationCap,
  Upload, Crown, Zap, X,
} from 'lucide-react';

export function ListingDetailPage({ id }: { id: string }) {
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [training, setTraining] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOrder, setShowOrder] = useState(false);
  const [showJobApply, setShowJobApply] = useState<string | null>(null);
  const [showTrainingApply, setShowTrainingApply] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      const { data: l } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (!l) {
        setLoading(false);
        return;
      }
      const lst = l as Listing;
      setListing(lst);

      const [imgsRes, catRes, subRes, ownerRes, prodsRes, jobsRes, trainingRes] = await Promise.all([
        supabase.from('listing_images').select('*').eq('listing_id', id).order('sort_order'),
        supabase.from('categories').select('*').eq('id', lst.category_id).maybeSingle(),
        lst.subcategory_id
          ? supabase.from('subcategories').select('*').eq('id', lst.subcategory_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase.from('profiles').select('*').eq('id', lst.owner_id).maybeSingle(),
        supabase.from('products').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
        supabase.from('jobs').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
        supabase.from('training_programs').select('*').eq('listing_id', id).order('created_at', { ascending: false }),
      ]);

      const imgUrls = (imgsRes.data as ListingImage[] || []).map((i) => i.url);
      if (lst.image_url && !imgUrls.includes(lst.image_url)) {
        imgUrls.unshift(lst.image_url);
      }
      setImages(imgUrls);

      setCategory((catRes.data as Category) || null);
      setSubcategory((subRes.data as Subcategory) || null);
      setOwner((ownerRes.data as Profile) || null);
      setProducts((prodsRes.data as Product[]) || []);
      setJobs((jobsRes.data as Job[]) || []);
      setTraining((trainingRes.data as TrainingProgram[]) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-gold-200/50 animate-pulse">
        جاري التحميل...
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gold-200/60">الإعلان غير موجود</p>
        <button onClick={() => navigate('/')} className="btn-gold rounded-xl px-6 py-2">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const hasGps = listing.lat != null && listing.lng != null;
  const hasPayments = category ? sectionHasPayments(category.slug) : false;
  const isOwner = listing.owner_id === user?.id;
  const isCommunity = category?.slug === 'community';
  const facilities = safeArray(listing.facilities);
  const paymentMethods = safeArray(listing.payment_methods);
  const ratingAvg = safeNum(listing.rating_avg);
  const ratingCount = safeNum(listing.rating_count);

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-1 text-sm text-gold-200/60 hover:text-gold-200 mb-6"
      >
        <ChevronLeft size={16} /> رجوع
      </button>

      {images.length > 0 && (
        <div className="mb-6">
          <ImageGallery images={images} title={listing.title} />
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {category && (
              <div className="flex items-center gap-2 mb-2">
                <Icon name={category.icon} size={16} className="gold-text" />
                <span className="text-sm text-gold-300/70">{category.name}</span>
                {subcategory && (
                  <>
                    <span className="text-gold-300/30">·</span>
                    <span className="text-sm text-gold-300/70">{subcategory.name}</span>
                  </>
                )}
              </div>
            )}
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-gold-50">
                {listing.title}
              </h1>
              {owner?.is_verified && (
                <BadgeCheck size={22} className="text-blue-400 shrink-0" />
              )}
            </div>
          </div>
          {listing.price != null && (
            <div className="flex items-center gap-1.5 text-gold-300 font-bold text-xl shrink-0">
              <DollarSign size={20} />
              {listing.price.toLocaleString()}
            </div>
          )}
        </div>

        {/* Operational status badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${listing.is_open ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            <Clock size={12} /> {listing.is_open ? 'مفتوح الآن' : 'مغلق'}
          </span>
          {listing.is_24_7 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
              <Clock size={12} /> متاح 24/7
            </span>
          )}
          {listing.delivery_available && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-500/15 text-blue-400">
              <Truck size={12} /> توصيل متاح
            </span>
          )}
          {listing.service_radius != null && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/10 text-gold-300">
              <MapPin size={12} /> نطاق {listing.service_radius} كم
            </span>
          )}
          {paymentMethods.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/10 text-gold-300">
              <CreditCard size={12} /> {paymentMethods.map((m) => PAYMENT_METHOD_OPTIONS.find((o) => o.value === m)?.label || m).join(' · ')}
            </span>
          )}
        </div>

        {/* Rating for craftsmen/drivers */}
        {(category?.slug === 'craftsmen' || category?.slug === 'drivers') && ratingCount > 0 && (
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={16} className={n <= Math.round(ratingAvg) ? 'text-gold-400 fill-gold-400' : 'text-gold-400/20'} />
              ))}
            </div>
            <span className="text-sm text-gold-100 font-bold">{ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-gold-300/50">({ratingCount} تقييم)</span>
          </div>
        )}

        {/* Event hall capacity & facilities */}
        {category?.slug === 'events' && (listing.capacity != null || facilities.length > 0) && (
          <div className="mb-4 p-4 rounded-xl bg-ink-600/40 border border-gold-400/10 space-y-3">
            {listing.capacity != null && (
              <div className="flex items-center gap-2 text-sm text-gold-100">
                <Users size={16} className="gold-text" />
                السعة: <span className="font-bold">{listing.capacity} شخص</span>
              </div>
            )}
            {facilities.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {facilities.map((f) => {
                  const label = FACILITY_OPTIONS.find((o) => o.value === f)?.label || f;
                  return (
                    <span key={f} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-300">
                      <CheckCircle2 size={11} /> {label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Craftsmen/Drivers wallet fee info */}
        {(category?.slug === 'craftsmen' || category?.slug === 'drivers') && listing.price != null && (
          <div className="mb-4 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gold-200/60 flex items-center gap-1.5">
                <DollarSign size={14} className="gold-text" /> السعر التقديري
              </span>
              <span className="text-gold-100 font-bold">{listing.price.toLocaleString()} ج.س</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-gold-400/10">
              <span className="text-gold-300/50 flex items-center gap-1">
                <Wallet size={12} /> رسوم المنصة (7%)
              </span>
              <span className="text-gold-300/70">{Math.round(listing.price * 0.07)} ج.س</span>
            </div>
          </div>
        )}

        {listing.is_featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gold-400/15 text-gold-300 mb-4">
            <Crown size={12} /> إعلان مميز
          </div>
        )}
        {listing.is_sponsored && !listing.is_featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/15 text-purple-400 mb-4">
            <Zap size={12} /> إعلان ممول
          </div>
        )}

        {listing.description && (
          <p className="text-gold-200/70 leading-relaxed mb-6 whitespace-pre-wrap">
            {listing.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {listing.phone && (
            <a
              href={`tel:${listing.phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Phone size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">الهاتف المباشر</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.phone}</div>
              </div>
            </a>
          )}

          {listing.business_phone && (
            <a
              href={`tel:${listing.business_phone}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Building size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">هاتف الشركة</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.business_phone}</div>
              </div>
            </a>
          )}

          {listing.email_contact && (
            <a
              href={`mailto:${listing.email_contact}`}
              className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10 hover:border-gold-400/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <Mail size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">البريد الإلكتروني</div>
                <div className="text-sm text-gold-100 truncate">{listing.email_contact}</div>
              </div>
            </a>
          )}

          {listing.location_text && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
              <span className="w-10 h-10 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                <MapPin size={18} className="gold-text" />
              </span>
              <div>
                <div className="text-xs text-gold-300/60">الموقع</div>
                <div className="text-sm text-gold-100">{listing.location_text}</div>
              </div>
            </div>
          )}

          {listing.whatsapp && (
            <a
              href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20 hover:border-green-500/40 transition-all"
            >
              <span className="w-10 h-10 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                <MessageCircle size={18} className="text-green-400" />
              </span>
              <div>
                <div className="text-xs text-green-400/70">واتساب مباشر</div>
                <div className="text-sm text-gold-100" dir="ltr">{listing.whatsapp}</div>
              </div>
            </a>
          )}
        </div>
      </div>

      {/* Products / Menu / Offers Catalog */}
      {products.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <ShoppingBag size={18} className="gold-text" /> {category?.slug === 'restaurants' ? 'منيو الطعام' : 'المنتجات والخدمات والعروض'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl bg-ink-600/40 border border-gold-400/10">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover shrink-0" onError={(e) => (e.currentTarget.style.display = 'none')} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gold-100 text-sm truncate">{p.name}</span>
                    {p.is_offer && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-400 shrink-0">
                        <Star size={9} /> عرض
                      </span>
                    )}
                  </div>
                  {p.description && <p className="text-xs text-gold-200/50 line-clamp-1">{p.description}</p>}
                  {p.price != null && (
                    <div className="flex items-center gap-1 text-gold-300 font-bold text-sm mt-0.5">
                      <DollarSign size={12} /> {p.price.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jobs section for companies */}
      {jobs.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <Briefcase size={18} className="gold-text" /> الوظائف الشاغرة ({jobs.length})
          </h2>
          <div className="space-y-3">
            {jobs.map((job) => (
              <div key={job.id} className="p-4 rounded-xl bg-ink-600/40 border border-gold-400/10">
                <h3 className="font-bold text-gold-100 text-sm mb-1">{job.title}</h3>
                {job.description && <p className="text-xs text-gold-200/60 mb-2">{job.description}</p>}
                {job.requirements && <p className="text-xs text-gold-300/50 mb-3">المتطلبات: {job.requirements}</p>}
                {user && !isOwner ? (
                  <button onClick={() => setShowJobApply(job.id)}
                    className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                    <Upload size={14} /> تقديم + رفع CV
                  </button>
                ) : !user ? (
                  <button onClick={() => navigate('/auth')} className="text-xs gold-text hover:underline">سجّل دخول للتقديم</button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training programs section for companies */}
      {training.length > 0 && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <GraduationCap size={18} className="gold-text" /> البرامج التدريبية ({training.length})
          </h2>
          <div className="space-y-3">
            {training.map((t) => (
              <div key={t.id} className="p-4 rounded-xl bg-ink-600/40 border border-gold-400/10">
                <h3 className="font-bold text-gold-100 text-sm mb-1">{t.title}</h3>
                {t.description && <p className="text-xs text-gold-200/60 mb-1">{t.description}</p>}
                {t.duration && <p className="text-xs text-gold-300/50 mb-3">المدة: {t.duration}</p>}
                {user && !isOwner ? (
                  <button onClick={() => setShowTrainingApply(t.id)}
                    className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-2">
                    <Upload size={14} /> التسجيل + رفع CV
                  </button>
                ) : !user ? (
                  <button onClick={() => navigate('/auth')} className="text-xs gold-text hover:underline">سجّل دخول للتسجيل</button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order button for payment-enabled sections */}
      {hasPayments && !isOwner && listing.bankak_account && !isCommunity && (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <button onClick={() => setShowOrder(true)}
            className="btn-gold rounded-xl px-8 py-3.5 inline-flex items-center gap-2 text-sm font-bold">
            <ShoppingBag size={18} /> اطلب الآن / حجز
          </button>
          <p className="text-xs text-gold-200/40 mt-2">سيتم تحويلك لبيانات بنكاك للدفع المباشر</p>
        </div>
      )}

      {/* Event hall booking button */}
      {category?.slug === 'events' && (
        <div className="glass-card rounded-2xl p-6 mb-6 text-center">
          <button
            onClick={() => alert('سيتم تحويلك لصفحة الحجز — تواصل مع القاعة مباشرة عبر الهاتف أو واتساب')}
            className="btn-gold rounded-xl px-8 py-3.5 inline-flex items-center gap-2 text-sm font-bold"
          >
            <Calendar size={18} /> طلب حجز هذه القاعة
          </button>
          <p className="text-xs text-gold-200/40 mt-2">سيتم التواصل معك لتأكيد الحجز والتاريخ</p>
        </div>
      )}

      {hasGps && (
        <div className="glass-card rounded-2xl p-6 mb-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <Navigation size={18} className="gold-text" /> الموقع على الخريطة
          </h2>
          <MapPreview lat={listing.lat!} lng={listing.lng!} label={listing.location_text} />
        </div>
      )}

      {owner && (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold text-gold-100 mb-4 flex items-center gap-2">
            <User size={18} className="gold-text" /> مقدم الخدمة
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gold-400/10 flex items-center justify-center shrink-0">
              <Icon name="User" size={24} className="gold-text" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gold-100">{owner.full_name}</span>
                {owner.is_verified && <BadgeCheck size={16} className="text-blue-400" />}
              </div>
              {owner.location_text && (
                <div className="text-sm text-gold-200/50 flex items-center gap-1">
                  <MapPin size={12} className="gold-text" /> {owner.location_text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrder && listing && (
        <OrderModal listing={listing} onClose={() => setShowOrder(false)} />
      )}

      {showJobApply && (
        <CvUploadModal
          title="تقديم على وظيفة"
          onSubmit={async (name, phone, cvUrl) => {
            await supabase.from('job_applications').insert({ job_id: showJobApply, applicant_id: user!.id, applicant_name: name, applicant_phone: phone, cv_url: cvUrl });
            setShowJobApply(null);
            alert('تم تقديمك بنجاح!');
          }}
          onClose={() => setShowJobApply(null)}
        />
      )}

      {showTrainingApply && (
        <CvUploadModal
          title="التسجيل في برنامج تدريبي"
          onSubmit={async (name, phone, cvUrl) => {
            await supabase.from('training_applications').insert({ training_id: showTrainingApply, applicant_id: user!.id, applicant_name: name, applicant_phone: phone, cv_url: cvUrl });
            setShowTrainingApply(null);
            alert('تم تسجيلك بنجاح!');
          }}
          onClose={() => setShowTrainingApply(null)}
        />
      )}
    </div>
  );
}

function CvUploadModal({ title, onSubmit, onClose }: { title: string; onSubmit: (name: string, phone: string, cvUrl: string) => Promise<void>; onClose: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [cvUrl, setCvUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadCv = async (file: File) => {
    if (!profile) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${profile.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (!error) {
      const { data } = supabase.storage.from('documents').getPublicUrl(path);
      setCvUrl(data.publicUrl);
    }
    setUploading(false);
  };

  const submit = async () => {
    if (!name.trim() || !phone.trim() || !cvUrl) return;
    setSubmitting(true);
    await onSubmit(name, phone, cvUrl);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up">
      <div className="glass-card rounded-2xl w-full max-w-md gold-glow">
        <div className="flex items-center justify-between p-5 border-b border-gold-400/15">
          <h2 className="font-display text-lg font-bold gold-gradient-text">{title}</h2>
          <button onClick={onClose} className="text-gold-200/60 hover:text-gold-200"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm text-gold-200/70 mb-2">الاسم *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-dark w-full rounded-xl px-4 py-3" />
          </div>
          <div>
            <label className="block text-sm text-gold-200/70 mb-2">رقم الهاتف *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-dark w-full rounded-xl px-4 py-3" dir="ltr" />
          </div>
          <div>
            <label className="block text-sm text-gold-200/70 mb-2">رفع السيرة الذاتية (CV) *</label>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCv(f); }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full glass-card border-2 border-dashed border-gold-400/20 hover:border-gold-400/40 rounded-xl py-6 text-center transition-all">
              {uploading ? <p className="text-sm text-gold-200/60">جاري الرفع...</p> :
                cvUrl ? <div className="flex items-center justify-center gap-2 text-green-400"><CheckCircle2 size={18} /><span className="text-sm">تم رفع CV</span></div> :
                <div className="flex flex-col items-center gap-1">
                  <Upload size={24} className="gold-text" />
                  <span className="text-xs text-gold-200/60">اضغط لرفع ملف CV</span>
                </div>}
            </button>
          </div>
          <button onClick={submit} disabled={!name.trim() || !phone.trim() || !cvUrl || submitting}
            className="btn-gold w-full rounded-xl py-3 disabled:opacity-50">
            {submitting ? 'جاري...' : 'تقديم'}
          </button>
        </div>
      </div>
    </div>
  );
}
