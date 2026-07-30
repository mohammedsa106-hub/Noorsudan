import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { colors, radii, fontSizes } from '@/lib/theme';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function Button({ label, onPress, variant = 'gold', loading, disabled, style, icon }: ButtonProps) {
  const bg =
    variant === 'gold'
      ? colors.gold400
      : variant === 'danger'
        ? colors.error
        : 'transparent';
  const fg = variant === 'gold' ? colors.black : variant === 'danger' ? colors.white : colors.gold200;
  const border = variant === 'outline' ? colors.borderActive : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.85 : disabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { color: fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
