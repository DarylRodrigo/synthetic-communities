import { useState, useEffect } from 'react';
import { X, Heart, User, Sparkles, RotateCcw, Search } from 'lucide-react';
import { interpretDistributionWithAI } from '../../utils/aiFilters';
import { initializeAI, generateWithAI } from '../../utils/aiUtils';
import './ProcreateModal.css';

export default function ProcreateModal({ maleParent, femaleParent, onClose, onCreate }) {
  const [generating, setGenerating] = useState(false);
  const [childPreview, setChildPreview] = useState(null);

  const generateChild = async () => {
    if (!maleParent || !femaleParent) {
      alert('Please select both parents');
      return;
    }

    setGenerating(true);

    try {
      const parent1 = maleParent;
      const parent2 = femaleParent;

      // Create detailed prompt for AI child generation
      const prompt = `Create a child persona by merging these two parents:

PARENT 1: ${parent1.name} (${parent1.age}, ${parent1.ethnicity}, ${parent1.sector} in ${parent1.city})
PARENT 2: ${parent2.name} (${parent2.age}, ${parent2.ethnicity}, ${parent2.sector} in ${parent2.city})

Create realistic child (age 18-35) inheriting balanced traits from both parents.

Return JSON array with one object:
[
  {
    "name": "Full name",
    "age": number,
    "gender": "M" or "F",
    "city": "Swiss city",
    "sector": "work sector",
    "education_level": "education",
    "ethnicity": "background",
    "religion": "religion",
    "backstory": "200-400 word life story",
    "personality_traits": {
      "openness": number (0-1),
      "conscientiousness": number (0-1),
      "extraversion": number (0-1),
      "agreeableness": number (0-1),
      "neuroticism": number (0-1)
    },
    "interests": ["interest1", "interest2", "interest3"]
  }
]`;

      // Use AI to generate the child (without structured output for now)
      console.log('Sending prompt to AI:', prompt.substring(0, 200) + '...');
      const aiResponse = await generateWithAI(prompt);
      console.log('AI Response received:', aiResponse);
      console.log('AI Response length:', aiResponse.length);

      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('AI returned empty response');
      }

      // Clean and parse the JSON response
      let cleanResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/^\s*```/, '')
        .replace(/```\s*$/, '')
        .trim();

      console.log('Cleaned Response:', cleanResponse);

      if (cleanResponse.length === 0) {
        throw new Error('Response became empty after cleaning');
      }

      // Additional cleaning for any remaining markdown or extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      console.log('Final JSON:', cleanResponse);

      if (cleanResponse.length === 0) {
        throw new Error('No JSON object found in response');
      }

      // Parse the JSON response (it's an array with one object)
      const responseArray = JSON.parse(cleanResponse);

      if (!Array.isArray(responseArray) || responseArray.length === 0) {
        throw new Error('AI response is not a valid array');
      }

      const childData = responseArray[0];

      // Add missing fields that weren't in the simplified prompt
      const child = {
        id: `child_${Date.now()}`,
        name: childData.name,
        age: childData.age,
        gender: childData.gender === 'Male' ? 'M' : 'F', // Normalize to M/F format
        city: childData.city,
        sector: childData.sector,
        education_level: childData.education_level || 'Bachelor',
        income_bracket: childData.income_bracket || 'middle',
        ethnicity: childData.ethnicity,
        cultural_background: childData.cultural_background || 'European',
        religion: childData.religion || 'None',
        backstory: childData.backstory,
        personality_traits: childData.personality_traits,
        interests: childData.interests,
        company: childData.company || 'Company',
      };

      setChildPreview(child);
    } catch (error) {
      console.error('Generation error:', error);
      alert('Error creating child: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };


  const handleCreate = () => {
    if (childPreview) {
      onCreate(childPreview);
    }
  };

  return (
    <div className='modal-overlay' onClick={onClose}>
      <div className='modal' onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className='modal-header'>
          <h2>Create Child Persona</h2>
          <button className='modal-close' onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='modal-content'>
          <div className='procreate-form'>
            {/* Selected Parents Display */}
            <div className='form-section'>
              <h3>Selected Parents</h3>
              <div className='parents-grid'>
                {/* Male Parent Card */}
                <div className='selected-parent gender-male'>
                  <div className='parent-avatar'>
                    {maleParent.name?.charAt(0)?.toUpperCase() || 'M'}
                  </div>
                  <div className='parent-info'>
                    <h4>{maleParent.name}</h4>
                    <p>{maleParent.age} years • {maleParent.city}</p>
                    <p>{maleParent.sector}</p>
                  </div>
                </div>

                {/* Female Parent Card */}
                <div className='selected-parent gender-female'>
                  <div className='parent-avatar'>
                    {femaleParent.name?.charAt(0)?.toUpperCase() || 'F'}
                  </div>
                  <div className='parent-info'>
                    <h4>{femaleParent.name}</h4>
                    <p>{femaleParent.age} years • {femaleParent.city}</p>
                    <p>{femaleParent.sector}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className='generate-section'>
              <button
                className='generate-btn'
                onClick={generateChild}
                disabled={generating}
              >
                {generating ? <RotateCcw size={16} className='spinning' /> : <Sparkles size={16} />}
                {generating ? 'Creating Child...' : 'Generate Child'}
              </button>
            </div>

            {/* Child Preview */}
            {childPreview && (
              <div className='child-preview'>
                <div className='preview-header'>
                  <h3>Child Preview</h3>
                  <div className='preview-actions'>
                    <button
                      className='create-btn'
                      onClick={handleCreate}
                    >
                      <User size={16} />
                      Create This Child
                    </button>
                  </div>
                </div>

                <div className='preview-card'>
                  <div className='preview-avatar'>
                    {childPreview.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className='preview-info'>
                    <h4>{childPreview.name}</h4>
                    <p>{childPreview.age} years old • {childPreview.gender}</p>
                    <p>{childPreview.city} • {childPreview.sector}</p>
                    <p>{childPreview.ethnicity} • {childPreview.education_level}</p>
                  </div>
                </div>

                <div className='preview-details'>
                  <h4>Personality Traits</h4>
                  <div className='traits-preview'>
                    {Object.entries(childPreview.personality_traits).map(([trait, value]) => (
                      <div key={trait} className='trait-preview'>
                        <span>{trait}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>

                  <h4>Backstory</h4>
                  <p className='backstory-preview'>{childPreview.backstory}</p>

                  <h4>Interests</h4>
                  <div className='interests-preview'>
                    {childPreview.interests.map((interest, index) => (
                      <span key={index} className='interest-tag'>{interest}</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

