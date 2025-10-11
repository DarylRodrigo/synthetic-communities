import { useState, useEffect } from 'react';
import { X, Save, RotateCcw, AlertCircle } from 'lucide-react';
import './EditPersonaModal.css';

export default function EditPersonaModal({ persona, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (persona) {
      setFormData({
        name: persona.name || '',
        age: persona.age || '',
        gender: persona.gender || '',
        city: persona.city || '',
        sector: persona.sector || '',
        company: persona.company || '',
        education_level: persona.education_level || '',
        income_bracket: persona.income_bracket || '',
        ethnicity: persona.ethnicity || '',
        cultural_background: persona.cultural_background || '',
        religion: persona.religion || '',
        backstory: persona.backstory || '',
        // Personality traits
        openness: persona.personality_traits?.openness || '',
        conscientiousness: persona.personality_traits?.conscientiousness || '',
        extraversion: persona.personality_traits?.extraversion || '',
        agreeableness: persona.personality_traits?.agreeableness || '',
        neuroticism: persona.personality_traits?.neuroticism || '',
        // Interests
        interests: persona.interests?.join(', ') || ''
      });
    }
  }, [persona]);

  // Track changes
  useEffect(() => {
    if (persona && Object.keys(formData).length > 0) {
      const changed = Object.keys(formData).some(key => {
        const originalValue = getOriginalValue(key);
        const currentValue = formData[key];
        return String(originalValue) !== String(currentValue);
      });
      setHasChanges(changed);
    }
  }, [formData, persona]);

  const getOriginalValue = (key) => {
    switch (key) {
      case 'openness':
      case 'conscientiousness':
      case 'extraversion':
      case 'agreeableness':
      case 'neuroticism':
        return persona.personality_traits?.[key] || '';
      case 'interests':
        return persona.interests?.join(', ') || '';
      default:
        return persona[key] || '';
    }
  };

  const validateField = (key, value) => {
    switch (key) {
      case 'age':
        const age = parseInt(value);
        if (isNaN(age) || age < 18 || age > 90) {
          return 'Age must be between 18 and 90';
        }
        break;
      case 'name':
        if (!value.trim()) {
          return 'Name is required';
        }
        break;
      case 'openness':
      case 'conscientiousness':
      case 'extraversion':
      case 'agreeableness':
      case 'neuroticism':
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 1) {
          return 'Must be a number between 0 and 1';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));

    // Validate immediately
    const error = validateField(key, value);
    setErrors(prev => ({ ...prev, [key]: error }));
  };

  const handleSave = async () => {
    // Validate all fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);

    try {
      // Prepare updated persona
      const updatedPersona = {
        ...persona,
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        city: formData.city,
        sector: formData.sector,
        company: formData.company,
        education_level: formData.education_level,
        income_bracket: formData.income_bracket,
        ethnicity: formData.ethnicity,
        cultural_background: formData.cultural_background,
        religion: formData.religion,
        backstory: formData.backstory,
        personality_traits: {
          openness: parseFloat(formData.openness),
          conscientiousness: parseFloat(formData.conscientiousness),
          extraversion: parseFloat(formData.extraversion),
          agreeableness: parseFloat(formData.agreeableness),
          neuroticism: parseFloat(formData.neuroticism)
        },
        interests: formData.interests.split(',').map(i => i.trim()).filter(i => i)
      };

      // TODO: Implement actual save to JSONL file
      console.log('Saving updated persona:', updatedPersona);

      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      onSave(updatedPersona);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (persona) {
      setFormData({
        name: persona.name || '',
        age: persona.age || '',
        gender: persona.gender || '',
        city: persona.city || '',
        sector: persona.sector || '',
        company: persona.company || '',
        education_level: persona.education_level || '',
        income_bracket: persona.income_bracket || '',
        ethnicity: persona.ethnicity || '',
        cultural_background: persona.cultural_background || '',
        religion: persona.religion || '',
        backstory: persona.backstory || '',
        openness: persona.personality_traits?.openness || '',
        conscientiousness: persona.personality_traits?.conscientiousness || '',
        extraversion: persona.personality_traits?.extraversion || '',
        agreeableness: persona.personality_traits?.agreeableness || '',
        neuroticism: persona.personality_traits?.neuroticism || '',
        interests: persona.interests?.join(', ') || ''
      });
      setErrors({});
    }
  };

  if (!persona) return null;

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='modal-header'>
          <h2>Edit Persona</h2>
          <button className='modal-close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='modal-content'>
          <form className='edit-form'>
            {/* Basic Info */}
            <div className='form-section'>
              <h3>Basic Information</h3>
              <div className='form-grid'>
                <div className='form-group'>
                  <label>Name *</label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className='error-text'>{errors.name}</span>}
                </div>

                <div className='form-group'>
                  <label>Age</label>
                  <input
                    type='number'
                    min={18}
                    max={90}
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className={errors.age ? 'error' : ''}
                  />
                  {errors.age && <span className='error-text'>{errors.age}</span>}
                </div>

                <div className='form-group'>
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                  >
                    <option value=''>Select gender</option>
                    <option value='Male'>Male</option>
                    <option value='Female'>Female</option>
                  </select>
                </div>

                <div className='form-group'>
                  <label>City</label>
                  <input
                    type='text'
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label>Sector</label>
                  <input
                    type='text'
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label>Company</label>
                  <input
                    type='text'
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label>Education Level</label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => handleInputChange('education_level', e.target.value)}
                  >
                    <option value=''>Select education</option>
                    <option value='High School'>High School</option>
                    <option value='Bachelor'>Bachelor</option>
                    <option value='Master'>Master</option>
                    <option value='Doctorate'>Doctorate</option>
                    <option value='Vocational'>Vocational</option>
                    <option value='Trade School'>Trade School</option>
                  </select>
                </div>

                <div className='form-group'>
                  <label>Income Bracket</label>
                  <select
                    value={formData.income_bracket}
                    onChange={(e) => handleInputChange('income_bracket', e.target.value)}
                  >
                    <option value=''>Select income</option>
                    <option value='low'>Low</option>
                    <option value='middle_low'>Middle Low</option>
                    <option value='middle'>Middle</option>
                    <option value='middle_high'>Middle High</option>
                    <option value='high'>High</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Cultural Info */}
            <div className='form-section'>
              <h3>Cultural Information</h3>
              <div className='form-grid'>
                <div className='form-group'>
                  <label>Ethnicity</label>
                  <input
                    type='text'
                    value={formData.ethnicity}
                    onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label>Cultural Background</label>
                  <input
                    type='text'
                    value={formData.cultural_background}
                    onChange={(e) => handleInputChange('cultural_background', e.target.value)}
                  />
                </div>

                <div className='form-group'>
                  <label>Religion</label>
                  <input
                    type='text'
                    value={formData.religion}
                    onChange={(e) => handleInputChange('religion', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Personality Traits */}
            <div className='form-section'>
              <h3>Personality Traits (0-1)</h3>
              <div className='form-grid'>
                {['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'].map(trait => (
                  <div key={trait} className='form-group'>
                    <label>{trait.charAt(0).toUpperCase() + trait.slice(1)}</label>
                    <input
                      type='number'
                      min={0}
                      max={1}
                      step={0.01}
                      value={formData[trait]}
                      onChange={(e) => handleInputChange(trait, e.target.value)}
                      className={errors[trait] ? 'error' : ''}
                    />
                    {errors[trait] && <span className='error-text'>{errors[trait]}</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Other Info */}
            <div className='form-section'>
              <h3>Additional Information</h3>
              <div className='form-group'>
                <label>Interests (comma-separated)</label>
                <textarea
                  value={formData.interests}
                  onChange={(e) => handleInputChange('interests', e.target.value)}
                  rows={3}
                  placeholder='Technology, Sports, Music, etc.'
                />
              </div>

              <div className='form-group'>
                <label>Backstory</label>
                <textarea
                  value={formData.backstory}
                  onChange={(e) => handleInputChange('backstory', e.target.value)}
                  rows={6}
                  placeholder='Tell their life story...'
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className='modal-footer'>
          <div className='footer-info'>
            {hasChanges && (
              <div className='changes-indicator'>
                <AlertCircle size={16} />
                <span>Unsaved changes</span>
              </div>
            )}
          </div>

          <div className='footer-buttons'>
            <button
              className='btn secondary'
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw size={16} />
              Reset
            </button>

            <button
              className='btn primary'
              onClick={handleSave}
              disabled={!hasChanges || saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
              {!saving && <Save size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

