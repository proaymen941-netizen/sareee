import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ExistingZone } from './GeoZoneMapEditor';

// Fix leaflet icon default assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const testPinIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#ef4444" stroke="#ffffff" stroke-width="2">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#ffffff"/>
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const storePinIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#10b981" stroke="#ffffff" stroke-width="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  `),
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const ZONE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#e11d48'];

interface GeoZoneOverviewMapProps {
  zones: ExistingZone[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  testLocation?: { lat: number; lng: number } | null;
  storeLocation?: { lat: number; lng: number } | null;
  onMapClick?: (lat: number, lng: number) => void;
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lng: number) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onMapClick) return;
    const clickHandler = (e: L.LeafletMouseEvent) => {
      onMapClick(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    };
    map.on('click', clickHandler);
    return () => {
      map.off('click', clickHandler);
    };
  }, [map, onMapClick]);
  return null;
}

function ViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function GeoZoneOverviewMap({
  zones,
  center = [15.3550, 44.2080],
  zoom = 12,
  height = '380px',
  testLocation,
  storeLocation,
  onMapClick
}: GeoZoneOverviewMapProps) {
  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ViewUpdater center={center} zoom={zoom} />
        <MapEvents onMapClick={onMapClick} />

        {/* Store Marker if provided */}
        {storeLocation && (
          <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storePinIcon}>
            <Popup>
              <div className="text-right p-1" dir="rtl">
                <span className="font-bold text-emerald-600 block">المتجر الرئيسي</span>
                <span className="text-xs text-muted-foreground">نقطة انطلاق التوصيل</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Test Location Pin if provided */}
        {testLocation && (
          <Marker position={[testLocation.lat, testLocation.lng]} icon={testPinIcon}>
            <Popup>
              <div className="text-right p-1" dir="rtl">
                <span className="font-bold text-rose-600 block">موقع العميل التجريبي</span>
                <span className="text-xs text-muted-foreground">{testLocation.lat}, {testLocation.lng}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Existing Zones */}
        {zones.map((zone, idx) => {
          try {
            const data = JSON.parse(zone.coordinates);
            const color = ZONE_COLORS[idx % ZONE_COLORS.length];
            const surge = zone.surgeMultiplier && parseFloat(zone.surgeMultiplier) > 1 
              ? ` (معامل زيادة: ×${zone.surgeMultiplier})` 
              : '';

            if (data && (data.type === 'circle' || data.center)) {
              const c = data.center || { lat: data.lat, lng: data.lng };
              const r = (data.radiusKm || 5) * 1000;
              return (
                <Circle
                  key={zone.id}
                  center={[c.lat, c.lng]}
                  radius={r}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: zone.isActive === false ? 0.08 : 0.22,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-1 text-right" dir="rtl">
                      <strong className="block font-bold text-sm text-foreground">{zone.name}</strong>
                      {zone.description && <p className="text-xs text-muted-foreground mt-0.5">{zone.description}</p>}
                      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs bg-muted/50 p-1.5 rounded">
                        <span className="font-semibold text-primary">الرسوم: {zone.deliveryFee || 0} ريال</span>
                        {surge && <span className="text-amber-600 font-medium">{surge}</span>}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        نصف القطر: {data.radiusKm || 5} كم
                      </div>
                    </div>
                  </Popup>
                </Circle>
              );
            } else if (Array.isArray(data) && data.length >= 3) {
              const positions: [number, number][] = data.map(p => [p.lat, p.lng]);
              return (
                <Polygon
                  key={zone.id}
                  positions={positions}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: zone.isActive === false ? 0.08 : 0.22,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-1 text-right" dir="rtl">
                      <strong className="block font-bold text-sm text-foreground">{zone.name}</strong>
                      {zone.description && <p className="text-xs text-muted-foreground mt-0.5">{zone.description}</p>}
                      <div className="mt-1.5 flex items-center justify-between gap-3 text-xs bg-muted/50 p-1.5 rounded">
                        <span className="font-semibold text-primary">الرسوم: {zone.deliveryFee || 0} ريال</span>
                        {surge && <span className="text-amber-600 font-medium">{surge}</span>}
                      </div>
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        مضلع حدودي: {data.length} نقاط
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            }
          } catch (e) {
            return null;
          }
          return null;
        })}
      </MapContainer>
    </div>
  );
}
