# Tests for Synthetic Community Backend

This directory contains the test suite for the Synthetic Community backend.

## Running Tests

### Run all tests
```bash
python -m pytest
```

### Run tests for a specific module
```bash
python -m pytest tests/test_social_media.py
```

### Run tests with verbose output
```bash
python -m pytest -v
```

### Run tests with coverage
```bash
python -m pytest --cov=src --cov-report=html
```

### Run specific test by name
```bash
python -m pytest tests/test_social_media.py::TestSocialMedia::test_add_post_single
```

### Run LLM tests (makes real API calls)
```bash
python -m pytest -m llm
```

### Skip LLM tests (default behavior)
```bash
python -m pytest -m "not llm"
```

## Test Structure

### `test_social_media.py`
Tests for the `SocialMedia` class which handles the platform layer of the simulation.

**Test Coverage:**
- **Initialization**: Tests that the class initializes correctly with empty state
- **Adding Posts**: Tests for adding single and multiple posts, maintaining order
- **Feed Generation**: Tests for retrieving feeds for different personas
- **Reactions**: Tests for adding reactions to posts, multiple reactions, various reaction types
- **Trending Topics**: Tests for the trending topics functionality (currently stub)
- **Platform State**: Tests for retrieving comprehensive platform state
- **Integration Tests**: Full workflow tests combining multiple operations
- **Edge Cases**: Tests for empty posts, reactions to non-existent posts

### `test_llm_client.py`
Tests for the LLM client wrapper (uses real Gemini API).

**Test Coverage:**
- **Client Creation**: Tests creating client with valid API key
- **Response Generation**: Tests generating responses from LLM
- **Temperature Parameter**: Tests custom temperature settings

**Note**: Marked with `@pytest.mark.llm` - requires `GEMINI_API_KEY` in environment.

### `test_candidate.py`
Tests for the `Candidate` class (uses mocked LLM).

**Test Coverage:**
- **Initialization**: Tests candidate creation with ID, name, and LLM client
- **Debate Statements**: Tests crafting debate statements with topic context
- **Previous Statements**: Tests including previous statements in context
- **Multiple Candidates**: Tests multiple candidates creating statements

### `test_mediator.py`
Tests for the `Mediator` class and debate dataclasses (uses mocked LLM).

**Test Coverage:**
- **Topic Management**: Tests adding and proposing topics
- **Topic Introduction**: Tests LLM-powered and default introductions
- **Debate Orchestration**: Tests orchestrating debate turns with candidates
- **Transcript Publishing**: Tests creating debate transcripts with metadata
- **Dataclasses**: Tests Topic, DebateTurn, and DebateTranscript structures

### `test_game_engine.py`
Tests for the `GameEngine` orchestrator (uses mocked dependencies).

**Test Coverage:**
- **Initialization**: Tests setup with config and LLM client
- **API Key Validation**: Tests error handling for missing API key
- **Debate Workflow**: Tests conducting full debates on topics
- **Transcript Storage**: Tests debate transcripts are stored correctly
- **Final Vote**: Tests delegation to population for voting

## Test Fixtures

The test suite uses pytest fixtures for common test data:

- `social_media`: Fresh SocialMedia instance for each test
- `sample_post`: A single sample post dictionary
- `sample_posts`: Multiple sample posts for testing

## Current Test Results

**test_social_media.py**: 21 tests
- 4 tests for post management
- 3 tests for feed generation
- 5 tests for reaction functionality
- 2 tests for trending topics
- 4 tests for platform state
- 3 tests for integration and edge cases

**test_llm_client.py**: 3 tests (requires `GEMINI_API_KEY`, run with `-m llm`)
**test_candidate.py**: 4 tests (mocked LLM)
**test_mediator.py**: 11 tests (mocked LLM)
**test_game_engine.py**: 7 tests (mocked dependencies)

## Future Improvements

As the SocialMedia class evolves, consider adding tests for:
- Feed ranking algorithms (when implemented)
- Virality calculations
- Content moderation rules
- Bot detection
- Personalized feeds based on persona attributes
- Engagement metrics and analytics
