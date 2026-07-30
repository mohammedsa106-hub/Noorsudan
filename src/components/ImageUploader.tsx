import { useState, useRef } from 'react';
import { Upload, X, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface ImageItem {
  url: string;
  id?: string;
}

export function ImageUploader({
  images,
  onChange,
}: {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFiles = async (files: FileList) => {
    setUploading(true);
    const newImages: ImageItem[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage
        .from('listing-images')
        .upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('listing-images').getPublicUrl(path);
        newImages.push({ url: data.publicUrl });
      }
    }
    onChange([...images, ...newImages]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onChange([...images, { url: urlInput.trim() }]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  const removeImage = (index: number) => {
    onChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative w-20 h-20 rounded-xl overflow-hidden border border-gold-400/20 group"
          >
            <img
              src={img.url}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => (e.currentTarget.style.opacity = '0.3')}
            />
            <button
              type="button"
              onClick={() => removeImage(i)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-red-400 hover:bg-red-500/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-gold-400/30 flex flex-col items-center justify-center gap-1 text-gold-200/50 hover:border-gold-400/60 hover:text-gold-200 transition-all disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-[10px]">جاري...</span>
          ) : (
            <>
              <Upload size={18} />
              <span className="text-[10px]">رفع صورة</span>
            </>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {showUrlInput ? (
        <div className="flex gap-2">
          <input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="رابط الصورة (https://...)"
            className="input-dark flex-1 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addUrl}
            className="btn-gold rounded-lg px-4 py-2 text-sm"
          >
            إضافة
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowUrlInput(true)}
          className="text-xs text-gold-200/50 hover:text-gold-200 flex items-center gap-1.5 transition-colors"
        >
          <LinkIcon size={12} /> أو أضف رابط صورة
        </button>
      )}

      {images.length === 0 && !uploading && (
        <p className="text-xs text-gold-200/40 flex items-center gap-1.5">
          <ImageIcon size={12} className="gold-text" /> يمكنك إضافة حتى 8 صور لإعلانك
        </p>
      )}
    </div>
  );
}
