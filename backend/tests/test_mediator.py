import pytest
import sys
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path to import modules
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.mediator import Mediator, Topic, Question, CandidateStatement, DebateTranscript, MediatorStatement, MediatorState


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
        question = Question(id="t1_q1", text="Test question?", topic=topic)
        mediator_intro = MediatorStatement("med_1", "Welcome", question)
        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", question)
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", question)

        all_statements = [mediator_intro, stmt1, stmt2]
        transcript = DebateTranscript(
            statements=all_statements,
            mediator_id="med_1",
            epoch=0,
            topic_index=0,
            question_index=0,
            topic=topic,
            question=question
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
    def sample_questions(self, sample_topics):
        """Fixture for sample questions"""
        return [
            Question(id="t1_q1", text="What policies should we implement?", topic=sample_topics[0]),
            Question(id="t2_q1", text="How should schools be funded?", topic=sample_topics[1])
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
        assert isinstance(mediator.state, MediatorState)
        assert mediator.state.id == "med_123"
        assert mediator.state.memory == ""

    def test_mediator_initialization_no_topics(self, mock_llm_client):
        """Test Mediator initializes with empty topic list"""
        mediator = Mediator("med_1", llm_client_instance=mock_llm_client)
        assert mediator.topics == []
        assert isinstance(mediator.state, MediatorState)
        assert mediator.state.memory == ""

    def test_add_topic(self, mediator):
        """Test adding a topic to mediator's pool"""
        new_topic = Topic(id="t3", title="Healthcare", description="Healthcare policy")
        mediator.add_topic(new_topic)
        assert len(mediator.topics) == 3
        assert mediator.topics[-1] == new_topic

    @patch('src.mediator.llm_client.generate_response')
    def test_propose_question(self, mock_generate, mediator, sample_topics):
        """Test proposing a question for a topic"""
        mock_generate.return_value = "What is the best climate policy?"

        question = mediator.propose_question(sample_topics[0], previous_transcripts=[])

        assert isinstance(question, Question)
        assert question.topic == sample_topics[0]
        assert len(question.text) > 0
        assert question.id.startswith("t1_q")
        mock_generate.assert_called_once()

    @patch('src.mediator.llm_client.generate_response')
    def test_propose_question_with_previous_transcripts(self, mock_generate, mediator, sample_topics, sample_questions):
        """Test proposing question considers previous transcripts"""
        mock_generate.return_value = "What should be done about rising temperatures?"

        # Create a previous transcript
        stmt1 = CandidateStatement("c1", "Alice", "We need carbon tax", sample_questions[0])
        transcript = DebateTranscript(
            statements=[stmt1],
            mediator_id="med_1",
            epoch=0,
            topic_index=0,
            question_index=0,
            topic=sample_topics[0],
            question=sample_questions[0]
        )

        question = mediator.propose_question(sample_topics[0], previous_transcripts=[transcript])

        assert isinstance(question, Question)
        assert question.topic == sample_topics[0]
        # Should generate second question for same topic
        assert question.id == "t1_q2"

    @patch('src.mediator.llm_client.generate_response')
    def test_introduce_question_with_llm(self, mock_generate, mediator, sample_questions):
        """Test introducing question with LLM generates introduction"""
        mock_generate.return_value = "Welcome to today's climate change debate."

        introduction = mediator.introduce_question(sample_questions[0])

        assert isinstance(introduction, str)
        assert len(introduction) > 0
        mock_generate.assert_called_once()

    def test_introduce_question_without_llm(self, sample_topics, sample_questions):
        """Test introducing question without LLM uses default format"""
        mediator = Mediator("med_1", topics=sample_topics, llm_client_instance=None)
        introduction = mediator.introduce_question(sample_questions[0])
        assert "question" in introduction.lower() or sample_questions[0].text in introduction

    def test_orchestrate_debate_turn(self, mediator, sample_questions):
        """Test orchestrating a debate turn with candidates"""
        # Create mock candidates
        mock_candidate1 = Mock()
        mock_candidate2 = Mock()

        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", sample_questions[0])
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", sample_questions[0])

        mock_candidate1.craft_debate_statement.return_value = stmt1
        mock_candidate2.craft_debate_statement.return_value = stmt2

        # Create mediator introduction
        mediator_intro = MediatorStatement("med_1", "Welcome to the debate", sample_questions[0])
        previous_statements = [mediator_intro]

        turn_result = mediator.orchestrate_debate_turn(
            question=sample_questions[0],
            candidates=[mock_candidate1, mock_candidate2],
            turn_number=0,
            previous_statements=previous_statements
        )

        assert isinstance(turn_result, list)
        assert len(turn_result) == 2
        assert turn_result[0] == stmt1
        assert turn_result[1] == stmt2

    def test_publish_debate_transcript(self, mediator, sample_topics, sample_questions):
        """Test publishing debate transcript with metadata"""
        mediator_intro = MediatorStatement("mediator_1", "Welcome to the debate", sample_questions[0])
        stmt1 = CandidateStatement("c1", "Alice", "Statement 1", sample_questions[0])
        stmt2 = CandidateStatement("c2", "Bob", "Statement 2", sample_questions[0])

        all_statements = [mediator_intro, stmt1, stmt2]

        transcript = mediator.publish_debate_transcript(
            all_statements=all_statements,
            topic=sample_topics[0],
            question=sample_questions[0],
            epoch=5,
            topic_index=0,
            question_index=0
        )

        assert isinstance(transcript, DebateTranscript)
        assert transcript.mediator_id == "mediator_1"
        assert transcript.epoch == 5
        assert transcript.topic_index == 0
        assert transcript.question_index == 0
        assert transcript.topic == sample_topics[0]
        assert transcript.question == sample_questions[0]
        assert len(transcript.statements) == 3
        assert transcript.statements[0] == mediator_intro

    @patch('src.mediator.llm_client.generate_response')
    def test_read_social_media_signals(self, mock_generate, mediator):
        """Test reading social media signals updates mediator memory"""
        mock_generate.return_value = "Key themes: climate action, healthcare reform. Sentiment: concerned but hopeful."

        social_media_feed = "Post 1: We need action on climate!\nPost 2: Healthcare costs are too high."
        mediator.read_social_media_signals(social_media_feed)

        assert "Social media review:" in mediator.state.memory
        assert "climate action" in mediator.state.memory
        mock_generate.assert_called_once()

        # Verify the prompt included the social media feed
        call_args = mock_generate.call_args
        assert social_media_feed in call_args[0][1]

    def test_read_social_media_signals_empty_feed(self, mediator):
        """Test reading empty social media feed does not update memory"""
        initial_memory = mediator.state.memory

        mediator.read_social_media_signals("")
        assert mediator.state.memory == initial_memory

        mediator.read_social_media_signals(None)
        assert mediator.state.memory == initial_memory

    @patch('src.mediator.llm_client.generate_response')
    def test_read_previous_debates(self, mock_generate, mediator, sample_topics, sample_questions):
        """Test reading previous debates updates mediator memory"""
        mock_generate.return_value = "Alice focuses on progressive policies, Bob on fiscal conservatism. Positions have remained consistent."

        # Create sample previous transcripts
        stmt1 = CandidateStatement("c1", "Alice", "I support universal healthcare", sample_questions[0])
        stmt2 = CandidateStatement("c2", "Bob", "We need lower taxes", sample_questions[0])
        transcript = DebateTranscript(
            statements=[stmt1, stmt2],
            mediator_id="med_1",
            epoch=0,
            topic_index=0,
            question_index=0,
            topic=sample_topics[0],
            question=sample_questions[0]
        )

        mediator.read_previous_debates([transcript])

        assert "Previous debates review:" in mediator.state.memory
        assert "Alice" in mediator.state.memory or "progressive" in mediator.state.memory
        mock_generate.assert_called_once()

        # Verify the prompt included debate information
        call_args = mock_generate.call_args
        assert "Alice" in call_args[0][1]

    def test_read_previous_debates_empty_list(self, mediator):
        """Test reading empty debate list does not update memory"""
        initial_memory = mediator.state.memory

        mediator.read_previous_debates([])
        assert mediator.state.memory == initial_memory

    @patch('src.mediator.llm_client.generate_response')
    def test_introduce_question_uses_memory(self, mock_generate, mediator, sample_questions):
        """Test introduce_question includes memory context in prompt and instructs LLM to reference it"""
        # Mock a contextual introduction that references the memory
        mock_generate.return_value = "Welcome to today's climate debate. Given the public's growing concern about climate action, this is a timely discussion."

        # Add some memory
        mediator.state.memory = "Social media review: People are concerned about climate.\n"

        introduction = mediator.introduce_question(sample_questions[0])

        assert isinstance(introduction, str)
        mock_generate.assert_called_once()

        # Verify memory was included in the prompt
        call_args = mock_generate.call_args
        prompt = call_args[0][1]
        assert "Your Preparation Context:" in prompt
        assert "People are concerned about climate" in prompt

        # Verify instructions to reference context are present
        assert "relevant" in prompt.lower() or "context" in prompt.lower()
