/**
 * Data loading and processing utilities for persona dashboard
 */

// Available data sources
export const DATA_SOURCES = {
  'swiss_population': {
    name: 'Swiss Population',
    path: '/swiss_population.jsonl'
  },
  'berlin_1936': {
    name: 'Berlin 1936 Population',
    path: '/berlin_1936_population.jsonl'
  },
  'build_zurich': {
    name: 'Build Zurich',
    path: '/build_zurich.jsonl'
  },
  'un_assembly_2045': {
    name: 'UN Assembly 2045',
    path: '/personas/UN_assembly_2045.jsonl'
  }
};

export async function loadPersonas(dataSource = 'swiss_population') {
  try {
    const source = DATA_SOURCES[dataSource];
    if (!source) {
      throw new Error(`Unknown data source: ${dataSource}`);
    }

    const response = await fetch(source.path);
    if (!response.ok) {
      throw new Error(`Failed to load ${source.path}: ${response.status}`);
    }

    const text = await response.text();

    // Parse JSONL (one JSON object per line)
    const lines = text.trim().split('\n');
    const personas = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line));

    console.log(`Loaded ${personas.length} personas from ${source.name}`);
    return personas;
  } catch (error) {
    console.error('Error loading personas:', error);
    return [];
  }
}

export function getAgeBins(personas) {
  const bins = {
    '18-25': 0,
    '26-35': 0,
    '36-45': 0,
    '46-55': 0,
    '56-65': 0,
    '66+': 0
  };
  
  personas.forEach(p => {
    const age = p.age;
    if (age <= 25) bins['18-25']++;
    else if (age <= 35) bins['26-35']++;
    else if (age <= 45) bins['36-45']++;
    else if (age <= 55) bins['46-55']++;
    else if (age <= 65) bins['56-65']++;
    else bins['66+']++;
  });
  
  return bins;
}

export function getEthnicityCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const eth = p.ethnicity || 'Unknown';
    counts[eth] = (counts[eth] || 0) + 1;
  });
  return counts;
}

export function getEducationCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const edu = p.education_level || 'Unknown';
    counts[edu] = (counts[edu] || 0) + 1;
  });
  return counts;
}

export function getIncomeCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const income = p.income_bracket || 'Unknown';
    counts[income] = (counts[income] || 0) + 1;
  });
  return counts;
}

export function getSectorCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const sector = p.sector || 'Unknown';
    counts[sector] = (counts[sector] || 0) + 1;
  });
  return counts;
}

export function getCityCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const city = p.city || 'Unknown';
    counts[city] = (counts[city] || 0) + 1;
  });
  return counts;
}

export function getReligionCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const religion = p.religion || 'Unknown';
    counts[religion] = (counts[religion] || 0) + 1;
  });
  return counts;
}

export function getCulturalBackgroundCounts(personas) {
  const counts = {};
  personas.forEach(p => {
    const bg = p.cultural_background || 'Unknown';
    counts[bg] = (counts[bg] || 0) + 1;
  });
  return counts;
}

export function getReligionByEthnicity(personas) {
  const data = {};
  personas.forEach(p => {
    const eth = p.ethnicity || 'Unknown';
    const religion = p.religion || 'Unknown';
    
    if (!data[eth]) data[eth] = {};
    data[eth][religion] = (data[eth][religion] || 0) + 1;
  });
  return data;
}

export function getInterestsFrequency(personas) {
  const counts = {};
  personas.forEach(p => {
    const interests = p.interests || [];
    interests.forEach(interest => {
      // Case-insensitive processing
      const normalizedInterest = interest.toLowerCase().trim();
      counts[normalizedInterest] = (counts[normalizedInterest] || 0) + 1;
    });
  });
  return counts;
}

// Case-insensitive version of existing functions
export function getEthnicityCountsNormalized(personas) {
  const counts = {};
  personas.forEach(p => {
    const ethnicity = (p.ethnicity || 'Unknown').toLowerCase().trim();
    counts[ethnicity] = (counts[ethnicity] || 0) + 1;
  });
  return counts;
}

export function getEducationCountsNormalized(personas) {
  const counts = {};
  personas.forEach(p => {
    const education = (p.education_level || 'Unknown').toLowerCase().trim();
    counts[education] = (counts[education] || 0) + 1;
  });
  return counts;
}

// Data for Sankey diagram: Education -> Income flows
export function getEducationIncomeFlows(personas, minDataPoints = 50) {
  // First, count education levels to filter out scarce ones
  const educationCounts = {};
  personas.forEach(p => {
    const education = (p.education_level || 'unknown').toLowerCase().trim();
    educationCounts[education] = (educationCounts[education] || 0) + 1;
  });

  // Filter out education levels with fewer than minDataPoints
  const validEducations = Object.keys(educationCounts).filter(
    education => educationCounts[education] >= minDataPoints
  );

  const flows = {};
  personas.forEach(p => {
    const education = (p.education_level || 'unknown').toLowerCase().trim();
    const income = (p.income_bracket || 'unknown').toLowerCase().trim();

    // Only include flows from education levels with sufficient data
    if (validEducations.includes(education)) {
      const key = `${education}->${income}`;
      flows[key] = (flows[key] || 0) + 1;
    }
  });

  return Object.entries(flows).map(([key, value]) => {
    const [source, target] = key.split('->');
    return { source, target, value };
  });
}

