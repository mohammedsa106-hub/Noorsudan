import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from './Icon';

const DEFAULT_REGION: Region = {
  latitude: 15.5007,
  longitude: 32.5599,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

interface MapPickerProps {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

export function MapPicker({ lat, lng, onChange }: MapPickerProps) {
  const hasCoords = lat && lng;
  const region: Region = hasCoords
    ? { latitude: parseFloat(lat), longitude: parseFloat(lng), latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : DEFAULT_REGION;

  const useGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'لم يتم منح إذن الوصول إلى الموقع');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      onChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
    } catch {
      Alert.alert('خطأ', 'تعذر الحصول على الموقع');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onPress={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onChange(latitude.toFixed(6), longitude.toFixed(6));
          }}
        >
          {hasCoords && (
            <Marker
              coordinate={{ latitude: parseFloat(lat), longitude: parseFloat(lng) }}
              pinColor={colors.gold400}
            />
          )}
        </MapView>
      </View>
      <View style={styles.row}>
        <View style={styles.coordBox}>
          <Text style={styles.coordLabel}>خط العرض</Text>
          <Text style={styles.coordVal}>{lat || '—'}</Text>
        </View>
        <View style={styles.coordBox}>
          <Text style={styles.coordLabel}>خط الطول</Text>
          <Text style={styles.coordVal}>{lng || '—'}</Text>
        </View>
        <Pressable style={styles.gpsBtn} onPress={useGps}>
          <Icon name="Navigation" size={16} color={colors.black} />
          <Text style={styles.gpsLabel}>موضعي</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>
        <Icon name="MapPin" size={12} color={colors.gold400} /> اضغط على الخريطة لتحديد الموقع
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  mapWrap: {
    height: 220,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  coordBox: {
    flex: 1,
    backgroundColor: colors.bgInput,
    borderRadius: radii.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coordLabel: { fontSize: 11, color: colors.ink500, textAlign: 'center' },
  coordVal: { fontSize: fontSizes.sm, color: colors.gold100, textAlign: 'center', marginTop: 2 },
  gpsBtn: {
    backgroundColor: colors.gold400,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  gpsLabel: { fontSize: fontSizes.sm, color: colors.black, fontWeight: '700' },
  hint: { fontSize: 11, color: colors.ink500 },
});
