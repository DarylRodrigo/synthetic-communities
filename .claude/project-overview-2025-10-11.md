# Synthetic Communities - Project Overview
**Generated:** 2025-10-11

## Executive Summary

**Synthetic Communities** is a multi-agent simulation system that models political debates, social media dynamics, and voting behavior. It simulates how candidates interact with a population of personas through debates, social media, and peer conversations, ultimately leading to voting outcomes. The system uses LLM-driven agents (Gemini API) for realistic reasoning and belief evolution.

---

## Core Architecture

### Main Components

#### 1. GameEngine (`backend/src/game_engine.py:27`)
**Purpose:** Orchestrates the entire simulation lifecycle

**Key Responsibilities:**
- Manages simulation epochs with configurable parameters
- Coordinates candidates, population, debates, and social media
- Serializes simulation state to JSONL files for reproducibility
- Implements the main game loop: debate → consumption → belief updates → social interaction

**Key Methods:**
- `run()` - Main simulation loop across epochs
- `_run_epoch()` - Single epoch execution
- `_conduct_debate_on_topic()` - Orchestrates multi-turn debates with questions
- `_serialize_epoch_state()` - Saves state to `data/simulation/{timestamp}/epochs.jsonl`

#### 2. Persona (`backend/src/persona.py:14`)
**Purpose:** Individual citizens/voters with evolving beliefs and behaviors

**Properties:**
- `features` - Demographics and characteristics
- `debate_knowledge` - Accumulated debate transcripts consumed
- `chats` - Conversation history with peers
- `social_media_knowledge` - Posts seen on the platform
- `posts` - Posts created by this persona
- `beliefs` - Current belief state (dict of topic → belief string)

**Key Behaviors:**
- `consume_debate_content()` - Process and store debate transcripts
- `update_beliefs()` - LLM-driven belief evolution based on knowledge category
- `chat_with_peers()` - Generate conversational responses
- `create_social_media_post()` - Generate posts based on beliefs and context
- `react_to_post()` - Generate thumbs up/down reactions
- `vote()` - Choose candidate based on all accumulated knowledge

**LLM Integration:**
Each persona has its own LLM client and uses context-aware prompts that include:
- Persona features and current beliefs
- Recent knowledge (debate/chat/social media)
- Knowledge summary statistics

#### 3. Population (`backend/src/population.py:9`)
**Purpose:** Manages the collection of personas and orchestrates collective behaviors

**Key Responsibilities:**
- Load personas from JSONL files
- Orchestrate paired peer conversations (random pairing)
- Coordinate social media posting (7% probability per persona)
- Manage reactions to posts (40% probability per persona per post)
- Conduct final voting and aggregate results

**Key Methods:**
- `load_from_jsonl()` - Load personas from data files
- `chat_with_peers()` - Create random pairs for conversations
- `create_social_media_posts()` - Stochastic post generation
- `react_to_posts()` - Stochastic reaction generation
- `conduct_vote()` - Final voting with candidate selection

#### 4. Candidate (`backend/src/candidate.py:20`)
**Purpose:** Political candidates who debate, adapt, and try to persuade

**State (`CandidateState`):**
- `id`, `name`, `character` - Identity and political leaning
- `policy_positions` - Dict of topic_id → position string
- `memory` - Accumulated reflections and experiences

**Key Behaviors:**
- `_initialize_policy_positions()` - LLM generates initial positions on all topics
- `read_social_media_signals()` - Adjust positions based on public sentiment
- `craft_debate_statement()` - Generate strategic debate responses with rebuttals
- `reflect_on_debate()` - Post-debate introspection and memory updates

**Strategy:**
- Candidates see previous statements in the debate and can rebut opponents
- They maintain memory of experiences and use it for decision-making
- They adapt positions based on social media sentiment while maintaining character

#### 5. Mediator (`backend/src/mediator.py:61`)
**Purpose:** Orchestrates debates and generates context-aware questions

**State (`MediatorState`):**
- `id` - Mediator identifier
- `memory` - Accumulated context from social media and previous debates

