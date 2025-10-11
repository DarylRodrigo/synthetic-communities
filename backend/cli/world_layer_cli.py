import sys
import os
import re
import json
import logging
from pathlib import Path
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

cli_dir = Path(__file__).parent
backend_dir = cli_dir.parent
root_dir = backend_dir.parent
sys.path.insert(0, str(backend_dir))

from src import llm_client 

# Logging
log_level = logging.DEBUG if os.getenv("DEBUG") else logging.INFO
logging.basicConfig(level=log_level, format="%(levelname)s - %(name)s - %(message)s")
log = logging.getLogger("WorldBuilderCLI")

DATA_ROOT = backend_dir / "data" / "worlds"

def slugify(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text or f"world-{datetime.now().strftime('%Y%m%d-%H%M%S')}"


class WorldBuilderCLI:
    def __init__(self):
        self.client = None
        self.seed_prompt: Optional[str] = None
        self.suggested_name: Optional[str] = None
        self.slug: Optional[str] = None
        self.world_yaml: Optional[str] = None
        self.story_md: Optional[str] = None

    # ---------- Boot ----------

    def initialize_llm(self):
        print("\n🤖 Initializing LLM client...")
        load_dotenv(backend_dir / ".env")
        load_dotenv(root_dir / ".env")
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("✗ GEMINI_API_KEY not found in environment")
            print("  Please set GEMINI_API_KEY in your .env file")
            sys.exit(1)
        try:
            self.client = llm_client.create_client(api_key)
            print("✓ LLM client initialized")
        except Exception as e:
            print(f"✗ Failed to initialize LLM client: {e}")
            sys.exit(1)

    # ---------- Prompts ----------

    @staticmethod
    def prompt_world_suggestion(seed: str) -> str:
        return f"""You are a scenario designer. Propose a short, evocative scenario name and 1–2 sentence synopsis from this seed.
Focus on the PLACE, COMMUNITY, and CONTEXT that will ground this world - not on specific individuals or candidates.
Keep the description NEUTRAL and OBSERVATIONAL - describe what exists, not what should be.

Seed:
\"\"\"{seed}\"\"\"

Respond as strict JSON with keys:
- name: short scenario name focusing on place/time/context (e.g., "Rustbelt Autumn, 2009", "Jakarta's Northern Coast, 2018")
- synopsis: one or two sentences describing the community, place, and civic atmosphere in neutral, factual terms.
"""

    @staticmethod
    def prompt_world_yaml(seed: str, scenario_name: str, synopsis: str) -> str:
        # Tight schema with comments to guide the LLM
        return f"""Generate ONLY a YAML document (no prose) for a `world.yaml` that seeds a civic simulation.
It must be valid YAML and include these top-level keys exactly once:

world:
  id: <kebab-case-id>
  description: <string>
  time:
    year: <int>
    season: <string>
  place:
    settlement: <small_town|city|capital|rural>
    density_per_km2: <float>
  regime:
    type: <electoral_democracy|authoritarian|hybrid>
    media_freedom: <0..1>
    protest_tolerance: <0..1>
  demography:
    population: <int>
    age: {{ median: <float>, p65_plus: <float> }}
    education: {{ tertiary: <float> }}
    groups:
      - {{ name: <string>, share: <0..1> }}
  economy:
    unemployment_rate: <0..1>
    industry_mix: {{ ...shares sum<=1 }}
    gini: <0..1>
    cost_of_living_index: <float>
    shock_sensitivity: {{ commodity_price: <0..1> }}
  history:
    narratives: [<strings>]
    recent_events:
      - {{ date: "<YYYY-MM-DD>", name: "<string>", valence: <-1..1>, cohorts: [<strings>] }}
  culture:
    tight_loose: <0..1>
    religiosity: <0..1>
    moral_foundations: {{ care: <0..1>, fairness: <0..1>, loyalty: <0..1>, authority: <0..1>, sanctity: <0..1>, liberty: <0..1> }}
  social_capital:
    interpersonal_trust: <0..1>
    institutional_trust: {{ local_gov: <0..1>, national_gov: <0..1>, media: <0..1> }}
    associations_density: <0..1>
    polarization: <0..1>
  information_ecosystem:
    outlets: [<strings>]
    platform_mix: {{ radio: <0..1>, tv: <0..1>, newspaper: <0..1>, social_app: <0..1> }}
    echo_chamber_strength: <0..1>
    bot_rate: <0..1>
  networks:
    topology: {{ type: <SBM|small_world|ER>, communities: <int>, intra_p: <0..1>, inter_p: <0..1> }}
    assortativity: {{ by_class: <0..1>, by_partisanship: <0..1> }}
  security:
    surveillance: <0..1>
    intimidation_risk: <0..1>
  policy_env:
    union_rights: <0..1>
    welfare_generosity: <0..1>
    speech_regulation: <0..1>
  mood:
    baseline_affect: {{ anxiety: <0..1>, anger: <0..1>, hope: <0..1> }}
  exogenous_timeline:
    - {{ date: "<YYYY-MM-DD>", name: "<string>", intensity: <0..1>, valence: <-1..1>, target: "<optional>" }}

Guidance:
- The YAML must align with this scenario:
  name: {scenario_name}
  synopsis: {synopsis}
  seed: {seed}
- Prefer plausible values and dates relative to the implied year.
- Use kebab-case for `world.id`.
- Do not include any keys beyond the schema.
- Output only YAML; no code fences, no comments."""

    @staticmethod
    def prompt_story_md(seed: str, scenario_name: str, synopsis: str, world_yaml_excerpt: str) -> str:
        return f"""Write a concise `story.md` that establishes the PLACE, COMMUNITY, and ATMOSPHERE of this simulation world.
This will serve as the foundation for generating diverse community members with varied perspectives later.

CRITICAL: Keep the narrative NEUTRAL and OBSERVATIONAL. Describe the setting, structures, and conditions WITHOUT:
- Taking moral or political positions
- Favoring any particular group, ideology, or viewpoint
- Implying what is "good" or "bad", "right" or "wrong"
- Prescribing solutions or expressing judgment
Instead, describe what EXISTS - the landscape, institutions, groups, tensions - like a neutral ethnographer.

Keep it 300–600 words. Use sections:

# {scenario_name}
*Logline:* {synopsis}

## The Place
[1–2 paragraphs describing the physical setting, sensory details, landmarks, and atmosphere. What does this place feel like? Be descriptive but neutral.]

## The Community
[Describe the social fabric: key demographic groups (mention diverse perspectives), social divisions, shared spaces (markets, squares, cafes, churches, community centers), and how people interact. What are the networks and gathering places? Present all groups neutrally.]

## Civic Infrastructure
[Key institutions and their reputations across different community segments: local media outlets, civic organizations, religious institutions, unions, businesses, government offices. Note that different groups may view these differently. These will shape how information flows and community members connect.]

## Cultural Touchstones
[Symbols, shared memories, local phrases, holidays, taboos, and values shaped by the regime/culture. What matters to people here? Present multiple value systems if they exist in the community.]

## Current Tensions
[What pressures or questions are simmering in this community right now? What recent events or changes have people talking? Present tensions from multiple angles without favoring any position. Keep this open-ended - not about specific candidates.]

Ground the narrative in this world config (excerpt):

{world_yaml_excerpt}

Only return the markdown content (no backticks outside the excerpt, no extra commentary)."""

    # ---------- LLM Helpers ----------

    def ask_json(self, user_prompt: str) -> dict:
        sys_inst = "You are a careful tool. Only return strict JSON. No prose."
        raw = llm_client.generate_response(self.client, user_prompt, sys_inst).strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            # Remove opening fence (```json or just ```)
            raw = re.sub(r"^```(?:json)?\s*\n", "", raw)
            # Remove closing fence
            raw = re.sub(r"\n```\s*$", "", raw)
            raw = raw.strip()

        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            # Try to extract JSON blob if model added extra text
            m = re.search(r"\{.*\}", raw, re.DOTALL)
            if m:
                return json.loads(m.group(0))
            raise

    def ask_text(self, user_prompt: str, sys_inst: Optional[str]) -> str:
        return llm_client.generate_response(self.client, user_prompt, sys_inst).strip()

    # ---------- IO ----------

    def write_files(self):
        assert self.slug and self.world_yaml and self.story_md
        world_dir = DATA_ROOT / self.slug
        world_dir.mkdir(parents=True, exist_ok=True)
        (world_dir / "world.yaml").write_text(self.world_yaml, encoding="utf-8")
        (world_dir / "story.md").write_text(self.story_md, encoding="utf-8")
        print(f"\n✓ Wrote:\n  - {world_dir / 'world.yaml'}\n  - {world_dir / 'story.md'}")

    # ---------- Flow ----------

    def run(self):
        print("\n" + "=" * 60)
        print("🗺️  WORLD BUILDER CLI")
        print("=" * 60)

        self.initialize_llm()

        print("\n📝 Enter a short seed (era/place/mood/themes).")
        print("   e.g., '2009 rustbelt mining town in autumn; union pride; flood risk; elite distrust'")
        print("   e.g., '1936 Berlin; authoritarian spectacle; fear and conformity; art underground'")
        self.seed_prompt = input("\nSeed: ").strip()
        if not self.seed_prompt:
            print("✗ Seed required.")
            sys.exit(1)

        print("\n🔮 Proposing scenario name & synopsis...")
        try:
            js = self.ask_json(self.prompt_world_suggestion(self.seed_prompt))
            self.suggested_name = js.get("name", "").strip() or "Untitled Scenario"
            synopsis = js.get("synopsis", "").strip()
            print(f"\nSuggestion:\n  Name: {self.suggested_name}\n  Synopsis: {synopsis}")
        except Exception as e:
            print(f"✗ Failed to get suggestion: {e}")
            self.suggested_name = "Untitled Scenario"
            synopsis = self.seed_prompt

        name_override = input("\nChange name? (Enter to keep): ").strip()
        if name_override:
            self.suggested_name = name_override

        default_slug = slugify(self.suggested_name)
        slug_in = input(f"Folder slug [{default_slug}]: ").strip()
        self.slug = slug_in or default_slug

        print("\n🧱 Generating world.yaml ...")
        try:
            wy = self.ask_text(
                self.prompt_world_yaml(self.seed_prompt, self.suggested_name, synopsis),
                sys_inst="You are a strict YAML generator. Output only valid YAML. No prose."
            )
            # basic sanity
            if "world:" not in wy or "time:" not in wy:
                raise ValueError("world.yaml missing required sections")
            self.world_yaml = wy
            print("✓ world.yaml generated")
        except Exception as e:
            print(f"✗ Failed to generate world.yaml: {e}")
            sys.exit(1)

        # Show short excerpt for context
        excerpt = "\n".join(self.world_yaml.splitlines()[:30])

        print("\n📖 Generating story.md ...")
        try:
            smd = self.ask_text(
                self.prompt_story_md(self.seed_prompt, self.suggested_name, synopsis, excerpt),
                sys_inst="You are a narrative designer. Return only markdown body."
            )
            self.story_md = smd
            print("✓ story.md generated")
        except Exception as e:
            print(f"✗ Failed to generate story.md: {e}")
            sys.exit(1)

        # Preview & confirm
        print("\n" + "=" * 60)
        print("WORLD.YAML (preview)")
        print("=" * 60)
        print("\n".join(self.world_yaml.splitlines()[:40]) + ("\n... (truncated)" if len(self.world_yaml.splitlines()) > 40 else ""))

        print("\n" + "=" * 60)
        print("STORY.MD (preview)")
        print("=" * 60)
        preview_lines = self.story_md.splitlines()
        print("\n".join(preview_lines[:40]) + ("\n... (truncated)" if len(preview_lines) > 40 else ""))

        confirm = input("\n✅ Write these files? (y/n): ").strip().lower()
        if confirm == "y":
            self.write_files()
        else:
            print("✗ Aborted. Nothing written.")

        # Quick regenerate loop
        while True:
            print("\nRegenerate options:")
            print("  1) Regenerate world.yaml")
            print("  2) Regenerate story.md")
            print("  3) Save & Exit")
            print("  4) Exit without saving")
            choice = input("Your choice: ").strip()
            if choice == "1":
                self.world_yaml = self.ask_text(
                    self.prompt_world_yaml(self.seed_prompt, self.suggested_name, synopsis),
                    sys_inst="You are a strict YAML generator. Output only valid YAML. No prose."
                )
                print("✓ world.yaml regenerated")
            elif choice == "2":
                excerpt = "\n".join(self.world_yaml.splitlines()[:30])
                self.story_md = self.ask_text(
                    self.prompt_story_md(self.seed_prompt, self.suggested_name, synopsis, excerpt),
                    sys_inst="You are a narrative designer. Return only markdown body."
                )
                print("✓ story.md regenerated")
            elif choice == "3":
                self.write_files()
                print("👋 Done.")
                sys.exit(0)
            elif choice == "4":
                print("👋 Exiting without saving.")
                sys.exit(0)
            else:
                print("Invalid choice. Try again.")


def main():
    try:
        WorldBuilderCLI().run()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()