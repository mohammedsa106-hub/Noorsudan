import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import type { RootStackParamList } from '@/lib/supabase';

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export function SettingsScreen() {
  const nav = useNavigation<SettingsNav>();
  const [notif1, setNotif1] = useState(true);
  const [notif2, setNotif2] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>الإشعارات</Text>
        <ToggleRow label="إشعارات الإعلانات الجديدة" value={notif1} onChange={setNotif1} />
        <ToggleRow label="إشعارات الرسائل" value={notif2} onChange={setNotif2} />

        <Text style={styles.sectionTitle}>المظهر</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>الوضع الليلي</Text>
          <Text style={styles.rowHint}>مفعّل دائماً</Text>
        </View>

        <Text style={styles.sectionTitle}>حول التطبيق</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>الإصدار</Text>
          <Text style={styles.rowHint}>1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Pressable
        style={[styles.toggle, value ? styles.toggleOn : styles.toggleOff]}
        onPress={() => onChange(!value)}
      >
        <View style={[styles.toggleKnob, value ? styles.toggleKnobOn : styles.toggleKnobOff]} />
      </Pressable>
    </View>
  );
}

export function HelpScreen() {
  const nav = useNavigation<SettingsNav>();
  const faqs = [
    { q: 'كيف أضيف إعلاناً؟', a: 'ادخل إلى التصنيف المناسب ثم اضغط على زر "إضافة إعلان". تحتاج إلى حساب مهني أو أعمال.' },
    { q: 'كيف أبحث عن خدمة؟', a: 'استخدم المساعد الذكي "اسأل نور" أو تصفح التصنيفات من الصفحة الرئيسية.' },
    { q: 'كيف أحدد موقعي الجغرافي؟', a: 'عند إضافة إعلان أو تعديل بياناتك، استخدم الخريطة أو زر "موضعي" لتحديد موقعك بدقة.' },
    { q: 'كيف أصبح مشرفاً؟', a: 'المشرفون يتم تعيينهم من قبل إدارة التطبيق. تواصل مع الدعم.' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle}>المساعدة</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {faqs.map((faq, i) => (
          <View key={i} style={styles.faqCard}>
            <View style={styles.faqQ}>
              <Icon name="HelpCircle" size={18} color={colors.gold400} />
              <Text style={styles.faqQText}>{faq.q}</Text>
            </View>
            <Text style={styles.faqA}>{faq.a}</Text>
          </View>
        ))}

        <Pressable style={styles.supportBtn} onPress={() => {}}>
          <Icon name="Mail" size={18} color={colors.gold200} />
          <Text style={styles.supportText}>تواصل مع الدعم</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  scroll: { padding: 16, paddingBottom: 60, gap: 8 },
  sectionTitle: { fontSize: fontSizes.lg, fontWeight: '800', color: colors.gold100, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  rowLabel: { fontSize: fontSizes.md, color: colors.gold200 },
  rowHint: { fontSize: fontSizes.sm, color: colors.ink500 },
  toggle: { width: 48, height: 28, borderRadius: 14, padding: 2, justifyContent: 'center' },
  toggleOn: { backgroundColor: colors.gold400 },
  toggleOff: { backgroundColor: colors.ink700 },
  toggleKnob: { width: 24, height: 24, borderRadius: 12 },
  toggleKnobOn: { backgroundColor: colors.black, alignSelf: 'flex-end' },
  toggleKnobOff: { backgroundColor: colors.ink400 },
  faqCard: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: 16, marginBottom: 8 },
  faqQ: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  faqQText: { fontSize: fontSizes.md, fontWeight: '700', color: colors.gold100, flex: 1 },
  faqA: { fontSize: fontSizes.sm, color: colors.ink400, lineHeight: 22 },
  supportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderWidth: 1, borderColor: colors.borderActive, borderRadius: radii.md, marginTop: 16 },
  supportText: { fontSize: fontSizes.md, color: colors.gold200, fontWeight: '600' },
});