**Key Behaviors:**
- `read_social_media_signals()` - Analyze public sentiment and themes
- `read_previous_debates()` - Review how candidate positions evolved
- `propose_question()` - Generate new questions based on topic and context
- `introduce_question()` - Create introductions referencing relevant context
- `orchestrate_debate_turn()` - Manage candidate responses in order
- `publish_debate_transcript()` - Package all statements with metadata

**Question Generation:**
- Context-aware: considers previous questions, candidate positions, and public sentiment
- Builds on discussion rather than repeating topics
- Concise (under 20 words), neutral, and probing

#### 6. SocialMedia (`backend/src/social_media.py:19`)
**Purpose:** Platform for posts, reactions, and feed generation

**Data Structures:**
- `Post` - Dataclass with id, persona_id, content, likes, dislikes
- `posts` - List of all posts
- `reactions` - Dict mapping post_id → list of reactions

**Key Methods:**
- `add_post()` - Add new post and return post ID
- `get_feed()` - Return last N posts as formatted string
- `add_reaction()` - Record reaction and update like/dislike counts
- `get_platform_state()` - Export full platform state

---

## Simulation Flow

### Per-Epoch Cycle (`game_engine.py:78-90`)

```
1. Candidates read social media
   ├─ Pull latest feed from social media platform
   └─ Update policy positions based on sentiment

2. For each topic:
   For each question:
     ├─ Mediator proposes context-aware question
     ├─ Mediator introduces question
     ├─ For each turn:
     │   └─ All candidates craft statements (seeing previous statements)
     └─ Publish debate transcript

3. Population consumes debate
   └─ All personas read latest debate transcript

4. Personas update beliefs from debate
   └─ LLM-driven belief evolution using debate knowledge

5. Personas chat with peers
   ├─ Random pairing of personas
   └─ N rounds of back-and-forth conversation

6. Personas update beliefs from chats
   └─ Integrate peer influence into beliefs

7. Personas post to social media
   └─ 7% probability, creates posts based on beliefs

8. Population reacts to posts
   └─ 40% probability per post, thumbs up/down

9. Personas update beliefs from social media
   └─ Final belief adjustments from social knowledge

10. Serialize epoch state
    └─ Save to data/simulation/{timestamp}/epochs.jsonl
```

### Final Vote

After all epochs complete:
- `conduct_final_vote()` in `game_engine.py:370`
- Each persona votes based on ALL accumulated knowledge
- Results aggregated by candidate

---

## Key Features

### 1. LLM-Driven Intelligence
- **Provider:** Google Gemini API (via `GEMINI_API_KEY`)
- **Usage:** All agent reasoning (candidates, personas, mediator)
- **Prompts:** Context-aware, role-specific, with system instructions
- **Responses:** Parsed (JSON for beliefs, text for statements)

### 2. Memory & Context
- **Candidates:** Maintain memory of social media reflections and debate experiences
- **Personas:** Store all knowledge in separate buckets (debate/chat/social)
- **Mediator:** Accumulates context from social media and previous debates
- **Usage:** Memory informs all future decisions and belief updates

### 3. Belief Evolution
- **Gradual:** Personas update beliefs incrementally (max 50% change per update)
- **Multi-Source:** Beliefs shaped by debates, conversations, and social media
- **Context-Rich:** Updates consider persona features, current beliefs, and new knowledge
- **LLM-Driven:** Natural language belief statements, not numeric scores

### 4. Strategic Debate
- **Rebuttals:** Candidates can directly challenge weak opponent arguments
- **Context-Aware:** Candidates see all previous statements in the debate
- **Memory-Informed:** Use accumulated experiences for credibility
- **Position Adaptation:** Adjust stances based on public sentiment

### 5. Reproducibility
- **Config-Driven:** All parameters in `Config` dataclass
- **Random Seeds:** Deterministic runs with fixed seed
- **Serialization:** State saved after each epoch to JSONL
- **Logging:** Comprehensive DEBUG/INFO logs throughout

---

## Data & Configuration

### Configuration (`config.py:5`)

