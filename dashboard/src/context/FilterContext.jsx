import { createContext, useContext, useState, useMemo } from 'react';
import { applyFilters, applyDistribution } from '../utils/filterUtils';

const FilterContext = createContext();

export function FilterProvider({ children, allPersonas }) {
  const [mode, setMode] = useState('filter'); // 'filter' or 'distribution'
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({
    demographics: {
      ageRange: [18, 90],
      genders: [],
      ethnicities: [],
      educationLevels: [],
      incomeBrackets: [],
      sectors: []
    },
    geographic: {
      cities: []
    },
    cultural: {
      religions: [],
      interests: [],
      culturalBackgrounds: []
    }
  });

  // Distribution state
  const [distribution, setDistribution] = useState({
    sampleSize: 500,
    gender: {},
    ageGroups: {},
    religion: {},
    ethnicity: {}
  });

  // Calculate filtered/sampled personas
  const resultPersonas = useMemo(() => {
    if (mode === 'filter') {
      return applyFilters(allPersonas, filters);
    } else {
      return applyDistribution(allPersonas, distribution);
    }
  }, [mode, allPersonas, filters, distribution]);

  // Helper functions
  const updateFilter = (category, key, value) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const clearFilters = () => {
    setFilters({
      demographics: {
        ageRange: [18, 90],
        genders: [],
        ethnicities: [],
        educationLevels: [],
        incomeBrackets: [],
        sectors: []
      },
      geographic: {
        cities: []
      },
      cultural: {
        religions: [],
        interests: [],
        culturalBackgrounds: []
      }
    });
  };

  const updateDistribution = (category, value) => {
    setDistribution(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const clearDistribution = () => {
    setDistribution({
      sampleSize: 500,
      gender: {},
      ageGroups: {},
      religion: {},
      ethnicity: {}
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    const demographics = filters.demographics || {};
    const geographic = filters.geographic || {};
    const cultural = filters.cultural || {};
    
    if (demographics.ageRange && (demographics.ageRange[0] !== 18 || demographics.ageRange[1] !== 90)) count++;
    if (demographics.genders && demographics.genders.length > 0) count++;
    if (demographics.ethnicities && demographics.ethnicities.length > 0) count++;
    if (demographics.educationLevels && demographics.educationLevels.length > 0) count++;
    if (demographics.incomeBrackets && demographics.incomeBrackets.length > 0) count++;
    if (demographics.sectors && demographics.sectors.length > 0) count++;
    if (geographic.cities && geographic.cities.length > 0) count++;
    if (cultural.religions && cultural.religions.length > 0) count++;
    if (cultural.interests && cultural.interests.length > 0) count++;
    if (cultural.culturalBackgrounds && cultural.culturalBackgrounds.length > 0) count++;
    
    return count;
  };

  const value = {
    mode,
    setMode,
    sidebarOpen,
    setSidebarOpen,
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    distribution,
    setDistribution,
    updateDistribution,
    clearDistribution,
    resultPersonas,
    allPersonas,
    getActiveFiltersCount
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}

