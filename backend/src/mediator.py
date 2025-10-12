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
class Question:
    """A specific question within a broader debate topic."""
    id: str
    text: str
    topic: Topic


@dataclass
class MediatorState:
    """State of a mediator."""
    id: str
    memory: str
    world_context: str = ""


@dataclass
class CandidateStatement:
    """A statement made by a candidate during a debate turn."""
    candidate_id: str
    candidate_name: str
    statement: str
    question: Question


@dataclass
class MediatorStatement:
    """A statement made by the mediator (e.g., question introduction)."""
    mediator_id: str
    statement: str
    question: Question


@dataclass
class DebateTranscript:
    """Complete transcript of a debate session with all statements."""
    statements: List  # MediatorStatement + all CandidateStatements
    mediator_id: str
    epoch: int
    topic_index: int
    question_index: int
    topic: Topic
    question: Question


class Mediator:
    def __init__(self, mediator_id: str, topics: List[Topic] = None, llm_client_instance=None, world_story: str = None):
        self.id = mediator_id
        self.topics = topics if topics is not None else []
        self.llm_client = llm_client_instance

        # Initialize memory with world context if available
        initial_memory = ""
        if world_story:
            initial_memory = f"""=== WORLD CONTEXT ===
{world_story}

You are a debate moderator in this world. Frame questions and introductions with awareness of this setting.

"""
            logger.debug(f"Mediator: Initialized with world context in memory ({len(world_story)} chars)")

        self.state = MediatorState(
            id=mediator_id,
            memory=initial_memory,
            world_context=world_story if world_story else ""
        )

    def add_topic(self, topic: Topic) -> None:
        """Add a topic to the mediator's topic pool."""
        self.topics.append(topic)

    def read_social_media_signals(self, social_media_feed: str) -> None:
        """Read social media signals to understand current public sentiment and key themes."""
        logger.debug(f"Mediator: read_social_media_signals called with feed length: {len(social_media_feed) if social_media_feed else 0}")

        if not social_media_feed:
            logger.debug("Mediator: No social media posts to review")
            return

        logger.info("Mediator reviewing social media for key themes and sentiment...")
        logger.debug(f"Mediator: Social media feed content:\n{social_media_feed[:200]}...")  # Log first 200 chars

        prompt = f"""Review these recent public social media posts and identify:
1. Key themes and topics people are discussing
2. Overall public sentiment and concerns

Recent public posts:
{social_media_feed}

Summarize the key themes and sentiment in 2-3 sentences."""

        system_instruction = "You are a debate moderator. Identify key themes and public sentiment from social media to inform your moderation."

        logger.debug("Mediator: Calling LLM to analyze social media")
        analysis = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        # Update memory
        self.state.memory += f"Social media review: {analysis.strip()}\n"
        logger.info(f"Mediator analyzed social media: {analysis.strip()[:100]}...")
        logger.debug(f"Mediator: Memory updated. Total memory length: {len(self.state.memory)}")

    def read_previous_debates(self, previous_transcripts: List[DebateTranscript]) -> None:
        """Read previous debate transcripts to understand how candidate positions have evolved."""
        logger.debug(f"Mediator: read_previous_debates called with {len(previous_transcripts)} transcripts")

        if not previous_transcripts:
            logger.debug("Mediator: No previous debates to review")
            return

        logger.info(f"Mediator reviewing {len(previous_transcripts)} previous debate(s)...")

        # Build summary of previous debates
        debate_summary = ""
        for transcript in previous_transcripts:
            debate_summary += f"\nEpoch {transcript.epoch}, Topic: {transcript.topic.title}\n"
            for stmt in transcript.statements:
                if isinstance(stmt, CandidateStatement):
                    debate_summary += f"- {stmt.candidate_name}: {stmt.statement[:100]}...\n"

        logger.debug(f"Mediator: Debate summary length: {len(debate_summary)}")

        prompt = f"""Review these previous debate transcripts and identify:
1. Key positions each candidate has taken
2. How positions have evolved over time
3. Areas of agreement and disagreement

Previous debates:
{debate_summary}

Summarize the key insights in 2-3 sentences."""

        system_instruction = "You are a debate moderator. Analyze previous debates to understand candidate positions and their evolution."

        logger.debug("Mediator: Calling LLM to analyze previous debates")
        analysis = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        # Update memory
        self.state.memory += f"Previous debates review: {analysis.strip()}\n"
        logger.info(f"Mediator analyzed previous debates: {analysis.strip()[:100]}...")
        logger.debug(f"Mediator: Memory updated. Total memory length: {len(self.state.memory)}")

    def propose_question(
        self,
        topic: Topic,
        previous_transcripts: List[DebateTranscript]
    ) -> Question:
        """Propose a new question for debate on the given topic.

        Uses context from previous questions, candidate positions, and social media.
        """
        logger.debug(f"Mediator: propose_question for topic '{topic.title}'")

        # Extract previous questions and statements for THIS topic only
        previous_questions = []
        previous_statements = []
        for transcript in previous_transcripts:
            if transcript.topic.id == topic.id:
                previous_questions.append(transcript.question.text)
                previous_statements.extend([
                    s for s in transcript.statements
                    if isinstance(s, CandidateStatement)
                ])

        logger.debug(f"Mediator: Found {len(previous_questions)} previous questions on this topic")

        # Build prompt
        # Note: world context is already included in self.state.memory from initialization
        prompt = f"""Topic: {topic.title}
Description: {topic.description}"""

        if previous_questions:
            prompt += f"\n\nQuestions already asked:\n"
            for i, q in enumerate(previous_questions, 1):
                prompt += f"{i}. {q}\n"

        if previous_statements:
            prompt += f"\n\nPrevious candidate positions (sample):\n"
            # Limit to 5 for context window
            for stmt in previous_statements[:5]:
                prompt += f"- {stmt.candidate_name}: {stmt.statement[:80]}...\n"

        if self.state.memory:
            prompt += f"\n\nYour preparation context:\n{self.state.memory}"

        prompt += """

Generate ONE specific, debatable question about this topic that:
- Has NOT been asked before
- Is relevant and builds on the discussion
- Is specific enough for focused debate
- Is probing and thought-provoking
- Reflects public interest or candidate disagreement
- Is CONCISE (one clear sentence, maximum 20 words)
- Is NEUTRAL and OBJECTIVE (do not address specific candidates by name)
- Is phrased as a general question that ALL candidates will answer

Return ONLY the question text as a single, concise sentence."""

        system_instruction = "You are a debate moderator generating thoughtful, specific questions. Keep questions concise (under 20 words) and neutral (do not address specific candidates)."

        logger.debug("Mediator: Calling LLM to generate question")
        question_text = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        ).strip()

        question_id = f"{topic.id}_q{len(previous_questions) + 1}"

        logger.info(f"Mediator proposed question: {question_text[:80]}...")

        return Question(
            id=question_id,
            text=question_text,
            topic=topic
        )

    def introduce_question(self, question: Question) -> str:
        """Generate introduction for the debate question.

        Uses accumulated memory (social media, previous debates) as context.
        """
        if not self.llm_client:
            return f"Today's question: {question.text}"

        # Note: world context is already included in self.state.memory from initialization
        prompt = f"""You are introducing the debate question: {question.text}

This question is part of the broader topic: {question.topic.title}
Topic Description: {question.topic.description}"""

        if self.state.memory:
            prompt += f"""

Your Preparation Context:
{self.state.memory}

INSTRUCTIONS:
- Introduce the question in 2-4 sentences
- If relevant, reference the world setting and its atmosphere
- If relevant, reference public sentiment from social media
- If relevant, acknowledge previous debate positions
- Only reference context DIRECTLY RELEVANT to this question
- Maintain neutrality as moderator"""
        else:
            prompt += "\n\nIntroduce this question clearly in 2-3 sentences."

        system_instruction = "You are a neutral debate moderator. When you have relevant context (including the world setting), weave it naturally into your introduction to set the scene."

        introduction = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        logger.debug(f"Mediator introduction: {introduction.strip()}")
        return introduction.strip()

    def orchestrate_debate_turn(
        self,
        question: Question,
        candidates: List,
        turn_number: int,
        previous_statements: List
    ) -> List[CandidateStatement]:
        """
        Orchestrate a single debate turn with all candidates.

        Args:
            question: The Question being debated
            candidates: List of Candidate objects
            turn_number: Current turn number (0-indexed)
            previous_statements: All statements from previous turns and mediator introduction

        Returns:
            List of CandidateStatements from this turn
        """
        statements: List[CandidateStatement] = []
        current_context = list(previous_statements)  # Copy to avoid mutating input

        for candidate in candidates:
            statement = candidate.craft_debate_statement(question, turn_number, current_context)
            statements.append(statement)
            current_context.append(statement)  # Each candidate sees previous candidates in same turn
            logger.debug(f"[Turn {turn_number}] {statement.candidate_name}: {statement.statement}")

        return statements

    def publish_debate_transcript(
        self,
        all_statements: List,
        topic: Topic,
        question: Question,
        epoch: int,
        topic_index: int,
        question_index: int
    ) -> DebateTranscript:
        """
        Publish the complete debate transcript.

        Args:
            all_statements: All statements (MediatorStatement + CandidateStatements)
            topic: The Topic that was debated
            question: The Question that was debated
            epoch: The epoch number when this debate occurred
            topic_index: Index of the topic that was debated
            question_index: Index of the question within the topic

        Returns:
            DebateTranscript with all statements and metadata
        """
        return DebateTranscript(
            statements=all_statements,
            mediator_id=self.id,
            epoch=epoch,
            topic_index=topic_index,
            question_index=question_index,
            topic=topic,
            question=question
        )
