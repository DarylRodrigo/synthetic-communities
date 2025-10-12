"""Simple Gemini LLM client wrapper."""

import google.generativeai as genai


def create_client(api_key: str):
    """Create Gemini client by configuring API key."""
    genai.configure(api_key=api_key)
    return genai  # Return the module itself since it's stateless


def generate_response(
    client,
    prompt: str,
    system_instruction: str,
    temperature: float = 1.0,
    max_output_tokens: int = 8000,
    model: str = 'gemini-2.0-flash-lite'
) -> str:
    """Generate LLM response with system instruction."""
    model = client.GenerativeModel(
        model,
        system_instruction=system_instruction
    )
    response = model.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens
        )
    )
    return response.text


async def generate_response_async(
    client,
    prompt: str,
    system_instruction: str,
    temperature: float = 1.0,
    max_output_tokens: int = 8000
) -> str:
    """Async version of generate_response for parallel execution."""
    model = client.GenerativeModel(
        'gemini-2.5-flash-lite',  # 'gemini-2.0-flash-lite',
        system_instruction=system_instruction
    )
    response = await model.generate_content_async(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_output_tokens
        )
    )
    return response.text
