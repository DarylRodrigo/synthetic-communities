"""
Persona Augmenter Module

This module takes raw personas from persona_generator.py and enhances them using Gemini 2.5 Pro.
It corrects logical inconsistencies and adds: religion, demeanour, interests, sector, backstory.
"""

import json
import logging
import time
import os
import random
import hashlib
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

try:
    from dotenv import load_dotenv
    # Load .env file from project root (parent directory)
    load_dotenv('../.env')
except ImportError:
    # python-dotenv not installed, will rely on system environment variables
    pass

try:
    import google.genai as genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False
    # Create mock classes for testing when genai is not available
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
                return MockPart()

        class GenerateContentConfig:
            def __init__(self, response_mime_type=None, **kwargs):
                self.response_mime_type = response_mime_type

        class ThinkingConfig:
            def __init__(self, thinking_budget):
                pass

    genai = MockGenAI("mock")
    types = MockTypes()

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

@dataclass
class AugmentationResult:
    """Result from LLM augmentation"""
    name: str
    index: int
    corrections: Dict[str, Any]  # Fields that were corrected/modified
    augmentations: Dict[str, Any]  # New fields added (religion, demeanour, interests, sector, backstory)

@dataclass
class QualityMetrics:
    """Track augmentation quality metrics"""
    total_processed: int = 0
    corrections_made: int = 0
    augmentations_added: int = 0
    errors_encountered: int = 0
    cache_hits: int = 0

class PersonaAugmenter:
    def __init__(self, api_key: str, environment_path: Optional[str] = None, batch_size: int = 15, delay_seconds: float = 1.0):
        if GENAI_AVAILABLE:
            self.client = genai.Client(api_key=api_key)
        else:
            self.client = None
        self.batch_size = batch_size
        self.delay_seconds = delay_seconds
        # Per project spec: use Gemini 2.5
        self.model = 'gemini-2.5-flash'
        self.cache_dir = Path('.cache')
        self.cache_dir.mkdir(exist_ok=True)
        self.metrics = QualityMetrics()
        
        # Environment context
        self.environment_path = environment_path
        self.environment_context = self._parse_environment(environment_path) if environment_path else None

    def _parse_environment(self, environment_path: str) -> Dict[str, Any]:
        """Parse environment story file and extract contextual metadata.
        
        This method reads the environment markdown file and extracts key information
        that will be used to contextualize personas. The LLM will handle the actual
        adaptation, but we provide the raw environment text.
        """
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
    
    def _get_cache_key(self, personas: List[Dict]) -> str:
        """Generate cache key for a batch of personas"""
        # Include environment in cache key to avoid cross-contamination
        content = json.dumps(personas, sort_keys=True)
        if self.environment_context and self.environment_context.get('available'):
            content += self.environment_context.get('file_path', '')
        return hashlib.md5(content.encode()).hexdigest()

    def _load_from_cache(self, cache_key: str) -> Optional[List[AugmentationResult]]:
        """Load results from cache if available"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    data = json.load(f)
                self.metrics.cache_hits += 1
                logging.info(f"Cache hit for batch {cache_key[:8]}")
                return [AugmentationResult(**result) for result in data]
            except Exception as e:
                logging.warning(f"Failed to load cache {cache_key}: {e}")
        return None

    def _save_to_cache(self, cache_key: str, results: List[AugmentationResult]):
        """Save results to cache"""
        cache_file = self.cache_dir / f"{cache_key}.json"
        try:
            with open(cache_file, 'w') as f:
                json.dump([asdict(result) for result in results], f, indent=2)
        except Exception as e:
            logging.warning(f"Failed to save cache {cache_key}: {e}")

    def _create_prompt(self, personas: List[Dict]) -> str:
        """Create the LLM prompt for a batch of personas"""

        personas_json = json.dumps(personas, indent=2)
        
        # Build environment section if available
        environment_section = ''
        if self.environment_context and self.environment_context.get('available'):
            environment_content = self.environment_context.get('raw_content', '')
            environment_section = f"""
