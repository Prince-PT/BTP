import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number;
  initialLng?: number;
  label: string;
  markerColor?: 'blue' | 'green' | 'red';
  autoNotify?: boolean; // If false, won't call onLocationSelect automatically
}

const LocationPicker = ({
  onLocationSelect,
  initialLat = 40.7128,
  initialLng = -74.006,
  label,
  markerColor = 'blue',
  autoNotify = true,
}: LocationPickerProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([initialLat, initialLng]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Get user's current location on mount
  useEffect(() => {
    // If initial coordinates are provided (not default NYC), use them
    if (initialLat !== 40.7128 || initialLng !== -74.006) {
      setMapCenter([initialLat, initialLng]);
      setIsInitializing(false);
      return;
    }
    
    // Otherwise, try to get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setIsInitializing(false);
        },
        (error) => {
          console.log('Using default location:', error);
          setIsInitializing(false);
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setIsInitializing(false);
    }
  }, [initialLat, initialLng]);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current || isInitializing) return;

    // Initialize map with user's current location or default
    const map = L.map(mapContainerRef.current).setView(mapCenter, 13);
    mapRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker colors
    const markerIcons: Record<string, L.Icon> = {
      blue: DefaultIcon,
      green: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
      red: L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: iconShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      }),
    };

    // Add draggable marker at the map center
    const marker = L.marker(mapCenter, {
      draggable: true,
      icon: markerIcons[markerColor],
    }).addTo(map);
    markerRef.current = marker;

    // Handle marker drag
    marker.on('dragend', async () => {
      const position = marker.getLatLng();
      setLoading(true);
      const addr = await reverseGeocode(position.lat, position.lng);
      setAddress(addr);
      setPendingLocation({ lat: position.lat, lng: position.lng, address: addr });
      if (autoNotify) {
        onLocationSelect(position.lat, position.lng, addr);
      }
      setLoading(false);
    });

    // Handle map click
    map.on('click', async (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      setLoading(true);
      const addr = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setAddress(addr);
      setPendingLocation({ lat: e.latlng.lat, lng: e.latlng.lng, address: addr });
      if (autoNotify) {
        onLocationSelect(e.latlng.lat, e.latlng.lng, addr);
      }
      setLoading(false);
    });

    // Initial reverse geocode
    reverseGeocode(mapCenter[0], mapCenter[1]).then(setAddress);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isInitializing, mapCenter]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      // Add a small delay to debounce multiple rapid calls
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Use our backend proxy to avoid CORS issues
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${API_URL}/api/geocode/reverse?lat=${lat}&lng=${lng}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Reverse geocode error:', error);
      // Return coordinates as fallback
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapRef.current || !markerRef.current) return;

    setLoading(true);
    try {
      // Use our backend proxy to avoid CORS issues
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(
        `${API_URL}/api/geocode/search?q=${encodeURIComponent(searchQuery)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lon);

        mapRef.current.setView([latNum, lngNum], 15);
        markerRef.current.setLatLng([latNum, lngNum]);
        setAddress(display_name);
        setPendingLocation({ lat: latNum, lng: lngNum, address: display_name });
        if (autoNotify) {
          onLocationSelect(latNum, lngNum, display_name);
        }
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      alert('Failed to search location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.setView([latitude, longitude], 15);
          markerRef.current.setLatLng([latitude, longitude]);
          const addr = await reverseGeocode(latitude, longitude);
          setAddress(addr);
          setPendingLocation({ lat: latitude, lng: longitude, address: addr });
          if (autoNotify) {
            onLocationSelect(latitude, longitude, addr);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Failed to get your location. Please enable location services.');
        setLoading(false);
      }
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {/* Search Bar */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search for a location..."
          className="input flex-1"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch(e as any);
            }
          }}
        />
        <button
          type="button"
          onClick={handleSearch}
          className="btn btn-secondary whitespace-nowrap"
          disabled={loading}
        >
          {loading ? '🔄' : '🔍'} Search
        </button>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          className="btn btn-secondary whitespace-nowrap"
          disabled={loading}
          title="Use my current location"
        >
          📍
        </button>
      </div>

      {/* Map */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="h-64 rounded-lg border-2 border-gray-300 overflow-hidden"
          style={{ zIndex: 0 }}
        />
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-2 text-sm font-medium text-gray-700">Loading address...</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Address */}
      {address && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl border-2 border-blue-200">
          <div className="flex items-start gap-3">
            <div className="text-2xl">📍</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-blue-700 uppercase mb-1">Selected Location</p>
              <p className="text-sm text-gray-700 font-medium">{address}</p>
            </div>
          </div>
          {!autoNotify && pendingLocation && (
            <button
              type="button"
              onClick={() => {
                if (pendingLocation) {
                  onLocationSelect(pendingLocation.lat, pendingLocation.lng, pendingLocation.address);
                }
              }}
              className="mt-3 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              ✓ Confirm This Location
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
