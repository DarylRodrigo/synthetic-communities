"""Simple Gemini LLM client wrapper."""

import google.generativeai as genai


def create_client(api_key: str):
    """Create Gemini client by configuring API key."""
    genai.configure(api_key=api_key)
    return genai  # Return the module itself since it's stateless


def generate_response(client, prompt: str, system_instruction: str, temperature: float = 0.7) -> str:
    """Generate LLM response with system instruction."""
    model = client.GenerativeModel(
        'gemini-2.0-flash-lite',
        system_instruction=system_instruction
    )
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=500
        )
    )
    return response.text
