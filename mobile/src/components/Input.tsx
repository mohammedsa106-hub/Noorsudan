import { TextInput, View, Text, StyleSheet } from 'react-native';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from './Icon';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: string;
  required?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  secureTextEntry?: boolean;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  required,
  multiline,
  numberOfLines,
  keyboardType = 'default',
  secureTextEntry,
}: InputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {icon && <Icon name={icon} size={14} color={colors.gold300} />}
          {'  '}
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.ink500}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        style={[styles.input, multiline && styles.multiline]}
        textAlign="right"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  label: {
    fontSize: fontSizes.sm,
    color: colors.gold100,
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.bgInput,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: fontSizes.md,
    color: colors.ink100,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
