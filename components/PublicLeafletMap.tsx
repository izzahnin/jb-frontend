'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type LatLon = [number, number];

function RecenterMap({ center }: { center: LatLon }) {
  const map = useMap();
  useEffect(() => { map.setView(center, map.getZoom()); }, [center, map]);
  return null;
}

function MapResizer() {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
}

type PublicLeafletMapProps = {
  center: LatLon;
  history?: LatLon[];
  timestamp?: string;
};

export default function PublicLeafletMap({ center, history = [], timestamp }: PublicLeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '250px', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <MapResizer />
      {history.length > 1 && (
        <Polyline positions={history} pathOptions={{ color: '#3b82f6', weight: 3, opacity: 0.8 }} />
      )}
      <Marker position={center}>
        <Popup>
          <div className="text-xs">
            <p className="font-semibold">Posisi Truk</p>
            <p>{center[0].toFixed(6)}, {center[1].toFixed(6)}</p>
            {timestamp && <p className="text-gray-500 mt-1">{timestamp}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
