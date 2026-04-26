'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// Defaults match backend env BASE_LAT / BASE_LNG
const BASE = { lat: 6.9271, lng: 79.8612 };
const MAX_KM = 7;

const PICKUP_TIMES = [
  '5:30 AM', '5:45 AM', '6:00 AM',
  '6:15 AM', '6:30 AM',
  '11:30 AM', '11:45 AM', '12:00 PM',
];

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface PickupResult {
  lat: number;
  lng: number;
  address: string;
  time: string;
  isValid: boolean;
  distance: number;
}

interface PickupSelectorProps {
  onSelect: (result: PickupResult) => void;
  initialTime?: string;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export function PickupSelector({ onSelect, initialTime = '5:45 AM' }: PickupSelectorProps) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const pinRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);
  const [distance, setDistance] = useState(0);
  const [isValid, setIsValid] = useState(false);
  const [address, setAddress] = useState('');
  const [pickupTime, setPickupTime] = useState(initialTime);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Initialise leaflet map once on mount
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;

    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !mapDivRef.current || mapRef.current) return;

      // Fix webpack-broken default icon URLs
      (L.Icon.Default.prototype as any)._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });

      const map = L.map(mapDivRef.current!, { zoomControl: true }).setView(
        [BASE.lat, BASE.lng],
        13,
      );
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Base marker (blue default)
      L.marker([BASE.lat, BASE.lng])
        .bindPopup('<b>Safari Base</b><br>7 km pickup radius from here')
        .addTo(map);

      // 7 km radius circle
      L.circle([BASE.lat, BASE.lng], {
        radius: MAX_KM * 1000,
        color: '#22c55e',
        fillColor: '#22c55e',
        fillOpacity: 0.07,
        weight: 2,
        dashArray: '6 4',
      }).addTo(map);

      // Click to place pin
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        placePin(L, map, lat, lng, '');
      });
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const placePin = useCallback(
    (L: any, map: any, lat: number, lng: number, addr: string) => {
      const dist = haversine(BASE.lat, BASE.lng, lat, lng);
      const valid = dist <= MAX_KM;

      // Remove old pin
      if (pinRef.current) { pinRef.current.remove(); pinRef.current = null; }

      // Coloured circle pin
      const icon = L.divIcon({
        html: `<div style="
          width:18px;height:18px;border-radius:50%;
          background:${valid ? '#22c55e' : '#ef4444'};
          border:3px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        className: '',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      const marker = L.marker([lat, lng], { icon })
        .bindPopup(
          valid
            ? `✅ Valid — ${dist.toFixed(2)} km from base`
            : `❌ Too far — ${dist.toFixed(2)} km (max ${MAX_KM} km)`,
        )
        .addTo(map)
        .openPopup();

      pinRef.current = marker;
      setPin({ lat, lng });
      setDistance(dist);
      setIsValid(valid);
      setAddress(addr);
      setShowResults(false);

      onSelectRef.current({ lat, lng, address: addr, time: pickupTime, isValid: valid, distance: dist });
    },
    [pickupTime],
  );

  // Fire onSelect whenever time changes (pin already placed)
  useEffect(() => {
    if (pin) {
      onSelectRef.current({ lat: pin.lat, lng: pin.lng, address, time: pickupTime, isValid, distance });
    }
  }, [pickupTime]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nominatim geocode search
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=lk`,
        { headers: { 'User-Agent': 'SafariBookingApp/1.0' } },
      );
      const data: SearchResult[] = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      // silently ignore
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (r: SearchResult) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    const shortName = r.display_name.split(',')[0];
    setSearchQuery(shortName);
    setShowResults(false);
    import('leaflet').then((L) => {
      if (!mapRef.current) return;
      mapRef.current.setView([lat, lng], 15);
      placePin(L, mapRef.current, lat, lng, r.display_name);
    });
  };

  return (
    <div className="space-y-4">
      {/* Search box */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Search for a location
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (!e.target.value) setShowResults(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Hotel name, landmark, area…"
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors min-w-[72px]"
          >
            {searching ? '…' : 'Search'}
          </button>
        </div>

        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
            {searchResults.map((r, i) => (
              <button
                key={i}
                onClick={() => selectSearchResult(r)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-green-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <p className="font-medium text-gray-900 truncate">{r.display_name.split(',')[0]}</p>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {r.display_name.split(',').slice(1, 4).join(',')}
                </p>
              </button>
            ))}
          </div>
        )}

        {showResults && searchResults.length === 0 && !searching && (
          <div className="absolute z-[1000] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-sm text-gray-500 text-center">
            No results found. Try a different name.
          </div>
        )}
      </div>

      {/* Hint */}
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-green-500 inline-block flex-shrink-0" />
        The green circle shows the 7 km pickup radius. Tap anywhere inside to set your pin.
      </p>

      {/* Map container */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div ref={mapDivRef} style={{ height: '320px', width: '100%' }} />
      </div>

      {/* Validation feedback */}
      {pin ? (
        <div className={`flex items-start gap-3 p-4 rounded-xl border text-sm ${
          isValid
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <span className="text-xl flex-shrink-0 mt-0.5">{isValid ? '✅' : '❌'}</span>
          <div>
            {isValid ? (
              <>
                <p className="font-semibold">Pickup location accepted</p>
                <p className="text-xs mt-0.5 opacity-75">
                  {distance.toFixed(2)} km from base · within the {MAX_KM} km service radius
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold">Pickup must be within {MAX_KM} km radius</p>
                <p className="text-xs mt-0.5 opacity-80">
                  Your pin is {distance.toFixed(2)} km away. Please tap a location inside the green circle.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
          <span>📍</span>
          <span>Tap on the map or search above to set your pickup point</span>
        </div>
      )}

      {/* Pickup time */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Time</label>
        <select
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none bg-white"
        >
          {PICKUP_TIMES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