// Data for Population Pyramid: Age distribution by gender
export function getAgeGenderDistribution(personas) {
  const bins = {
    '18-25': { male: 0, female: 0 },
    '26-35': { male: 0, female: 0 },
    '36-45': { male: 0, female: 0 },
    '46-55': { male: 0, female: 0 },
    '56-65': { male: 0, female: 0 },
    '66+': { male: 0, female: 0 }
  };

  personas.forEach(p => {
    const age = p.age;
    const gender = (p.gender || 'unknown').toLowerCase().trim();

    let bin = '66+';
    if (age <= 25) bin = '18-25';
    else if (age <= 35) bin = '26-35';
    else if (age <= 45) bin = '36-45';
    else if (age <= 55) bin = '46-55';
    else if (age <= 65) bin = '56-65';

    if (gender === 'male' || gender === 'm') {
      bins[bin].male += 1;
    } else if (gender === 'female' || gender === 'f') {
      bins[bin].female += 1;
    }
  });

  return bins;
}

// Country name to ISO 3-letter code mapping for choropleth
const COUNTRY_TO_ISO3 = {
  'Afghanistan': 'AFG',
  'Albania': 'ALB',
  'Australia': 'AUS',
  'Austria': 'AUT',
  'Bangladesh': 'BGD',
  'Bosnia and Herzegovina': 'BIH',
  'Brazil': 'BRA',
  'Bulgaria': 'BGR',
  'Canada': 'CAN',
  'China': 'CHN',
  'Colombia': 'COL',
  'Croatia': 'HRV',
  'Czech Republic': 'CZE',
  'Ecuador': 'ECU',
  'Egypt': 'EGY',
  'Eritrea': 'ERI',
  'Estonia': 'EST',
  'Ethiopia': 'ETH',
  'France': 'FRA',
  'Germany': 'DEU',
  'Ghana': 'GHA',
  'Hungary': 'HUN',
  'India': 'IND',
  'Iran': 'IRN',
  'Iraq': 'IRQ',
  'Ireland': 'IRL',
  'Israel': 'ISR',
  'Italy': 'ITA',
  'Japan': 'JPN',
  'Jordan': 'JOR',
  'Kosovo': 'XKX', // Kosovo uses XKX in many choropleth implementations
  'Latvia': 'LVA',
  'Lebanon': 'LBN',
  'Lithuania': 'LTU',
  'Mexico': 'MEX',
  'Morocco': 'MAR',
  'Nepal': 'NPL',
  'Netherlands': 'NLD',
  'New Zealand': 'NZL',
  'Nigeria': 'NGA',
  'North Macedonia': 'MKD',
  'Pakistan': 'PAK',
  'Palestine': 'PSE',
  'Peru': 'PER',
  'Poland': 'POL',
  'Portugal': 'PRT',
  'Romania': 'ROU',
  'Russia': 'RUS',
  'Serbia': 'SRB',
  'Slovakia': 'SVK',
  'Slovenia': 'SVN',
  'Somalia': 'SOM',
  'South Africa': 'ZAF',
  'South Korea': 'KOR',
  'Spain': 'ESP',
  'Sri Lanka': 'LKA',
  'Sudan': 'SDN',
  'Switzerland': 'CHE',
  'Syria': 'SYR',
  'Thailand': 'THA',
  'Tunisia': 'TUN',
  'Turkey': 'TUR',
  'Ukraine': 'UKR',
  'United Kingdom': 'GBR',
  'United States': 'USA',
  'Vietnam': 'VNM'
};

