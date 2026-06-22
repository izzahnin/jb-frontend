'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet icon paths broken by webpack
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

type LatLon = [number, number];

type LeafletMapProps = {
  center: LatLon;
  history: LatLon[];
  latestTimestamp?: string;
};

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

export default function LeafletMap({ center, history, latestTimestamp }: LeafletMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '400px', width: '100%' }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />
      <MapResizer />
      {history.length > 1 && (
        <Polyline positions={history} color="#3b82f6" weight={3} opacity={0.7} />
      )}
      <Marker position={center}>
        <Popup>
          <div className="text-xs">
            <p className="font-semibold">Posisi Terakhir</p>
            <p>{center[0].toFixed(6)}, {center[1].toFixed(6)}</p>
            {latestTimestamp && <p className="text-gray-500 mt-1">{latestTimestamp}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
