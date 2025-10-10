import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.mediator import Mediator
from src.models import Topic, CandidateStatement, DebateTranscript, MediatorStatement


class TestTopic:
    """Test suite for Topic dataclass"""

    def test_topic_creation(self):
        """Test creating a Topic instance"""
        topic = Topic(id="t1", title="Healthcare", description="Universal healthcare debate")
        assert topic.id == "t1"
        assert topic.title == "Healthcare"
        assert topic.description == "Universal healthcare debate"


class TestDebateTranscript:
    """Test suite for DebateTranscript dataclass"""

    def test_transcript_creation(self):
        """Test creating a DebateTranscript with statements"""
        topic = Topic(id="t1", title="Test", description="Test topic")
        mediator_intro = MediatorStatement("med_1", "Welcome", topic)
        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", topic)
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", topic)

        all_statements = [mediator_intro, stmt1, stmt2]
        transcript = DebateTranscript(
            statements=all_statements,
            mediator_id="med_1",
            epoch=0,
            topic_index=0,
            topic=topic
        )
        assert len(transcript.statements) == 3
        assert transcript.statements[0] == mediator_intro


class TestMediator:
    """Test suite for Mediator class"""

    @pytest.fixture
    def mock_llm_client(self):
        """Fixture to create a mock LLM client"""
        return Mock()

    @pytest.fixture
    def sample_topics(self):
        """Fixture for sample topics"""
        return [
            Topic(id="t1", title="Climate Change", description="Climate policy debate"),
            Topic(id="t2", title="Education", description="Education reform debate")
        ]

    @pytest.fixture
    def mediator(self, sample_topics, mock_llm_client):
        """Fixture to create a Mediator instance"""
        return Mediator("mediator_1", topics=sample_topics, llm_client_instance=mock_llm_client)

    def test_mediator_initialization(self, sample_topics, mock_llm_client):
        """Test creating a Mediator instance"""
        mediator = Mediator("med_123", topics=sample_topics, llm_client_instance=mock_llm_client)
        assert mediator.id == "med_123"
        assert len(mediator.topics) == 2
        assert mediator.llm_client == mock_llm_client

    def test_mediator_initialization_no_topics(self, mock_llm_client):
        """Test Mediator initializes with empty topic list"""
        mediator = Mediator("med_1", llm_client_instance=mock_llm_client)
        assert mediator.topics == []

    def test_add_topic(self, mediator):
        """Test adding a topic to mediator's pool"""
        new_topic = Topic(id="t3", title="Healthcare", description="Healthcare policy")
        mediator.add_topic(new_topic)
        assert len(mediator.topics) == 3
        assert mediator.topics[-1] == new_topic

    def test_propose_topic(self, mediator, sample_topics):
        """Test proposing a topic from the pool"""
        topic = mediator.propose_topic(0)
        assert topic == sample_topics[0]

        topic = mediator.propose_topic(1)
        assert topic == sample_topics[1]

    def test_propose_topic_no_topics(self, mock_llm_client):
        """Test proposing topic raises error when no topics available"""
        mediator = Mediator("med_1", llm_client_instance=mock_llm_client)
        with pytest.raises(ValueError, match="No topics provided"):
            mediator.propose_topic(0)

    def test_propose_topic_invalid_index(self, mediator):
        """Test proposing topic with invalid index raises error"""
        with pytest.raises(ValueError, match="Invalid topic index"):
            mediator.propose_topic(10)

        with pytest.raises(ValueError, match="Invalid topic index"):
            mediator.propose_topic(-1)

    @patch('src.mediator.llm_client.generate_response')
    def test_introduce_topic_with_llm(self, mock_generate, mediator, sample_topics):
        """Test introducing topic with LLM generates introduction"""
        mock_generate.return_value = "Welcome to today's climate change debate."

        introduction = mediator.introduce_topic(sample_topics[0])

        assert isinstance(introduction, str)
        assert len(introduction) > 0
        mock_generate.assert_called_once()

    def test_introduce_topic_without_llm(self, sample_topics):
        """Test introducing topic without LLM uses default format"""
        mediator = Mediator("med_1", topics=sample_topics, llm_client_instance=None)
        introduction = mediator.introduce_topic(sample_topics[0])
        assert "Climate Change" in introduction

    def test_orchestrate_debate_turn(self, mediator, sample_topics):
        """Test orchestrating a debate turn with candidates"""
        # Create mock candidates
        mock_candidate1 = Mock()
        mock_candidate2 = Mock()

        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", sample_topics[0])
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", sample_topics[0])

        mock_candidate1.craft_debate_statement.return_value = stmt1
        mock_candidate2.craft_debate_statement.return_value = stmt2

        # Create mediator introduction
        mediator_intro = MediatorStatement("med_1", "Welcome to the debate", sample_topics[0])
        previous_statements = [mediator_intro]

        turn_result = mediator.orchestrate_debate_turn(
            topic=sample_topics[0],
            candidates=[mock_candidate1, mock_candidate2],
            turn_number=0,
            previous_statements=previous_statements
        )

        assert isinstance(turn_result, list)
        assert len(turn_result) == 2
        assert turn_result[0] == stmt1
        assert turn_result[1] == stmt2

    def test_publish_debate_transcript(self, mediator, sample_topics):
        """Test publishing debate transcript with metadata"""
        mediator_intro = MediatorStatement("mediator_1", "Welcome to the debate", sample_topics[0])
        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", sample_topics[0])
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", sample_topics[0])

        all_statements = [mediator_intro, stmt1, stmt2]

        transcript = mediator.publish_debate_transcript(
            all_statements=all_statements,
            topic=sample_topics[0],
            epoch=5,
            topic_index=0
        )

        assert isinstance(transcript, DebateTranscript)
        assert transcript.mediator_id == "mediator_1"
        assert transcript.epoch == 5
        assert transcript.topic_index == 0
        assert transcript.topic == sample_topics[0]
        assert len(transcript.statements) == 3
        assert transcript.statements[0] == mediator_intro
