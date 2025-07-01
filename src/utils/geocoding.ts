// frontend/src/utils/geocoding.ts
// Zipcode to City Center Geocoding with Multiple APIs and Caching

interface CityCoordinates {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipcode: string;
  source: 'census' | 'opencage' | 'cache' | 'regional' | 'fallback'|'zippopotam';
  cached_date?: string;
}

interface GeocacheEntry {
  coordinates: CityCoordinates;
  timestamp: number;
  expires: number;
}

// Regional fallback centers for US states
const REGIONAL_CENTERS: Record<string, CityCoordinates> = {
  'CA': { latitude: 36.7783, longitude: -119.4179, city: 'Sandeep', state: 'CA', zipcode: '', source: 'regional' },
  'TX': { latitude: 31.9686, longitude: -99.9018, city: 'Texas', state: 'TX', zipcode: '', source: 'regional' },
  'NY': { latitude: 40.7128, longitude: -74.0060, city: 'New York', state: 'NY', zipcode: '', source: 'regional' },
  'FL': { latitude: 27.7663, longitude: -82.6404, city: 'Florida', state: 'FL', zipcode: '', source: 'regional' },
  'IL': { latitude: 40.6331, longitude: -89.3985, city: 'Illinois', state: 'IL', zipcode: '', source: 'regional' },
  'PA': { latitude: 41.2033, longitude: -77.1945, city: 'Pennsylvania', state: 'PA', zipcode: '', source: 'regional' },
  'OH': { latitude: 40.4173, longitude: -82.9071, city: 'Ohio', state: 'OH', zipcode: '', source: 'regional' },
  'GA': { latitude: 32.1656, longitude: -82.9001, city: 'Georgia', state: 'GA', zipcode: '', source: 'regional' },
  'NC': { latitude: 35.7596, longitude: -79.0193, city: 'North Carolina', state: 'NC', zipcode: '', source: 'regional' },
  'MI': { latitude: 44.3148, longitude: -85.6024, city: 'Michigan', state: 'MI', zipcode: '', source: 'regional' }
};

// Ultimate fallback (Beijing - current system)
const ULTIMATE_FALLBACK: CityCoordinates = {
  latitude: 39.913818,
  longitude: 116.363625,
  city: 'Beijing',
  state: 'CN',
  zipcode: '',
  source: 'fallback'
};

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
const GEOCACHE_KEY = 'geocoding_cache';

/**
 * Validate US zipcode format
 */
export function validateZipcode(zipcode: string): boolean {
  const cleanZip = zipcode.trim();
  // Match 5-digit or 5+4 format
  return /^\d{5}(-\d{4})?$/.test(cleanZip);
}

/**
 * Clean and normalize zipcode
 */
function normalizeZipcode(zipcode: string): string {
  return zipcode.trim().split('-')[0]; // Remove +4 extension for API calls
}

/**
 * Get cached coordinates for zipcode
 */
function getCachedCoordinates(zipcode: string): CityCoordinates | null {
  try {
    const cache = localStorage.getItem(GEOCACHE_KEY);
    if (!cache) return null;

    const geocache: Record<string, GeocacheEntry> = JSON.parse(cache);
    const normalizedZip = normalizeZipcode(zipcode);
    const entry = geocache[normalizedZip];

    if (entry && Date.now() < entry.expires) {
      console.log(`🎯 Using cached coordinates for ${zipcode}`);
      return {
        ...entry.coordinates,
        source: 'cache',
        cached_date: new Date(entry.timestamp).toISOString()
      };
    }

    // Remove expired entry
    if (entry) {
      delete geocache[normalizedZip];
      localStorage.setItem(GEOCACHE_KEY, JSON.stringify(geocache));
    }

    return null;
  } catch (error) {
    console.error('Error reading geocache:', error);
    return null;
  }
}

/**
 * Cache coordinates for zipcode
 */
function cacheCoordinates(zipcode: string, coordinates: CityCoordinates): void {
  try {
    const cache = localStorage.getItem(GEOCACHE_KEY);
    const geocache: Record<string, GeocacheEntry> = cache ? JSON.parse(cache) : {};
    
    const normalizedZip = normalizeZipcode(zipcode);
    const now = Date.now();

    geocache[normalizedZip] = {
      coordinates,
      timestamp: now,
      expires: now + CACHE_DURATION
    };

    localStorage.setItem(GEOCACHE_KEY, JSON.stringify(geocache));
    console.log(`💾 Cached coordinates for ${zipcode}`);
  } catch (error) {
    console.error('Error caching coordinates:', error);
  }
}

/**
 * Geocode using US Census API (Primary - Free)
 */
async function geocodeWithCensus(zipcode: string): Promise<CityCoordinates | null> {
  try {
    const normalizedZip = normalizeZipcode(zipcode);
    // const url = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?address=${normalizedZip}&benchmark=2020&format=json`)}`;
    const url = `http://api.zippopotam.us/us/${normalizedZip}`;
    console.log(`🏛️ Trying Census API for ${zipcode}`);
    
    const response = await fetch(url, {
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
});

if (!response.ok) {
  throw new Error(`Census API error: ${response.status}`);
}

const proxyData = await response.json();
const data = JSON.parse(proxyData.contents); // Extract the actual data from proxy
    
    if (data.places?.latitude && data.places.latitude.length > 0) {
      //const match = data.result.addressMatches[0];
      const coordslt = data.places.latitude;
      const coordslng =data.places.longitude
      //const address = match.addressComponents;

      const result: CityCoordinates = {
        latitude: parseFloat(coordslt),
        longitude: parseFloat(coordslng),
        city: data.places.state || 'Unknown City',
        state: data.places.state || 'Unknown State',
        zipcode: normalizedZip,
        source: 'zippopotam'
      };

      console.log(`✅ Census API success:`, result);
      return result;
    }

    console.log(`❌ Census API: No results for ${zipcode}`);
    return null;

  } catch (error) {
    console.error(`❌ Census API error for ${zipcode}:`, error);
    return null;
  }
}

