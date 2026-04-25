'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, LoadScript, Circle, Marker } from '@react-google-maps/api';

const BASE_LOCATION = { lat: 6.9271, lng: 79.8612 };
const MAX_RADIUS_KM = 7;
const MAX_RADIUS_METERS = MAX_RADIUS_KM * 1000;

interface LocationResult {
  lat: number;
  lng: number;
  isValid: boolean;
  distance: number;
}

interface LocationPickerProps {
  onLocationSelect: (result: LocationResult) => void;
  apiKey: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function LocationPicker({ onLocationSelect, apiKey }: LocationPickerProps) {
  const [selected, setSelected] = useState<{ lat: number; lng: number } | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [distance, setDistance] = useState(0);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      const dist = haversineDistance(BASE_LOCATION.lat, BASE_LOCATION.lng, lat, lng);
      const valid = dist <= MAX_RADIUS_KM;
      setSelected({ lat, lng });
      setDistance(dist);
      setIsValid(valid);
      onLocationSelect({ lat, lng, isValid: valid, distance: dist });
    },
    [onLocationSelect]
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        Click on the map to select your pickup location. Must be within {MAX_RADIUS_KM}km from our base.
      </div>

      <LoadScript googleMapsApiKey={apiKey}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '380px', borderRadius: '12px' }}
          center={BASE_LOCATION}
          zoom={12}
          onClick={handleMapClick}
        >
          <Marker position={BASE_LOCATION} title="Safari Base" />

          <Circle
            center={BASE_LOCATION}
            radius={MAX_RADIUS_METERS}
            options={{
              fillColor: '#22c55e',
              fillOpacity: 0.1,
              strokeColor: '#22c55e',
              strokeOpacity: 0.6,
              strokeWeight: 2,
            }}
          />

          {selected && (
            <Marker
              position={selected}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: isValid ? '#22c55e' : '#ef4444',
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#fff',
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {selected && (
        <div
          className={`p-4 rounded-lg border text-sm ${
            isValid ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {isValid ? (
            <>
              <p className="font-semibold">Valid pickup location</p>
              <p className="mt-1">Distance: {distance.toFixed(2)} km from base</p>
            </>
          ) : (
            <>
              <p className="font-semibold">Location too far</p>
              <p className="mt-1">
                {distance.toFixed(2)} km away — maximum is {MAX_RADIUS_KM} km. Please select a closer point.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
