import { View, Text, StyleSheet, Pressable, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { MapPreview } from '@/components/MapPreview';
import { useAuth } from '@/context/AuthContext';
import { ACCOUNT_TYPE_LABELS, type RootStackParamList } from '@/lib/supabase';

type ProfileNav = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
  const nav = useNavigation<ProfileNav>();
  const { profile, signOut } = useAuth();

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.emptyText}>يرجى تسجيل الدخول</Text>
          <Pressable style={styles.signInBtn} onPress={() => nav.navigate('Auth')}>
            <Text style={styles.signInText}>تسجيل الدخول</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const avatarIcon = profile.account_type === 'business' ? 'Store' : profile.account_type === 'professional' ? 'HardHat' : profile.account_type === 'admin' ? 'ShieldCheck' : 'User';

  const contactItems = [
    { label: 'الاسم', value: profile.full_name, icon: 'User', action: null },
    { label: 'النوع', value: ACCOUNT_TYPE_LABELS[profile.account_type], icon: 'Tag', action: null },
    { label: 'الهاتف', value: profile.phone, icon: 'Phone', action: profile.phone ? `tel:${profile.phone}` : null },
    { label: 'هاتف الشركة', value: profile.business_phone, icon: 'Phone', action: profile.business_phone ? `tel:${profile.business_phone}` : null },
    { label: 'البريد', value: profile.email_contact, icon: 'Mail', action: profile.email_contact ? `mailto:${profile.email_contact}` : null },
    { label: 'الموقع', value: profile.location_text, icon: 'MapPin', action: null },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable style={styles.backBtn} onPress={() => nav.goBack()}>
          <Icon name="ChevronLeft" size={22} color={colors.gold200} />
        </Pressable>
        <Text style={styles.topTitle}>الملف الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Icon name={avatarIcon} size={40} color={colors.gold400} />
          </View>
          <Text style={styles.name}>{profile.full_name}</Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{ACCOUNT_TYPE_LABELS[profile.account_type]}</Text>
          </View>
        </View>

        <View style={styles.contactList}>
          {contactItems.map((item) => (
            <Pressable
              key={item.label}
              style={styles.contactItem}
              onPress={() => item.action && Linking.openURL(item.action)}
              disabled={!item.action}
            >
              <View style={styles.contactIcon}>
                <Icon name={item.icon} size={18} color={colors.gold400} />
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue}>{item.value || 'غير محدد'}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        {profile.lat != null && profile.lng != null && (
          <View style={styles.mapSection}>
            <MapPreview lat={profile.lat} lng={profile.lng} label={profile.location_text} />
          </View>
        )}

        <View style={styles.quickLinks}>
          <Pressable style={styles.linkBtn} onPress={() => nav.navigate('Dashboard')}>
            <Icon name="Settings" size={18} color={colors.gold200} />
            <Text style={styles.linkText}>لوحة التحكم</Text>
            <Icon name="ChevronLeft" size={16} color={colors.gold400} />
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => nav.navigate('Help')}>
            <Icon name="HelpCircle" size={18} color={colors.gold200} />
            <Text style={styles.linkText}>المساعدة</Text>
            <Icon name="ChevronLeft" size={16} color={colors.gold400} />
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => nav.navigate('Settings')}>
            <Icon name="Settings" size={18} color={colors.gold200} />
            <Text style={styles.linkText}>الإعدادات</Text>
            <Icon name="ChevronLeft" size={16} color={colors.gold400} />
          </Pressable>
        </View>

        <Pressable style={styles.signOutBtn} onPress={async () => { await signOut(); nav.reset({ routes: [{ name: 'Auth' }] }); }}>
          <Icon name="LogOut" size={18} color={colors.error} />
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  emptyText: { fontSize: fontSizes.lg, color: colors.ink400 },
  signInBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: radii.md, backgroundColor: colors.gold400 },
  signInText: { color: colors.black, fontWeight: '700', fontSize: fontSizes.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgInput, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: fontSizes.xl, fontWeight: '800', color: colors.gold100 },
  scroll: { padding: 16, paddingBottom: 60, gap: 16 },
  profileCard: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(212,160,23,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: fontSizes.xxl, fontWeight: '800', color: colors.gold100 },
  typeBadge: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 4, borderRadius: radii.full, backgroundColor: 'rgba(212,160,23,0.15)' },
  typeText: { fontSize: fontSizes.sm, color: colors.gold300, fontWeight: '600' },
  contactList: { gap: 8 },
  contactItem: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(212,160,23,0.08)', alignItems: 'center', justifyContent: 'center' },
  contactContent: { flex: 1 },
  contactLabel: { fontSize: fontSizes.xs, color: colors.ink500 },
  contactValue: { fontSize: fontSizes.md, color: colors.gold100, marginTop: 2 },
  mapSection: { gap: 8 },
  quickLinks: { gap: 8 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  linkText: { flex: 1, fontSize: fontSizes.md, color: colors.gold200, fontWeight: '600' },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderWidth: 1, borderColor: colors.error, borderRadius: radii.md, marginTop: 8 },
  signOutText: { fontSize: fontSizes.md, color: colors.error, fontWeight: '700' },
});
