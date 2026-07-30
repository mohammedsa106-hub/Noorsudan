import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { supabase } from '@/lib/client';
import { useAuth } from '@/context/AuthContext';
import type { RootStackParamList, AccountType } from '@/lib/supabase';

type AuthNav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

export function AuthScreen() {
  const nav = useNavigation<AuthNav>();
  const { refreshProfile } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [otp, setOtp] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const isEmail = identifier.includes('@');
  const email = isEmail ? identifier : `${identifier}@phone.nour.sd`;

  const handleSignIn = async () => {
    if (!identifier || !password) return Alert.alert('تنبيه', 'أدخل البريد/الهاتف وكلمة المرور');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
    await refreshProfile();
    nav.reset({ routes: [{ name: 'Home' }] });
  };

  const handleSignUp = async () => {
    if (!identifier || !password || !fullName) return Alert.alert('تنبيه', 'أكمل جميع الحقول');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, account_type: accountType } },
    });
    if (error) {
      setLoading(false);
      return Alert.alert('خطأ', error.message);
    }
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        account_type: accountType,
        phone: isEmail ? '' : identifier,
        email_contact: isEmail ? identifier : '',
      });
    }
    setLoading(false);
    setStep('otp');
  };

  const handleOtp = async () => {
    if (otp !== '123456') return Alert.alert('خطأ', 'رمز التحقق غير صحيح');
    await refreshProfile();
    nav.reset({ routes: [{ name: 'Home' }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.logo}>
            <Icon name="Sparkles" size={48} color={colors.gold400} />
            <Text style={styles.logoText}>نور السودان</Text>
            <Text style={styles.tagline}>اسأل نور... وحياتك أسهل</Text>
          </View>

          <View style={styles.tabs}>
            <Pressable
              style={[styles.tab, mode === 'signin' && styles.tabActive]}
              onPress={() => { setMode('signin'); setStep('form'); }}
            >
              <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>تسجيل الدخول</Text>
            </Pressable>
            <Pressable
              style={[styles.tab, mode === 'signup' && styles.tabActive]}
              onPress={() => { setMode('signup'); setStep('form'); }}
            >
              <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>حساب جديد</Text>
            </Pressable>
          </View>

          {step === 'form' ? (
            <View style={styles.form}>
              {mode === 'signup' && (
                <>
                  <Input label="الاسم الكامل" value={fullName} onChangeText={setFullName} icon="User" placeholder="اسمك الكامل" required />
                  <Text style={styles.fieldLabel}>نوع الحساب</Text>
                  <View style={styles.typeRow}>
                    {([
                      { key: 'individual', label: 'فردي', icon: 'User' },
                      { key: 'business', label: 'أعمال', icon: 'Store' },
                      { key: 'professional', label: 'مهني', icon: 'HardHat' },
                    ] as const).map((t) => (
                      <Pressable
                        key={t.key}
                        style={[styles.typeBtn, accountType === t.key && styles.typeBtnActive]}
                        onPress={() => setAccountType(t.key)}
                      >
                        <Icon name={t.icon} size={20} color={accountType === t.key ? colors.black : colors.gold400} />
                        <Text style={[styles.typeLabel, accountType === t.key && styles.typeLabelActive]}>{t.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </>
              )}
              <Input label="البريد الإلكتروني أو الهاتف" value={identifier} onChangeText={setIdentifier} icon="Mail" placeholder="email@example.com أو رقم الهاتف" required />
              <View>
                <Input label="كلمة المرور" value={password} onChangeText={setPassword} icon="Lock" placeholder="••••••••" secureTextEntry={!showPw} required />
                <Pressable style={styles.showPw} onPress={() => setShowPw(!showPw)}>
                  <Icon name={showPw ? 'EyeOff' : 'Eye'} size={16} color={colors.gold300} />
                </Pressable>
              </View>
              <Button label={mode === 'signin' ? 'دخول' : 'إنشاء حساب'} onPress={mode === 'signin' ? handleSignIn : handleSignUp} loading={loading} />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.otpHint}>أدخل رمز التحقق (123456)</Text>
              <Input label="رمز التحقق" value={otp} onChangeText={setOtp} placeholder="123456" keyboardType="numeric" />
              <Button label="تأكيد" onPress={handleOtp} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.xl, flexGrow: 1 },
  logo: { alignItems: 'center', marginVertical: spacing.xxxl },
  logoText: { fontSize: fontSizes.xxxl, fontWeight: '900', color: colors.gold200, marginTop: 8 },
  tagline: { fontSize: fontSizes.md, color: colors.ink400, marginTop: 4 },
  tabs: { flexDirection: 'row', backgroundColor: colors.bgInput, borderRadius: radii.md, padding: 4, marginBottom: spacing.xl },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: radii.sm },
  tabActive: { backgroundColor: colors.gold400 },
  tabText: { fontSize: fontSizes.md, color: colors.ink400, fontWeight: '600' },
  tabTextActive: { color: colors.black },
  form: { gap: spacing.sm },
  fieldLabel: { fontSize: fontSizes.sm, color: colors.gold100, marginBottom: 8, fontWeight: '600' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: spacing.md },
  typeBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgInput,
  },
  typeBtnActive: { borderColor: colors.gold400, backgroundColor: colors.gold400 },
  typeLabel: { fontSize: fontSizes.sm, color: colors.gold200, fontWeight: '600' },
  typeLabelActive: { color: colors.black },
  showPw: { position: 'absolute', left: 16, bottom: 28, zIndex: 1 },
  otpHint: { fontSize: fontSizes.md, color: colors.gold100, textAlign: 'center', marginBottom: spacing.md },
});
