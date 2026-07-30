import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Expand } from 'lucide-react';

export function ImageGallery({
  images,
  title,
}: {
  images: string[];
  title?: string;
}) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const next = useCallback(() => {
    setCurrent((c) => (c + 1) % images.length);
  }, [images.length]);

  const prev = useCallback(() => {
    setCurrent((c) => (c - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') next();
      if (e.key === 'ArrowRight') prev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, next, prev]);

  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 bg-ink-600">
        <img
          src={images[0]}
          alt={title || ''}
          className="w-full h-full object-cover"
        />
        <button
          onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/50 flex items-center justify-center text-gold-100 hover:bg-black/70 transition-all"
        >
          <Expand size={18} />
        </button>
        {lightbox && (
          <Lightbox
            images={images}
            current={current}
            title={title}
            onClose={() => setLightbox(false)}
            onPrev={prev}
            onNext={next}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 bg-ink-600 group">
        <img
          src={images[current]}
          alt={title || ''}
          className="w-full h-full object-cover transition-transform duration-300"
        />
        <button
          onClick={prev}
          className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-gold-100 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={22} />
        </button>
        <button
          onClick={next}
          className="absolute top-1/2 left-2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-gold-100 hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => setLightbox(true)}
          className="absolute top-3 right-3 w-9 h-9 rounded-lg bg-black/50 flex items-center justify-center text-gold-100 hover:bg-black/70 transition-all"
        >
          <Expand size={18} />
        </button>
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? 'w-6 bg-gold-400' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
              i === current
                ? 'border-gold-400'
                : 'border-transparent opacity-60 hover:opacity-100'
            }`}
          >
            <img src={url} alt="" className="w-full h-full object-cover" />
          </button>
        ))}
      </div>

      {lightbox && (
        <Lightbox
          images={images}
          current={current}
          title={title}
          onClose={() => setLightbox(false)}
          onPrev={prev}
          onNext={next}
        />
      )}
    </div>
  );
}

function Lightbox({
  images,
  current,
  title,
  onClose,
  onPrev,
  onNext,
}: {
  images: string[];
  current: number;
  title?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
      >
        <X size={22} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute top-1/2 right-4 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
      >
        <ChevronRight size={26} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute top-1/2 left-4 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
      >
        <ChevronLeft size={26} />
      </button>
      <img
        src={images[current]}
        alt={title || ''}
        className="max-w-full max-h-full object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
        {current + 1} / {images.length}
      </div>
    </div>
  );
}
