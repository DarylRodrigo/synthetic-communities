/**
 * Data loading and processing utilities for persona dashboard
 */

export async function loadPersonas() {
  try {
    const response = await fetch('/personas.jsonl');
    const text = await response.text();
    
    // Parse JSONL (one JSON object per line)
    const lines = text.trim().split('\n');
    const personas = lines
      .filter(line => line.trim())
      .map(line => JSON.parse(line));
    
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
      counts[interest] = (counts[interest] || 0) + 1;
    });
  });
  return counts;
}

