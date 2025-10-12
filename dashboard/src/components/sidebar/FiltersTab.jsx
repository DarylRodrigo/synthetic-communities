import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { getUniqueValues, getUniqueInterests } from '../../utils/filterUtils';
import { interpretFiltersWithAI } from '../../utils/aiFilters';

export default function FiltersTab() {
  const { allPersonas, filters, updateFilter, clearFilters, setMode, setFilters, getActiveFiltersCount } = useFilters();
  const [expandedSection, setExpandedSection] = useState('demographics');
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Get unique values for dropdowns
  const uniqueGenders = getUniqueValues(allPersonas, 'gender');
  const uniqueEthnicities = getUniqueValues(allPersonas, 'ethnicity');
  const uniqueEducation = getUniqueValues(allPersonas, 'education_level');
  const uniqueIncome = getUniqueValues(allPersonas, 'income_bracket');
  const uniqueSectors = getUniqueValues(allPersonas, 'sector');
  const uniqueCities = getUniqueValues(allPersonas, 'city');
  const uniqueReligions = getUniqueValues(allPersonas, 'religion');
  const uniqueInterests = getUniqueInterests(allPersonas);
  const uniqueCulturalBgs = getUniqueValues(allPersonas, 'cultural_background');

  const toggleCheckbox = (category, key, value) => {
    const current = filters[category][key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    updateFilter(category, key, updated);
  };

  const handleAI = async () => {
    if (!aiQuery.trim()) {
      alert('Please describe what personas you want to filter');
      return;
    }

    setAiLoading(true);
    try {
      const availableOptions = {
        cities: uniqueCities,
        ethnicities: uniqueEthnicities,
        education: uniqueEducation,
        income: uniqueIncome,
        sectors: uniqueSectors,
        religions: uniqueReligions
      };

      const interpretedFilters = await interpretFiltersWithAI(aiQuery, availableOptions);
      
      // Show preview
      const preview = `Interpreted filters:\n\nAge: ${interpretedFilters.demographics.ageRange[0]}-${interpretedFilters.demographics.ageRange[1]}\n` +
        `Genders: ${(interpretedFilters.demographics.genders || []).join(', ') || 'All'}\n` +
        `Ethnicities: ${(interpretedFilters.demographics.ethnicities || []).slice(0, 3).join(', ')}${((interpretedFilters.demographics.ethnicities || []).length > 3 ? '...' : '' || 'All')}\n` +
        `Education: ${(interpretedFilters.demographics.educationLevels || []).join(', ') || 'All'}\n` +
        `Cities: ${(interpretedFilters.geographic.cities || []).join(', ') || 'All'}\n\n` +
        `Apply these filters?`;
      
      if (confirm(preview)) {
        // Extract only the filter structure from the AI response and merge with defaults
        const filterData = {
          demographics: {
            ageRange: [18, 90], // Default age range
            genders: [],
            ethnicities: [],
            educationLevels: [],
            incomeBrackets: [],
            sectors: [],
            ...interpretedFilters.demographics // Override with AI response
          },
          geographic: {
            cities: [],
            ...interpretedFilters.geographic // Override with AI response
          },
          cultural: {
            religions: [],
            interests: [],
            culturalBackgrounds: [],
            ...interpretedFilters.cultural // Override with AI response
          }
        };
        setFilters(filterData);
        setMode('filter');
        setAiQuery(''); // Clear input after success
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error interpreting query: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className='filters-tab'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button className='action-button secondary' onClick={clearFilters} disabled={activeCount === 0}>
          <X size={16} />
          Clear All {activeCount > 0 && `(${activeCount})`}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <textarea
          placeholder='Describe the personas you want... (e.g., "young tech workers in Zurich")'
          value={aiQuery}
          onChange={(e) => setAiQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            resize: 'vertical',
            minHeight: '60px',
            marginBottom: '8px'
          }}
        />
        <button className='action-button' onClick={handleAI} disabled={aiLoading || !aiQuery.trim()}>
          <Sparkles size={16} />
          {aiLoading ? 'Interpreting...' : 'I\'m Feeling Lazy'}
        </button>
      </div>

      {/* Demographics Section */}
      <div className='filter-section'>
        <h4>Demographics</h4>

        <div className='filter-control'>
          <label className='filter-label'>Age Range</label>
          <div className='range-slider'>
            <input
              type='range'
              min={18}
              max={90}
              value={filters.demographics.ageRange[0]}
              onChange={(e) => updateFilter('demographics', 'ageRange', [parseInt(e.target.value), filters.demographics.ageRange[1]])}
            />
            <input
              type='range'
              min={18}
              max={90}
              value={filters.demographics.ageRange[1]}
              onChange={(e) => updateFilter('demographics', 'ageRange', [filters.demographics.ageRange[0], parseInt(e.target.value)])}
            />
            <div className='range-value'>
              <span>{filters.demographics.ageRange[0]}</span>
              <span>{filters.demographics.ageRange[1]}</span>
            </div>
          </div>
        </div>

        <div className='filter-control'>
          <label className='filter-label'>Gender</label>
          <div className='checkbox-group'>
            {uniqueGenders.map(gender => (
              <div key={gender} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`gender-${gender}`}
                  checked={filters.demographics.genders.includes(gender)}
                  onChange={() => toggleCheckbox('demographics', 'genders', gender)}
                />
                <label htmlFor={`gender-${gender}`}>{gender}</label>
              </div>
            ))}
          </div>
        </div>

        <div className='filter-control'>
          <label className='filter-label'>Ethnicity ({filters.demographics.ethnicities.length} selected)</label>
          <div className='checkbox-group'>
            {uniqueEthnicities.map(ethnicity => (
              <div key={ethnicity} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`ethnicity-${ethnicity}`}
                  checked={filters.demographics.ethnicities.includes(ethnicity)}
                  onChange={() => toggleCheckbox('demographics', 'ethnicities', ethnicity)}
                />
                <label htmlFor={`ethnicity-${ethnicity}`}>{ethnicity}</label>
              </div>
            ))}
          </div>
        </div>

        <div className='filter-control'>
          <label className='filter-label'>Education Level</label>
          <div className='checkbox-group'>
            {uniqueEducation.map(edu => (
              <div key={edu} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`edu-${edu}`}
                  checked={filters.demographics.educationLevels.includes(edu)}
                  onChange={() => toggleCheckbox('demographics', 'educationLevels', edu)}
                />
                <label htmlFor={`edu-${edu}`}>{edu}</label>
              </div>
            ))}
          </div>
        </div>

        <div className='filter-control'>
          <label className='filter-label'>Income Bracket</label>
          <div className='checkbox-group'>
            {uniqueIncome.map(income => (
              <div key={income} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`income-${income}`}
                  checked={filters.demographics.incomeBrackets.includes(income)}
                  onChange={() => toggleCheckbox('demographics', 'incomeBrackets', income)}
                />
                <label htmlFor={`income-${income}`}>{income}</label>
              </div>
            ))}
          </div>
        </div>

        <div className='filter-control'>
          <label className='filter-label'>Job Sector ({filters.demographics.sectors.length} selected)</label>
          <div className='checkbox-group'>
            {uniqueSectors.map(sector => (
              <div key={sector} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`sector-${sector}`}
                  checked={filters.demographics.sectors.includes(sector)}
                  onChange={() => toggleCheckbox('demographics', 'sectors', sector)}
                />
                <label htmlFor={`sector-${sector}`}>{sector}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Section */}
      <div className='filter-section'>
        <h4>Geographic</h4>

        <div className='filter-control'>
          <label className='filter-label'>Cities ({filters.geographic.cities.length} selected)</label>
          <div className='checkbox-group'>
            {uniqueCities.slice(0, 20).map(city => (
              <div key={city} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`city-${city}`}
                  checked={filters.geographic.cities.includes(city)}
                  onChange={() => toggleCheckbox('geographic', 'cities', city)}
                />
                <label htmlFor={`city-${city}`}>{city}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cultural Section */}
      <div className='filter-section'>
        <h4>Cultural</h4>

        <div className='filter-control'>
          <label className='filter-label'>Religion ({filters.cultural.religions.length} selected)</label>
          <div className='checkbox-group'>
            {uniqueReligions.map(religion => (
              <div key={religion} className='checkbox-item'>
                <input
                  type='checkbox'
                  id={`religion-${religion}`}
                  checked={filters.cultural.religions.includes(religion)}
                  onChange={() => toggleCheckbox('cultural', 'religions', religion)}
                />
                <label htmlFor={`religion-${religion}`}>{religion}</label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

