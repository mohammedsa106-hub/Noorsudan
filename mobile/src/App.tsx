import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Pressable } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AskNourProvider, useAskNour } from '@/context/AskNourContext';
import { colors } from '@/lib/theme';
import { Icon } from '@/components/Icon';
import { AskNourModal } from '@/components/AskNourModal';
import { HomeScreen } from '@/screens/HomeScreen';
import { AuthScreen } from '@/screens/AuthScreen';
import { CategoryScreen } from '@/screens/CategoryScreen';
import { ListingDetailScreen } from '@/screens/ListingDetailScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { SettingsScreen, HelpScreen } from '@/screens/SettingsHelpScreens';
import type { RootStackParamList } from '@/lib/supabase';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgCard,
    text: colors.gold100,
    border: colors.border,
    primary: colors.gold400,
  },
};

function FloatingAskButton() {
  const { openAsk } = useAskNour();
  return (
    <Pressable style={styles.fab} onPress={() => openAsk()}>
      <Icon name="Sparkles" size={24} color={colors.gold400} />
    </Pressable>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const initialRoute = user ? 'Home' : 'Auth';

  return (
    <>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Category" component={CategoryScreen} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Help" component={HelpScreen} />
        <Stack.Screen name="Admin" component={AdminPlaceholder} />
      </Stack.Navigator>
      {user && <FloatingAskButton />}
      <AskNourModal />
    </>
  );
}

function AdminPlaceholder() {
  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AskNourProvider>
          <NavigationContainer theme={navTheme}>
            <AppRoutes />
          </NavigationContainer>
          <StatusBar style="light" backgroundColor={colors.bg} />
        </AskNourProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.borderActive,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.gold400,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
  },
});
