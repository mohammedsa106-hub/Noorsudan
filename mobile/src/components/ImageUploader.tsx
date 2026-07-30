import { View, Text, Pressable, Image, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from './Icon';
import { supabase } from '@/lib/client';
import { STORAGE_BUCKET } from '@/lib/supabase';

export interface ImageItem {
  url: string;
  id?: string;
}

interface ImageUploaderProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const pickImages = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('تنبيه', 'لم يتم منح إذن الوصول إلى الصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: 8,
      });
      if (result.canceled) return;

      setUploading(true);
      const uploaded: ImageItem[] = [];
      for (const asset of result.assets) {
        const fileExt = asset.uri.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: `image/${fileExt}`,
        } as any);

        const { data, error } = await supabase.storage.from(STORAGE_BUCKET).upload(fileName, formData);
        if (error) continue;
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(data.path);
        uploaded.push({ url: pub.publicUrl });
      }
      onChange([...images, ...uploaded].slice(0, 8));
    } catch (e) {
      Alert.alert('خطأ', 'فشل رفع الصور');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <View>
      <View style={styles.grid}>
        {images.map((img, idx) => (
          <View key={idx} style={styles.thumb}>
            <Image source={{ uri: img.url }} style={styles.thumbImg} />
            <Pressable style={styles.removeBtn} onPress={() => removeImage(idx)}>
              <Icon name="X" size={12} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {images.length < 8 && (
          <Pressable style={styles.addBtn} onPress={pickImages} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator color={colors.gold200} />
            ) : (
              <>
                <Icon name="ImagePlus" size={24} color={colors.gold400} />
                <Text style={styles.addLabel}>إضافة صور</Text>
              </>
            )}
          </Pressable>
        )}
      </View>
      <Text style={styles.hint}>يمكنك إضافة حتى 8 صور (JPG/PNG)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumb: {
    width: 80,
    height: 80,
    borderRadius: radii.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 80,
    height: 80,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderActive,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: { fontSize: 10, color: colors.gold400 },
  hint: { fontSize: 11, color: colors.ink500, marginTop: 6 },
});
