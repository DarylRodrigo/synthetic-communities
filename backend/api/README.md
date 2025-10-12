# Synthetic Communities API Documentation

RESTful API for accessing simulation data from the Synthetic Communities multi-agent simulation system.

## Base URL

```
http://localhost:8000/api
```

## Endpoints

### 1. List All Simulations

Returns a list of all available simulation runs.

**Endpoint:** `GET /api/simulations`

**Response:**
```json
{
  "simulations": [
    {
      "id": "20251011_221904",
      "epoch_count": 1
    },
    {
      "id": "20251011_215614",
      "epoch_count": 1
    }
  ]
}
```

**Fields:**
- `id` (string): Simulation identifier (timestamp format: YYYYMMDD_HHMMSS)
- `epoch_count` (integer): Total number of epochs in the simulation

**Notes:**
- Results are sorted by ID (timestamp) in descending order (newest first)
- Only includes simulations with valid `epochs.jsonl` files

---

### 2. Get Simulation Metadata

Returns static metadata for a specific simulation.

**Endpoint:** `GET /api/simulation/<simulation_id>/metadata`

**Path Parameters:**
- `simulation_id` (string, required): The simulation identifier

**Response:**
```json
{
  "simulation_id": "20251011_221904",
  "config": {
    "population_size": 3,
    "questions_per_topic": 1,
    "turns_per_question": 1,
    "num_epochs": 1,
    "random_seed": 42
  },
  "topics": [
    {
      "id": "topic_1",
      "title": "Healthcare Reform",
      "description": "Should the government implement universal healthcare?"
    }
  ],
  "candidates": [
    {
      "id": "candidate_1",
      "name": "Alice Johnson",
      "character": "Progressive left-leaning, prioritizes social programs",
      "initial_policy_positions": {
        "topic_1": "Healthcare is a fundamental human right..."
      }
    }
  ],
  "population": [
    {
      "id": "5fd4c715-ab18-4aef-bf05-77d1b20645fe",
      "name": "Danielle Deshusses",
      "demographics": {
        "age": 61,
        "gender": "M",
        "city": "Yoderland",
        "job": "Editor, magazine features",
        "education_level": "high_school",
        "income_bracket": "middle_low",
        "personality_traits": {
          "openness": 0.406,
          "conscientiousness": 0.132,
          "extraversion": 0.557,
          "agreeableness": 0.53,
          "neuroticism": 0.841
        },
        "prior_beliefs": {
          "technology": -0.439,
          "immigration": -0.563
        }
      }
    }
  ]
}
```

**Metadata Sections:**
- `config`: Simulation configuration parameters
- `topics`: Full topic definitions used in debates
- `candidates`: Candidate profiles with initial policy positions
- `population`: Complete demographics and characteristics for all personas

**Error Responses:**
- `404 Not Found`: Simulation or metadata file does not exist
```json
{
  "error": "Metadata for simulation <simulation_id> not found"
}
```

---

### 3. Get Epoch Count

Returns the total number of epochs for a simulation.

**Endpoint:** `GET /api/simulation/<simulation_id>/epoch_count`

**Path Parameters:**
- `simulation_id` (string, required): The simulation identifier

**Response:**
```json
{
  "simulation_id": "20251011_221904",
  "total_epochs": 1
}
```

**Fields:**
- `simulation_id` (string): The simulation identifier
- `total_epochs` (integer): Total number of epochs in the simulation

**Error Responses:**
- `404 Not Found`: Simulation does not exist
```json
{
  "error": "Simulation <simulation_id> not found"
}
```

---

### 4. Get Epoch Data

Returns dynamic data for a specific epoch.

**Endpoint:** `GET /api/simulation/<simulation_id>/epoch/<epoch_number>`

**Path Parameters:**
- `simulation_id` (string, required): The simulation identifier
- `epoch_number` (integer, required): The epoch number (0-indexed)

