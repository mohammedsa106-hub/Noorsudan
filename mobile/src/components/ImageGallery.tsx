import { useState, useCallback } from 'react';
import { View, Text, Pressable, FlatList, Modal, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'react-native';
import { colors, radii, fontSizes, spacing } from '@/lib/theme';
import { Icon } from './Icon';

const { width: SCREEN_W } = Dimensions.get('window');

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <View>
        <Pressable onPress={() => setLightbox(true)}>
          <Image source={{ uri: images[0] }} style={styles.singleImg} />
          <View style={styles.expandBtn}>
            <Icon name="Maximize" size={14} color={colors.white} />
          </View>
        </Pressable>
        <Lightbox images={images} visible={lightbox} onClose={() => setLightbox(false)} initialIdx={0} />
      </View>
    );
  }

  return (
    <View>
      <FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
          setActiveIdx(idx);
        }}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.mainImg} />
        )}
        keyExtractor={(_, i) => String(i)}
      />
      <Pressable style={styles.expandOverlay} onPress={() => setLightbox(true)}>
        <Icon name="Maximize" size={16} color={colors.white} />
      </Pressable>
      <View style={styles.dots}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIdx && styles.dotActive]} />
        ))}
      </View>
      <Lightbox images={images} visible={lightbox} onClose={() => setLightbox(false)} initialIdx={activeIdx} />
    </View>
  );
}

function Lightbox({
  images,
  visible,
  onClose,
  initialIdx,
}: {
  images: string[];
  visible: boolean;
  onClose: () => void;
  initialIdx: number;
}) {
  const [idx, setIdx] = useState(initialIdx);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lightboxBg}>
        <Pressable style={styles.lightboxClose} onPress={onClose}>
          <Icon name="X" size={24} color={colors.white} />
        </Pressable>
        <Image source={{ uri: images[idx] }} style={styles.lightboxImg} resizeMode="contain" />
        <View style={styles.lightboxNav}>
          <Pressable onPress={() => setIdx((p) => (p > 0 ? p - 1 : images.length - 1))}>
            <Icon name="ChevronRight" size={32} color={colors.gold200} />
          </Pressable>
          <Text style={styles.lightboxCounter}>
            {idx + 1} / {images.length}
          </Text>
          <Pressable onPress={() => setIdx((p) => (p < images.length - 1 ? p + 1 : 0))}>
            <Icon name="ChevronLeft" size={32} color={colors.gold200} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  singleImg: {
    width: '100%',
    height: 240,
    borderRadius: radii.md,
  resizeMode: 'cover',
  backgroundColor: colors.bgInput,
  overflow: 'hidden',
  position: 'relative',
  zIndex: 1,
  elevation: 1,
  shadowColor: '#000',
  shadowOpacity: 0.3,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  },
  expandBtn: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    elevation: 2,
  },
  mainImg: {
    width: SCREEN_W - 32,
    height: 260,
    resizeMode: 'cover',
    backgroundColor: colors.bgInput,
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.ink600 },
  dotActive: { backgroundColor: colors.gold400, width: 20 },
  lightboxBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImg: { width: '100%', height: '70%' },
  lightboxNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 40,
    marginTop: 20,
  },
  lightboxCounter: { fontSize: fontSizes.lg, color: colors.gold200, fontWeight: '700' },
});
