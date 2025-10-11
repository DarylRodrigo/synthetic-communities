import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.game_engine import GameEngine
from src.config import Config
from src.mediator import Topic, DebateTranscript, CandidateStatement, MediatorStatement


class TestGameEngine:
    """Test suite for GameEngine class"""

    @pytest.fixture
    def sample_config(self):
        """Fixture for a sample configuration"""
        return Config(
            population_size=10,
            num_candidates=2,
            topics_per_epoch=1,
            turns_per_topic=2,
            num_epochs=1,
            random_seed=42
        )

    @pytest.fixture
    def mock_llm_client(self):
        """Fixture for mock LLM client"""
        return Mock()

    @pytest.fixture
    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key_123'})
    def game_engine(self, mock_create_client, sample_config, mock_llm_client):
        """Fixture to create a GameEngine instance with mocked dependencies"""
        mock_create_client.return_value = mock_llm_client
        engine = GameEngine(sample_config)
        return engine

    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_api_key'})
    def test_game_engine_initialization(self, mock_create_client, sample_config):
        """Test GameEngine initializes with config and sets up components"""
        mock_create_client.return_value = Mock()

        engine = GameEngine(sample_config)

        assert engine.config == sample_config
        assert engine.current_epoch == 0
        assert engine.population is not None
        assert engine.candidates == []
        assert engine.social_media is None
        assert engine.debate_transcripts == []
        mock_create_client.assert_called_once_with('test_api_key')

    @patch('src.game_engine.os.getenv')
    @patch('src.game_engine.llm_client.create_client')
    def test_initialization_without_api_key(self, mock_create_client, mock_getenv, sample_config):
        """Test GameEngine raises error when GEMINI_API_KEY is missing"""
        mock_getenv.return_value = None

        with pytest.raises(ValueError, match="GEMINI_API_KEY not found"):
            GameEngine(sample_config)

    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key'})
    def test_conduct_debate_on_topic(self, mock_create_client, sample_config):
        """Test conducting a full debate on a topic"""
        mock_create_client.return_value = Mock()

        engine = GameEngine(sample_config)

        # Setup mediator with topics
        topic = Topic(id="t1", title="Climate", description="Climate policy")
        engine.mediator = Mock()
        engine.mediator.propose_topic.return_value = topic
        engine.mediator.introduce_topic.return_value = "Welcome to the debate."

        # Setup candidates
        mock_candidate1 = Mock()
        mock_candidate2 = Mock()
        engine.candidates = [mock_candidate1, mock_candidate2]

        # Mock candidate statements for each turn
        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", topic)
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", topic)
        engine.mediator.orchestrate_debate_turn.side_effect = [[stmt1], [stmt2]]

        # Mock transcript
        all_statements = [
            MediatorStatement("med_1", "Welcome to the debate.", topic),
            stmt1,
            stmt2
        ]
        transcript = DebateTranscript(
            statements=all_statements,
            mediator_id="med_1",
            epoch=0,
            topic_index=0,
            topic=topic
        )
        engine.mediator.publish_debate_transcript.return_value = transcript

        # Run debate
        engine._conduct_debate_on_topic(topic_index=0)

        # Verify mediator methods were called
        engine.mediator.propose_topic.assert_called_once_with(0)
        engine.mediator.introduce_topic.assert_called_once_with(topic)
        assert engine.mediator.orchestrate_debate_turn.call_count == 2
        engine.mediator.publish_debate_transcript.assert_called_once()

        # Verify transcript was stored
        assert len(engine.debate_transcripts) == 1
        assert engine.debate_transcripts[0] == transcript

    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key'})
    def test_conduct_debate_without_mediator(self, mock_create_client, sample_config):
        """Test conducting debate raises error when no mediator configured"""
        mock_create_client.return_value = Mock()
        engine = GameEngine(sample_config)

        with pytest.raises(ValueError, match="No mediator or candidates"):
            engine._conduct_debate_on_topic(0)

    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key'})
    def test_conduct_final_vote(self, mock_create_client, sample_config):
        """Test conducting final vote delegates to population"""
        mock_create_client.return_value = Mock()
        engine = GameEngine(sample_config)

        # Setup candidates
        candidate1 = Mock()
        candidate1.name = "Alice"
        candidate2 = Mock()
        candidate2.name = "Bob"
        engine.candidates = [candidate1, candidate2]

        # Mock population vote
        engine.population.conduct_vote = Mock(return_value={"Alice": 6, "Bob": 4})

        result = engine.conduct_final_vote()

        engine.population.conduct_vote.assert_called_once_with(["Alice", "Bob"])
        assert result == {"Alice": 6, "Bob": 4}

    @patch('src.game_engine.llm_client.create_client')
    @patch.dict('os.environ', {'GEMINI_API_KEY': 'test_key'})
    def test_debate_transcripts_accumulate(self, mock_create_client, sample_config):
        """Test that debate transcripts accumulate across multiple debates"""
        mock_create_client.return_value = Mock()
        engine = GameEngine(sample_config)

        # Setup
        topic = Topic(id="t1", title="Test", description="Test topic")
        engine.mediator = Mock()
        engine.mediator.propose_topic.return_value = topic
        engine.mediator.introduce_topic.return_value = "Intro"
        engine.candidates = [Mock(), Mock()]

        stmt1 = CandidateStatement("c1", "Alice", "Statement", topic)
        engine.mediator.orchestrate_debate_turn.return_value = [stmt1]

        all_statements = [MediatorStatement("m1", "Intro", topic), stmt1]
        transcript1 = DebateTranscript(statements=all_statements, mediator_id="m1", epoch=0, topic_index=0, topic=topic)
        transcript2 = DebateTranscript(statements=all_statements, mediator_id="m1", epoch=0, topic_index=1, topic=topic)
        engine.mediator.publish_debate_transcript.side_effect = [transcript1, transcript2]

        # Conduct two debates
        engine._conduct_debate_on_topic(0)
        engine._conduct_debate_on_topic(1)

        # Verify both transcripts stored
        assert len(engine.debate_transcripts) == 2
        assert engine.debate_transcripts[0] == transcript1
        assert engine.debate_transcripts[1] == transcript2
