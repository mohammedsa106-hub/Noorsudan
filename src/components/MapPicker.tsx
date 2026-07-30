import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, MapPin } from 'lucide-react';

const goldIcon = L.divIcon({
  className: 'gold-marker',
  html: `<div style="width:32px;height:32px;border-radius:50% 50% 50% 0;background:linear-gradient(135deg,#F5D061,#D4A017);transform:rotate(-45deg);border:2px solid #0a0a0a;box-shadow:0 0 12px rgba(200,168,73,0.6);display:flex;align-items:center;justify-content:center;"><span style="transform:rotate(45deg);font-size:16px;">📍</span></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const DEFAULT_CENTER: [number, number] = [15.5007, 32.5599]; // Khartoum

export function MapPicker({
  lat,
  lng,
  onChange,
}: {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const center: [number, number] =
      lat && lng ? [parseFloat(lat), parseFloat(lng)] : DEFAULT_CENTER;

    const map = L.map(containerRef.current).setView(center, 13);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);

    if (lat && lng) {
      markerRef.current = L.marker([parseFloat(lat), parseFloat(lng)], {
        icon: goldIcon,
      }).addTo(map);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickedLat, lng: clickedLng } = e.latlng;
      onChange(clickedLat.toFixed(6), clickedLng.toFixed(6));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (lat && lng) {
      const pos: [number, number] = [parseFloat(lat), parseFloat(lng)];
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        markerRef.current = L.marker(pos, { icon: goldIcon }).addTo(map);
      }
      map.setView(pos, map.getZoom());
    }
  }, [lat, lng]);

  const useGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      onChange(pos.coords.latitude.toFixed(6), pos.coords.longitude.toFixed(6));
    });
  };

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className="w-full h-56 rounded-xl overflow-hidden border border-gold-400/20"
        style={{ background: '#0a0a0a' }}
      />
      <div className="flex gap-2">
        <input
          value={lat}
          onChange={(e) => onChange(e.target.value, lng)}
          placeholder="خط العرض"
          className="input-dark flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <input
          value={lng}
          onChange={(e) => onChange(lat, e.target.value)}
          placeholder="خط الطول"
          className="input-dark flex-1 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={useGps}
          className="btn-gold rounded-lg px-4 py-2 text-sm whitespace-nowrap flex items-center gap-1.5"
        >
          <Navigation size={14} /> موضعي
        </button>
      </div>
      <p className="text-xs text-gold-200/40 flex items-center gap-1">
        <MapPin size={12} className="gold-text" /> اضغط على الخريطة لتحديد الموقع بدقة
      </p>
    </div>
  );
}