// Ethnicity to Country mapping for world map
const ETHNICITY_TO_COUNTRY = {
  // Simple country/ethnic names
  'afghan': 'Afghanistan',
  'albanian': 'Albania',
  'american': 'United States',
  'australian': 'Australia',
  'bosnian': 'Bosnia and Herzegovina',
  'brazilian': 'Brazil',
  'british': 'United Kingdom',
  'chinese': 'China',
  'french': 'France',
  'german': 'Germany',
  'indian': 'India',
  'iranian': 'Iran',
  'irish': 'Ireland',
  'italian': 'Italy',
  'kosovan': 'Kosovo',
  'portuguese': 'Portugal',
  'russian': 'Russia',
  'serbian': 'Serbia',
  'spanish': 'Spain',
  'sri lankan': 'Sri Lanka',
  'swiss': 'Switzerland',
  'syrian': 'Syria',
  'turkish': 'Turkey',
  'vietnamese': 'Vietnam',

  // Swiss combination ethnicities (map to Switzerland)
  'albanian-swiss': 'Switzerland',
  'bosnian-swiss': 'Switzerland',
  'british-swiss': 'Switzerland',
  'swiss (irish descent)': 'Switzerland',
  'swiss (kosovan heritage)': 'Switzerland',
  'swiss-french': 'Switzerland',
  'swiss-german': 'Switzerland',
  'swiss-italian': 'Switzerland',
  'swiss-russian': 'Switzerland',
  'swiss-serbian': 'Switzerland',
  'swiss-spanish': 'Switzerland',
  'swiss-turkish': 'Switzerland',
  'turkish-german': 'Germany', // Primary ethnicity German
  'turkish-swiss': 'Switzerland',

  // Additional European countries
  'dutch': 'Netherlands',
  'austrian': 'Austria',
  'polish': 'Poland',
  'hungarian': 'Hungary',
  'czech': 'Czech Republic',
  'slovak': 'Slovakia',
  'croatian': 'Croatia',
  'slovenian': 'Slovenia',

  // Balkan/Baltic countries
  'macedonian': 'North Macedonia',
  'montenegrin': 'Montenegro',
  'bulgarian': 'Bulgaria',
  'romanian': 'Romania',
  'lithuanian': 'Lithuania',
  'latvian': 'Latvia',
  'estonian': 'Estonia',

  // Asian countries
  'japanese': 'Japan',
  'korean': 'South Korea',
  'thai': 'Thailand',
  'pakistani': 'Pakistan',
  'bangladeshi': 'Bangladesh',
  'nepali': 'Nepal',

  // Middle Eastern countries
  'iraqi': 'Iraq',
  'lebanese': 'Lebanon',
  'jordanian': 'Jordan',
  'palestinian': 'Palestine',
  'israeli': 'Israel',
  'egyptian': 'Egypt',
  'moroccan': 'Morocco',
  'tunisian': 'Tunisia',
  'algerian': 'Algeria',

  // African countries
  'ghanian': 'Ghana',
  'nigerian': 'Nigeria',
  'ethiopian': 'Ethiopia',
  'somali': 'Somalia',
  'eritrean': 'Eritrea',
  'sudanese': 'Sudan',

  // Americas
  'canadian': 'Canada',
  'mexican': 'Mexico',
  'colombian': 'Colombia',
  'peruvian': 'Peru',
  'ecuadorian': 'Ecuador',

  // Other regions
  'new zealander': 'New Zealand',
  'south african': 'South Africa'
};

// Get the primary country/region from the dataset for location-aware geocoding
export function getDatasetLocation(personas) {
  // Get unique countries from the data
  const countries = [...new Set(personas.map(p => p.country).filter(Boolean))];

  // If all personas have the same country, use that
  if (countries.length === 1) {
    return countries[0];
  }

  // If multiple countries, try to determine primary location from cities
  const cities = [...new Set(personas.map(p => p.city).filter(Boolean))];
  const firstCity = cities[0];

  // Simple heuristics for common city-country mappings
  if (firstCity) {
    const cityLower = firstCity.toLowerCase();
    if (cityLower.includes('zurich') || cityLower.includes('geneva') || cityLower.includes('basel') || cityLower.includes('bern')) {
      return 'CH'; // Switzerland
    } else if (cityLower.includes('berlin') || cityLower.includes('munich') || cityLower.includes('hamburg') || cityLower.includes('cologne')) {
      return 'DE'; // Germany
    }
  }

  // Default fallback
  return 'CH';
}

// Data for Ethnicity World Map: Map ethnicities to countries
export function getEthnicityWorldMap(personas) {
  const countryCounts = {};
  const countryNames = {};

  personas.forEach(p => {
    const ethnicity = (p.ethnicity || 'unknown').toLowerCase().trim();

    // Try to find the country mapping
    let country = ETHNICITY_TO_COUNTRY[ethnicity];

    // If not found, try some fallback logic for compound ethnicities
    if (!country) {
      // Handle patterns like "country-swiss" or "swiss-country"
      if (ethnicity.includes('-swiss') || ethnicity.includes('swiss-')) {
        country = 'Switzerland';
      } else if (ethnicity.includes('-german') || ethnicity.includes('german-')) {
        country = 'Germany';
      } else if (ethnicity.includes('-')) {
        // For other compound ethnicities, try the first part
        const firstPart = ethnicity.split('-')[0];
        country = ETHNICITY_TO_COUNTRY[firstPart];
      }

      // Final fallback to Switzerland (since this is Swiss population data)
      if (!country) {
        country = 'Switzerland';
      }
    }

    countryCounts[country] = (countryCounts[country] || 0) + 1;
    countryNames[country] = country; // Store country names for hover text
  });

  // Convert to format suitable for Plotly choropleth
  // Use ISO codes for locations, keep country names for text
  const isoCodes = Object.keys(countryCounts).map(country => COUNTRY_TO_ISO3[country] || 'CHE'); // Default to Switzerland
  const countryList = Object.keys(countryCounts);
  const values = Object.values(countryCounts);
  const hoverText = countryList.map((country, i) => `${country}: ${values[i]} people`);

  return { isoCodes, countryList, values, hoverText };
}

