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

## Test Fixtures

The test suite uses pytest fixtures for common test data:

- `social_media`: Fresh SocialMedia instance for each test
- `sample_post`: A single sample post dictionary
- `sample_posts`: Multiple sample posts for testing

## Current Test Results

All 21 tests pass successfully:
- 4 tests for post management
- 3 tests for feed generation
- 5 tests for reaction functionality
- 2 tests for trending topics
- 4 tests for platform state
- 3 tests for integration and edge cases

## Future Improvements

As the SocialMedia class evolves, consider adding tests for:
- Feed ranking algorithms (when implemented)
- Virality calculations
- Content moderation rules
- Bot detection
- Personalized feeds based on persona attributes
- Engagement metrics and analytics
