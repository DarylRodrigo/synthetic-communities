"""
UN Delegate Generator Module

This module generates synthetic UN delegates using Gemini 2.5 Flash.
Each delegate represents one of the 193 UN member states with realistic
diplomatic profiles and environment-appropriate backstories.
"""

import json
import logging
import time
import os
import random
import hashlib
import uuid
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime

try:
    from dotenv import load_dotenv
    load_dotenv('../.env')
except ImportError:
    pass

try:
    import google.genai as genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    class MockGenAI:
        def __init__(self, api_key):
            pass
    class MockTypes:
        class Content:
            def __init__(self, role, parts):
                self.role = role
                self.parts = parts
        class Part:
            @staticmethod
            def from_text(text):
                return None
        class GenerateContentConfig:
            def __init__(self, response_mime_type=None, **kwargs):
                self.response_mime_type = response_mime_type
        class ThinkingConfig:
            def __init__(self, thinking_budget):
                pass
    genai = MockGenAI('mock')
    types = MockTypes()

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

# 193 UN Member States (as of 2024)
UN_MEMBER_STATES = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda',
    'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain',
    'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria',
    'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada',
    'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros',
    'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
    'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
    'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada',
    'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy',
    'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati',
    'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya',
    'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia',
    'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius',
    'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand',
    'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines',
    'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino',
    'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
    'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan',
    'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Tajikistan', 'Tanzania', 'Thailand',
    'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]

@dataclass
class QualityMetrics:
    """Track generation quality metrics"""
    total_processed: int = 0
    errors_encountered: int = 0
    cache_hits: int = 0

