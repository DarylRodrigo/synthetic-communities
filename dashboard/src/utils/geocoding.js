/**
 * Geocoding utilities for Swiss cities
 */

// Simple cache for geocoded cities
const geocodeCache = {};

export async function geocodeCity(cityName) {
  // Check cache first
  if (geocodeCache[cityName]) {
    return geocodeCache[cityName];
  }
  
  try {
    // Use Nominatim (OpenStreetMap) for free geocoding
    const query = encodeURIComponent(`${cityName}, Switzerland`);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`;
    
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
      geocodeCache[cityName] = coords;
      return coords;
    }
    
    // Fallback: center of Switzerland
    return { lat: 46.8182, lon: 8.2275 };
  } catch (error) {
    console.error(`Error geocoding ${cityName}:`, error);
    return { lat: 46.8182, lon: 8.2275 };
  }
}

export async function geocodeCities(cityCounts, onProgress = null) {
  const geocoded = [];
  const entries = Object.entries(cityCounts);
  const total = entries.length;
  
  for (let i = 0; i < entries.length; i++) {
    const [city, count] = entries[i];
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const coords = await geocodeCity(city);
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

