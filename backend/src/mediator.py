import logging
from typing import List
from dataclasses import dataclass
from . import llm_client

logger = logging.getLogger(__name__)


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
    candidate_name: str
    statement: str
    topic: Topic


@dataclass
class MediatorStatement:
    """A statement made by the mediator (e.g., topic introduction)."""
    mediator_id: str
    statement: str
    topic: Topic


@dataclass
class DebateTranscript:
    """Complete transcript of a debate session with all statements."""
    statements: List  # MediatorStatement + all CandidateStatements
    mediator_id: str
    epoch: int
    topic_index: int
    topic: Topic


class Mediator:
    def __init__(self, mediator_id: str, topics: List[Topic] = None, llm_client_instance=None):
        self.id = mediator_id
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

        logger.debug(f"Mediator introduction: {introduction.strip()}")
        return introduction.strip()

    def orchestrate_debate_turn(
        self,
        topic: Topic,
        candidates: List,
        turn_number: int,
        previous_statements: List
    ) -> List[CandidateStatement]:
        """
        Orchestrate a single debate turn with all candidates.

        Args:
            topic: The Topic being debated
            candidates: List of Candidate objects
            turn_number: Current turn number (0-indexed)
            previous_statements: All statements from previous turns and mediator introduction

        Returns:
            List of CandidateStatements from this turn
        """
        statements: List[CandidateStatement] = []
        current_context = list(previous_statements)  # Copy to avoid mutating input

        for candidate in candidates:
            statement = candidate.craft_debate_statement(topic, turn_number, current_context)
            statements.append(statement)
            current_context.append(statement)  # Each candidate sees previous candidates in same turn
            logger.debug(f"[Turn {turn_number}] {statement.candidate_name}: {statement.statement}")

        return statements

    def publish_debate_transcript(
        self,
        all_statements: List,
        topic: Topic,
        epoch: int,
        topic_index: int
    ) -> DebateTranscript:
        """
        Publish the complete debate transcript.

        Args:
            all_statements: All statements (MediatorStatement + CandidateStatements)
            topic: The Topic that was debated
            epoch: The epoch number when this debate occurred
            topic_index: Index of the topic that was debated

        Returns:
            DebateTranscript with all statements and metadata
        """
        return DebateTranscript(
            statements=all_statements,
            mediator_id=self.id,
            epoch=epoch,
            topic_index=topic_index,
            topic=topic
        )
