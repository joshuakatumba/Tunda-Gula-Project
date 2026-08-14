/**
 * FarmMap.tsx
 * Lightweight Leaflet map showing seller farm pins.
 * Used in AdminDelivery.tsx to see verified farmer locations.
 *
 * Requires: npm install leaflet react-leaflet @types/leaflet
 */
import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default icon paths broken by bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface FarmPin {
  id: number | string;
  name: string;
  district: string;
  lat: number;
  lng: number;
  is_verified: boolean;
}

interface FarmMapProps {
  pins: FarmPin[];
  height?: number;
}

export function FarmMap({ pins, height = 400 }: FarmMapProps) {
  // Default centre: Uganda
  const centre: [number, number] = [1.3733, 32.2903];

  const validPins = pins.filter(p => p.lat && p.lng);

  return (
    <MapContainer
      center={centre}
      zoom={7}
      style={{ height, width: "100%", borderRadius: 8, border: "1px solid var(--line)" }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validPins.map(pin => (
        <Marker key={pin.id} position={[pin.lat, pin.lng]}>
          <Popup>
            <strong>{pin.name}</strong><br />
            {pin.district} district<br />
            {pin.is_verified ? "Verified" : "Pending verification"}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