/**
 * Geocode using OpenCage API (Backup - 2,500 free requests/day)
 */
async function geocodeWithOpenCage(zipcode: string): Promise<CityCoordinates | null> {
  try {
    // Note: You'll need to get a free API key from https://opencagedata.com/
    const API_KEY = 'YOUR_OPENCAGE_API_KEY'; // Replace with actual key
    
    if (API_KEY === 'YOUR_OPENCAGE_API_KEY') {
      console.log(`⚠️ OpenCage API key not configured, skipping`);
      return null;
    }

    const normalizedZip = normalizeZipcode(zipcode);
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${normalizedZip}&key=${API_KEY}&countrycode=us&limit=1`;
    
    console.log(`🌍 Trying OpenCage API for ${zipcode}`);
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`OpenCage API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      const geometry = result.geometry;
      const components = result.components;

      const coords: CityCoordinates = {
        latitude: geometry.lat,
        longitude: geometry.lng,
        city: components.city || components.town || components.village || 'Unknown City',
        state: components.state_code || components.state || 'Unknown State',
        zipcode: normalizedZip,
        source: 'opencage'
      };

      console.log(`✅ OpenCage API success:`, coords);
      return coords;
    }

    console.log(`❌ OpenCage API: No results for ${zipcode}`);
    return null;

  } catch (error) {
    console.error(`❌ OpenCage API error for ${zipcode}:`, error);
    return null;
  }
}

/**
 * Get regional center based on zipcode pattern
 */
function getRegionalFallback(zipcode: string): CityCoordinates | null {
  const normalizedZip = normalizeZipcode(zipcode);
  const firstDigit = normalizedZip.charAt(0);
  
  // US zipcode regional mapping (approximate)
  const zipToState: Record<string, string> = {
    '0': 'MA', '1': 'NY', '2': 'NY', '3': 'PA',
    '4': 'GA', '5': 'IL', '6': 'TX', '7': 'TX',
    '8': 'CO', '9': 'CA'
  };

  const state = zipToState[firstDigit];
  if (state && REGIONAL_CENTERS[state]) {
    console.log(`🗺️ Using regional fallback for ${zipcode} -> ${state}`);
    return {
      ...REGIONAL_CENTERS[state],
      zipcode: normalizedZip
    };
  }

  return null;
}

/**
 * Main function: Get city center coordinates from zipcode
 */
export async function getCityCoordinatesFromZipcode(zipcode: string): Promise<CityCoordinates> {
  console.log(`\n🎯 ===== GEOCODING ZIPCODE: ${zipcode} =====`);

  // Step 1: Validate zipcode format
  if (!validateZipcode(zipcode)) {
    console.log(`❌ Invalid zipcode format: ${zipcode}`);
    return {
      ...ULTIMATE_FALLBACK,
      zipcode: zipcode
    };
  }

  const normalizedZip = normalizeZipcode(zipcode);

  // Step 2: Check cache first
  const cached = getCachedCoordinates(normalizedZip);
  if (cached) {
    return cached;
  }

  // Step 3: Try Census API (primary)
  console.log(`🔄 Geocoding ${normalizedZip}...`);
  let coordinates = await geocodeWithCensus(normalizedZip);

  // Step 4: Try OpenCage API (backup)
  if (!coordinates) {
    coordinates = await geocodeWithOpenCage(normalizedZip);
  }

  // Step 5: Try regional fallback
  if (!coordinates) {
    coordinates = getRegionalFallback(normalizedZip);
  }

  // Step 6: Ultimate fallback (Beijing)
  if (!coordinates) {
    console.log(`⚠️ All geocoding methods failed for ${zipcode}, using Beijing fallback`);
    coordinates = {
      ...ULTIMATE_FALLBACK,
      zipcode: normalizedZip
    };
  }

  // Cache successful results (except ultimate fallback)
  if (coordinates.source !== 'fallback') {
    cacheCoordinates(normalizedZip, coordinates);
  }

  console.log(`✅ Final coordinates for ${zipcode}:`, coordinates);
  return coordinates;
}

/**
 * Clear geocoding cache
 */
export function clearGeocodingCache(): void {
  try {
    localStorage.removeItem(GEOCACHE_KEY);
    console.log('🗑️ Geocoding cache cleared');
  } catch (error) {
    console.error('Error clearing geocoding cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getGeocodeStats(): { entries: number; size: string; oldestEntry: string | null } {
  try {
    const cache = localStorage.getItem(GEOCACHE_KEY);
    if (!cache) {
      return { entries: 0, size: '0 KB', oldestEntry: null };
    }

    const geocache: Record<string, GeocacheEntry> = JSON.parse(cache);
    const entries = Object.keys(geocache).length;
    const size = `${Math.round(cache.length / 1024)} KB`;
    
    const timestamps = Object.values(geocache).map(entry => entry.timestamp);
    const oldestEntry = timestamps.length > 0 
      ? new Date(Math.min(...timestamps)).toLocaleDateString()
      : null;

    return { entries, size, oldestEntry };
  } catch (error) {
    console.error('Error getting geocode stats:', error);
    return { entries: 0, size: '0 KB', oldestEntry: null };
  }
}

export type { CityCoordinates };