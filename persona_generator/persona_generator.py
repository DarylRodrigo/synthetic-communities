"""
Persona Generator Module

This module generates synthetic personas using only the `faker` library.
Personas include realistic demographic, geographic, psychological, and behavioral traits,
saved as JSONL lines under backend/data/personas.jsonl.
"""

import json
import logging
import random
import uuid
from datetime import datetime, date
from pathlib import Path
from typing import Dict, List, Optional

try:
    from faker import Faker
except ImportError as e:
    raise ImportError("Required package not found. Please install: pip install faker") from e

logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')

def _generate_name_for_ethnicity(ethnicity: str, fallback_fake: "Faker") -> str:
    """Generate a culturally appropriate name based on ethnicity, with graceful fallbacks.

    This function maps common ethnicity labels to Faker locales to diversify names.
    If a mapped locale is unavailable, it falls back to the provided Faker instance.
    """
    ethnicity = (ethnicity or '').lower()

    # Map ethnicity to candidate faker locales (ordered by preference)
    ethnicity_to_locales: Dict[str, List[str]] = {
        'swiss-german': ['de_CH'],
        'swiss-french': ['fr_CH'],
        'swiss-italian': ['it_CH'],
        'german': ['de_DE'],
        'french': ['fr_FR'],
        'italian': ['it_IT'],
        'portuguese': ['pt_PT'],
        'brazilian': ['pt_BR'],
        'spanish': ['es_ES'],
        'turkish': ['tr_TR'],
        'kosovan': ['sq_AL', 'bs_BA', 'hr_HR', 'sr_RS'],  # Albanian/Balkan fallbacks
        'sri lankan': ['en_IN'],  # best available fallback
        'indian': ['en_IN'],
        'chinese': ['zh_CN', 'zh_TW'],
        'vietnamese': ['vi_VN'],
        'syrian': ['ar_SA', 'ar_EG'],
        'afghan': ['fa_IR'],  # Persian as closest available fallback
        # Broad buckets
        'other european': ['de_DE', 'fr_FR', 'it_IT', 'es_ES', 'pt_PT'],
        'mediterranean': ['it_IT', 'es_ES', 'pt_PT'],
    }

    # Find matching key
    chosen_locales: List[str] = []
    for key, locales in ethnicity_to_locales.items():
        if key in ethnicity:
            chosen_locales = locales
            break

    # Try to generate name from candidate locales
    for locale in chosen_locales:
        try:
            local_fake = Faker(locale)
            return local_fake.name()
        except Exception:
            continue

    # Fallback to provided faker
    try:
        return fallback_fake.name()
    except Exception:
        # Final safety fallback
        return "Alex Smith"

