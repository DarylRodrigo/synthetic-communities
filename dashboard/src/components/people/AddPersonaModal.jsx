import { useState, useEffect } from 'react';
import { X, Save, Sparkles, RefreshCw } from 'lucide-react';
import { interpretFiltersWithAI } from '../../utils/aiFilters';
import './AddPersonaModal.css';

export default function AddPersonaModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    city: '',
    sector: '',
    company: '',
    education_level: '',
    income_bracket: '',
    ethnicity: '',
    cultural_background: '',
    religion: '',
    backstory: '',
    openness: '',
    conscientiousness: '',
    extraversion: '',
    agreeableness: '',
    neuroticism: '',
    interests: ''
  });

  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState({});

  // Available options for dropdowns
  const availableOptions = {
    cities: ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne', 'Lucerne', 'St. Gallen', 'Lugano'],
    ethnicities: ['Swiss-German', 'Swiss-French', 'Swiss-Italian', 'German', 'French', 'Italian', 'Portuguese', 'Kosovan', 'Spanish', 'Turkish'],
    education: ['High School', 'Bachelor', 'Master', 'Doctorate', 'Vocational', 'Trade School'],
    income: ['low', 'middle_low', 'middle', 'middle_high', 'high'],
    sectors: ['Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Retail', 'Government', 'Non-profit']
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

  const generateWithAI = async () => {
    setGenerating(true);

    try {
      // Use AI to generate persona data
      const query = `Create a realistic persona for Switzerland. Age between 18-90, include all required fields.`;

      const interpretedFilters = await interpretFiltersWithAI(query, availableOptions);

      // Convert to form data format
      const generatedData = {
        name: `Generated Person ${Math.floor(Math.random() * 1000)}`,
        age: Math.floor(Math.random() * (90 - 18) + 18),
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        city: interpretedFilters.geographic.cities[0] || 'Zurich',
        sector: interpretedFilters.demographics.sectors[0] || 'Technology',
        company: `Company ${Math.floor(Math.random() * 100)}`,
        education_level: interpretedFilters.demographics.educationLevels[0] || 'Bachelor',
        income_bracket: interpretedFilters.demographics.incomeBrackets[0] || 'middle',
        ethnicity: interpretedFilters.demographics.ethnicities[0] || 'Swiss-German',
        cultural_background: 'European',
        religion: interpretedFilters.cultural.religions[0] || 'Christian',
        backstory: 'Generated backstory...',
        openness: (Math.random() * 0.8 + 0.1).toFixed(2),
        conscientiousness: (Math.random() * 0.8 + 0.1).toFixed(2),
        extraversion: (Math.random() * 0.8 + 0.1).toFixed(2),
        agreeableness: (Math.random() * 0.8 + 0.1).toFixed(2),
        neuroticism: (Math.random() * 0.8 + 0.1).toFixed(2),
        interests: 'Technology, Sports, Music'
      };

      setFormData(generatedData);
      setErrors({});
    } catch (error) {
      console.error('AI Generation error:', error);
      alert('Error generating persona: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    // Validate all required fields
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare new persona
    const newPersona = {
      id: `persona_${Date.now()}`,
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
    console.log('Adding new persona:', newPersona);

    onSave(newPersona);
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='modal-header'>
          <h2>Add New Persona</h2>
          <button className='modal-close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* AI Generation Button */}
        <div className='ai-generation-section'>
          <button
            className='ai-generate-btn'
            onClick={generateWithAI}
            disabled={generating}
          >
            {generating ? <RefreshCw size={16} className='spinning' /> : <Sparkles size={16} />}
            {generating ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>

        {/* Content */}
        <div className='modal-content'>
          <form className='add-form'>
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
                    placeholder='Enter name'
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
                    placeholder='18-90'
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
                  <select
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  >
                    <option value=''>Select city</option>
                    {availableOptions.cities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>Sector</label>
                  <select
                    value={formData.sector}
                    onChange={(e) => handleInputChange('sector', e.target.value)}
                  >
                    <option value=''>Select sector</option>
                    {availableOptions.sectors.map(sector => (
                      <option key={sector} value={sector}>{sector}</option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>Company</label>
                  <input
                    type='text'
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    placeholder='Company name'
                  />
                </div>

                <div className='form-group'>
                  <label>Education Level</label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => handleInputChange('education_level', e.target.value)}
                  >
                    <option value=''>Select education</option>
                    {availableOptions.education.map(edu => (
                      <option key={edu} value={edu}>{edu}</option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>Income Bracket</label>
                  <select
                    value={formData.income_bracket}
                    onChange={(e) => handleInputChange('income_bracket', e.target.value)}
                  >
                    <option value=''>Select income</option>
                    {availableOptions.income.map(income => (
                      <option key={income} value={income}>{income}</option>
                    ))}
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
                  <select
                    value={formData.ethnicity}
                    onChange={(e) => handleInputChange('ethnicity', e.target.value)}
                  >
                    <option value=''>Select ethnicity</option>
                    {availableOptions.ethnicities.map(ethnicity => (
                      <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                    ))}
                  </select>
                </div>

                <div className='form-group'>
                  <label>Cultural Background</label>
                  <input
                    type='text'
                    value={formData.cultural_background}
                    onChange={(e) => handleInputChange('cultural_background', e.target.value)}
                    placeholder='Cultural background'
                  />
                </div>

                <div className='form-group'>
                  <label>Religion</label>
                  <input
                    type='text'
                    value={formData.religion}
                    onChange={(e) => handleInputChange('religion', e.target.value)}
                    placeholder='Religion'
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
                      placeholder='0.00'
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
          <button
            className='btn primary'
            onClick={handleSave}
          >
            <Save size={16} />
            Save Persona
          </button>
        </div>
      </div>
    </div>
  );
}

