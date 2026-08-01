import { useState, useRef } from 'react';
import { supabase, type Listing, type Order, sectionHasPayments, isOpenNow, formatTime } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { Icon } from '@/components/Icon';
import {
  X, Upload, MessageCircle, Phone, MapPin, Navigation, Clock,
  Truck, Star, Users, Calendar, Wallet, CheckCircle2, DollarSign,
  ShoppingBag, CreditCard, Briefcase, GraduationCap,
  ShieldCheck, Crown, Zap,
} from 'lucide-react';
import { FACILITY_OPTIONS } from '@/lib/supabase';

export function SectionCard({
  listing,
  categorySlug,
  subName,
  isOwner,
  isAdmin,
  onEdit,
  onDelete,
  index,
  images,
  products,
}: {
  listing: Listing;
  categorySlug: string;
  subName?: string;
  isOwner: boolean;
  isAdmin: boolean;
  onEdit: () => void;
  onDelete: (id: string) => void;
  index: number;
  images: string[];
  products: Product[];
}) {
  const [showOrder, setShowOrder] = useState(false);
  const hasPayments = sectionHasPayments(categorySlug);
  const coverImage = images[0] || listing.image_url;
  const offers = products.filter((p: Product) => p.is_offer);

  return (
    <>
      <div
        className="glass-card glass-card-hover rounded-2xl overflow-hidden animate-fade-up relative"
        style={{ animationDelay: `${index * 0.05}s` }}
      >
        {coverImage && (
          <button
            onClick={() => navigate(`/listing/${listing.id}`)}
            className="block w-full h-40 overflow-hidden bg-ink-600 relative"
          >
            <img
              src={coverImage}
              alt={listing.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur ${
              isOpenNow(listing) ? 'bg-green-500/80 text-white' : 'bg-red-500/80 text-white'
            }`}>
              {isOpenNow(listing) ? 'مفتوح الآن' : 'مغلق'}
            </div>
            {listing.is_featured && (
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur bg-gold-400/80 text-ink-900 flex items-center gap-1">
                <Crown size={10} /> مميز
              </div>
            )}
            {listing.is_sponsored && !listing.is_featured && (
              <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur bg-purple-500/80 text-white flex items-center gap-1">
                <Zap size={10} /> إعلان
              </div>
            )}
          </button>
        )}

        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              {subName && (
                <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300 mb-1">
                  {subName}
                </span>
              )}
              <h3 className="font-bold text-gold-50 line-clamp-1">{listing.title}</h3>
            </div>
            {listing.price != null && (
              <div className="flex items-center gap-1 text-gold-300 font-bold text-sm shrink-0">
                <DollarSign size={14} />
                {listing.price.toLocaleString()}
              </div>
            )}
          </div>

          {listing.description && (
            <p className="text-sm text-gold-200/60 mb-3 line-clamp-2 min-h-[2.5rem]">
              {listing.description}
            </p>
          )}

          {/* Section-specific content */}
          <SectionSpecificContent listing={listing} slug={categorySlug} products={products} offers={offers} />

          {/* Contact actions */}
          <div className="space-y-2 text-xs text-gold-200/80 border-t border-gold-400/10 pt-3">
            {listing.phone && (
              <a href={`tel:${listing.phone}`} className="flex items-center gap-2 hover:text-gold-200 transition-colors group">
                <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-all">
                  <Phone size={13} className="gold-text" />
                </span>
                <span dir="ltr">{listing.phone}</span>
              </a>
            )}
            {listing.whatsapp && (
              <a href={`https://wa.me/${listing.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-green-400 transition-colors group">
                <span className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-all">
                  <MessageCircle size={13} className="text-green-400" />
                </span>
                <span>واتساب مباشر</span>
              </a>
            )}
            {listing.location_text && (
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center shrink-0">
                  <MapPin size={13} className="gold-text" />
                </span>
                <span className="line-clamp-1">{listing.location_text}</span>
              </div>
            )}
            {listing.lat != null && listing.lng != null && (
              <button onClick={() => navigate(`/listing/${listing.id}`)}
                className="flex items-center gap-2 gold-text hover:underline transition-all group w-full">
                <span className="w-7 h-7 rounded-lg bg-gold-400/10 flex items-center justify-center group-hover:bg-gold-400/20 transition-all shrink-0">
                  <Navigation size={13} />
                </span>
                <span>عرض الموقع على الخريطة</span>
              </button>
            )}
          </div>

          {/* Order button for payment-enabled sections */}
          {hasPayments && !isOwner && listing.bankak_account && (
            <button onClick={() => setShowOrder(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 text-sm btn-gold rounded-xl py-2.5 transition-all">
              <ShoppingBag size={15} /> اطلب الآن / حجز
            </button>
          )}

          {/* Event hall booking */}
          {categorySlug === 'events' && (
            <button onClick={() => navigate(`/listing/${listing.id}`)}
              className="w-full mt-3 flex items-center justify-center gap-2 text-sm btn-gold rounded-xl py-2.5 transition-all">
              <Calendar size={15} /> طلب حجز القاعة
            </button>
          )}

          {/* Owner/Admin controls */}
          {(isOwner || isAdmin) && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-gold-400/10">
              <button onClick={onEdit}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs gold-text border border-gold-400/20 hover:border-gold-400/50 hover:bg-gold-400/10 rounded-lg py-2 transition-all">
                <Icon name="Edit2" size={13} /> تعديل
              </button>
              <button onClick={() => onDelete(listing.id)}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-400/70 hover:text-red-400 border border-red-500/20 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg py-2 transition-all">
                <Icon name="Trash2" size={13} /> حذف
              </button>
            </div>
          )}
        </div>
      </div>

      {showOrder && (
        <OrderModal listing={listing} onClose={() => setShowOrder(false)} />
      )}
    </>
  );
}

function SectionSpecificContent({ listing, slug, products, offers }: { listing: Listing; slug: string; products: Product[]; offers: Product[] }) {
  if (slug === 'restaurants') {
    return (
      <div className="mb-3 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {listing.delivery_available ? (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
              <Truck size={10} /> توصيل
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
              <ShoppingBag size={10} /> استلام فقط
            </span>
          )}
          {listing.opening_time && listing.closing_time && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
              <Clock size={10} /> {formatTime(listing.opening_time)} - {formatTime(listing.closing_time)}
            </span>
          )}
        </div>
        {products.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-gold-300/60">
            <ShoppingBag size={11} /> {products.length} صنف بالمنيو
            {offers.length > 0 && <span className="text-green-400">· {offers.length} عرض خاص</span>}
          </div>
        )}
      </div>
    );
  }

  if (slug === 'business-jobs') {
    return (
      <div className="mb-3 space-y-2">
        {listing.description && <p className="text-xs text-gold-200/50 line-clamp-1">{listing.description}</p>}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
            <Briefcase size={10} /> وظائف وخدمات
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
            <GraduationCap size={10} /> تدريب
          </span>
          {listing.email_contact && (
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
              <FileText size={10} /> خدمة عملاء
            </span>
          )}
        </div>
      </div>
    );
  }

  if (slug === 'community') {
    return (
      <div className="mb-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
            <Heart size={10} /> عمل إنساني
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
            <ShieldCheck size={10} /> تطوع وتبرع بالعين
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
            <Icon name="Gift" size={10} /> بدون مدفوعات
          </span>
        </div>
      </div>
    );
  }

  if (slug === 'events') {
    return (
      <div className="mb-3 space-y-2">
        {listing.capacity != null && (
          <div className="flex items-center gap-1.5 text-xs text-gold-200/70">
            <Users size={13} className="gold-text" /> السعة: {listing.capacity} شخص
          </div>
        )}
        {listing.facilities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {listing.facilities.slice(0, 4).map((f) => {
              const label = FACILITY_OPTIONS.find((o) => o.value === f)?.label || f;
              return <span key={f} className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
                <CheckCircle2 size={9} /> {label}
              </span>;
            })}
            {listing.facilities.length > 4 && <span className="text-[10px] text-gold-300/50">+{listing.facilities.length - 4}</span>}
          </div>
        )}
      </div>
    );
  }

  if (slug === 'craftsmen' || slug === 'drivers') {
    return (
      <div className="mb-3 space-y-2">
        {listing.rating_count > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={12} className={n <= Math.round(listing.rating_avg) ? 'text-gold-400 fill-gold-400' : 'text-gold-400/20'} />
              ))}
            </div>
            <span className="text-xs text-gold-300/60">{listing.rating_avg.toFixed(1)} ({listing.rating_count})</span>
          </div>
        )}
        {listing.price != null && (
          <div className="p-2 rounded-lg bg-ink-600/40 border border-gold-400/10">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gold-200/60 flex items-center gap-1.5"><DollarSign size={12} className="gold-text" /> سعر تقديري</span>
              <span className="text-gold-100 font-bold">{listing.price.toLocaleString()} ج.س</span>
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5 pt-1.5 border-t border-gold-400/10">
              <span className="text-gold-300/50 flex items-center gap-1"><Wallet size={10} /> رسوم المنصة (7%)</span>
              <span className="text-gold-300/70">{Math.round(listing.price * 0.07)} ج.س</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (slug === 'health') {
    return (
      <div className="mb-3">
        {listing.is_24_7 && (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
            <Clock size={10} /> متاح 24/7
          </span>
        )}
      </div>
    );
  }

  // Default: generic badges
  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {listing.delivery_available && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
          <Truck size={10} /> توصيل متاح
        </span>
      )}
      {listing.payment_methods.length > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
          <CreditCard size={10} /> {listing.payment_methods.map((m) => m).join(' · ')}
        </span>
      )}
      {products.length > 0 && (
        <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gold-400/10 text-gold-300">
          <ShoppingBag size={10} /> {products.length} منتج
        </span>
      )}
    </div>
  );
}

