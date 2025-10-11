import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

function initializeAI() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  console.log('API Key loaded:', apiKey ? 'YES (length: ' + apiKey.length + ')' : 'NO');

  if (!apiKey || apiKey === 'your_api_key_here') {
    throw new Error('GEMINI_API_KEY not configured. Please add it to .env file');
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export async function generateWithAI(prompt, schema = null) {
  const ai = initializeAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json'
    }
  });

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    let response = result.response.text();
    console.log('AI Response:', response);

    // Clean response if it contains markdown formatting
    response = response
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/^\s*```/, '')
      .replace(/```\s*$/, '')
      .trim();

    return response;
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error(`AI generation failed: ${error.message}`);
  }
}

export { initializeAI };