**Response:**
```json
{
  "epoch": 0,
  "debates": [
    {
      "topic_id": "topic_1",
      "question": {
        "id": "topic_1_q1",
        "text": "How can universal healthcare be funded..."
      },
      "statements": [
        {
          "type": "mediator",
          "mediator_id": "mediator_1",
          "statement": "Welcome, everyone, to today's debate..."
        },
        {
          "type": "candidate",
          "candidate_id": "candidate_1",
          "statement": "Funding universal healthcare is an investment..."
        }
      ]
    }
  ],
  "newsfeed": {
    "posts": [
      {
        "id": "persona_1_cf7ad0cb",
        "persona_id": "persona_1",
        "content": "I believe healthcare is a right...",
        "likes": 5,
        "dislikes": 2
      }
    ]
  },
  "candidates": [
    {
      "id": "candidate_1",
      "policy_positions": {
        "topic_1": "Healthcare is a fundamental human right..."
      },
      "state_memory": "After the debate, I realized..."
    }
  ],
  "population_votes": [
    {
      "id": "5fd4c715-ab18-4aef-bf05-77d1b20645fe",
      "policy_positions": {
        "healthcare": {
          "reasoning": "Universal healthcare funding is complex...",
          "vote": ""
        }
      },
      "overall_vote": ""
    }
  ]
}
```

**Response Sections:**
- `epoch` (integer): The epoch number
- `debates` (array): All debate transcripts from this epoch
  - `topic_id` (string): Reference to topic in metadata
  - `question` (object): The debate question
  - `statements` (array): Mediator and candidate statements
- `newsfeed` (object): Social media posts from this epoch
- `candidates` (array): Candidate dynamic state (policy positions and memory)
- `population_votes` (array): Population dynamic state (beliefs and reasoning)

**Error Responses:**
- `404 Not Found`: Simulation does not exist
```json
{
  "error": "Simulation <simulation_id> not found"
}
```
- `404 Not Found`: Epoch number does not exist
```json
{
  "error": "Epoch <epoch_number> not found"
}
```

---

## Data Structure Overview

### Static Data (metadata.json)
Contains simulation-constant information:
- Simulation configuration
- Topic definitions
- Candidate profiles and initial positions
- Population demographics and characteristics

### Dynamic Data (epochs.jsonl)
Contains epoch-specific data:
- Debate transcripts (references topics by ID)
- Social media posts and interactions
- Candidate policy evolution and reflections
- Population belief updates and reasoning

**Design Principle:** Static metadata is stored once and retrieved separately from dynamic epoch data to reduce redundancy and payload size.

---

## Error Handling

All endpoints use standard HTTP status codes:
- `200 OK`: Request successful
- `404 Not Found`: Resource does not exist
- `500 Internal Server Error`: Server error

Error responses follow this format:
```json
{
  "error": "Description of the error"
}
```

---

## Running the API

Start the Flask development server:

```bash
cd backend
python api/app.py
```

The API will be available at:
- `http://localhost:8000`
- `http://0.0.0.0:8000`

**Note:** This is a development server. Use a production WSGI server (e.g., Gunicorn, uWSGI) for production deployments.

---

## CORS

CORS is enabled for all origins to allow frontend applications to access the API from different domains.

---

## Example Usage

### Python

```python
import requests

# List all simulations
response = requests.get("http://localhost:8000/api/simulations")
simulations = response.json()["simulations"]

# Get metadata for the latest simulation
sim_id = simulations[0]["id"]
metadata = requests.get(f"http://localhost:8000/api/simulation/{sim_id}/metadata").json()

# Get epoch 0 data
epoch_data = requests.get(f"http://localhost:8000/api/simulation/{sim_id}/epoch/0").json()
```

### cURL

```bash
# List all simulations
curl http://localhost:8000/api/simulations

# Get metadata
curl http://localhost:8000/api/simulation/20251011_221904/metadata

# Get epoch count
curl http://localhost:8000/api/simulation/20251011_221904/epoch_count

# Get epoch 0
curl http://localhost:8000/api/simulation/20251011_221904/epoch/0
```

### JavaScript (fetch)

```javascript
// List all simulations
const simulations = await fetch('http://localhost:8000/api/simulations')
  .then(res => res.json());

// Get metadata
const metadata = await fetch(`http://localhost:8000/api/simulation/${simId}/metadata`)
  .then(res => res.json());

// Get epoch data
const epochData = await fetch(`http://localhost:8000/api/simulation/${simId}/epoch/0`)
  .then(res => res.json());
```