class DelegateGenerator:
    def __init__(self, api_key: str, environment_path: Optional[str] = None, batch_size: int = 10, delay_seconds: float = 1.0):
        if GENAI_AVAILABLE:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None
        self.batch_size = batch_size
        self.delay_seconds = delay_seconds
        self.model = 'gemini-2.5-flash'
        self.cache_dir = Path('.cache')
        self.cache_dir.mkdir(exist_ok=True)
        self.metrics = QualityMetrics()
        
        # Environment context
        self.environment_path = environment_path
        self.environment_context = self._parse_environment(environment_path) if environment_path else None

    def _parse_environment(self, environment_path: str) -> Dict[str, Any]:
        """Parse environment story file and extract contextual metadata."""
        try:
            env_file = Path(environment_path)
            if not env_file.exists():
                logging.warning(f'Environment file not found: {environment_path}')
                return {'raw_content': None, 'available': False}
            
            with open(env_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            logging.info(f'Loaded environment from: {environment_path}')
            return {
                'raw_content': content,
                'available': True,
                'file_path': str(env_file)
            }
        except Exception as e:
            logging.error(f'Failed to parse environment file: {e}')
            return {'raw_content': None, 'available': False}
    
    def _get_cache_key(self, delegates: List[Dict]) -> str:
        """Generate cache key for a batch of delegates"""
        content = json.dumps(delegates, sort_keys=True)
        if self.environment_context and self.environment_context.get('available'):
            content += self.environment_context.get('file_path', '')
        return hashlib.md5(content.encode()).hexdigest()

    def _load_from_cache(self, cache_key: str) -> Optional[List[Dict]]:
        """Load results from cache if available"""
        cache_file = self.cache_dir / f'delegate_{cache_key}.json'
        if cache_file.exists():
            try:
                with open(cache_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.metrics.cache_hits += 1
                logging.info(f'Cache hit for batch {cache_key[:8]}')
                return data
            except Exception as e:
                logging.warning(f'Failed to load cache {cache_key}: {e}')
        return None

    def _save_to_cache(self, cache_key: str, results: List[Dict]):
        """Save results to cache"""
        cache_file = self.cache_dir / f'delegate_{cache_key}.json'
        try:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2)
        except Exception as e:
            logging.warning(f'Failed to save cache {cache_key}: {e}')

    def _create_prompt(self, delegate_specs: List[Dict]) -> str:
        """Create the LLM prompt for a batch of delegates"""
        
        delegate_specs_json = json.dumps(delegate_specs, indent=2)
        
        # Build environment section if available
        environment_section = ''
        if self.environment_context and self.environment_context.get('available'):
            environment_content = self.environment_context.get('raw_content', '')
            environment_section = f"""
ENVIRONMENT CONTEXT:
You are generating UN delegate personas for a specific world setting. Read the environment description below and extract:
- TIME PERIOD (year/era)
- LOCATION (UN Assembly location)
- CULTURAL/HISTORICAL CONTEXT (AI rights debate, political climate, major events)

Use this context to ground delegate backstories in the specific time/place.

ENVIRONMENT STORY:
{environment_content}

IMPORTANT: Delegates are BACKGROUND POPULATION, not story characters. They are ordinary diplomats doing their jobs. Do NOT make them participants in the main story events. Backstories should reflect normal diplomatic careers, not plot involvement. Be subtle - mention the era/location casually, not obsessively.
"""

        prompt = f"""
You are a UN delegate persona generator. I will provide you with {len(delegate_specs)} delegate specifications, each containing a country and age.

{environment_section}

Your task: Generate a COMPLETE persona for each delegate with ALL fields below.

STRICT OUTPUT CONTRACT:
- Output MUST be a JSON array of objects.
- Each object MUST include exactly: id, name, age, gender, city, job, company, education_level, income_bracket, ethnicity, cultural_background, country, susceptibility, trust_institution, turnout_propensity, media_diet, personality_traits, confirmation_bias, social_network_influence, risk_aversion, fairness_value, prior_beliefs, timestamp, religion, demeanour, interests, sector, backstory.
- The order MUST match the input delegate specifications (0-based index).

FIELD GENERATION RULES:

BASIC FIELDS:
- id: Generate a unique UUID
- name: Culturally appropriate for the country (e.g., Japanese name for Japan, Brazilian name for Brazil). Transliterate to Latin script.
- age: Use the provided age from input
- gender: Choose realistic gender (Male/Female) based on global diplomat demographics
- city: A major city in the delegate's home country (capital or major diplomatic hub)
- job: ALWAYS "Ambassador"
- company: "Permanent Mission of [Country] to the United Nations"
- education_level: Choose from ['bachelor_degree', 'master_degree', 'doctorate']. Diplomats are highly educated (80% master_degree or doctorate).
- income_bracket: Choose from ['middle', 'middle_high', 'high', 'upper_middle']. Ambassadors are well-compensated.
- ethnicity: Match the country's majority or significant ethnic group
- cultural_background: Brief cultural descriptor matching the country (e.g., "Japanese diplomatic culture", "West African", "Latin American")
- country: Use the exact country code from input (e.g., "US", "JP", "BR") - use standard ISO codes
- timestamp: Current ISO timestamp

PSYCHOLOGICAL TRAITS (0.0-1.0 scale):
- susceptibility: How susceptible to persuasion/propaganda (diplomats typically 0.2-0.5)
- trust_institution: Trust in international institutions (diplomats typically 0.6-0.9)
- turnout_propensity: Political engagement (diplomats typically 0.8-1.0)
    - media_diet: Object with {{social_media, tv, newspaper, blogs}} summing to 1.0 (diplomats favor newspapers/tv)
    - personality_traits: Big Five {{openness, conscientiousness, extraversion, agreeableness, neuroticism}} each 0.0-1.0
- confirmation_bias: Tendency to favor confirming information (0.0-1.0)
- social_network_influence: Social capital and networking (diplomats typically 0.6-0.9)
- risk_aversion: Risk tolerance (0.0-1.0, diplomats typically 0.4-0.7)
- fairness_value: Value placed on fairness (0.0-1.0)

PRIOR BELIEFS (-1.0 to 1.0 scale):
- prior_beliefs: Object with 3-6 topics from: ['foreign_policy', 'technology', 'education', 'climate_change', 'immigration', 'economy', 'healthcare', 'social_justice']
- Values: -1.0 (strongly against) to +1.0 (strongly for)

AUGMENTED FIELDS:
- religion: Choose from ['Catholic','Protestant','Muslim','Hindu','Buddhist','Orthodox','Jewish','Christian','None','Other']. Match country's religious demographics.
- demeanour: One compact clause (≤12 words), professional diplomatic tone (e.g., "Measured and diplomatic, skilled in multilateral negotiation")
- interests: 3-4 items reflecting diplomatic profession and cultural background (e.g., ["international law", "cultural diplomacy", "chess"])
- sector: ALWAYS "Government"
- backstory: DOCUMENTARY STYLE. Third-person, compact, factual, dense. No melodrama. Anchor to age, education, career. Mention diplomatic postings, achievements, negotiations. Reference the environment's time/place subtly. 2 sentences max.

DOCUMENTARY BACKSTORY EXAMPLES (FORMAT ONLY):
- "Born 1985 in Tokyo; MA International Relations 2008, Georgetown. Served as Deputy Ambassador to ASEAN 2015-2020, promoted to UN Permanent Representative 2043 after successful mediation in South China Sea dispute."
- "BA Economics 2000, University of São Paulo; career diplomat since 2002. Specialized in trade negotiations, led MERCOSUR delegation 2030-2038, appointed UN Ambassador 2042 following climate treaty success."

GENERAL PRINCIPLES:
- Keep everything realistic and culturally appropriate
- Diplomats are typically 35-70 years old, highly educated, multilingual
- Names must be culturally authentic (Japanese, Arabic, European, etc.)
- All text in English, but names can be transliterated from native scripts
- Backstories should mention ordinary diplomatic career progression, not story plot involvement
- If environment is provided, subtly reference the era/context in backstory

DELEGATE SPECIFICATIONS TO PROCESS:
{delegate_specs_json}

Return ONLY the JSON array described above.
"""
        
        return prompt

    def _call_llm_with_retry(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """Call LLM with retry logic"""
        if not GENAI_AVAILABLE or not self.client:
            logging.error('Gemini API not available. Cannot generate delegates without API.')
            return None

        for attempt in range(max_retries):
            try:
                logging.info(f'LLM call attempt {attempt + 1}/{max_retries}')

                contents = [
                    types.Content(
                        role='user',
                        parts=[types.Part.from_text(text=prompt)],
                    ),
                ]

                generate_content_config = types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=-1),
                    response_mime_type='application/json',
                )

                response_text = ''
                for chunk in self.client.models.generate_content_stream(
                    model=self.model,
                    contents=contents,
                    config=generate_content_config,
                ):
                    response_text += chunk.text

                return response_text

            except Exception as e:
                self.metrics.errors_encountered += 1
                logging.error(f'LLM call failed (attempt {attempt + 1}): {e}')
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff

        return None

    def generate_batch(self, delegate_specs: List[Dict]) -> List[Dict]:
        """Generate a batch of delegates"""

        # Check cache first
        cache_key = self._get_cache_key(delegate_specs)
        cached_results = self._load_from_cache(cache_key)
        if cached_results:
            return cached_results

        # Create and send prompt
        prompt = self._create_prompt(delegate_specs)

        response_text = self._call_llm_with_retry(prompt)
        if not response_text:
            logging.error('Failed to get LLM response after retries')
            return []

        try:
            # Parse JSON response
            results = json.loads(response_text)
            if not isinstance(results, list):
                logging.error(f'Expected JSON array, got: {type(results)}')
                return []

            # Validate results
            valid_results = []
            required_fields = ['id', 'name', 'age', 'gender', 'city', 'job', 'company', 
                             'education_level', 'income_bracket', 'ethnicity', 'cultural_background',
                             'country', 'susceptibility', 'trust_institution', 'turnout_propensity',
                             'media_diet', 'personality_traits', 'confirmation_bias',
                             'social_network_influence', 'risk_aversion', 'fairness_value',
                             'prior_beliefs', 'timestamp', 'religion', 'demeanour', 'interests',
                             'sector', 'backstory']

            for result in results:
                if not isinstance(result, dict):
                    logging.warning(f'Invalid result format: {result}')
                    continue
                
                # Check all required fields present
                missing = [f for f in required_fields if f not in result]
                if missing:
                    logging.warning(f'Missing required fields: {missing}')
                    continue
                
                valid_results.append(result)

            self.metrics.total_processed += len(valid_results)

            # Cache successful results
            if valid_results:
                self._save_to_cache(cache_key, valid_results)

            # Add delay between calls
            time.sleep(self.delay_seconds)

            return valid_results

        except json.JSONDecodeError as e:
            self.metrics.errors_encountered += 1
            logging.error(f'Failed to parse LLM response as JSON: {e}')
            return []
        except Exception as e:
            self.metrics.errors_encountered += 1
            logging.error(f'Unexpected error processing LLM response: {e}')
            return []

    def generate_delegates(self, num_delegates: int, output_file: str) -> None:
        """Generate UN delegates and save to output file"""

        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Select countries (shuffle for variety)
        countries = UN_MEMBER_STATES[:num_delegates]
        if num_delegates > len(UN_MEMBER_STATES):
            logging.warning(f'Requested {num_delegates} delegates but only {len(UN_MEMBER_STATES)} UN members exist. Generating {len(UN_MEMBER_STATES)}.')
            num_delegates = len(UN_MEMBER_STATES)

        # Create delegate specifications with country and age
        delegate_specs = []
        for country in countries:
            # Assign realistic age for ambassador (35-70, weighted toward 45-60)
            ages = list(range(35, 71))
            weights = [0.5 if 45 <= a <= 60 else 0.2 for a in ages]
            age = random.choices(ages, weights=weights)[0]
            
            delegate_specs.append({
                'country': country,
                'age': age
            })

        # Process in batches
        total_processed = 0
        with open(output_path, 'w', encoding='utf-8') as output_f:
            for i in range(0, len(delegate_specs), self.batch_size):
                batch = delegate_specs[i:i + self.batch_size]
                batch_number = (i // self.batch_size) + 1
                
                logging.info(f'Processing batch {batch_number} ({len(batch)} delegates)')
                
                batch_results = self.generate_batch(batch)
                
                # Save immediately
                for delegate in batch_results:
                    output_f.write(json.dumps(delegate, ensure_ascii=False) + '\n')
                    total_processed += 1
                
                logging.info(f'Batch {batch_number} completed: {len(batch_results)}/{len(batch)} delegates saved')

        logging.info(f'Completed generation: {total_processed}/{num_delegates} delegates saved to {output_path}')
        self._log_metrics()

    def _log_metrics(self):
        """Log quality metrics"""
        logging.info('=== Delegate Generation Quality Metrics ===')
        logging.info(f'Total processed: {self.metrics.total_processed}')
        logging.info(f'Errors encountered: {self.metrics.errors_encountered}')
        logging.info(f'Cache hits: {self.metrics.cache_hits}')

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate UN delegate personas using Gemini LLM')
    parser.add_argument('--output', type=str, default='../backend/data/personas/UN_assembly_2045.jsonl',
                        help='Output file path for delegates (default: ../backend/data/personas/UN_assembly_2045.jsonl)')
    parser.add_argument('--environment', type=str, default=None,
                        help='Path to environment story file (e.g., ../backend/data/worlds/un-assembly-new-york-2045/story.md)')
    parser.add_argument('--batch-size', type=int, default=10,
                        help='Number of delegates per batch (default: 10)')
    parser.add_argument('--num-delegates', type=int, default=193,
                        help='Number of delegates to generate (default: 193 - all UN members)')
    
    args = parser.parse_args()
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logging.error('GEMINI_API_KEY environment variable not set')
        exit(1)

    # Log configuration
    logging.info('=== UN Delegate Generation Configuration ===')
    logging.info(f'Output file: {args.output}')
    logging.info(f'Environment: {args.environment if args.environment else "None (generic generation)"}')
    logging.info(f'Batch size: {args.batch_size}')
    logging.info(f'Number of delegates: {args.num_delegates}')

    generator = DelegateGenerator(
        api_key=api_key,
        environment_path=args.environment,
        batch_size=args.batch_size
    )

    try:
        generator.generate_delegates(
            num_delegates=args.num_delegates,
            output_file=args.output
        )
    except Exception as e:
        import traceback
        logging.error(f'Delegate generation failed: {e}')
        logging.error(f'Full traceback:\n{traceback.format_exc()}')
        exit(1)

if __name__ == '__main__':
    main()