```python
@dataclass
class Config:
    population_size: int      # Number of personas
    questions_per_topic: int  # Questions per debate topic
    turns_per_question: int   # Back-and-forth turns per question
    num_epochs: int           # Total simulation epochs
    random_seed: int          # For reproducibility
```

**Additional properties in Config (not in dataclass):**
- `topics_per_epoch` - Used in game loop (referenced in `game_engine.py:81`)

### Topics

Defined as `Topic` dataclass (`mediator.py:10`):
```python
@dataclass
class Topic:
    id: str
    title: str
    description: str
```

**Example:** Healthcare Reform - "Should the government implement universal healthcare?"

### Personas

**Loading:** `data/personas.jsonl` via `population.load_from_jsonl()`

**Format (expected):** Each line is a JSON object with at minimum:
```json
{"id": "persona_1", "features": {...}}
```

**Current Issue:** The personas.jsonl file is loaded but features are NOT extracted from file - they remain empty dict by default. The system works with personas having no pre-defined features.

### Output Files

**Location:** `data/simulation/{timestamp}/epochs.jsonl`

**Format:** One JSON object per line (JSONL), one line per epoch

**Structure:**
```json
{
  "epoch": 0,
  "debates": [...],       // All debate transcripts for this epoch
  "newsfeed": {...},      // Social media posts
  "candidates": [...],    // Candidate states (positions, memory)
  "population_votes": [...]  // Persona beliefs and demographics
}
```

---

## Entry Point

### `main.py:16`

**Flow:**
1. Configure logging (DEBUG level)
2. Create `Config` with simulation parameters
3. Initialize `GameEngine`
4. Load population from `data/personas.jsonl`
5. Define debate topics
6. Initialize candidates with political leanings
7. Initialize mediator with topics
8. Initialize social media platform
9. Run simulation: `engine.run()`
10. Print results and debate summary
11. Conduct final vote

**Example Configuration (from main.py):**
- Population: 100 personas
- Questions per topic: 1
- Turns per question: 1
- Epochs: 1
- Seed: 42
- Candidates: 2 (Alice Johnson - Progressive, Bob Smith - Conservative)
- Topics: 1 (Healthcare Reform)

---

## Code Organization

```
backend/
├── main.py                 # Entry point
├── src/
│   ├── __init__.py
│   ├── config.py          # Configuration dataclass
│   ├── game_engine.py     # Main orchestration
│   ├── persona.py         # Individual citizen agents
│   ├── population.py      # Persona collection manager
│   ├── candidate.py       # Political candidate agents
│   ├── mediator.py        # Debate orchestrator
│   ├── social_media.py    # Platform and posts
│   └── llm_client.py      # LLM interface (not read but referenced)
└── data/
    ├── personas.jsonl     # Population data
    └── simulation/        # Output directory
```

---

## Dependencies & Environment

**Required:**
- Python 3.x
- `GEMINI_API_KEY` environment variable (Google Gemini API)
- `.env` file for environment variables

**Key Imports:**
- `dotenv` - Load environment variables
- `logging` - Comprehensive logging
- `json` - JSONL serialization
- `dataclasses` - Clean data structures
- `typing` - Type hints throughout
- `datetime`, `pathlib` - File management
- `uuid` - Unique IDs for posts

**LLM Client:**
- Module: `src.llm_client`
- Functions: `create_client(api_key)`, `generate_response(client, prompt, system_instruction)`
- Provider: Google Gemini (based on environment variable name)

---

## Probabilistic Behaviors

The simulation includes stochastic elements for realism:

1. **Social Media Posting** (`population.py:111`)
   - Probability: 7% per persona per epoch
   - Eligible personas generate posts using LLM

2. **Post Reactions** (`population.py:149`)
   - Probability: 40% per persona per post
   - Generates thumbs_up or thumbs_down using LLM

3. **Peer Conversation Length** (`population.py:81`)
   - Mean: 3 rounds per conversation
   - Variance: ±1 round
   - Back-and-forth messages between paired personas

4. **Persona Pairing** (`population.py:68`)
   - Random shuffle for peer conversations
   - Odd persona out doesn't chat that round

---

