import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, FlatList, ScrollView, Modal, Alert, Linking, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { MapPicker } from '@/components/MapPicker';
import { ImageUploader, type ImageItem } from '@/components/ImageUploader';
import { supabase } from '@/lib/client';
import { useAuth } from '@/context/AuthContext';
import {
  getAllowedTypes, FALLBACK_CATEGORIES, type Category, type Subcategory, type Listing, type AccountType, type RootStackParamList,
} from '@/lib/supabase';

type CatNav = NativeStackNavigationProp<RootStackParamList, 'Category'>;

export function CategoryScreen() {
  const route = useRoute();
  const nav = useNavigation<CatNav>();
  const { user, profile } = useAuth();
  const params = route.params as { slug: string; name?: string };

  const [category, setCategory] = useState<Category | null>(null);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [listingImages, setListingImages] = useState<Record<string, string[]>>({});
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);

  const slug = params.slug;

  const load = useCallback(async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
    const cat = cats as Category | null;
    setCategory(cat);
    if (!cat) { setLoading(false); return; }

    const [subsRes, listingsRes] = await Promise.all([
      supabase.from('subcategories').select('*').eq('category_id', cat.id).order('sort_order'),
      supabase.from('listings').select('*').eq('category_id', cat.id).eq('is_active', true).order('created_at', { ascending: false }),
    ]);
    setSubcats((subsRes.data as Subcategory[]) || []);
    const lst = (listingsRes.data as Listing[]) || [];
    setListings(lst);

    if (lst.length > 0) {
      const ids = lst.map((l) => l.id);
      const { data: imgs } = await supabase.from('listing_images').select('*').in('listing_id', ids).order('sort_order');
      const map: Record<string, string[]> = {};
      (imgs || []).forEach((img: any) => {
        if (!map[img.listing_id]) map[img.listing_id] = [];
        map[img.listing_id].push(img.url);
      });
      setListingImages(map);
    }
    setLoading(false);
  }, [slug]);

  useFocusEffect(
    useCallback(() => { load(); }, [load])
  );

  const allowedTypes = getAllowedTypes(slug);
  const canAdd = !!user && !!profile && allowedTypes.includes(profile.account_type);
  const accountType = profile?.account_type || 'individual';

  const visibleListings = activeSub ? listings.filter((l) => l.subcategory_id === activeSub) : listings;

  const handleDelete = (id: string) => {
    Alert.alert('حذف الإعلان', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('listings').delete().eq('id', id);
          setListings((prev) => prev.filter((l) => l.id !== id));
        },
      },
    ]);
  };

  const handleSaved = (saved: Listing, isEdit: boolean) => {
    if (isEdit) {
      setListings((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
    } else {
      setListings((prev) => [saved, ...prev]);
    }
    setShowAdd(false);
    setEditing(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle}>{category?.name || params.name || 'التصنيف'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {canAdd && (
          <Button label="إضافة إعلان" onPress={() => setShowAdd(true)} icon={<Icon name="Plus" size={18} color={colors.black} />} style={styles.addBtn} />
        )}

        {subcats.length > 0 && (
          <View style={styles.subcats}>
            <Pressable
              style={[styles.subChip, !activeSub && styles.subChipActive]}
              onPress={() => setActiveSub(null)}
            >
              <Text style={[styles.subChipText, !activeSub && styles.subChipTextActive]}>الكل ({listings.length})</Text>
            </Pressable>
            {subcats.map((s) => {
              const count = listings.filter((l) => l.subcategory_id === s.id).length;
              return (
                <Pressable
                  key={s.id}
                  style={[styles.subChip, activeSub === s.id && styles.subChipActive]}
                  onPress={() => setActiveSub(activeSub === s.id ? null : s.id)}
                >
                  <Text style={[styles.subChipText, activeSub === s.id && styles.subChipTextActive]}>
                    {s.name} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        {loading ? (
          <Text style={styles.empty}>جاري التحميل...</Text>
        ) : visibleListings.length === 0 ? (
          <Text style={styles.empty}>لا توجد إعلانات في هذا القسم بعد</Text>
        ) : (
          <View style={styles.listings}>
            {visibleListings.map((l) => {
              const sub = subcats.find((s) => s.id === l.subcategory_id);
              const imgs = listingImages[l.id] || [];
              const cover = imgs[0] || l.image_url;
              const isOwner = user?.id === l.owner_id;
              return (
                <View key={l.id} style={styles.card}>
                  <Pressable onPress={() => nav.navigate('ListingDetail', { id: l.id })}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.cardImg} />
                    ) : (
                      <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                        <Icon name="Image" size={32} color={colors.ink600} />
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.cardBody}>
                    <Pressable onPress={() => nav.navigate('ListingDetail', { id: l.id })}>
                      <Text style={styles.cardTitle}>{l.title}</Text>
                    </Pressable>
                    {sub && <Text style={styles.cardSub}>{sub.name}</Text>}
                    {l.price != null && (
                      <Text style={styles.cardPrice}>{l.price} ج.س</Text>
                    )}
                    {l.description ? <Text style={styles.cardDesc} numberOfLines={2}>{l.description}</Text> : null}
                    <View style={styles.cardContact}>
                      {l.phone ? (
                        <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${l.phone}`)}>
                          <Icon name="Phone" size={14} color={colors.gold200} />
                          <Text style={styles.contactText}>{l.phone}</Text>
                        </Pressable>
                      ) : null}
                      {l.location_text ? (
                        <View style={styles.contactBtn}>
                          <Icon name="MapPin" size={14} color={colors.gold200} />
                          <Text style={styles.contactText}>{l.location_text}</Text>
                        </View>
                      ) : null}
                    </View>
                    {isOwner && (
                      <View style={styles.ownerRow}>
                        <Pressable style={styles.ownerBtn} onPress={() => setEditing(l)}>
                          <Icon name="Edit" size={14} color={colors.gold200} />
                          <Text style={styles.ownerBtnText}>تعديل</Text>
                        </Pressable>
                        <Pressable style={[styles.ownerBtn, { borderColor: colors.error }]} onPress={() => handleDelete(l.id)}>
                          <Icon name="Trash" size={14} color={colors.error} />
                          <Text style={[styles.ownerBtnText, { color: colors.error }]}>حذف</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {(showAdd || editing) && category && (
        <ListingFormModal
          categoryId={category.id}
          slug={slug}
          subcats={subcats}
          accountType={accountType}
          userId={user!.id}
          existing={editing}
          onClose={() => { setShowAdd(false); setEditing(null); }}
          onSaved={handleSaved}
        />
      )}
    </SafeAreaView>
  );
}

function ListingFormModal({
  categoryId, slug, subcats, accountType, userId, existing, onClose, onSaved,
}: {
  categoryId: string;
  slug: string;
  subcats: Subcategory[];
  accountType: AccountType;
  userId: string;
  existing: Listing | null;
  onClose: () => void;
  onSaved: (l: Listing, isEdit: boolean) => void;
}) {
  const isJob = slug === 'business-jobs';
  const isService = slug === 'craftsmen' || slug === 'drivers';
  const mode = isJob ? 'job' : isService ? 'service' : 'item';

  const titleLabel = isJob ? 'المسمى الوظيفي' : isService ? 'اسم الخدمة' : 'العنوان';
  const descLabel = isJob ? 'وصف الوظيفة والمتطلبات' : isService ? 'وصف الخدمة والخبرة' : 'الوصف';
  const priceLabel = isJob ? 'الراتب' : isService ? 'سعر الخدمة' : 'السعر';

  const [form, setForm] = useState({
    title: existing?.title || '',
    description: existing?.description || '',
    phone: existing?.phone || '',
    business_phone: existing?.business_phone || '',
    email_contact: existing?.email_contact || '',
    price: existing?.price?.toString() || '',
    location_text: existing?.location_text || '',
    subcategory_id: existing?.subcategory_id || '',
    lat: existing?.lat?.toString() || '',
    lng: existing?.lng?.toString() || '',
  });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existing) {
      supabase.from('listing_images').select('*').eq('listing_id', existing.id).order('sort_order').then(({ data }) => {
        if (data) setImages(data.map((d: any) => ({ url: d.url, id: d.id })));
      });
    }
  }, [existing]);

  const submit = async () => {
    if (!form.title || !form.phone || !form.email_contact) {
      setError('أكمل الحقول المطلوبة (العنوان، الهاتف، البريد)');
      return;
    }
    setSaving(true);
    const payload = {
      category_id: categoryId,
      subcategory_id: form.subcategory_id || null,
      title: form.title,
      description: form.description,
      phone: form.phone,
      business_phone: form.business_phone,
      email_contact: form.email_contact,
      price: form.price ? parseFloat(form.price) : null,
      location_text: form.location_text,
      image_url: images[0]?.url || null,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      is_active: true,
    };

    let data: Listing | null = null;
    let err: any = null;

    if (existing) {
      const res = await supabase.from('listings').update(payload).eq('id', existing.id).select().maybeSingle();
      err = res.error; data = res.data as Listing | null;
    } else {
      const res = await supabase.from('listings').insert({ ...payload, owner_id: userId }).select().maybeSingle();
      err = res.error; data = res.data as Listing | null;
    }

    if (err || !data) {
      setSaving(false);
      setError('فشل الحفظ. تحقق من البيانات.');
      return;
    }

    if (existing) {
      await supabase.from('listing_images').delete().eq('listing_id', data.id);
    }
    if (images.length > 0) {
      await supabase.from('listing_images').insert(images.map((img, i) => ({ listing_id: data!.id, url: img.url, sort_order: i })));
    }

    setSaving(false);
    onSaved(data, !!existing);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBody}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{existing ? 'تعديل' : 'إضافة'} {mode === 'job' ? 'وظيفة' : mode === 'service' ? 'خدمة' : 'إعلان'}</Text>
            <Pressable onPress={onClose}><Icon name="X" size={22} color={colors.gold200} /></Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {subcats.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>القسم الفرعي</Text>
                <View style={styles.subSelectRow}>
                  {subcats.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.subSelectChip, form.subcategory_id === s.id && styles.subSelectChipActive]}
                      onPress={() => setForm((f) => ({ ...f, subcategory_id: form.subcategory_id === s.id ? '' : s.id }))}
                    >
                      <Text style={[styles.subSelectText, form.subcategory_id === s.id && styles.subSelectTextActive]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Input label={titleLabel} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} icon="Tag" required />
            <Input label={descLabel} value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} icon="FileText" multiline numberOfLines={3} />
            <Input label="رقم الهاتف" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} icon="Phone" required keyboardType="phone-pad" />
            <Input label="هاتف الشركة" value={form.business_phone} onChangeText={(v) => setForm({ ...form, business_phone: v })} icon="Phone" keyboardType="phone-pad" />
            <Input label="البريد الإلكتروني" value={form.email_contact} onChangeText={(v) => setForm({ ...form, email_contact: v })} icon="Mail" required keyboardType="email-address" />
            <Input label={priceLabel} value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} icon="DollarSign" keyboardType="numeric" />
            <Input label="الموقع (نصي)" value={form.location_text} onChangeText={(v) => setForm({ ...form, location_text: v })} icon="MapPin" />

            <Text style={styles.fieldLabel}>الصور</Text>
            <ImageUploader images={images} onChange={setImages} />

            <Text style={styles.fieldLabel}>الموقع الجغرافي (GPS)</Text>
            <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm({ ...form, lat, lng })} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Button label="حفظ" onPress={submit} loading={saving} style={{ marginTop: spacing.md }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  scroll: { padding: 16, paddingBottom: 100 },
  addBtn: { marginBottom: spacing.md },
  subcats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.lg },
  subChip: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 14, paddingVertical: 8 },
  subChipActive: { backgroundColor: colors.gold400, borderColor: colors.gold400 },
  subChipText: { fontSize: fontSizes.sm, color: colors.gold200 },
  subChipTextActive: { color: colors.black, fontWeight: '700' },
  listings: { gap: 16 },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden' },
  cardImg: { width: '100%', height: 180, backgroundColor: colors.bgInput },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 16, gap: 6 },
  cardTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.gold50 },
  cardSub: { fontSize: fontSizes.sm, color: colors.gold400 },
  cardPrice: { fontSize: fontSizes.md, color: colors.gold200, fontWeight: '700' },
  cardDesc: { fontSize: fontSizes.sm, color: colors.ink400, lineHeight: 20 },
  cardContact: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgInput, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radii.sm },
  contactText: { fontSize: fontSizes.sm, color: colors.gold200 },
  ownerRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  ownerBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.borderActive, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  ownerBtnText: { fontSize: fontSizes.sm, color: colors.gold200, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.ink500, fontSize: fontSizes.md, paddingVertical: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: colors.bgCard, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  fieldLabel: { fontSize: fontSizes.sm, color: colors.gold100, marginBottom: 8, fontWeight: '600' },
  subSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  subSelectChip: { backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 8 },
  subSelectChipActive: { backgroundColor: colors.gold400, borderColor: colors.gold400 },
  subSelectText: { fontSize: fontSizes.sm, color: colors.gold200 },
  subSelectTextActive: { color: colors.black, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: fontSizes.sm, marginTop: 8 },
});
