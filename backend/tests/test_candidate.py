import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.candidate import Candidate
from src.mediator import Topic, CandidateStatement


class TestCandidate:
    """Test suite for Candidate class"""

    @pytest.fixture
    def mock_llm_client(self):
        """Fixture to create a mock LLM client"""
        return Mock()

    @pytest.fixture
    def sample_topic(self):
        """Fixture for a sample debate topic"""
        return Topic(
            id="topic_1",
            title="Climate Policy",
            description="Should governments implement carbon taxes?"
        )

    @pytest.fixture
    def candidate(self, mock_llm_client):
        """Fixture to create a Candidate instance"""
        return Candidate("candidate_1", "Alice Johnson", mock_llm_client)

    def test_candidate_initialization(self, mock_llm_client):
        """Test creating a Candidate instance"""
        candidate = Candidate("cand_123", "Bob Smith", mock_llm_client)
        assert candidate.id == "cand_123"
        assert candidate.name == "Bob Smith"
        assert candidate.llm_client == mock_llm_client

    @patch('src.candidate.llm_client.generate_response')
    def test_craft_debate_statement(self, mock_generate, candidate, sample_topic):
        """Test crafting a debate statement returns CandidateStatement"""
        mock_generate.return_value = "I strongly support carbon taxes for environmental reasons."

        statement = candidate.craft_debate_statement(sample_topic, turn_number=0, previous_statements=[])

        assert isinstance(statement, CandidateStatement)
        assert statement.candidate_id == "candidate_1"
        assert statement.candidate_name == "Alice Johnson"
        assert statement.topic == sample_topic
        assert len(statement.statement) > 0
        mock_generate.assert_called_once()

    @patch('src.candidate.llm_client.generate_response')
    def test_craft_statement_with_previous_statements(self, mock_generate, candidate, sample_topic, mock_llm_client):
        """Test crafting statement includes context from previous statements"""
        mock_generate.return_value = "I disagree with my opponent's view."

        # Create previous statement
        previous = [CandidateStatement(
            candidate_id="candidate_2",
            candidate_name="Bob Smith",
            statement="Carbon taxes hurt the economy.",
            topic=sample_topic
        )]

        statement = candidate.craft_debate_statement(sample_topic, turn_number=1, previous_statements=previous)

        assert isinstance(statement, CandidateStatement)
        # Verify the prompt included debate history with candidate names
        call_args = mock_generate.call_args
        prompt = call_args[0][1]
        assert "Debate history" in prompt
        assert "Bob Smith" in prompt

    @patch('src.candidate.llm_client.generate_response')
    def test_multiple_candidates_create_statements(self, mock_generate, sample_topic, mock_llm_client):
        """Test multiple candidates can create statements"""
        mock_generate.return_value = "Test statement."

        candidate1 = Candidate("c1", "Alice", mock_llm_client)
        candidate2 = Candidate("c2", "Bob", mock_llm_client)

        stmt1 = candidate1.craft_debate_statement(sample_topic, 0, [])
        stmt2 = candidate2.craft_debate_statement(sample_topic, 0, [stmt1])

        assert stmt1.candidate_id == "c1"
        assert stmt2.candidate_id == "c2"
        assert mock_generate.call_count == 2