ENVIRONMENT CONTEXT:
You are adapting personas to fit within a specific world setting. Read the environment description below and extract:
- TIME PERIOD (year/era)
- LOCATION (city, country, region)
- CULTURAL/HISTORICAL CONTEXT (political climate, major events, social norms)

Use this context to adapt persona fields to be historically and culturally appropriate for that setting.

ENVIRONMENT STORY:
{environment_content}

ADAPTATION RULES:
- Names: Adjust to fit the location/era (e.g., German names for 1930s Berlin)
- Jobs: Translate modern jobs to era-appropriate equivalents (e.g., 'Data Scientist' → 'Statistical Clerk', 'AI Engineer' → 'Electrical Engineer')
- City: Use location-appropriate neighborhoods/districts from the environment
- Interests: Replace anachronistic activities with era-appropriate ones (e.g., no 'streaming' in 1936 → 'radio programs')
- Backstory: Ground in the specific time/place with ordinary life events (NOT story plot participation)
- Sector: Map to industries that existed in that era

IMPORTANT: Personas are BACKGROUND POPULATION, not story characters. They live ordinary lives in this world. Do NOT make them participants in the main story events. Be subtle - mention the era/location casually, not obsessively.
"""

        prompt = f"""
You are a synthetic human persona creator. I will provide you with {len(personas)} raw personas in JSON format.

{environment_section}

Your single-stage task (for each persona):
1) CORRECT obvious inconsistencies (education-job mismatches, age-seniority mismatches, name-ethnicity mismatches, etc.).
2) {'ADAPT to the environment context provided above.' if environment_section else ''}
3) ADD the following fields: religion, demeanour, interests, sector, backstory.

STRICT OUTPUT CONTRACT:
- Output MUST be a JSON array of objects.
- Each object MUST include exactly: index (number), name (string), corrections (object), augmentations (object).
- index MUST match the order of the input personas in the batch (0-based).
- corrections: ONLY the fields you changed from input (key:value of the corrected fields).
- augmentations: MUST include fields: religion (string), demeanour (string), interests (array of 3-4 short items), sector (string), backstory (string).
- Do NOT repeat unchanged input fields.

FIELD RULES:
- religion: choose from ['Catholic','Protestant','Muslim','Hindu','Buddhist','Orthodox','Jewish','Christian','None','Other'] and keep plausible for ethnicity/country/era and age (younger skew slightly to 'None').
- demeanour: one compact clause (<=12 words), professional tone, aligned with education, job, and age (e.g., 'calm and analytical under pressure').
- interests: 3-4 items; nouns/noun-phrases; reflect age, job, culture, and ERA (e.g., 'alpine traditions', 'patient safety').
- sector: choose one from this controlled list appropriate to the era: ['Healthcare','Education','Technology','Finance','Manufacturing','Services','Creative','Government','Environmental Services','Legal Services','Insurance','Tourism & Hospitality','Agriculture','Construction/Skilled Trades','Operations & Logistics','Pharmaceuticals/Biotech','Arts & Culture','Fishing & Aquaculture','IT Sales','Business/Management'].
- backstory: DOCUMENTARY STYLE. Third-person, compact, factual, and dense. No melodrama. No humor. No name-origin inventions. Anchor to the persona's numeric data (age, education, tenure) AND the environment's time/place. Prefer dates/years and concrete contributions/metrics when plausible. Keep it 2 sentences max.

DOCUMENTARY BACKSTORY EXAMPLES (FORMAT ONLY, NOT CONTENT TO COPY):
- "Born 1983 in Flawil; BPharm 2005. Hospital pharmacist since 2007; led 2023 medication-safety rollout cutting administration errors 18%."
- "BA Economics 2014; risk surveyor since 2016, Zurich. Audited 220+ policies in 2024; authored internal checklist adopted firm-wide."

