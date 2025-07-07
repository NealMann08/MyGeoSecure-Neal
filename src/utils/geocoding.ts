// frontend/src/utils/geocoding.ts
// FIXED: Proper zipcode to coordinates using actual city centers (not generic state centers)

interface CityCoordinates {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  zipcode: string;
  source: 'zippopotam' | 'cache' | 'fallback';
  cached_date?: string;
}

interface GeocacheEntry {
  coordinates: CityCoordinates;
  timestamp: number;
  expires: number;
}

// ONLY fallback for when ALL APIs fail (Beijing)
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
      console.log(`🎯 Using cached coordinates for ${zipcode}: ${entry.coordinates.city}, ${entry.coordinates.state}`);
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
    console.log(`💾 Cached coordinates for ${zipcode}: ${coordinates.city}, ${coordinates.state}`);
  } catch (error) {
    console.error('Error caching coordinates:', error);
  }
}

/**
 * Geocode using Zippopotam.us API (Primary - Free, No CORS issues)
 */
async function geocodeWithZippopotam(zipcode: string): Promise<CityCoordinates | null> {
  try {
    const normalizedZip = normalizeZipcode(zipcode);
    const url = `http://api.zippopotam.us/us/${normalizedZip}`;
    
    console.log(`🌐 Getting exact coordinates for ${zipcode} using Zippopotam API...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Zippopotam API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.places && data.places.length > 0) {
      const place = data.places[0];

      const result: CityCoordinates = {
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        city: place['place name'],
        state: place['state abbreviation'],
        zipcode: normalizedZip,
        source: 'zippopotam'
      };

      console.log(`✅ Found exact city center for ${zipcode}: ${result.city}, ${result.state} (${result.latitude}, ${result.longitude})`);
      return result;
    }

    console.log(`❌ Zippopotam API: No results for ${zipcode}`);
    return null;

  } catch (error) {
    console.error(`❌ Zippopotam API error for ${zipcode}:`, error);
    return null;
  }
}

/**
 * Main function: Get EXACT city center coordinates from zipcode
 */
export async function getCityCoordinatesFromZipcode(zipcode: string): Promise<CityCoordinates> {
  console.log(`\n🎯 ===== GETTING EXACT COORDINATES FOR ZIPCODE: ${zipcode} =====`);

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

  // Step 3: Get EXACT coordinates from Zippopotam API
  console.log(`🔄 Looking up exact city center for ${normalizedZip}...`);
  let coordinates = await geocodeWithZippopotam(normalizedZip);

  // Step 4: Only use fallback if API completely fails
  if (!coordinates) {
    console.log(`⚠️ Could not find coordinates for zipcode ${zipcode}. This might be an invalid US zipcode.`);
    console.log(`🔄 Using Beijing fallback as last resort`);
    coordinates = {
      ...ULTIMATE_FALLBACK,
      zipcode: normalizedZip
    };
  }

  // Cache successful results (except fallback)
  if (coordinates.source !== 'fallback') {
    cacheCoordinates(normalizedZip, coordinates);
  }

  console.log(`✅ Final coordinates for ${zipcode}: ${coordinates.city}, ${coordinates.state} (${coordinates.latitude}, ${coordinates.longitude})`);
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