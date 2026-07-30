import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { ImageGallery } from '@/components/ImageGallery';
import { MapPreview } from '@/components/MapPreview';
import { supabase } from '@/lib/client';
import type { Listing, Category, Subcategory, Profile, RootStackParamList } from '@/lib/supabase';

type DetailNav = NativeStackNavigationProp<RootStackParamList, 'ListingDetail'>;

export function ListingDetailScreen() {
  const route = useRoute();
  const nav = useNavigation<DetailNav>();
  const { id } = route.params as { id: string };
  const [listing, setListing] = useState<Listing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [subcat, setSubcat] = useState<Subcategory | null>(null);
  const [owner, setOwner] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: lst } = await supabase.from('listings').select('*').eq('id', id).maybeSingle();
      const l = lst as Listing | null;
      setListing(l);
      if (!l) { setLoading(false); return; }

      const [imgsRes, catRes, subRes, ownerRes] = await Promise.all([
        supabase.from('listing_images').select('*').eq('listing_id', l.id).order('sort_order'),
        supabase.from('categories').select('*').eq('id', l.category_id).maybeSingle(),
        l.subcategory_id ? supabase.from('subcategories').select('*').eq('id', l.subcategory_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('profiles').select('*').eq('id', l.owner_id).maybeSingle(),
      ]);

      const imgUrls = (imgsRes.data || []).map((d: any) => d.url as string);
      const allImgs = l.image_url && !imgUrls.includes(l.image_url) ? [l.image_url, ...imgUrls] : imgUrls;
      setImages(allImgs);
      setCategory(catRes.data as Category | null);
      setSubcat(subRes.data as Subcategory | null);
      setOwner(ownerRes.data as Profile | null);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator color={colors.gold400} size="large" /></View>
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>الإعلان غير موجود</Text>
          <Pressable style={styles.backLink} onPress={() => nav.goBack()}>
            <Text style={styles.backLinkText}>العودة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle} numberOfLines={1}>تفاصيل الإعلان</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {images.length > 0 && <ImageGallery images={images} />}

        <View style={styles.card}>
          {category && (
            <View style={styles.breadcrumb}>
              <Icon name={category.icon} size={14} color={colors.gold400} />
              <Text style={styles.breadcrumbText}>{category.name}</Text>
              {subcat && <Text style={styles.breadcrumbText}> • {subcat.name}</Text>}
            </View>
          )}
          <Text style={styles.title}>{listing.title}</Text>
          {listing.price != null && (
            <Text style={styles.price}>{listing.price} ج.س</Text>
          )}
          {listing.description ? <Text style={styles.desc}>{listing.description}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>معلومات التواصل</Text>
        <View style={styles.contactGrid}>
          {listing.phone ? (
            <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`tel:${listing.phone}`)}>
              <Icon name="Phone" size={20} color={colors.gold400} />
              <Text style={styles.contactLabel}>الهاتف</Text>
              <Text style={styles.contactValue}>{listing.phone}</Text>
            </Pressable>
          ) : null}
          {listing.business_phone ? (
            <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`tel:${listing.business_phone}`)}>
              <Icon name="Phone" size={20} color={colors.gold400} />
              <Text style={styles.contactLabel}>هاتف الشركة</Text>
              <Text style={styles.contactValue}>{listing.business_phone}</Text>
            </Pressable>
          ) : null}
          {listing.email_contact ? (
            <Pressable style={styles.contactCard} onPress={() => Linking.openURL(`mailto:${listing.email_contact}`)}>
              <Icon name="Mail" size={20} color={colors.gold400} />
              <Text style={styles.contactLabel}>البريد</Text>
              <Text style={styles.contactValue} numberOfLines={1}>{listing.email_contact}</Text>
            </Pressable>
          ) : null}
          {listing.location_text ? (
            <View style={styles.contactCard}>
              <Icon name="MapPin" size={20} color={colors.gold400} />
              <Text style={styles.contactLabel}>الموقع</Text>
              <Text style={styles.contactValue}>{listing.location_text}</Text>
            </View>
          ) : null}
        </View>

        {listing.lat != null && listing.lng != null && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>الموقع على الخريطة</Text>
            <MapPreview lat={listing.lat} lng={listing.lng} label={listing.location_text} />
          </View>
        )}

        {owner && (
          <View style={styles.ownerCard}>
            <View style={styles.ownerAvatar}>
              <Icon name={owner.account_type === 'business' ? 'Store' : owner.account_type === 'professional' ? 'HardHat' : 'User'} size={24} color={colors.gold400} />
            </View>
            <View>
              <Text style={styles.ownerName}>{owner.full_name}</Text>
              {owner.location_text ? <Text style={styles.ownerLoc}>{owner.location_text}</Text> : null}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: fontSizes.lg, color: colors.ink400 },
  backLink: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.bgInput },
  backLinkText: { color: colors.gold200, fontSize: fontSizes.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.gold100 },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  card: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20, gap: 8 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breadcrumbText: { fontSize: fontSizes.sm, color: colors.gold400 },
  title: { fontSize: fontSizes.xxl, fontWeight: '900', color: colors.gold50 },
  price: { fontSize: fontSizes.xl, color: colors.gold200, fontWeight: '700' },
  desc: { fontSize: fontSizes.md, color: colors.ink300, lineHeight: 24 },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.gold100 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  contactCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  contactLabel: { fontSize: fontSizes.xs, color: colors.ink500 },
  contactValue: { fontSize: fontSizes.sm, color: colors.gold100, fontWeight: '600', textAlign: 'center' },
  mapSection: { gap: 12 },
  ownerCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: 20 },
  ownerAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(212,160,23,0.1)', alignItems: 'center', justifyContent: 'center' },
  ownerName: { fontSize: fontSizes.lg, fontWeight: '700', color: colors.gold100 },
  ownerLoc: { fontSize: fontSizes.sm, color: colors.ink400, marginTop: 2 },
});