GENERAL PRINCIPLES:
- Keep everything realistic; harmonize with country/locale, ethnicity, era, and job market norms.
- Consider all numerical fields from input when deciding seniority and impact.
- Transliterate all names to Latin script; ensure every field value is in English.
- Keep output strictly to the contract (index, name, corrections, augmentations) with valid JSON only.

PERSONAS TO PROCESS:
{personas_json}

Return ONLY the JSON array described above.
"""

        return prompt

    def _call_llm_with_retry(self, prompt: str, max_retries: int = 3) -> Optional[str]:
        """Call LLM with retry logic"""
        if not GENAI_AVAILABLE or not self.client:
            # Return mock response for testing
            return self._mock_llm_response(prompt)

        for attempt in range(max_retries):
            try:
                logging.info(f"LLM call attempt {attempt + 1}/{max_retries}")

                contents = [
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=prompt)],
                    ),
                ]

                generate_content_config = types.GenerateContentConfig(
                    thinking_config=types.ThinkingConfig(thinking_budget=-1),
                    response_mime_type="application/json",
                )

                response_text = ""
                for chunk in self.client.models.generate_content_stream(
                    model=self.model,
                    contents=contents,
                    config=generate_content_config,
                ):
                    response_text += chunk.text

                return response_text

            except Exception as e:
                self.metrics.errors_encountered += 1
                logging.error(f"LLM call failed (attempt {attempt + 1}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff

        return None

    def _mock_llm_response(self, prompt: str) -> str:
        """Generate mock LLM response for testing"""
        import re

        # Extract personas from prompt
        personas_match = re.search(r'PERSONAS TO PROCESS:\s*(\[[\s\S]*?\])\n', prompt)
        if not personas_match:
            return "[]"

        try:
            personas = json.loads(personas_match.group(1))
        except:
            return "[]"

        results = []
        for persona in personas:
            name = persona.get('name', 'Unknown')

            # Generate mock augmentations based on persona data
            augmentations = {
                'religion': self._mock_religion(persona),
                'demeanour': self._mock_demeanour(persona),
                'interests': self._mock_interests(persona),
                'sector': self._mock_sector(persona),
                'backstory': self._mock_backstory(persona)
            }

            results.append({
                'name': name,
                'corrections': {},
                'augmentations': augmentations
            })

        return json.dumps(results)

    def _mock_religion(self, persona):
        ethnicity = persona.get('ethnicity', '')
        age = persona.get('age', 30)

        # Religion distribution based on Swiss and global demographics
        if 'swiss' in ethnicity.lower():
            # Swiss: ~35% Catholic, ~25% Protestant, ~30% no religion, ~10% other
            religions = ['Catholic', 'Protestant', 'None', 'Other']
            weights = [0.35, 0.25, 0.30, 0.10]
        elif ethnicity in ['Italian', 'Portuguese', 'Spanish', 'French']:
            # Southern European Catholics: ~80% Catholic, ~15% none, ~5% other
            religions = ['Catholic', 'None', 'Other']
            weights = [0.80, 0.15, 0.05]
        elif ethnicity in ['German', 'Austrian']:
            # Central European: ~30% Catholic, ~25% Protestant, ~35% none, ~10% other
            religions = ['Catholic', 'Protestant', 'None', 'Other']
            weights = [0.30, 0.25, 0.35, 0.10]
        elif ethnicity in ['Turkish', 'Syrian']:
            # Muslim-majority: ~90% Muslim, ~5% none, ~5% other
            religions = ['Muslim', 'None', 'Other']
            weights = [0.90, 0.05, 0.05]
        elif ethnicity in ['Sri Lankan', 'Indian']:
            # South Asian mix: ~70% Hindu/Buddhist, ~15% Muslim, ~10% Christian, ~5% none
            religions = ['Hindu', 'Buddhist', 'Muslim', 'Christian', 'None']
            weights = [0.40, 0.30, 0.15, 0.10, 0.05]
        elif ethnicity in ['Chinese', 'Vietnamese']:
            # East Asian: ~50% Buddhist/Traditional, ~30% none, ~15% Christian, ~5% other
            religions = ['Buddhist', 'Traditional Chinese', 'None', 'Christian', 'Other']
            weights = [0.30, 0.20, 0.30, 0.15, 0.05]
        elif ethnicity in ['Kosovan']:
            # Balkan mix: ~90% Muslim, ~5% Catholic, ~5% none
            religions = ['Muslim', 'Catholic', 'None']
            weights = [0.90, 0.05, 0.05]
        elif ethnicity in ['Brazilian']:
            # Brazilian: ~65% Catholic, ~20% Protestant, ~10% none, ~5% other
            religions = ['Catholic', 'Protestant', 'None', 'Other']
            weights = [0.65, 0.20, 0.10, 0.05]
        elif ethnicity in ['Afghan']:
            # Afghan: ~99% Muslim, ~1% other
            religions = ['Muslim', 'Other']
            weights = [0.99, 0.01]
        else:
            # Default for other ethnicities
            religions = ['Christian', 'None', 'Other']
            weights = [0.50, 0.30, 0.20]

        # Slight age influence: younger people more likely to be "none"
        if age < 30:
            # Increase "none" probability for younger people
            none_idx = religions.index('None') if 'None' in religions else -1
            if none_idx >= 0:
                weights = list(weights)
                weights[none_idx] += 0.1
                # Normalize
                total = sum(weights)
                weights = [w/total for w in weights]

        return random.choices(religions, weights=weights)[0]

    def _mock_demeanour(self, persona):
        education = persona.get('education_level', '')
        job = persona.get('job', '').lower()
        age = persona.get('age', 30)
        personality = persona.get('personality_traits', {})

        # More nuanced demeanour based on multiple factors
        if education in ['doctorate']:
            base_demeanour = 'scholarly and analytical'
        elif education in ['master_degree']:
            base_demeanour = 'methodical and detail-oriented'
        elif education in ['bachelor_degree']:
            base_demeanour = 'ambitious and collaborative'
        else:
            base_demeanour = 'practical and hands-on'

        # Job-specific modifiers
        if 'doctor' in job or 'surgeon' in job or 'psychologist' in job:
            return f"{base_demeanour}, with a calm, empathetic bedside manner"
        elif 'teacher' in job or 'professor' in job:
            return f"{base_demeanour}, patient and inspiring to students"
        elif 'engineer' in job or 'scientist' in job:
            return f"{base_demeanour}, with precise problem-solving focus"
        elif 'manager' in job or 'director' in job:
            return f"{base_demeanour}, decisive with natural leadership presence"
        elif 'artist' in job or 'designer' in job:
            return f"{base_demeanour}, creative with unconventional thinking"
        elif 'sales' in job or 'business' in job:
            return f"{base_demeanour}, persuasive and relationship-focused"
        elif age > 60:
            return f"{base_demeanour}, wise and patient from decades of experience"
        else:
            return base_demeanour

    def _mock_interests(self, persona):
        age = persona.get('age', 30)
        job = persona.get('job', '').lower()
        ethnicity = persona.get('ethnicity', '').lower()
        education = persona.get('education_level', '')

        # Base interests by age group
        if age < 25:
            base_interests = ['social media', 'gaming', 'sports', 'music']
        elif age < 35:
            base_interests = ['travel', 'fitness', 'cooking', 'reading']
        elif age < 50:
            base_interests = ['cultural events', 'gardening', 'hiking', 'books']
        elif age < 65:
            base_interests = ['history', 'classical music', 'bridge', 'volunteering']
        else:
            base_interests = ['community service', 'genealogy', 'bird watching', 'memoir writing']

        # Job-specific interests
        if 'doctor' in job or 'nurse' in job or 'pharmacist' in job:
            base_interests.extend(['medical research', 'patient advocacy'])
        elif 'teacher' in job or 'professor' in job:
            base_interests.extend(['educational policy', 'student mentoring'])
        elif 'engineer' in job or 'scientist' in job:
            base_interests.extend(['innovation', 'problem solving'])
        elif 'artist' in job or 'designer' in job:
            base_interests.extend(['art exhibitions', 'creative writing'])
        elif 'business' in job or 'manager' in job:
            base_interests.extend(['networking', 'leadership development'])

        # Cultural/ethnic interests
        if 'italian' in ethnicity or 'portuguese' in ethnicity or 'spanish' in ethnicity:
            base_interests.append('mediterranean cuisine')
        elif 'german' in ethnicity or 'swiss' in ethnicity:
            base_interests.append('alpine traditions')
        elif 'french' in ethnicity:
            base_interests.append('wine culture')
        elif 'turkish' in ethnicity or 'syrian' in ethnicity:
            base_interests.append('middle eastern cuisine')
        elif 'chinese' in ethnicity or 'vietnamese' in ethnicity:
            base_interests.append('asian cuisine')
        elif 'sri lankan' in ethnicity or 'indian' in ethnicity:
            base_interests.append('south asian cuisine')
        elif 'brazilian' in ethnicity:
            base_interests.append('latin american culture')
        elif 'kosovan' in ethnicity:
            base_interests.append('balkan traditions')

        # Education-based interests
        if education in ['master_degree', 'doctorate']:
            base_interests.append('academic research')
        elif education == 'bachelor_degree':
            base_interests.append('professional development')

        # Remove duplicates and limit to 4
        unique_interests = list(set(base_interests))
        return unique_interests[:4]

    def _mock_sector(self, persona):
        job = persona.get('job', '').lower()
        if 'pharmacist' in job or 'doctor' in job or 'nurse' in job:
            return 'healthcare'
        elif 'teacher' in job or 'professor' in job:
            return 'education'
        elif 'software' in job or 'data' in job or 'it' in job:
            return 'technology'
        elif 'accountant' in job or 'financial' in job:
            return 'finance'
        else:
            return 'other'

    def _mock_backstory(self, persona):
        name = persona.get('name', 'This person')
        age = persona.get('age', 30)
        job = persona.get('job', 'their profession')
        city = persona.get('city', 'their hometown')
        education = persona.get('education_level', 'unknown')
        ethnicity = persona.get('ethnicity', 'unknown')
        
        # Extract environment context for era-appropriate backstories
        current_year = 2025  # Default to current year
        if self.environment_context and self.environment_context.get('available'):
            # Simple extraction: look for 4-digit years in the environment content
            import re
            content = self.environment_context.get('raw_content', '')
            years = re.findall(r'\b(19\d{2}|20\d{2})\b', content)
            if years:
                current_year = int(years[0])  # Use first year found
        
        birth_year = current_year - age

        # Create more specific, dense backstories based on profile
        if age < 25:
            # Young professionals - focus on ambition and recent achievements
            education_detail = 'fresh out of university' if education in ['bachelor_degree', 'master_degree'] else 'recently completed vocational training'
            return f'Born {birth_year}. {education_detail.capitalize()}, landed their first role as {job} in {city}. Recently earning recognition for developing improvements that reduced waste by 23% in their department.'

        elif age < 35:
            # Mid-career - focus on career progression and family
            start_year = current_year - random.randint(7, 12)
            return f'Born {birth_year}. Has rapidly advanced to {job} at their {city}-based firm since {start_year}, implementing strategies that increased team productivity by 31%. Volunteers as a youth mentor in the community.'

        elif age < 50:
            # Established career - focus on leadership and expertise
            start_year = current_year - random.randint(15, 25)
            leadership_role = 'leading a team of specialists' if random.random() > 0.5 else 'managing cross-functional projects'
            return f'Born {birth_year}. Has worked as {job} in {city} since {start_year}, {leadership_role}. Their {education} background has shaped their inclusive management style, recently publishing research that influenced industry standards.'

        elif age < 65:
            # Senior career - focus on legacy and mentorship
            start_year = current_year - random.randint(30, 40)
            return f'Born {birth_year}. Serves as senior {job} in {city} since {start_year}, mentoring the next generation. Their extensive network and instrumental role in developing training programs have benefited over 200 professionals.'

        else:
            # Retirement/senior - focus on life achievements and wisdom
            start_year = current_year - random.randint(40, 50)
            retirement_status = 'enjoying well-earned retirement' if age > 70 else 'transitioning toward retirement'
            return f'Born {birth_year}. Now {retirement_status} in {city} after a distinguished career as {job} since {start_year}. Their pioneering work established benchmarks still used today, remaining active in professional associations.'

    def augment_batch(self, personas: List[Dict]) -> List[AugmentationResult]:
        """Augment a batch of personas"""

        # Check cache first
        cache_key = self._get_cache_key(personas)
        cached_results = self._load_from_cache(cache_key)
        if cached_results:
            return cached_results

        # Create and send prompt
        prompt = self._create_prompt(personas)

        response_text = self._call_llm_with_retry(prompt)
        if not response_text:
            logging.error("Failed to get LLM response after retries")
            return []

        try:
            # Parse JSON response
            results = json.loads(response_text)
            if not isinstance(results, list):
                logging.error(f"Expected JSON array, got: {type(results)}")
                return []

            # Convert to AugmentationResult objects
            augmentation_results = []
            for result in results:
                if not isinstance(result, dict) or 'name' not in result or 'index' not in result:
                    logging.warning(f"Invalid result format: {result}")
                    continue

                corrections = result.get('corrections', {})
                augmentations = result.get('augmentations', {})

                # Validate required fields in augmentations
                required_fields = ['religion', 'demeanour', 'interests', 'sector', 'backstory']
                if not all(field in augmentations for field in required_fields):
                    logging.warning(f"Missing required fields in augmentations: {augmentations}")
                    continue

                aug_result = AugmentationResult(
                    index=int(result['index']),
                    name=result['name'],
                    corrections=corrections,
                    augmentations=augmentations
                )

                augmentation_results.append(aug_result)

                # Update metrics
                if corrections:
                    self.metrics.corrections_made += 1
                if augmentations:
                    self.metrics.augmentations_added += 1

            self.metrics.total_processed += len(augmentation_results)

            # Cache successful results
            if augmentation_results:
                self._save_to_cache(cache_key, augmentation_results)

            # Add delay between calls
            time.sleep(self.delay_seconds)

            return augmentation_results

        except json.JSONDecodeError as e:
            self.metrics.errors_encountered += 1
            logging.error(f"Failed to parse LLM response as JSON: {e}")
            return []
        except Exception as e:
            self.metrics.errors_encountered += 1
            logging.error(f"Unexpected error processing LLM response: {e}")
            return []

    def augment_personas(self, input_file: str, output_file: str) -> None:
        """Process all personas from input file and save to output file (incremental saving)"""

        input_path = Path(input_file)
        output_path = Path(output_file)

        if not input_path.exists():
            raise FileNotFoundError(f"Input file not found: {input_path}")

        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Open output file for appending (will create if doesn't exist)
        total_processed = 0

        with open(input_path, 'r', encoding='utf-8') as input_f:
            # Process line by line to handle large files efficiently
            current_batch = []
            batch_number = 0

            for line_num, line in enumerate(input_f, 1):
                try:
                    persona = json.loads(line.strip())
                    current_batch.append((line_num, persona))
                except json.JSONDecodeError as e:
                    logging.warning(f"Skipping invalid JSON at line {line_num}: {e}")
                    continue

                # When we have a full batch, process it
                if len(current_batch) >= self.batch_size:
                    batch_number += 1
                    processed_count = self._process_and_save_batch(
                        current_batch, output_path, batch_number
                    )
                    total_processed += processed_count
                    current_batch = []  # Reset for next batch

            # Process remaining personas in the last incomplete batch
            if current_batch:
                batch_number += 1
                processed_count = self._process_and_save_batch(
                    current_batch, output_path, batch_number
                )
                total_processed += processed_count

        logging.info(f"Completed processing: {total_processed} personas saved to {output_path}")
        # Log quality metrics
        self._log_metrics()

    def _process_and_save_batch(self, batch: List[tuple], output_path: Path, batch_number: int) -> int:
        """Process a batch and immediately save results"""

        line_numbers, personas = zip(*batch)
        logging.info(f"Processing batch {batch_number} ({len(personas)} personas)")

        batch_results = self.augment_batch(list(personas))

        # Apply results and save immediately
        saved_count = 0
        with open(output_path, 'a', encoding='utf-8') as output_f:
            # Create quick index -> result map to avoid name-based matching
            idx_to_result = {r.index: r for r in batch_results if r.index is not None}

            for j, (line_num, original_persona) in enumerate(batch):
                try:
                    result = idx_to_result.get(j)
                    if result:
                        # Apply corrections (override existing fields)
                        for field, value in result.corrections.items():
                            original_persona[field] = value

                        # Apply augmentations (add new fields)
                        for field, value in result.augmentations.items():
                            original_persona[field] = value

                    # Save immediately
                    output_f.write(json.dumps(original_persona, ensure_ascii=False) + '\n')
                    saved_count += 1

                except Exception as e:
                    logging.error(f"Failed to save persona from line {line_num}: {e}")

        logging.info(f"Batch {batch_number} completed: {saved_count}/{len(personas)} personas saved")
        return saved_count

    def _log_metrics(self):
        """Log quality metrics"""
        logging.info("=== Augmentation Quality Metrics ===")
        logging.info(f"Total processed: {self.metrics.total_processed}")
        logging.info(f"Corrections made: {self.metrics.corrections_made}")
        logging.info(f"Augmentations added: {self.metrics.augmentations_added}")
        logging.info(f"Errors encountered: {self.metrics.errors_encountered}")
        logging.info(f"Cache hits: {self.metrics.cache_hits}")

        if self.metrics.total_processed > 0:
            correction_rate = self.metrics.corrections_made / self.metrics.total_processed
            logging.info(f"Correction rate: {correction_rate:.1%}")

def main():
    """Main function for command line usage"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Augment raw personas with LLM enhancements')
    parser.add_argument('--input', type=str, default='../backend/data/raw_personas.jsonl',
                        help='Input file path for raw personas (default: ../backend/data/raw_personas.jsonl)')
    parser.add_argument('--output', type=str, default='../backend/data/personas.jsonl',
                        help='Output file path for augmented personas (default: ../backend/data/personas.jsonl)')
    parser.add_argument('--environment', type=str, default=None,
                        help='Path to environment story file (e.g., ../backend/data/worlds/berlin-shadows-1936/story.md)')
    parser.add_argument('--batch-size', type=int, default=15,
                        help='Number of personas per batch (default: 15)')
    
    args = parser.parse_args()
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        logging.error('GEMINI_API_KEY environment variable not set')
        exit(1)

    # Log configuration
    logging.info('=== Persona Augmentation Configuration ===')
    logging.info(f'Input file: {args.input}')
    logging.info(f'Output file: {args.output}')
    logging.info(f'Environment: {args.environment if args.environment else "None (generic augmentation)"}')
    logging.info(f'Batch size: {args.batch_size}')

    augmenter = PersonaAugmenter(
        api_key=api_key,
        environment_path=args.environment,
        batch_size=args.batch_size
    )

    try:
        augmenter.augment_personas(
            input_file=args.input,
            output_file=args.output
        )
    except Exception as e:
        logging.error(f'Augmentation failed: {e}')
        exit(1)

if __name__ == '__main__':
    main()