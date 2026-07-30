import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { supabase } from '@/lib/client';
import { useAuth } from '@/context/AuthContext';
import { useAskNour } from '@/context/AskNourContext';
import { FALLBACK_CATEGORIES, QUICK_PROMPTS, type Category, type RootStackParamList } from '@/lib/supabase';

type HomeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export function HomeScreen() {
  const nav = useNavigation<HomeNav>();
  const { profile } = useAuth();
  const { openAsk } = useAskNour();
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('categories')
        .select('*')
        .order('sort_order')
        .then(({ data }) => {
          if (data && data.length > 0) setCategories(data as Category[]);
        });
    }, [])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerLogo}>
            <Icon name="Sparkles" size={24} color={colors.gold400} />
            <Text style={styles.headerTitle}>نور السودان</Text>
          </View>
          <Pressable
            style={styles.profileBtn}
            onPress={() => nav.navigate(profile ? 'Profile' : 'Auth')}
          >
            <Icon name={profile ? 'User' : 'LogOut'} size={20} color={colors.gold200} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>دليل الخدمات والأعمال الأول في السودان</Text>
          </View>
          <Text style={styles.heroTitle}>اسأل نور... وحياتك أسهل</Text>
          <Text style={styles.heroSub}>
            منصة متكاملة للبحث عن الخدمات والأعمال في كل السودان
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.askCard, pressed && { opacity: 0.9 }]}
          onPress={() => openAsk()}
        >
          <View style={styles.askIcon}>
            <Icon name="MessageCircle" size={28} color={colors.gold400} />
          </View>
          <View style={styles.askBody}>
            <Text style={styles.askTitle}>اسأل نور</Text>
            <Text style={styles.askDesc}>مساعد ذكي يساعدك في إيجاد الخدمة المناسبة</Text>
          </View>
          <Icon name="ChevronLeft" size={20} color={colors.gold400} />
        </Pressable>

        <View style={styles.quickPrompts}>
          {QUICK_PROMPTS.map((q) => (
            <Pressable key={q} style={styles.chip} onPress={() => openAsk(q)}>
              <Text style={styles.chipText}>{q}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.sectionTitle}>التصنيفات</Text>
        <View style={styles.grid}>
          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={({ pressed }) => [styles.catCard, pressed && { opacity: 0.85 }]}
              onPress={() => nav.navigate('Category', { slug: cat.slug, name: cat.name })}
            >
              <View style={styles.catIcon}>
                <Icon name={cat.icon} size={28} color={colors.gold400} />
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>نور السودان © 2026</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: fontSizes.xl, fontWeight: '900', color: colors.gold200 },
  profileBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { alignItems: 'center', marginBottom: spacing.xxl },
  badge: {
    backgroundColor: 'rgba(212,160,23,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.full,
    marginBottom: 16,
  },
  badgeText: { fontSize: fontSizes.sm, color: colors.gold300, fontWeight: '600' },
  heroTitle: { fontSize: fontSizes.display, fontWeight: '900', color: colors.gold100, textAlign: 'center' },
  heroSub: { fontSize: fontSizes.md, color: colors.ink400, textAlign: 'center', marginTop: 8 },
  askCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: spacing.lg,
  },
  askIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,160,23,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askBody: { flex: 1 },
  askTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  askDesc: { fontSize: fontSizes.sm, color: colors.ink400, marginTop: 4 },
  quickPrompts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.xxl },
  chip: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: fontSizes.sm, color: colors.gold200 },
  sectionTitle: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.gold100, marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '47%',
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  catIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(212,160,23,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: { fontSize: fontSizes.md, fontWeight: '700', color: colors.ink100, textAlign: 'center' },
  footer: { alignItems: 'center', paddingVertical: spacing.xxl },
  footerText: { fontSize: fontSizes.sm, color: colors.ink600 },
});
