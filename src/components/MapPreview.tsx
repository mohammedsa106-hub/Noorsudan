import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExternalLink, MapPin } from 'lucide-react';

const goldIcon = L.divIcon({
  className: 'gold-marker',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#F5D061,#D4A017);transform:rotate(-45deg);border:2px solid #0a0a0a;box-shadow:0 0 10px rgba(200,168,73,0.6);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function MapPreview({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current).setView([lat, lng], 15);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    L.marker([lat, lng], { icon: goldIcon }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng]);

  const openInGoogleMaps = () => {
    window.open(
      `https://www.google.com/maps?q=${lat},${lng}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-48 rounded-xl overflow-hidden border border-gold-400/20"
        style={{ background: '#0a0a0a' }}
      />
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-xs text-gold-200/60 flex items-center gap-1.5">
            <MapPin size={13} className="gold-text" /> {label}
          </span>
        )}
        <button
          onClick={openInGoogleMaps}
          className="btn-gold rounded-lg px-4 py-2 text-sm flex items-center gap-1.5 ml-auto"
        >
          <ExternalLink size={14} /> افتح في خرائط جوجل
        </button>
      </div>
    </div>
  );
}
