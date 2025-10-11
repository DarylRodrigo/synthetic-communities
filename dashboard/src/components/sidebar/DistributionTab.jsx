import { useState, useMemo } from 'react';
import { Sparkles, AlertCircle } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { getUniqueValues } from '../../utils/filterUtils';
import { interpretDistributionWithAI } from '../../utils/aiFilters';

export default function DistributionTab() {
  const { allPersonas, distribution, updateDistribution, clearDistribution, setMode, setDistribution } = useFilters();
  const [loading, setLoading] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Get top categories (max 6 to avoid clutter)
  const topReligions = useMemo(() => {
    const counts = {};
    allPersonas.forEach(p => {
      const religion = p.religion || 'Unknown';
      counts[religion] = (counts[religion] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([religion]) => religion);
  }, [allPersonas]);

  const topEthnicities = useMemo(() => {
    const counts = {};
    allPersonas.forEach(p => {
      const ethnicity = p.ethnicity || 'Unknown';
      counts[ethnicity] = (counts[ethnicity] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ethnicity]) => ethnicity);
  }, [allPersonas]);

  const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56-65', '66+'];
  const genders = ['Male', 'Female'];

  const updateSlider = (category, key, value) => {
    updateDistribution(category, {
      ...distribution[category],
      [key]: parseFloat(value)
    });
  };

  const getTotal = (category) => {
    const values = Object.values(distribution[category] || {});
    return values.reduce((sum, val) => sum + val, 0);
  };

  const isValidTotal = (category) => {
    const total = getTotal(category);
    return Math.abs(total - 100) < 0.1 || total === 0;
  };

  const handleAI = async () => {
    if (!aiQuery.trim()) {
      alert('Please describe your desired distribution');
      return;
    }

    setAiLoading(true);
    try {
      const availableOptions = {
        religions: topReligions,
        ethnicities: topEthnicities
      };

      const interpretedDist = await interpretDistributionWithAI(aiQuery, availableOptions);
      
      // Show preview
      const preview = `Interpreted distribution:\n\n` +
        `Sample Size: ${interpretedDist.sampleSize}\n` +
        `Gender: ${Object.entries(interpretedDist.gender || {}).map(([k, v]) => `${k} ${v.toFixed(0)}%`).join(', ')}\n` +
        `Age Groups: ${Object.entries(interpretedDist.ageGroups || {}).slice(0, 3).map(([k, v]) => `${k} ${v.toFixed(0)}%`).join(', ')}...\n\n` +
        `Apply this distribution?`;
      
      if (confirm(preview)) {
        setDistribution(interpretedDist);
        setAiQuery(''); // Clear input after success
      }
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error interpreting distribution: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const handleApply = async () => {
    // Validate all totals
    if (!isValidTotal('gender') || !isValidTotal('ageGroups') || 
        !isValidTotal('religion') || !isValidTotal('ethnicity')) {
      alert('All distribution percentages must add up to 100%');
      return;
    }

    setLoading(true);
    setMode('distribution');
    // Simulate processing time for sampling
    await new Promise(resolve => setTimeout(resolve, 500));
    setLoading(false);
  };

  const DistributionSliders = ({ category, items, label }) => {
    const total = getTotal(category);
    const remaining = 100 - total;
    const isValid = isValidTotal(category);

    return (
      <div className='filter-control'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label className='filter-label'>{label}</label>
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600',
            color: isValid || total === 0 ? '#10b981' : '#ef4444'
          }}>
            {total.toFixed(0)}%
          </span>
        </div>
        
        {items.map(item => {
          const value = distribution[category]?.[item] || 0;
          return (
            <div key={item} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: '#475569' }}>{item}</span>
                <span style={{ fontSize: '13px', fontWeight: '500', color: '#0f172a' }}>{value}%</span>
              </div>
              <input
                type='range'
                min={0}
                max={100}
                step={1}
                value={value}
                onChange={(e) => updateSlider(category, item, e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          );
        })}
        
        {!isValid && total > 0 && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            padding: '8px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <AlertCircle size={14} color='#ef4444' />
            <span style={{ fontSize: '12px', color: '#dc2626' }}>
              {remaining > 0 ? `${remaining.toFixed(0)}% remaining` : `Over by ${Math.abs(remaining).toFixed(0)}%`}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='distribution-tab'>
      <div style={{ marginBottom: '20px' }}>
        <textarea
          placeholder='Describe your desired distribution... (e.g., "500 personas, 70% male, mostly young")'
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

      <div className='filter-control'>
        <label className='filter-label'>Sample Size</label>
        <input
          type='number'
          min={1}
          max={allPersonas.length}
          value={distribution.sampleSize}
          onChange={(e) => updateDistribution('sampleSize', parseInt(e.target.value) || 1)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            fontSize: '14px'
          }}
        />
        <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
          Max: {allPersonas.length.toLocaleString()}
        </span>
      </div>

      <div className='filter-section'>
        <h4>Target Distributions</h4>
        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
          Adjust sliders to match your desired distribution. Each category must total 100%.
        </p>

        <DistributionSliders 
          category='gender' 
          items={genders}
          label='Gender' 
        />

        <DistributionSliders 
          category='ageGroups' 
          items={ageGroups}
          label='Age Groups' 
        />

        <DistributionSliders 
          category='religion' 
          items={topReligions}
          label='Religion (Top 6)' 
        />

        <DistributionSliders 
          category='ethnicity' 
          items={topEthnicities}
          label='Ethnicity (Top 6)' 
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
        <button 
          className='action-button' 
          onClick={handleApply}
          disabled={loading}
          style={{ flex: 1 }}
        >
          {loading ? 'Sampling...' : 'Apply Distribution'}
        </button>
        <button 
          className='action-button secondary' 
          onClick={clearDistribution}
          style={{ flex: 1 }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}

