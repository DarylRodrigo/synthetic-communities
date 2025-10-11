#!/usr/bin/env python3
"""
Test script for PersonaAugmenter without requiring API key.
This demonstrates the augmenter logic and can be used for development.
"""

import json
import sys
import os
sys.path.append(os.path.dirname(__file__))

from augmenter import PersonaAugmenter, AugmentationResult

def mock_llm_response(personas):
    """Mock LLM response for testing - uses the actual augmenter logic"""
    from augmenter import PersonaAugmenter

    # Create a temporary augmenter instance to use its mock methods
    augmenter = PersonaAugmenter(api_key="mock")

    results = []
    for persona in personas:
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
            name=name,
            corrections=corrections,
            augmentations=augmentations
        )
        results.append(result)

    return json.dumps([{
        'name': r.name,
        'corrections': r.corrections,
        'augmentations': r.augmentations
    } for r in results])

def test_augmenter():
    """Test the augmenter with mock data"""

    # Load some test personas
    test_personas = []
    with open('../backend/data/raw_personas.jsonl', 'r') as f:
        for i, line in enumerate(f):
            if i >= 4:  # Just test first 4 personas
                break
            test_personas.append(json.loads(line.strip()))

    print(f"Testing with {len(test_personas)} personas...")

    # Create augmenter instance and use mock response directly
    augmenter = PersonaAugmenter(api_key="mock")

    # Generate mock response for these specific personas
    mock_response = mock_llm_response(test_personas)

    # Parse the mock response as if it came from LLM
    results = json.loads(mock_response)

    # Convert to AugmentationResult objects
    augmentation_results = []
    for result in results:
        aug_result = AugmentationResult(
            name=result['name'],
            corrections=result['corrections'],
            augmentations=result['augmentations']
        )
        augmentation_results.append(aug_result)

    print(f"\nProcessed {len(results)} personas:")
    for i, result in enumerate(results):
        print(f"\n{i+1}. {result['name']}")
        if result['corrections']:
            print(f"   Corrections: {result['corrections']}")
        if result['augmentations']:
            print(f"   Religion: {result['augmentations'].get('religion', 'N/A')}")
            print(f"   Demeanour: {result['augmentations'].get('demeanour', 'N/A')}")
            print(f"   Interests: {result['augmentations'].get('interests', [])}")
            print(f"   Sector: {result['augmentations'].get('sector', 'N/A')}")
            print(f"   Backstory: {result['augmentations'].get('backstory', 'N/A')[:100]}...")

    # Apply results to test personas
    print("\n=== Applying augmentations to personas ===")
    for i, (persona, result) in enumerate(zip(test_personas, results)):
        print(f"\nOriginal persona {i+1}: {persona['name']}")
        print(f"Job: {persona.get('job', 'N/A')}")

        # Apply corrections
        for field, value in result['corrections'].items():
            persona[field] = value
            print(f"Corrected {field}: {value}")

        # Apply augmentations
        for field, value in result['augmentations'].items():
            persona[field] = value
            print(f"Added {field}: {value}")

    print("\n=== Final enhanced persona structure ===")
    enhanced_persona = test_personas[0]
    print("Enhanced fields:")
    for key in sorted(enhanced_persona.keys()):
        value = enhanced_persona[key]
        if isinstance(value, str) and len(str(value)) > 50:
            print(f"  {key}: {str(value)[:50]}...")
        else:
            print(f"  {key}: {value}")

    # Test metrics
    print("\n=== Quality Metrics ===")
    augmenter._log_metrics()

if __name__ == "__main__":
    test_augmenter()