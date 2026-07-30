import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, FlatList, Modal, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
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
  ACCOUNT_TYPE_LABELS, getAllowedTypes, FALLBACK_CATEGORIES, type Category, type Subcategory, type Listing, type AccountType, type RootStackParamList,
} from '@/lib/supabase';

type DashNav = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

export function DashboardScreen() {
  const nav = useNavigation<DashNav>();
  const { user, profile, refreshProfile } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [subcats, setSubcats] = useState<Subcategory[]>([]);
  const [tab, setTab] = useState<'listings' | 'profile'>('listings');
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Listing>>({});
  const [savedMsg, setSavedMsg] = useState(false);

  const isAdmin = profile?.account_type === 'admin';
  const isProvider = profile && profile.account_type !== 'individual' && profile.account_type !== 'admin';

  const load = useCallback(async () => {
    if (!user) return;
    const [lstRes, catRes, subRes] = await Promise.all([
      supabase.from('listings').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
      supabase.from('categories').select('*').order('sort_order'),
      supabase.from('subcategories').select('*').order('sort_order'),
    ]);
    setListings((lstRes.data as Listing[]) || []);
    if (catRes.data && catRes.data.length > 0) setCategories(catRes.data as Category[]);
    setSubcats((subRes.data as Subcategory[]) || []);
  }, [user]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleActive = async (l: Listing) => {
    await supabase.from('listings').update({ is_active: !l.is_active }).eq('id', l.id);
    setListings((prev) => prev.map((x) => (x.id === l.id ? { ...x, is_active: !x.is_active } : x)));
  };

  const handleDelete = (id: string) => {
    Alert.alert('حذف', 'هل أنت متأكد؟', [
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

  const startEdit = (l: Listing) => {
    setEditingId(l.id);
    setEditForm(l);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await supabase.from('listings').update({
      title: editForm.title,
      description: editForm.description,
      phone: editForm.phone,
      business_phone: editForm.business_phone,
      email_contact: editForm.email_contact,
      price: editForm.price,
      location_text: editForm.location_text,
    }).eq('id', editingId);
    setListings((prev) => prev.map((l) => (l.id === editingId ? { ...l, ...editForm } as Listing : l)));
    setEditingId(null);
  };

  const saveProfile = async (data: Partial<{ full_name: string; phone: string; business_phone: string; email_contact: string; location_text: string; lat: string; lng: string }>) => {
    if (!user) return;
    await supabase.from('profiles').update({
      full_name: data.full_name,
      phone: data.phone,
      business_phone: data.business_phone,
      email_contact: data.email_contact,
      location_text: data.location_text,
      lat: data.lat ? parseFloat(data.lat) : null,
      lng: data.lng ? parseFloat(data.lng) : null,
    }).eq('id', user.id);
    await refreshProfile();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle}>لوحة التحكم</Text>
        <View style={{ width: 40 }} />
      </View>

      {isAdmin && (
        <Pressable style={styles.adminBanner} onPress={() => nav.navigate('Admin')}>
          <Icon name="ShieldCheck" size={18} color={colors.gold200} />
          <Text style={styles.adminText}>إدارة التصنيفات والأقسام</Text>
          <Icon name="ChevronLeft" size={16} color={colors.gold200} />
        </Pressable>
      )}

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, tab === 'listings' && styles.tabActive]} onPress={() => setTab('listings')}>
          <Text style={[styles.tabText, tab === 'listings' && styles.tabTextActive]}>إعلاناتي ({listings.length})</Text>
        </Pressable>
        <Pressable style={[styles.tab, tab === 'profile' && styles.tabActive]} onPress={() => setTab('profile')}>
          <Text style={[styles.tabText, tab === 'profile' && styles.tabTextActive]}>بيانات التواصل</Text>
        </Pressable>
      </View>

      {tab === 'listings' ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {isProvider && (
            <Button label="إضافة إعلان جديد" onPress={() => setShowCreate(true)} icon={<Icon name="Plus" size={18} color={colors.black} />} style={{ marginBottom: 16 }} />
          )}
          {listings.length === 0 ? (
            <Text style={styles.empty}>لا توجد إعلانات بعد</Text>
          ) : (
            listings.map((l) => {
              const cat = categories.find((c) => c.id === l.category_id);
              return (
                <View key={l.id} style={styles.card}>
                  {editingId === l.id ? (
                    <View style={styles.editForm}>
                      <Input label="العنوان" value={editForm.title || ''} onChangeText={(v) => setEditForm({ ...editForm, title: v })} />
                      <Input label="الوصف" value={editForm.description || ''} onChangeText={(v) => setEditForm({ ...editForm, description: v })} multiline />
                      <Input label="الهاتف" value={editForm.phone || ''} onChangeText={(v) => setEditForm({ ...editForm, phone: v })} keyboardType="phone-pad" />
                      <Input label="هاتف الشركة" value={editForm.business_phone || ''} onChangeText={(v) => setEditForm({ ...editForm, business_phone: v })} keyboardType="phone-pad" />
                      <Input label="البريد" value={editForm.email_contact || ''} onChangeText={(v) => setEditForm({ ...editForm, email_contact: v })} keyboardType="email-address" />
                      <Input label="السعر" value={editForm.price?.toString() || ''} onChangeText={(v) => setEditForm({ ...editForm, price: v ? parseFloat(v) : null })} keyboardType="numeric" />
                      <Input label="الموقع" value={editForm.location_text || ''} onChangeText={(v) => setEditForm({ ...editForm, location_text: v })} />
                      <View style={styles.editBtns}>
                        <Button label="حفظ" onPress={saveEdit} style={{ flex: 1 }} />
                        <Button label="إلغاء" variant="outline" onPress={() => setEditingId(null)} style={{ flex: 1 }} />
                      </View>
                    </View>
                  ) : (
                    <>
                      <View style={styles.cardHeader}>
                        {l.image_url ? (
                          <Image source={{ uri: l.image_url }} style={styles.cardImg} />
                        ) : (
                          <View style={[styles.cardImg, styles.cardImgPlaceholder]}>
                            <Icon name={cat?.icon || 'Folder'} size={20} color={colors.ink600} />
                          </View>
                        )}
                        <View style={styles.cardHeaderText}>
                          <View style={styles.catRow}>
                            <Icon name={cat?.icon || 'Folder'} size={14} color={colors.gold400} />
                            <Text style={styles.catName}>{cat?.name || ''}</Text>
                          </View>
                          <Pressable onPress={() => nav.navigate('ListingDetail', { id: l.id })}>
                            <Text style={styles.cardTitle}>{l.title}</Text>
                          </Pressable>
                          <View style={[styles.statusBadge, l.is_active ? styles.statusActive : styles.statusInactive]}>
                            <Text style={styles.statusText}>{l.is_active ? 'نشط' : 'متوقف'}</Text>
                          </View>
                        </View>
                      </View>
                      {l.description ? <Text style={styles.cardDesc} numberOfLines={2}>{l.description}</Text> : null}
                      <View style={styles.cardActions}>
                        <Pressable style={styles.actionBtn} onPress={() => startEdit(l)}>
                          <Icon name="Edit" size={14} color={colors.gold200} />
                          <Text style={styles.actionText}>تعديل</Text>
                        </Pressable>
                        <Pressable style={styles.actionBtn} onPress={() => toggleActive(l)}>
                          <Icon name={l.is_active ? 'EyeOff' : 'Eye'} size={14} color={colors.gold200} />
                          <Text style={styles.actionText}>{l.is_active ? 'إيقاف' : 'تفعيل'}</Text>
                        </Pressable>
                        <Pressable style={[styles.actionBtn, { borderColor: colors.error }]} onPress={() => handleDelete(l.id)}>
                          <Icon name="Trash" size={14} color={colors.error} />
                          <Text style={[styles.actionText, { color: colors.error }]}>حذف</Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <ProfileContactEditor profile={profile} onSave={saveProfile} savedMsg={savedMsg} />
      )}

      {showCreate && (
        <CreateListingModal
          categories={categories}
          subcats={subcats}
          accountType={profile?.account_type || 'individual'}
          userId={user!.id}
          onClose={() => setShowCreate(false)}
          onCreated={(l) => { setListings((prev) => [l, ...prev]); setShowCreate(false); }}
        />
      )}
    </SafeAreaView>
  );
}

function ProfileContactEditor({
  profile, onSave, savedMsg,
}: {
  profile: any;
  onSave: (data: any) => void;
  savedMsg: boolean;
}) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    business_phone: profile?.business_phone || '',
    email_contact: profile?.email_contact || '',
    location_text: profile?.location_text || '',
    lat: profile?.lat?.toString() || '',
    lng: profile?.lng?.toString() || '',
  });

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Input label="الاسم الكامل" value={form.full_name} onChangeText={(v) => setForm({ ...form, full_name: v })} icon="User" />
      <Input label="الهاتف" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} icon="Phone" keyboardType="phone-pad" />
      <Input label="هاتف الشركة" value={form.business_phone} onChangeText={(v) => setForm({ ...form, business_phone: v })} icon="Phone" keyboardType="phone-pad" />
      <Input label="البريد الإلكتروني" value={form.email_contact} onChangeText={(v) => setForm({ ...form, email_contact: v })} icon="Mail" keyboardType="email-address" />
      <Input label="الموقع (نصي)" value={form.location_text} onChangeText={(v) => setForm({ ...form, location_text: v })} icon="MapPin" />
      <Text style={styles.fieldLabel}>الموقع الجغرافي (GPS)</Text>
      <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm({ ...form, lat, lng })} />
      {savedMsg && <Text style={styles.savedMsg}>تم الحفظ</Text>}
      <Button label="حفظ البيانات" onPress={() => onSave(form)} style={{ marginTop: 16 }} />
    </ScrollView>
  );
}

function CreateListingModal({
  categories, subcats, accountType, userId, onClose, onCreated,
}: {
  categories: Category[];
  subcats: Subcategory[];
  accountType: AccountType;
  userId: string;
  onClose: () => void;
  onCreated: (l: Listing) => void;
}) {
  const [selectedCat, setSelectedCat] = useState<string>('');
  const [selectedSub, setSelectedSub] = useState<string>('');
  const [form, setForm] = useState({
    title: '', description: '', phone: '', business_phone: '', email_contact: '', price: '', location_text: '', lat: '', lng: '',
  });
  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const allowedCats = categories.filter((c) => getAllowedTypes(c.slug).includes(accountType));
  const filteredSubs = subcats.filter((s) => s.category_id === selectedCat);

  const submit = async () => {
    if (!selectedCat || !form.title || !form.phone || !form.email_contact) {
      setError('أكمل الحقول المطلوبة');
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: userId,
      category_id: selectedCat,
      subcategory_id: selectedSub || null,
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
    const { data, error: err } = await supabase.from('listings').insert(payload).select().maybeSingle();
    if (err || !data) {
      setSaving(false);
      setError('فشل النشر');
      return;
    }
    if (images.length > 0) {
      await supabase.from('listing_images').insert(images.map((img, i) => ({ listing_id: data.id, url: img.url, sort_order: i })));
    }
    setSaving(false);
    onCreated(data as Listing);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBody}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>إضافة إعلان</Text>
            <Pressable onPress={onClose}><Icon name="X" size={22} color={colors.gold200} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>التصنيف</Text>
            <View style={styles.catSelectRow}>
              {allowedCats.map((c) => (
                <Pressable
                  key={c.id}
                  style={[styles.catSelectChip, selectedCat === c.id && styles.catSelectChipActive]}
                  onPress={() => { setSelectedCat(c.id); setSelectedSub(''); }}
                >
                  <Icon name={c.icon} size={16} color={selectedCat === c.id ? colors.black : colors.gold400} />
                  <Text style={[styles.catSelectText, selectedCat === c.id && styles.catSelectTextActive]}>{c.name}</Text>
                </Pressable>
              ))}
            </View>

            {filteredSubs.length > 0 && (
              <View>
                <Text style={styles.fieldLabel}>القسم الفرعي</Text>
                <View style={styles.catSelectRow}>
                  {filteredSubs.map((s) => (
                    <Pressable
                      key={s.id}
                      style={[styles.catSelectChip, selectedSub === s.id && styles.catSelectChipActive]}
                      onPress={() => setSelectedSub(selectedSub === s.id ? '' : s.id)}
                    >
                      <Text style={[styles.catSelectText, selectedSub === s.id && styles.catSelectTextActive]}>{s.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Input label="العنوان" value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} icon="Tag" required />
            <Input label="الوصف" value={form.description} onChangeText={(v) => setForm({ ...form, description: v })} icon="FileText" multiline />
            <Input label="الهاتف" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} icon="Phone" required keyboardType="phone-pad" />
            <Input label="هاتف الشركة" value={form.business_phone} onChangeText={(v) => setForm({ ...form, business_phone: v })} icon="Phone" keyboardType="phone-pad" />
            <Input label="البريد" value={form.email_contact} onChangeText={(v) => setForm({ ...form, email_contact: v })} icon="Mail" required keyboardType="email-address" />
            <Input label="السعر" value={form.price} onChangeText={(v) => setForm({ ...form, price: v })} icon="DollarSign" keyboardType="numeric" />
            <Input label="الموقع" value={form.location_text} onChangeText={(v) => setForm({ ...form, location_text: v })} icon="MapPin" />

            <Text style={styles.fieldLabel}>الصور</Text>
            <ImageUploader images={images} onChange={setImages} />

            <Text style={styles.fieldLabel}>الموقع الجغرافي</Text>
            <MapPicker lat={form.lat} lng={form.lng} onChange={(lat, lng) => setForm({ ...form, lat, lng })} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Button label="نشر" onPress={submit} loading={saving} style={{ marginTop: 16 }} />
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
  adminBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 16, padding: 14, backgroundColor: 'rgba(212,160,23,0.1)', borderWidth: 1, borderColor: colors.borderActive, borderRadius: radii.md },
  adminText: { flex: 1, fontSize: fontSizes.md, color: colors.gold200, fontWeight: '600' },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 8, backgroundColor: colors.bgInput, borderRadius: radii.md, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.gold400 },
  tabText: { fontSize: fontSizes.sm, color: colors.ink400, fontWeight: '600' },
  tabTextActive: { color: colors.black },
  scroll: { padding: 16, paddingBottom: 100 },
  empty: { textAlign: 'center', color: colors.ink500, fontSize: fontSizes.md, paddingVertical: 40 },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', gap: 12 },
  cardImg: { width: 64, height: 64, borderRadius: radii.sm, backgroundColor: colors.bgInput },
  cardImgPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardHeaderText: { flex: 1, gap: 4 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catName: { fontSize: fontSizes.sm, color: colors.gold400 },
  cardTitle: { fontSize: fontSizes.md, fontWeight: '700', color: colors.gold50 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full, marginTop: 4 },
  statusActive: { backgroundColor: 'rgba(34,197,94,0.2)' },
  statusInactive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardDesc: { fontSize: fontSizes.sm, color: colors.ink400, marginTop: 8, lineHeight: 20 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.borderActive, borderRadius: radii.sm, paddingHorizontal: 12, paddingVertical: 6 },
  actionText: { fontSize: fontSizes.sm, color: colors.gold200, fontWeight: '600' },
  editForm: { gap: 8 },
  editBtns: { flexDirection: 'row', gap: 8 },
  fieldLabel: { fontSize: fontSizes.sm, color: colors.gold100, marginBottom: 8, fontWeight: '600' },
  savedMsg: { color: colors.success, fontSize: fontSizes.sm, textAlign: 'center', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBody: { backgroundColor: colors.bgCard, borderTopLeftRadius: radii.xxl, borderTopRightRadius: radii.xxl, maxHeight: '92%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  modalScroll: { padding: 20, paddingBottom: 40 },
  catSelectRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  catSelectChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgInput, borderWidth: 1, borderColor: colors.border, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 8 },
  catSelectChipActive: { backgroundColor: colors.gold400, borderColor: colors.gold400 },
  catSelectText: { fontSize: fontSizes.sm, color: colors.gold200 },
  catSelectTextActive: { color: colors.black, fontWeight: '700' },
  errorText: { color: colors.error, fontSize: fontSizes.sm, marginTop: 8 },
});
