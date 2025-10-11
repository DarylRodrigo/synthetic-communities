/**
 * Geocoding utilities for Swiss cities
 */

// Persistent cache using localStorage
const CACHE_KEY = 'geocode_cache';

function getGeocodeCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : {};
  } catch (error) {
    console.warn('Failed to load geocode cache:', error);
    return {};
  }
}

function setGeocodeCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Failed to save geocode cache:', error);
  }
}

export async function geocodeCity(cityName, countryCode = 'CH') {
  const cache = getGeocodeCache();
  const cacheKey = `${cityName}_${countryCode}`;

  // Check cache first
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  try {
    // Use Nominatim (OpenStreetMap) for free geocoding
    // Map country codes to country names for the query
    const countryNames = {
      'CH': 'Switzerland',
      'DE': 'Germany',
      'FR': 'France',
      'IT': 'Italy',
      'AT': 'Austria'
    };

    const countryName = countryNames[countryCode] || 'Switzerland';
    const query = encodeURIComponent(`${cityName}, ${countryName}`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1&countrycodes=${countryCode}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'SyntheticCommunityDashboard/1.0'
      }
    });

    const data = await response.json();

    if (data && data.length > 0) {
      const coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };

      // Update cache with country-specific key
      cache[cacheKey] = coords;
      setGeocodeCache(cache);

      return coords;
    }

    // Fallback: try without country restriction
    const fallbackQuery = encodeURIComponent(cityName);
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${fallbackQuery}&limit=1`;

    const fallbackResponse = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'SyntheticCommunityDashboard/1.0'
      }
    });

    const fallbackData = await fallbackResponse.json();

    if (fallbackData && fallbackData.length > 0) {
      const coords = {
        lat: parseFloat(fallbackData[0].lat),
        lon: parseFloat(fallbackData[0].lon)
      };

      cache[cacheKey] = coords;
      setGeocodeCache(cache);

      return coords;
    }

    // Final fallback: center of the specified country
    const countryCenters = {
      'CH': { lat: 46.8182, lon: 8.2275 },
      'DE': { lat: 51.1657, lon: 10.4515 },
      'FR': { lat: 46.2276, lon: 2.2137 },
      'IT': { lat: 41.8719, lon: 12.5674 },
      'AT': { lat: 47.5162, lon: 14.5501 }
    };

    return countryCenters[countryCode] || { lat: 46.8182, lon: 8.2275 };
  } catch (error) {
    console.error(`Error geocoding ${cityName} in ${countryCode}:`, error);

    // Return country center as fallback
    const countryCenters = {
      'CH': { lat: 46.8182, lon: 8.2275 },
      'DE': { lat: 51.1657, lon: 10.4515 },
      'FR': { lat: 46.2276, lon: 2.2137 },
      'IT': { lat: 41.8719, lon: 12.5674 },
      'AT': { lat: 47.5162, lon: 14.5501 }
    };

    return countryCenters[countryCode] || { lat: 46.8182, lon: 8.2275 };
  }
}

export async function geocodeCities(cityCounts, onProgress = null, countryCode = 'CH') {
  const geocoded = [];
  const entries = Object.entries(cityCounts);
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const [city, count] = entries[i];

    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));

    const coords = await geocodeCity(city, countryCode);
    geocoded.push({
      city,
      count,
      lat: coords.lat,
      lon: coords.lon
    });

    // Report progress
    if (onProgress) {
      onProgress(i + 1, total);
    }
  }

  return geocoded;
}

