from dataclasses import dataclass
from typing import List
from . import llm_client


@dataclass
class Topic:
    """Represents a debate topic."""
    id: str
    title: str
    description: str


@dataclass
class CandidateStatement:
    """A statement made by a candidate during a debate turn."""
    candidate_id: str
    statement: str
    topic: Topic


@dataclass
class DebateTurn:
    """Results from a single debate turn with all candidate statements."""
    topic: Topic
    turn_number: int
    statements: List[CandidateStatement]


@dataclass
class DebateTranscript:
    """Complete transcript of a debate session with metadata."""
    transcript: List[DebateTurn]
    mediator_id: str
    epoch: int
    topic_index: int

    @property
    def num_turns(self) -> int:
        """Get the number of turns in this debate."""
        return len(self.transcript)


class Mediator:
    def __init__(self, mediator_id: str, topics: List[Topic] = None, llm_client_instance=None):
        self.id = mediator_id
<<<<<<< HEAD
    
    def propose_topic(self, topic: str, social_media_summary: str, debate_summarise: str) -> Dict[str, Any]:
        return {"id": "topic_1", "title": "Default Topic", "description": "A default debate topic"}
    
    def orchestrate_debate_turn(self, topic: List[str], candidates: List[Any],
                               turn_number: int) -> Dict[str, Any]:

        for topic in topics: 
            statements = []
            for candidate in candidates:
                statement = candidate.craft_debate_statement(topic, turn_number, statements)
                statements.append(statement)

        return {"topic": topic, "turn": turn_number, "statements": statements}
    
    def publish_debate_transcript(self, debate_session: List[Dict[str, Any]]) -> Dict[str, Any]:
        return {"transcript": debate_session, "mediator_id": self.id}
=======
        self.topics = topics if topics is not None else []
        self.llm_client = llm_client_instance

    def add_topic(self, topic: Topic) -> None:
        """Add a topic to the mediator's topic pool."""
        self.topics.append(topic)

    def propose_topic(self, topic_index: int) -> Topic:
        """Propose a topic from the topic pool."""
        if not self.topics:
            raise ValueError("No topics provided")

        if not (0 <= topic_index < len(self.topics)):
            raise ValueError(f"Invalid topic index: {topic_index}")

        return self.topics[topic_index]

    def introduce_topic(self, topic: Topic) -> str:
        """Generate LLM-powered introduction for the debate topic."""
        if not self.llm_client:
            return f"Today's debate topic: {topic.title}"

        prompt = f"Introduce this debate topic concisely:\n\nTitle: {topic.title}\nDescription: {topic.description}"
        system_instruction = "You are a neutral debate moderator. Introduce topics clearly and concisely in 1-2 sentences."

        introduction = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        return introduction.strip()

    def orchestrate_debate_turn(
        self,
        topic: Topic,
        candidates: List,
        turn_number: int
    ) -> DebateTurn:
        """
        Orchestrate a single debate turn with all candidates.

        Args:
            topic: The Topic being debated
            candidates: List of Candidate objects
            turn_number: Current turn number (0-indexed)

        Returns:
            DebateTurn containing all candidate statements
        """
        statements: List[CandidateStatement] = []
        for candidate in candidates:
            statement = candidate.craft_debate_statement(topic, turn_number, statements)
            statements.append(statement)

        return DebateTurn(
            topic=topic,
            turn_number=turn_number,
            statements=statements
        )

    def publish_debate_transcript(
        self,
        debate_session: List[DebateTurn],
        epoch: int,
        topic_index: int
    ) -> DebateTranscript:
        """
        Publish the complete debate transcript.

        Args:
            debate_session: List of DebateTurn objects from the debate
            epoch: The epoch number when this debate occurred
            topic_index: Index of the topic that was debated

        Returns:
            DebateTranscript with all debate data and metadata
        """
        return DebateTranscript(
            transcript=debate_session,
            mediator_id=self.id,
            epoch=epoch,
            topic_index=topic_index
        )
>>>>>>> 07337f3 (Initial implementation)
