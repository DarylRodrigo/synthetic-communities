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
      const prompt = `You are creating a synthetic child persona by intelligently merging two parent personas. Create a realistic child (age 18+) who inherits traits from both parents.

PARENT 1 (Father):
- Name: ${parent1.name}
- Age: ${parent1.age}
- Gender: ${parent1.gender === 'M' ? 'Male' : 'Female'}
- Ethnicity: ${parent1.ethnicity}
- City: ${parent1.city}
- Sector: ${parent1.sector}
- Education: ${parent1.education_level}
- Income: ${parent1.income_bracket}
- Religion: ${parent1.religion || 'Not specified'}
- Cultural Background: ${parent1.cultural_background || 'Not specified'}
${parent1.personality_traits ? `- Personality: Openness ${parent1.personality_traits.openness}, Conscientiousness ${parent1.personality_traits.conscientiousness}, Extraversion ${parent1.personality_traits.extraversion}, Agreeableness ${parent1.personality_traits.agreeableness}, Neuroticism ${parent1.personality_traits.neuroticism}` : ''}
${parent1.interests ? `- Interests: ${parent1.interests.join(', ')}` : ''}
${parent1.backstory ? `- Backstory: ${parent1.backstory}` : ''}

PARENT 2 (Mother):
- Name: ${parent2.name}
- Age: ${parent2.age}
- Gender: ${parent2.gender === 'F' ? 'Female' : 'Male'}
- Ethnicity: ${parent2.ethnicity}
- City: ${parent2.city}
- Sector: ${parent2.sector}
- Education: ${parent2.education_level}
- Income: ${parent2.income_bracket}
- Religion: ${parent2.religion || 'Not specified'}
- Cultural Background: ${parent2.cultural_background || 'Not specified'}
${parent2.personality_traits ? `- Personality: Openness ${parent2.personality_traits.openness}, Conscientiousness ${parent2.personality_traits.conscientiousness}, Extraversion ${parent2.personality_traits.extraversion}, Agreeableness ${parent2.personality_traits.agreeableness}, Neuroticism ${parent2.personality_traits.neuroticism}` : ''}
${parent2.interests ? `- Interests: ${parent2.interests.join(', ')}` : ''}
${parent2.backstory ? `- Backstory: ${parent2.backstory}` : ''}

INSTRUCTIONS:
Create a realistic child (age 18-35) who inherits a balanced mix of traits from both parents. The child should feel like a natural combination of the two parents while having their own unique identity.

Return a JSON object with these exact fields:
{
  "name": "Full name",
  "age": number (18-35),
  "gender": "M" or "F",
  "city": "Swiss city name",
  "sector": "work sector",
  "company": "company name",
  "education_level": "education level",
  "income_bracket": "low|middle_low|middle|middle_high|high",
  "ethnicity": "ethnic background",
  "cultural_background": "cultural background",
  "religion": "religion",
  "backstory": "detailed life story (200-400 words)",
  "personality_traits": {
    "openness": number (0-1),
    "conscientiousness": number (0-1),
    "extraversion": number (0-1),
    "agreeableness": number (0-1),
    "neuroticism": number (0-1)
  },
  "interests": ["interest1", "interest2", "interest3"]
}

Make the backstory realistic, entertaining, and reflect the family background. Include specific details about their upbringing, education, career, and life experiences.`;

      // Use AI to generate the child (without structured output for now)
      const aiResponse = await generateWithAI(prompt);
      console.log('AI Response:', aiResponse);

      // Clean and parse the JSON response
      let cleanResponse = aiResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*$/g, '')
        .replace(/^\s*```/, '')
        .replace(/```\s*$/, '')
        .trim();

      console.log('Cleaned Response:', cleanResponse);

      // Additional cleaning for any remaining markdown or extra text
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      }

      console.log('Final JSON:', cleanResponse);

      // Parse the JSON response
      const childData = JSON.parse(cleanResponse);

      // Convert gender to match our system
      const child = {
        id: `child_${Date.now()}`,
        ...childData,
        gender: childData.gender === 'Male' ? 'M' : 'F', // Normalize to M/F format
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