def generate_personas(n_personas: int, country: str = "CH", seed: Optional[int] = None) -> None:
    if not isinstance(n_personas, int) or n_personas <= 0:
        raise ValueError("n_personas must be a positive integer")

    # Handle Switzerland with multiple language regions
    swiss_locales = ['de_CH', 'fr_CH', 'it_CH']  # rm_CH not available in faker
    if country == "CH":
        # Use multiple Swiss locales for diversity
        locales = swiss_locales
        logging.info("Generating personas for Switzerland with multiple language regions")
    else:
        # For other countries, use the specified locale or fallback to en_US
        try:
            fake = Faker(country)
            locales = [country]
        except Exception as e:
            logging.warning(f"Invalid locale '{country}', falling back to 'en_US': {e}")
            locales = ['en_US']

    if seed is not None:
        Faker.seed(seed)
        random.seed(seed)

    output_path = Path("../backend/data/raw_personas.jsonl")
    output_path.parent.mkdir(parents=True, exist_ok=True)

    susceptibility_sum = trust_sum = turnout_sum = 0.0

    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            for i in range(n_personas):
                # Select locale for this persona (round-robin for Switzerland)
                if country == "CH":
                    locale = swiss_locales[i % len(swiss_locales)]
                else:
                    locale = locales[0]

                fake = Faker(locale)
                profile = fake.simple_profile()

                # Generate realistic age distribution (always 18-90)
                # Use weighted distribution for realistic population demographics
                age_ranges = [
                    (18, 25, 0.25),   # Young adults
                    (26, 40, 0.35),   # Prime working age
                    (41, 65, 0.30),   # Middle-aged
                    (66, 90, 0.10)    # Elderly
                ]

                rand = random.random()
                cumulative = 0
                for min_age, max_age, weight in age_ranges:
                    cumulative += weight
                    if rand <= cumulative:
                        age = random.randint(min_age, max_age)
                        break

                # Gender is pulled from profile['sex']
                gender = profile.get('sex', random.choice(['M', 'F']))

                # Basic location info
                city = fake.city()
                job = fake.job()
                company = fake.company()

                # Education level based on age (realistic progression)
                education_levels = ['high_school', 'some_college', 'bachelor_degree', 'master_degree', 'doctorate', 'trade_school']

                # Age-appropriate education distributions
                if age <= 22:
                    # Young people: mostly high school, some college
                    education_weights = [0.60, 0.30, 0.08, 0.01, 0.005, 0.005]
                elif age <= 25:
                    # College age: mix of high school, college, some bachelor's
                    education_weights = [0.30, 0.40, 0.25, 0.03, 0.01, 0.01]
                elif age <= 30:
                    # Young professionals: bachelor's, some master's, college dropouts
                    education_weights = [0.15, 0.25, 0.40, 0.15, 0.03, 0.02]
                elif age <= 40:
                    # Established professionals: bachelor's and master's common
                    education_weights = [0.10, 0.15, 0.35, 0.25, 0.10, 0.05]
                elif age <= 50:
                    # Mid-career: good mix of all levels
                    education_weights = [0.08, 0.12, 0.30, 0.25, 0.15, 0.10]
                elif age <= 65:
                    # Late career: experienced, mix of education levels
                    education_weights = [0.12, 0.15, 0.25, 0.20, 0.13, 0.15]
                else:
                    # Elderly: mix but fewer advanced degrees, more trade/vocational
                    education_weights = [0.20, 0.15, 0.20, 0.15, 0.05, 0.25]

                education_level = random.choices(education_levels, weights=education_weights)[0]

                income_brackets = ['low', 'middle_low', 'middle', 'middle_high', 'high']
                income_weights = [0.20, 0.25, 0.30, 0.15, 0.10]
                income_bracket = random.choices(income_brackets, weights=income_weights)[0]


                # Ethnicity based on realistic Swiss demographics (2023 data)
                # Switzerland: 75% Swiss citizens, 25% foreign nationals
                # Major immigrant groups: Italian (15%), German (5%), Portuguese (5%), French (5%),
                # Kosovan (3%), Spanish (3%), Turkish (2%), Sri Lankan (1%)

                swiss_ethnicities = ['Swiss-German', 'Swiss-French', 'Swiss-Italian']
                european_ethnicities = ['German', 'French', 'Italian', 'Portuguese', 'Kosovan', 'Spanish', 'Turkish']
                global_ethnicities = ['Sri Lankan', 'Chinese', 'Indian', 'Brazilian', 'Syrian', 'Afghan', 'Vietnamese']

                # Weighted distribution reflecting Swiss demographics
                # 60% Swiss (of total population), 35% European immigrants, 5% global immigrants
                ethnicity_options = (
                    swiss_ethnicities * 60 +      # 60% Swiss
                    european_ethnicities * 35 +    # 35% European immigrants
                    global_ethnicities * 5         # 5% Global immigrants
                )

                ethnicity = random.choice(ethnicity_options)

                # Cultural background based on ethnicity
                if ethnicity in swiss_ethnicities:
                    cultural_background = random.choice(['Swiss-German', 'Swiss-French', 'Swiss-Italian', 'Alpine culture'])
                elif ethnicity in ['German', 'Austrian']:
                    cultural_background = random.choice(['Central European', 'German-speaking', 'Alpine culture'])
                elif ethnicity in ['French']:
                    cultural_background = random.choice(['Western European', 'Romance culture', 'French-speaking'])
                elif ethnicity in ['Italian', 'Portuguese', 'Spanish']:
                    cultural_background = random.choice(['Southern European', 'Mediterranean culture', 'Romance culture'])
                elif ethnicity in ['Kosovan', 'Turkish']:
                    cultural_background = random.choice(['Balkan culture', 'Mediterranean culture', 'European'])
                elif ethnicity == 'Sri Lankan':
                    cultural_background = random.choice(['South Asian', 'Sri Lankan culture', 'Asian'])
                elif ethnicity in ['Chinese', 'Indian', 'Vietnamese']:
                    cultural_background = random.choice(['East Asian', 'South Asian', 'Asian'])
                elif ethnicity in ['Brazilian', 'Syrian', 'Afghan']:
                    cultural_background = random.choice(['Latin American', 'Middle Eastern', 'South Asian'])
                else:
                    cultural_background = random.choice(['European', 'Western', 'Global'])


                # Gender (roughly 50/50 split)
                gender = random.choice(['Male', 'Female'])

                # Random behavioral traits
                susceptibility = round(random.uniform(0, 1), 3)
                trust_institution = round(random.uniform(0, 1), 3)
                turnout_propensity = round(random.uniform(0, 1), 3)

                # Media consumption
                media_weights = {
                    'social_media': random.uniform(0, 1),
                    'tv': random.uniform(0, 1),
                    'newspaper': random.uniform(0, 1),
                    'blogs': random.uniform(0, 1)
                }
                total_weight = sum(media_weights.values())
                media_diet = {k: round(v / total_weight, 3) for k, v in media_weights.items()}

                # Personality traits (Big Five)
                personality_traits = {
                    'openness': round(random.uniform(0, 1), 3),
                    'conscientiousness': round(random.uniform(0, 1), 3),
                    'extraversion': round(random.uniform(0, 1), 3),
                    'agreeableness': round(random.uniform(0, 1), 3),
                    'neuroticism': round(random.uniform(0, 1), 3)
                }

                # Cognitive Bias (e.g., confirmation bias)
                confirmation_bias = random.uniform(0, 1)  # Higher values = more bias to agree with prior beliefs

                # Social Network Influence (Social Capital)
                social_network_influence = random.uniform(0, 1)  # Social connectedness and influence ability

                # Decision-Making (e.g., risk aversion, fairness value)
                risk_aversion = random.uniform(0, 1)
                fairness_value = random.uniform(0, 1)

                # Random topic-based beliefs
                topics = ['climate_change', 'immigration', 'economy', 'healthcare', 'education', 'foreign_policy', 'technology', 'social_justice']
                prior_beliefs = {topic: round(random.uniform(-1, 1), 3) for topic in random.sample(topics, random.randint(3, 6))}

                # Create persona
                persona = {
                    'id': str(uuid.uuid4()),
                    # Generate a name consistent with inferred ethnicity when possible
                    'name': _generate_name_for_ethnicity(ethnicity, fake),
                    'age': age,
                    'gender': gender,
                    'city': city,
                    'job': job,
                    'company': company,
                    'education_level': education_level,
                    'income_bracket': income_bracket,
                    'ethnicity': ethnicity,
                    'cultural_background': cultural_background,
                    'country': country if country != "CH" else f"CH_{locale.split('_')[0]}",
                    'susceptibility': susceptibility,
                    'trust_institution': trust_institution,
                    'turnout_propensity': turnout_propensity,
                    'media_diet': media_diet,
                    'personality_traits': personality_traits,
                    'confirmation_bias': confirmation_bias,
                    'social_network_influence': social_network_influence,
                    'risk_aversion': risk_aversion,
                    'fairness_value': fairness_value,
                    'prior_beliefs': prior_beliefs,
                    'timestamp': datetime.now().isoformat()
                }

                f.write(json.dumps(persona, ensure_ascii=False) + '\n')

                # Accumulate statistics for summary
                susceptibility_sum += susceptibility
                trust_sum += trust_institution
                turnout_sum += turnout_propensity

        # Log summary stats
        country_display = country if country != "CH" else "Switzerland (multi-language)"
        logging.info(f"Generated {n_personas} personas for {country_display} → {output_path}")
        if n_personas > 0:
            logging.info("Summary Statistics:")
            logging.info(f"- Average susceptibility: {susceptibility_sum / n_personas:.3f}")
            logging.info(f"- Average trust_institution: {trust_sum / n_personas:.3f}")
            logging.info(f"- Average turnout_propensity: {turnout_sum / n_personas:.3f}")

    except Exception as e:
        logging.error(f"Error generating personas: {e}")
        raise OSError(f"Failed to write personas to {output_path}: {e}") from e

def main():
    n_personas = 1000
    country = "CH"
    seed = 42
    try:
        generate_personas(n_personas, country, seed)
    except Exception as e:
        logging.error(f"Failed to generate personas: {e}")
        exit(1)

if __name__ == "__main__":
    main()
