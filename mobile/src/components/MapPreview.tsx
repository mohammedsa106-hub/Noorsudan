import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from './Icon';

interface MapPreviewProps {
  lat: number;
  lng: number;
  label?: string;
}

export function MapPreview({ lat, lng, label }: MapPreviewProps) {
  const region: Region = {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const openGoogleMaps = () => {
    Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapWrap}>
        <MapView style={styles.map} initialRegion={region} scrollEnabled={false} zoomEnabled={false} rotateEnabled={false}>
          <Marker coordinate={{ latitude: lat, longitude: lng }} pinColor={colors.gold400} />
        </MapView>
      </View>
      {label && <Text style={styles.label}>{label}</Text>}
      <Pressable style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.85 : 1 }]} onPress={openGoogleMaps}>
        <Icon name="MapPinned" size={16} color={colors.black} />
        <Text style={styles.btnLabel}>افتح في خرائط جوجل</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  mapWrap: {
    height: 180,
    borderRadius: radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  map: { flex: 1 },
  label: { fontSize: fontSizes.sm, color: colors.gold100, textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.gold400,
    paddingVertical: 12,
    borderRadius: radii.md,
  },
  btnLabel: { fontSize: fontSizes.md, color: colors.black, fontWeight: '700' },
});
