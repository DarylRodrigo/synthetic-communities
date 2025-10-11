import { useState } from 'react';
import { Edit, MapPin, Building, GraduationCap, Globe2, Sparkles, Wallet } from 'lucide-react';
import './PersonaCard.css';

export default function PersonaCard({ persona, isSelected, onSelect, onEdit, procreateMode, onProcreateClick }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCardClick = (e) => {
    // Don't toggle if clicking on checkbox or edit button
    if (e.target.type === 'checkbox' || e.target.closest('.edit-btn')) {
      return;
    }

    // If in procreate mode, select parent instead of expanding
    if (procreateMode && onProcreateClick) {
      onProcreateClick();
      return;
    }

    setIsExpanded(!isExpanded);
  };

  const formatBackstory = (backstory) => {
    if (!backstory) return 'No backstory available';

    // Convert line breaks and basic formatting
    return backstory
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  const genderClass = persona.gender === 'M' ? 'gender-male' : persona.gender === 'F' ? 'gender-female' : '';

  return (
    <div className={`persona-card ${isExpanded ? 'expanded' : ''} ${isSelected ? 'selected' : ''} ${genderClass} ${procreateMode ? 'procreate-mode' : ''}`}>
      {/* Selection Checkbox or Procreate Indicator */}
      <div className='card-header'>
        {!procreateMode ? (
          <>
            <label className='selection-checkbox'>
              <input
                type='checkbox'
                checked={isSelected}
                onChange={onSelect}
              />
              <span className='checkmark'></span>
            </label>

            <button
              className='edit-btn'
              onClick={() => onEdit(persona)}
              title='Edit persona'
            >
              <Edit size={16} />
            </button>
          </>
        ) : (
          <div className='procreate-indicator'>
            Click to Select
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className='card-content' onClick={handleCardClick}>
        {/* Avatar and Basic Info */}
        <div className='card-avatar-section'>
          <div className='avatar'>
            {persona.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className='basic-info'>
            <h3 className='persona-name'>{persona.name || 'Unknown'}</h3>
            <div className='persona-meta'>
              <span className='age'>{persona.age || '??'} years old</span>
              <span className='gender'>{persona.gender || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Location and Job */}
        <div className='card-details'>
          <div className='detail-item'>
            <MapPin size={16} />
            <span>{persona.city || 'Unknown'}, {persona.country || 'CH'}</span>
          </div>
          <div className='detail-item'>
            <Building size={16} />
            <span>{persona.sector || 'Unknown'}</span>
          </div>
          <div className='detail-item'>
            <GraduationCap size={16} />
            <span>{persona.education_level || 'Unknown'}</span>
          </div>
        </div>

        {/* Key Traits */}
        <div className='card-traits'>
          <div className='trait-item'>
            <Globe2 size={14} />
            <span>{persona.ethnicity || 'Unknown'}</span>
          </div>
          <div className='trait-item'>
            <Sparkles size={14} />
            <span>{persona.religion || 'Unknown'}</span>
          </div>
          <div className='trait-item'>
            <Wallet size={14} />
            <span>{persona.income_bracket || 'Unknown'}</span>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className='expanded-content'>
            {/* Personality Traits */}
            {persona.personality_traits && (
              <div className='traits-section'>
                <h4>Personality Traits</h4>
                <div className='personality-grid'>
                  {Object.entries(persona.personality_traits).map(([trait, value]) => (
                    <div key={trait} className='personality-item'>
                      <span className='trait-name'>{trait}:</span>
                      <div className='trait-bar'>
                        <div
                          className='trait-fill'
                          style={{ width: `${(value || 0) * 100}%` }}
                        ></div>
                      </div>
                      <span className='trait-value'>{value?.toFixed(2) || '0.00'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Backstory */}
            {persona.backstory && (
              <div className='backstory-section'>
                <h4>Life Story</h4>
                <div
                  className='backstory-text'
                  dangerouslySetInnerHTML={{ __html: formatBackstory(persona.backstory) }}
                />
              </div>
            )}

            {/* Interests */}
            {persona.interests && persona.interests.length > 0 && (
              <div className='interests-section'>
                <h4>Interests</h4>
                <div className='interests-tags'>
                  {persona.interests.map((interest, index) => (
                    <span key={index} className='interest-tag'>{interest}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Media Consumption */}
            {persona.media_diet && (
              <div className='media-section'>
                <h4>Media Consumption</h4>
                <div className='media-grid'>
                  {Object.entries(persona.media_diet).map(([medium, percentage]) => (
                    <div key={medium} className='media-item'>
                      <span className='media-name'>{medium.replace('_', ' ')}:</span>
                      <span className='media-percentage'>{Math.round(percentage * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Expand Toggle */}
      <button
        className='expand-toggle'
        onClick={handleCardClick}
        title={isExpanded ? 'Collapse' : 'Expand details'}
      >
        {isExpanded ? '−' : '+'}
      </button>
    </div>
  );
}

