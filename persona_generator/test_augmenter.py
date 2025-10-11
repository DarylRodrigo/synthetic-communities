#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script for PersonaAugmenter without requiring API key.
This demonstrates the augmenter logic and can be used for development.
"""

import json
import sys
import os
import codecs

# Set UTF-8 encoding for stdout to handle special characters
if sys.platform == 'win32':
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

sys.path.append(os.path.dirname(__file__))

from augmenter import PersonaAugmenter, AugmentationResult

def mock_llm_response(personas, environment_path=None):
    """Mock LLM response for testing - uses the actual augmenter logic"""
    from augmenter import PersonaAugmenter

    # Create a temporary augmenter instance to use its mock methods
    augmenter = PersonaAugmenter(api_key='mock', environment_path=environment_path)

    results = []
    for i, persona in enumerate(personas):
        name = persona['name']

        # Use the actual augmenter methods for realistic results
        corrections = {}
        augmentations = {
            'religion': augmenter._mock_religion(persona),
            'demeanour': augmenter._mock_demeanour(persona),
            'interests': augmenter._mock_interests(persona),
            'sector': augmenter._mock_sector(persona),
            'backstory': augmenter._mock_backstory(persona)
        }

        result = AugmentationResult(
            index=i,
            name=name,
            corrections=corrections,
            augmentations=augmentations
        )
        results.append(result)

    return json.dumps([{
        'index': r.index,
        'name': r.name,
        'corrections': r.corrections,
        'augmentations': r.augmentations
    } for r in results])

def test_augmenter():
    """Test the augmenter with mock data"""
    
    # Test with environment
    environment_path = '../backend/data/worlds/berlin-shadows-1936/story.md'
    
    print('=== Testing Environment-Aware Augmentation ===')
    print(f'Environment: {environment_path}\n')

    # Load some test personas
    test_personas = []
    with open('../backend/data/raw_personas.jsonl', 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= 4:  # Just test first 4 personas
                break
            test_personas.append(json.loads(line.strip()))

    print(f'Testing with {len(test_personas)} personas...\n')

    # Create augmenter instance with environment
    augmenter = PersonaAugmenter(api_key='mock', environment_path=environment_path)
    
    # Check if environment was loaded
    if augmenter.environment_context and augmenter.environment_context.get('available'):
        print('[OK] Environment loaded successfully')
        print(f'Environment content preview: {augmenter.environment_context["raw_content"][:200]}...\n')
    else:
        print('[WARN] Warning: Environment not loaded\n')

    # Generate mock response for these specific personas
    mock_response = mock_llm_response(test_personas, environment_path)

    # Parse the mock response as if it came from LLM
    results = json.loads(mock_response)

    # Convert to AugmentationResult objects
    augmentation_results = []
    for result in results:
        aug_result = AugmentationResult(
            index=result['index'],
            name=result['name'],
            corrections=result['corrections'],
            augmentations=result['augmentations']
        )
        augmentation_results.append(aug_result)

    print(f'Processed {len(results)} personas:\n')
    for i, result in enumerate(results):
        print(f'{i+1}. {result["name"]}')
        if result['corrections']:
            print(f'   Corrections: {result["corrections"]}')
        if result['augmentations']:
            print(f'   Religion: {result["augmentations"].get("religion", "N/A")}')
            print(f'   Demeanour: {result["augmentations"].get("demeanour", "N/A")}')
            print(f'   Interests: {result["augmentations"].get("interests", [])}')
            print(f'   Sector: {result["augmentations"].get("sector", "N/A")}')
            backstory = result['augmentations'].get('backstory', 'N/A')
            print(f'   Backstory: {backstory}\n')

    # Apply results to test personas
    print('=== Applying augmentations to personas ===')
    for i, (persona, result) in enumerate(zip(test_personas, results)):
        print(f'\n{i+1}. Original: {persona["name"]}, {persona.get("age")} years old')
        print(f'   Job: {persona.get("job", "N/A")}')
        print(f'   City: {persona.get("city", "N/A")}')

        # Apply corrections
        for field, value in result['corrections'].items():
            persona[field] = value
            print(f'   → Corrected {field}: {value}')

        # Apply augmentations
        for field, value in result['augmentations'].items():
            persona[field] = value

    print('\n=== Final enhanced persona structure ===')
    enhanced_persona = test_personas[0]
    print('Enhanced fields:')
    for key in sorted(enhanced_persona.keys()):
        value = enhanced_persona[key]
        if isinstance(value, str) and len(str(value)) > 60:
            print(f'  {key}: {str(value)[:60]}...')
        else:
            print(f'  {key}: {value}')

    # Test metrics
    print('\n=== Quality Metrics ===')
    augmenter._log_metrics()

if __name__ == '__main__':
    test_augmenter()