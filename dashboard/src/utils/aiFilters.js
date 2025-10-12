/**
 * AI-powered filter and distribution interpretation using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function initializeAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('API Key loaded:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');
  console.log('All env vars:', import.meta.env);
  
  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured. Please add it to .env file');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function interpretFiltersWithAI(query, availableOptions = {}) {
  const ai = initializeAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-pro'
  });

  const filterSchema = {
    type: 'object',
    properties: {
      reasoning: {
        type: 'string',
        description: 'Explanation of how the natural language query was interpreted into structured filters'
      },
      demographics: {
        type: 'object',
        properties: {
          ageRange: {
            type: 'array',
            items: { type: 'number' },
            minItems: 2,
            maxItems: 2
          },
          genders: {
            type: 'array',
            items: { type: 'string', enum: ['Male', 'Female'] }
          },
          ethnicities: {
            type: 'array',
            items: { type: 'string' }
          },
          educationLevels: {
            type: 'array',
            items: { type: 'string' }
          },
          incomeBrackets: {
            type: 'array',
            items: { type: 'string' }
          },
          sectors: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      geographic: {
        type: 'object',
        properties: {
          cities: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      cultural: {
        type: 'object',
        properties: {
          religions: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    },
    required: ['reasoning', 'demographics', 'geographic', 'cultural']
  };

  const prompt = `Convert this natural language query into structured filters for persona selection.

User Query: "${query}"

Available Options (ONLY use values from these lists):
- Genders: Male, Female
- Cities: ${(availableOptions.cities || []).slice(0, 30).join(', ')}
- Ethnicities: ${(availableOptions.ethnicities || []).join(', ')}
- Education Levels: ${(availableOptions.education || []).join(', ')}
- Income Brackets: ${(availableOptions.income || []).join(', ')}
- Sectors: ${(availableOptions.sectors || []).join(', ')}
- Religions: ${(availableOptions.religions || []).join(', ')}

Rules:
1. ONLY use exact values from the available options above
2. ageRange: [min, max] where min and max are between 18 and 90
3. Empty arrays [] mean "no filter" (show all)
4. Be flexible with synonyms:
   - "young" or "youth" → [18, 35]
   - "middle-aged" → [36, 55]
   - "senior" or "elderly" → [65, 90]
   - "tech" → "Technology"
   - "finance" → "Finance"
   - "educated" → ["Bachelor", "Master", "Doctorate"]
   - "wealthy" or "rich" → ["high", "middle_high"]
   - "poor" → ["low"]
5. If uncertain, leave array empty rather than guessing

Examples:
- "young tech workers in Zurich" → ageRange: [18, 35], sectors: ["Technology"], cities: ["Zurich"]
- "educated women" → genders: ["Female"], educationLevels: ["Bachelor", "Master", "Doctorate"]
- "everyone" or "all" → all arrays empty

IMPORTANT: First provide a brief reasoning (2-3 sentences) explaining your interpretation, then return the structured filters.

Return ONLY valid JSON with this structure:
{
  "reasoning": "Brief explanation of interpretation",
  "demographics": { ... },
  "geographic": { ... },
  "cultural": { ... }
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const response = result.response.text();
  console.log('AI Filter Response:', response);
  const parsed = JSON.parse(response);
  
  // Handle both flat and nested response formats
  if (parsed.demographics) {
    // Already in correct format
    return parsed;
  } else {
    // Convert flat format to nested format
    return {
      demographics: {
        ageRange: parsed.ageRange || [18, 90],
        genders: parsed.genders || [],
        ethnicities: parsed.ethnicities || [],
        educationLevels: parsed.educationLevels || [],
        incomeBrackets: parsed.incomeBrackets || [],
        sectors: parsed.sectors || []
      },
      geographic: {
        cities: parsed.cities || []
      },
      cultural: {
        religions: parsed.religions || []
      }
    };
  }
}

export async function interpretDistributionWithAI(query, availableOptions = {}) {
  const ai = initializeAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-pro'
  });

  const distributionSchema = {
    type: 'object',
    properties: {
      reasoning: {
        type: 'string',
        description: 'Explanation of how the natural language query was interpreted into distribution percentages'
      },
      sampleSize: {
        type: 'number',
        minimum: 1
      },
      gender: {
        type: 'object',
        properties: {
          Male: { type: 'number', minimum: 0, maximum: 100 },
          Female: { type: 'number', minimum: 0, maximum: 100 }
        }
      },
      ageGroups: {
        type: 'object',
        properties: {
          '18-25': { type: 'number', minimum: 0, maximum: 100 },
          '26-35': { type: 'number', minimum: 0, maximum: 100 },
          '36-45': { type: 'number', minimum: 0, maximum: 100 },
          '46-55': { type: 'number', minimum: 0, maximum: 100 },
          '56-65': { type: 'number', minimum: 0, maximum: 100 },
          '66+': { type: 'number', minimum: 0, maximum: 100 }
        }
      },
      religion: {
        type: 'object',
        additionalProperties: { type: 'number', minimum: 0, maximum: 100 }
      },
      ethnicity: {
        type: 'object',
        additionalProperties: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    required: ['reasoning', 'sampleSize', 'gender', 'ageGroups', 'religion', 'ethnicity']
  };

  const prompt = `Convert this natural language query into distribution percentages for persona sampling.

User Query: "${query}"

Available Options:
- Top Religions: ${(availableOptions.religions || []).join(', ')}
- Top Ethnicities: ${(availableOptions.ethnicities || []).join(', ')}

Rules:
1. sampleSize: integer (default 500 if not specified in query)
2. Each category (gender, ageGroups, religion, ethnicity) percentages MUST add up to exactly 100
3. If a category isn't mentioned in the query, distribute evenly
4. Be flexible with natural language:
   - "mostly men" → Male: 70, Female: 30
   - "young people" → higher % in 18-25, 26-35
   - "diverse" → spread evenly
   - "equal split" → 50/50 or evenly distributed

Examples:
- "500 personas, 70% male, mostly young" → sampleSize: 500, gender: {Male: 70, Female: 30}, ageGroups: {18-25: 40, 26-35: 40, 36-45: 10, 46-55: 5, 56-65: 3, 66+: 2}
- "200 people, equal gender, all ages" → sampleSize: 200, gender: {Male: 50, Female: 50}, ageGroups: even split across all

IMPORTANT: First provide a brief reasoning (2-3 sentences) explaining your interpretation, then return the distribution data.

Return ONLY valid JSON with this structure:
{
  "reasoning": "Brief explanation of interpretation",
  "sampleSize": 500,
  "gender": { ... },
  "ageGroups": { ... },
  "religion": { ... },
  "ethnicity": { ... }
}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json'
    }
  });

  const response = result.response.text();
  console.log('AI Distribution Response:', response);
  
  const parsed = JSON.parse(response);
  
  // Validate and normalize percentages
  ['gender', 'ageGroups', 'religion', 'ethnicity'].forEach(category => {
    if (parsed[category] && Object.keys(parsed[category]).length > 0) {
      const total = Object.values(parsed[category]).reduce((sum, val) => sum + val, 0);
      if (Math.abs(total - 100) > 0.1) {
        // Normalize to 100%
        Object.keys(parsed[category]).forEach(key => {
          parsed[category][key] = (parsed[category][key] / total) * 100;
        });
      }
    }
  });
  
  return parsed;
}

