/**
 * Filter and distribution utilities for persona selection
 */

export function applyFilters(personas, filters) {
  return personas.filter(persona => {
    // Demographics filters
    const demographics = filters.demographics || {};
    const ageRange = demographics.ageRange || [18, 90];
    const age = persona.age;
    if (age < ageRange[0] || age > ageRange[1]) {
      return false;
    }

    if (demographics.genders && demographics.genders.length > 0 && !demographics.genders.includes(persona.gender)) {
      return false;
    }

    if (demographics.ethnicities && demographics.ethnicities.length > 0 && !demographics.ethnicities.includes(persona.ethnicity)) {
      return false;
    }

    if (demographics.educationLevels && demographics.educationLevels.length > 0 && !demographics.educationLevels.includes(persona.education_level)) {
      return false;
    }

    if (demographics.incomeBrackets && demographics.incomeBrackets.length > 0 && !demographics.incomeBrackets.includes(persona.income_bracket)) {
      return false;
    }

    if (demographics.sectors && demographics.sectors.length > 0 && !demographics.sectors.includes(persona.sector)) {
      return false;
    }

    // Geographic filters
    const geographic = filters.geographic || {};
    if (geographic.cities && geographic.cities.length > 0 && !geographic.cities.includes(persona.city)) {
      return false;
    }

    // Cultural filters
    const cultural = filters.cultural || {};
    if (cultural.religions && cultural.religions.length > 0 && !cultural.religions.includes(persona.religion)) {
      return false;
    }

    if (cultural.culturalBackgrounds && cultural.culturalBackgrounds.length > 0 && !cultural.culturalBackgrounds.includes(persona.cultural_background)) {
      return false;
    }

    if (cultural.interests && cultural.interests.length > 0) {
      const personaInterests = persona.interests || [];
      const hasMatchingInterest = cultural.interests.some(interest => 
        personaInterests.includes(interest)
      );
      if (!hasMatchingInterest) {
        return false;
      }
    }

    return true;
  });
}

export function applyDistribution(personas, distribution) {
  const { sampleSize, gender, ageGroups, religion, ethnicity } = distribution;

  if (sampleSize <= 0 || personas.length === 0) {
    return [];
  }

  // Build stratified sampling plan
  const strata = {};
  
  // Combine all distribution criteria
  personas.forEach((persona, idx) => {
    const genderVal = persona.gender || 'Unknown';
    const ageGroup = getAgeGroup(persona.age);
    const religionVal = persona.religion || 'Unknown';
    const ethnicityVal = persona.ethnicity || 'Unknown';
    
    const key = `${genderVal}|${ageGroup}|${religionVal}|${ethnicityVal}`;
    
    if (!strata[key]) {
      strata[key] = {
        personas: [],
        target: 0,
        gender: genderVal,
        ageGroup,
        religion: religionVal,
        ethnicity: ethnicityVal
      };
    }
    strata[key].personas.push(persona);
  });

  // Calculate target counts for each stratum
  Object.values(strata).forEach(stratum => {
    let weight = 1.0;
    
    // Apply gender weight
    if (Object.keys(gender).length > 0) {
      weight *= (gender[stratum.gender] || 0) / 100;
    }
    
    // Apply age group weight
    if (Object.keys(ageGroups).length > 0) {
      weight *= (ageGroups[stratum.ageGroup] || 0) / 100;
    }
    
    // Apply religion weight
    if (Object.keys(religion).length > 0) {
      weight *= (religion[stratum.religion] || 0) / 100;
    }
    
    // Apply ethnicity weight
    if (Object.keys(ethnicity).length > 0) {
      weight *= (ethnicity[stratum.ethnicity] || 0) / 100;
    }
    
    stratum.target = weight * sampleSize;
  });

  // Perform stratified sampling
  const sampled = [];
  
  // Sort strata by target count (descending) to prioritize large strata
  const sortedStrata = Object.values(strata).sort((a, b) => b.target - a.target);
  
  sortedStrata.forEach(stratum => {
    const count = Math.round(stratum.target);
    const available = stratum.personas.length;
    
    if (count > 0 && available > 0) {
      // Randomly sample from this stratum
      const shuffled = [...stratum.personas].sort(() => Math.random() - 0.5);
      const toTake = Math.min(count, available);
      sampled.push(...shuffled.slice(0, toTake));
    }
  });

  // If we haven't reached sample size, randomly fill from remaining
  if (sampled.length < sampleSize) {
    const remaining = personas.filter(p => !sampled.includes(p));
    const shuffled = [...remaining].sort(() => Math.random() - 0.5);
    const needed = sampleSize - sampled.length;
    sampled.push(...shuffled.slice(0, needed));
  }

  // If we have too many, trim
  if (sampled.length > sampleSize) {
    return sampled.slice(0, sampleSize);
  }

  return sampled;
}

function getAgeGroup(age) {
  if (age <= 25) return '18-25';
  if (age <= 35) return '26-35';
  if (age <= 45) return '36-45';
  if (age <= 55) return '46-55';
  if (age <= 65) return '56-65';
  return '66+';
}

export function getUniqueValues(personas, field) {
  const values = new Set();
  personas.forEach(p => {
    const value = p[field];
    if (value !== undefined && value !== null) {
      values.add(value);
    }
  });
  return Array.from(values).sort();
}

export function getUniqueInterests(personas) {
  const interests = new Set();
  personas.forEach(p => {
    if (p.interests && Array.isArray(p.interests)) {
      p.interests.forEach(interest => interests.add(interest));
    }
  });
  return Array.from(interests).sort();
}

export function exportToJSON(personas) {
  const dataStr = JSON.stringify(personas, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `personas_export_${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV(personas) {
  if (personas.length === 0) return;
  
  // Get all keys from first persona
  const keys = Object.keys(personas[0]).filter(k => typeof personas[0][k] !== 'object');
  
  // Create CSV header
  const header = keys.join(',');
  
  // Create CSV rows
  const rows = personas.map(persona => {
    return keys.map(key => {
      const value = persona[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',');
  });
  
  const csv = [header, ...rows].join('\n');
  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `personas_export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

