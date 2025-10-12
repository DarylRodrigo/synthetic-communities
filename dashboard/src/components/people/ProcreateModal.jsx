import { useState, useEffect } from 'react';
import { X, Heart, User, Sparkles, RotateCcw, Search } from 'lucide-react';
import { interpretDistributionWithAI } from '../../utils/aiFilters';
import { GoogleGenerativeAI } from '@google/generative-ai';
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

      // Create comprehensive prompt with detailed parent information
      const prompt = `Create a child persona by merging these two parents with realistic genetic and environmental inheritance:

FATHER: ${parent1.name}
- Age: ${parent1.age}
- Ethnicity: ${parent1.ethnicity}
- Education: ${parent1.education_level}
- Job: ${parent1.job || parent1.sector}
- City: ${parent1.city}
- Personality: ${JSON.stringify(parent1.personality_traits || {})}
- Religion: ${parent1.religion || 'Unknown'}
- Demeanour: ${parent1.demeanour || 'Unknown'}
- Interests: ${JSON.stringify(parent1.interests || [])}

MOTHER: ${parent2.name}
- Age: ${parent2.age}
- Ethnicity: ${parent2.ethnicity}
- Education: ${parent2.education_level}
- Job: ${parent2.job || parent2.sector}
- City: ${parent2.city}
- Personality: ${JSON.stringify(parent2.personality_traits || {})}
- Religion: ${parent2.religion || 'Unknown'}
- Demeanour: ${parent2.demeanour || 'Unknown'}
- Interests: ${JSON.stringify(parent2.interests || [])}

Create a realistic child (age 18-35) who inherits balanced traits from both parents.

Return ONLY valid JSON with this exact structure:
{
  "name": "Full name",
  "age": 25,
  "gender": "Male",
  "city": "Swiss city",
  "sector": "work sector",
  "education_level": "education level",
  "ethnicity": "ethnic background",
  "religion": "religious background",
  "backstory": "Documentary-style life story in 2 sentences max, third-person, factual and dense, no melodrama, no humor, no name-origin inventions. Anchor to numeric data (age, education, tenure) and concrete contributions/metrics. Format: 'Born YYYY. [Achievement/contribution].'",
  "personality_traits": {
    "openness": 0.75,
    "conscientiousness": 0.82,
    "extraversion": 0.68,
    "agreeableness": 0.71,
    "neuroticism": 0.34
  },
  "interests": ["interest1", "interest2", "interest3"]
}`;

      // Use Gemini 2.5 Pro with structured output
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('API Key available:', !!apiKey && apiKey !== 'your_api_key_here');

      if (!apiKey || apiKey === 'your_api_key_here') {
        throw new Error('GEMINI_API_KEY not configured. Please add it to .env file');
      }

      console.log('Initializing Gemini client...');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });

      console.log('Sending prompt to Gemini 2.5 Pro...');
      try {
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });

        console.log('Gemini API call completed successfully');

        if (!result || !result.response) {
          throw new Error('No response object returned from Gemini API');
        }

        const response = result.response.text();
        console.log('Response type:', typeof response);
        console.log('Response length:', response?.length || 0);
        console.log('Response preview:', response?.substring(0, 200) + '...' || 'No response');

        if (!response || response.trim().length === 0) {
          throw new Error('AI returned empty response');
        }

        // Process the response...
        // Clean the response
        let cleanResponse = response
          .replace(/```json\s*/g, '')
          .replace(/```\s*$/g, '')
          .replace(/^\s*```/, '')
          .replace(/```\s*$/, '')
          .trim();

        console.log('Cleaned Response:', cleanResponse);

        if (cleanResponse.length === 0) {
          throw new Error('Response became empty after cleaning');
        }

        // Parse the JSON response
        const childData = JSON.parse(cleanResponse);

        // Validate required fields
        if (!childData.name || !childData.age || !childData.personality_traits) {
          throw new Error('AI response missing required fields');
        }

        // Add missing fields with defaults
        const child = {
          id: `child_${Date.now()}`,
          name: childData.name,
          age: childData.age,
          gender: childData.gender === 'Male' ? 'Male' : 'Female',
          city: childData.city || parent1.city, // Default to father's city
          sector: childData.sector,
          education_level: childData.education_level || 'bachelor_degree',
          income_bracket: childData.income_bracket || 'middle',
          ethnicity: childData.ethnicity,
          cultural_background: childData.cultural_background || 'European',
          country: childData.country || 'CH_de',
          susceptibility: childData.susceptibility || 0.3,
          trust_institution: childData.trust_institution || 0.7,
          turnout_propensity: childData.turnout_propensity || 0.7,
          media_diet: childData.media_diet || {"social_media": 0.25, "tv": 0.1, "newspaper": 0.35, "blogs": 0.3},
          confirmation_bias: childData.confirmation_bias || 0.25,
          social_network_influence: childData.social_network_influence || 0.15,
          risk_aversion: childData.risk_aversion || 0.35,
          fairness_value: childData.fairness_value || 0.6,
          prior_beliefs: childData.prior_beliefs || {"foreign_policy": 0.15, "technology": 0.8, "education": 0.75},
          timestamp: new Date().toISOString(),
          religion: childData.religion || 'None',
          demeanour: childData.demeanour || 'Balanced and thoughtful',
          backstory: childData.backstory,
          personality_traits: childData.personality_traits,
          interests: childData.interests,
          company: childData.company || 'Independent',
        };

        setChildPreview(child);

      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError);
        console.error('Error details:', {
          message: geminiError.message,
          stack: geminiError.stack,
          code: geminiError.code,
          status: geminiError.status
        });
        throw new Error(`Gemini API failed: ${geminiError.message}`);
      }
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

