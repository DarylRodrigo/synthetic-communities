import { Users, Building2, GraduationCap, Globe } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';

export default function PresetsTab() {
  const { setFilters, setMode } = useFilters();

  const presets = [
    {
      id: 'young-professionals',
      name: 'Young Professionals',
      description: '25-35 years, Bachelor+ degree, Tech/Finance sectors',
      icon: GraduationCap,
      filters: {
        demographics: {
          ageRange: [25, 35],
          genders: [],
          ethnicities: [],
          educationLevels: ['Bachelor', 'Master', 'Doctorate'],
          incomeBrackets: [],
          sectors: ['Technology', 'Finance', 'Healthcare', 'Education']
        },
        geographic: { cities: [] },
        cultural: {
          religions: [],
          interests: [],
          culturalBackgrounds: []
        }
      }
    },
    {
      id: 'senior-citizens',
      name: 'Senior Citizens',
      description: '65+ years, all backgrounds',
      icon: Users,
      filters: {
        demographics: {
          ageRange: [65, 90],
          genders: [],
          ethnicities: [],
          educationLevels: [],
          incomeBrackets: [],
          sectors: []
        },
        geographic: { cities: [] },
        cultural: {
          religions: [],
          interests: [],
          culturalBackgrounds: []
        }
      }
    },
    {
      id: 'urban-elite',
      name: 'Urban Elite',
      description: 'Zurich/Geneva/Basel, Master+, High income',
      icon: Building2,
      filters: {
        demographics: {
          ageRange: [18, 90],
          genders: [],
          ethnicities: [],
          educationLevels: ['Master', 'Doctorate'],
          incomeBrackets: ['high', 'middle_high'],
          sectors: []
        },
        geographic: { 
          cities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'] 
        },
        psychological: {
          clusters: [],
          personalityRanges: {
            openness: [0, 1],
            conscientiousness: [0, 1],
            extraversion: [0, 1],
            agreeableness: [0, 1],
            neuroticism: [0, 1]
          }
        },
        cultural: {
          religions: [],
          interests: [],
          culturalBackgrounds: []
        }
      }
    },
    {
      id: 'cultural-minorities',
      name: 'Cultural Minorities',
      description: 'Non-Swiss ethnicities, diverse backgrounds',
      icon: Globe,
      filters: {
        demographics: {
          ageRange: [18, 90],
          genders: [],
          ethnicities: ['German', 'French', 'Italian', 'Portuguese', 'Kosovan', 'Spanish', 'Turkish', 
                       'Sri Lankan', 'Chinese', 'Indian', 'Brazilian', 'Syrian', 'Afghan', 'Vietnamese'],
          educationLevels: [],
          incomeBrackets: [],
          sectors: []
        },
        geographic: { cities: [] },
        cultural: {
          religions: [],
          interests: [],
          culturalBackgrounds: []
        }
      }
    }
  ];

  const applyPreset = (preset) => {
    setFilters(preset.filters);
    setMode('filter');
  };

  return (
    <div className='presets-tab'>
      <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        Quick-start filters for common persona segments
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {presets.map(preset => {
          const Icon = preset.icon;
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              style={{
                padding: '16px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(37, 99, 235, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: '#eff6ff',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Icon size={20} color='#2563eb' />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '600', 
                    color: '#0f172a',
                    marginBottom: '4px'
                  }}>
                    {preset.name}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    color: '#64748b',
                    lineHeight: '1.5'
                  }}>
                    {preset.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