## Notable Implementation Details

### 1. Incremental Debate Knowledge

Personas track debate transcripts with round indicators:
- `persona.py:38-62` - Compares new vs previous transcripts
- Avoids storing duplicate content
- Formats as `[round N debate transcript] content`

### 2. Belief Update Constraints

When updating beliefs (`persona.py:100`):
- `max_change_percentage` parameter (default 50%)
- Prevents radical belief shifts
- LLM instructed to maintain gradual change

### 3. Candidate Reflection

Candidates reflect twice per debate:
1. **During:** Update positions from social media (`candidate.py:59`)
2. **After:** Deep reflection on debate performance (`candidate.py:224`)
   - Honest introspection
   - Acknowledging opponent's good points
   - Evaluating own performance

### 4. Context-Aware Question Generation

Mediator generates questions (`mediator.py:150`):
- Considers previous questions on the topic
- Reviews candidate positions from past debates
- Incorporates social media analysis
- Ensures questions build on the discussion

### 5. Sequential Statement Context

In debates (`mediator.py:264`):
- Each candidate sees statements from previous candidates in the SAME turn
- Enables real-time rebuttals within a turn
- Context accumulates throughout the debate

### 6. Safety Checks for Content

Multiple places handle potential type mismatches:
- `game_engine.py:214-217` - Check if Post.content is Post object
- `social_media.py:43-46`, `social_media.py:61-63` - Extract string content
- Handles edge cases from dict/object conversions

### 7. Serialization

Custom JSON encoder (`game_engine.py:19`):
- `DataclassJSONEncoder` - Handles dataclass instances
- Converts to dict via `asdict()` before JSON serialization
- Used for epoch state serialization

---

## Current State & Recent Changes

**Branch:** `feat/persona-characters`

**Recent Commit (HEAD):**
"Remove outdated personas.jsonl file from backend and update personas.jsonl in dashboard with new entries and modifications, including enhanced details for existing personas and the addition of new ones."

**Recent Changes:**
- Persona file management and updates
- Enhanced persona details
- New personas added

**Clean Working Directory:** No uncommitted changes

---

## Potential Extensions & TODOs

Based on README.md vision vs current implementation:

### Not Yet Implemented

1. **Persona Features from File**
   - Currently personas.jsonl data is not loaded into `persona.features`
   - Would enable heterogeneous populations with pre-defined traits

2. **Social Network Graph**
   - Personas don't have social graph connections
   - Currently random pairing for conversations
   - Could implement homophily and targeted influence

3. **Multiple Opinion Models**
   - Currently LLM-based only
   - README mentions: Bayesian, bounded confidence, elaboration likelihood, etc.
   - Could add pluggable update strategies

4. **Platform Dynamics**
   - No feed ranking algorithm
   - No virality modeling
   - No moderation rules
   - Feed is simple chronological

5. **Multiple Topics Per Epoch**
   - Config has `questions_per_topic` but game loop uses `topics_per_epoch`
   - Currently main.py only defines 1 topic

6. **Voting Rule Variations**
   - Only simple plurality currently
   - README mentions ranked-choice, approval, score voting

7. **Metrics & Telemetry**
   - Basic logging exists
   - Could add: polarization indices, exposure diversity, etc.

### Implemented Well

✓ LLM-driven agent reasoning
✓ Memory and context tracking
✓ Multi-stage belief updates
✓ Strategic debate with rebuttals
✓ Social media posting and reactions
✓ Peer conversations
✓ State serialization
✓ Reproducibility (seeds + config)
✓ Comprehensive logging

---

## Summary

**Synthetic Communities** is a sophisticated multi-agent simulation with LLM-powered reasoning at its core. The system models realistic political discourse through debates, social media, and peer conversations, culminating in voting outcomes. Key strengths include context-aware agents with memory, gradual belief evolution, strategic candidate behavior, and reproducible experiments. The codebase is well-structured with clear separation of concerns, comprehensive type hints, and detailed logging.

**Primary Use Case:** Research platform for studying opinion dynamics, messaging strategies, platform effects, and collective decision-making in controlled experimental settings.