export function OrderModal({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'details' | 'payment' | 'done'>('details');
  const [orderData, setOrderData] = useState({ name: profile?.full_name || '', phone: profile?.phone || '', notes: '' });
  const [receiptUrl, setReceiptUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitOrder = async () => {
    if (!user || !orderData.name.trim() || !orderData.phone.trim()) return;
    const { data } = await supabase.from('orders').insert({
      listing_id: listing.id,
      customer_id: user.id,
      customer_name: orderData.name,
      customer_phone: orderData.phone,
      notes: orderData.notes,
    }).select().maybeSingle();
    if (data) {
      setOrderId((data as Order).id);
      setStep('payment');
    }
  };

  const uploadReceipt = async (file: File) => {
    if (!user || !orderId) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${orderId}.${ext}`;
    const { error } = await supabase.storage.from('receipts').upload(path, file, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
      setReceiptUrl(urlData.publicUrl);
      await supabase.from('orders').update({ receipt_url: urlData.publicUrl }).eq('id', orderId);
    }
    setUploading(false);
  };

  const sendReceiptViaWhatsApp = () => {
    const msg = `السلام عليكم، أنا ${orderData.name}. طلبت خدمة من "${listing.title}" على تطبيق نور. تم تحويل المبلغ عبر بنكاك لحسابكم. رقم الطلب: ${orderId?.slice(0, 8)}`;
    const phone = listing.whatsapp || listing.phone || '';
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    setStep('done');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-up">
      <div className="glass-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto gold-glow">
        <div className="flex items-center justify-between p-5 border-b border-gold-400/15 sticky top-0 bg-ink-500/95 backdrop-blur z-10">
          <h2 className="font-display text-lg font-bold gold-gradient-text">
            {step === 'done' ? 'تم الطلب' : step === 'payment' ? 'الدفع عبر بنكاك' : 'تقديم الطلب'}
          </h2>
          <button onClick={onClose} className="text-gold-200/60 hover:text-gold-200"><X size={20} /></button>
        </div>

        <div className="p-5 space-y-4">
          {step === 'details' && (
            <>
              <div className="glass-card rounded-xl p-3 border border-gold-400/15">
                <p className="text-sm text-gold-100 font-bold">{listing.title}</p>
                {listing.price != null && <p className="text-xs gold-text mt-1">السعر: {listing.price.toLocaleString()} ج.س</p>}
              </div>
              <div>
                <label className="block text-sm text-gold-200/70 mb-2">الاسم *</label>
                <input value={orderData.name} onChange={(e) => setOrderData({ ...orderData, name: e.target.value })}
                  className="input-dark w-full rounded-xl px-4 py-3" placeholder="اسمك الكامل" />
              </div>
              <div>
                <label className="block text-sm text-gold-200/70 mb-2">رقم الهاتف *</label>
                <input value={orderData.phone} onChange={(e) => setOrderData({ ...orderData, phone: e.target.value })}
                  className="input-dark w-full rounded-xl px-4 py-3" placeholder="رقمك" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm text-gold-200/70 mb-2">تفاصيل الطلب</label>
                <textarea value={orderData.notes} onChange={(e) => setOrderData({ ...orderData, notes: e.target.value })}
                  className="input-dark w-full rounded-xl px-4 py-3 resize-none" rows={3} placeholder="اكتب تفاصيل طلبك..." />
              </div>
              <button onClick={submitOrder} disabled={!orderData.name.trim() || !orderData.phone.trim()}
                className="btn-gold w-full rounded-xl py-3 disabled:opacity-50">
                متابعة للدفع
              </button>
            </>
          )}

          {step === 'payment' && (
            <>
              <div className="glass-card rounded-xl p-4 border border-gold-400/20 gold-glow">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={18} className="gold-text" />
                  <h3 className="font-bold text-gold-100">بيانات بنكاك للتحويل</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-ink-600/40">
                    <span className="text-gold-200/60">اسم الحساب:</span>
                    <span className="text-gold-100 font-bold">{listing.bankak_name || listing.title}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-ink-600/40">
                    <span className="text-gold-200/60">رقم/حساب بنكاك:</span>
                    <span className="text-gold-100 font-bold" dir="ltr">{listing.bankak_account}</span>
                  </div>
                </div>
                <p className="text-xs text-gold-200/40 mt-3">حوّل المبلغ عبر تطبيق بنكاك على الرقم أعلاه، ثم ارفع الإيصال أو أرسله واتساب.</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gold-200/70 mb-2">رفع إيصال التحويل (صورة)</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadReceipt(f); }} />
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="w-full glass-card border-2 border-dashed border-gold-400/20 hover:border-gold-400/40 rounded-xl py-6 text-center transition-all">
                    {uploading ? <p className="text-sm text-gold-200/60">جاري الرفع...</p> :
                      receiptUrl ? <div className="flex items-center justify-center gap-2 text-green-400"><CheckCircle2 size={18} /><span className="text-sm">تم رفع الإيصال</span></div> :
                      <div className="flex flex-col items-center gap-1">
                        <Upload size={24} className="gold-text" />
                        <span className="text-xs text-gold-200/60">اضغط لرفع صورة الإيصال</span>
                      </div>}
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gold-300/40">
                  <div className="flex-1 h-px bg-gold-400/10" /> أو <div className="flex-1 h-px bg-gold-400/10" />
                </div>

                <button onClick={sendReceiptViaWhatsApp}
                  className="w-full bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25 rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition-all">
                  <MessageCircle size={18} /> إرسال الإيصال عبر واتساب
                </button>
              </div>

              <button onClick={() => setStep('done')}
                className="btn-gold w-full rounded-xl py-3 disabled:opacity-50" disabled={!receiptUrl}>
                تأكيد الطلب
              </button>
            </>
          )}

          {step === 'done' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-green-500/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h3 className="font-bold text-gold-100 mb-2">تم تقديم طلبك بنجاح!</h3>
              <p className="text-sm text-gold-200/60 mb-4">
                {receiptUrl ? 'تم رفع الإيصال وسيتم مراجعته من قبل مقدم الخدمة.' : 'يمكنك إرسال الإيصال عبر واتساب لمقدم الخدمة.'}
              </p>
              <p className="text-xs text-gold-300/50 mb-4">رقم الطلب: {orderId?.slice(0, 8)}</p>
              <button onClick={onClose} className="btn-gold rounded-xl px-6 py-2.5">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
