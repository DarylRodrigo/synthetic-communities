import logging
from typing import Dict, List, Any
from dataclasses import dataclass
from .mediator import Topic, CandidateStatement, MediatorStatement
from . import llm_client

logger = logging.getLogger(__name__)


@dataclass
class CandidateState:
    """State of a candidate."""
    id: str
    name: str
    policy_positions: Dict[str, str]  # topic_id -> position string
    memory: str


class Candidate:
    def __init__(self, candidate_id: str, name: str, topics: List[Topic], llm_client_instance):
        self.id = candidate_id
        self.name = name
        self.topics = topics
        self.llm_client = llm_client_instance

        # Initialize policy positions based on topics
        self.state = self._initialize_policy_positions()

    def _initialize_policy_positions(self) -> CandidateState:
        """Initialize policy positions for each topic using LLM."""
        logger.debug(f"{self.name}: Initializing policy positions for {len(self.topics)} topics")
        policy_positions = {}

        for topic in self.topics:
            logger.debug(f"{self.name}: Generating initial position for topic '{topic.title}' (ID: {topic.id})")
            prompt = f"You are {self.name}, a political candidate. What is your position on: {topic.title}? {topic.description}. Answer in 2-3 sentences."
            system_instruction = f"You are {self.name}, a political candidate. Provide clear, concise policy positions."

            position = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            policy_positions[topic.id] = position.strip()
            logger.info(f"{self.name} initial position on {topic.title}: {position.strip()}")

        logger.debug(f"{self.name}: Policy position initialization complete")
        return CandidateState(
            id=self.id,
            name=self.name,
            policy_positions=policy_positions,
            memory=""
        )

    def read_social_media_signals(self, social_media_feed: str) -> None:
        """Read social media signals and update policy positions based on public sentiment."""
        logger.debug(f"{self.name}: read_social_media_signals called with feed length: {len(social_media_feed) if social_media_feed else 0}")

        if not social_media_feed:
            logger.debug(f"{self.name}: No social media posts to review")
            return

        logger.info(f"{self.name} reviewing social media and updating positions...")
        logger.debug(f"{self.name}: Social media feed content:\n{social_media_feed[:200]}...")  # Log first 200 chars

        # Update positions for each topic based on public sentiment
        for topic in self.topics:
            current_position = self.state.policy_positions[topic.id]
            logger.debug(f"{self.name}: Processing topic '{topic.title}' (ID: {topic.id})")
            logger.debug(f"{self.name}: Current position on {topic.title}: {current_position}")

            prompt = f"""Your current position on {topic.title}: {current_position}

Recent public posts:
{social_media_feed}

Based on public sentiment, should you adjust your stance? Reply with your updated position in 2-3 sentences, or keep the same if no adjustment needed."""

            system_instruction = f"You are {self.name}, a political candidate. Adjust your positions based on public opinion while maintaining authenticity."

            logger.debug(f"{self.name}: Calling LLM to update position on {topic.title}")
            updated_position = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            old_position = self.state.policy_positions[topic.id]
            self.state.policy_positions[topic.id] = updated_position.strip()

            if old_position != updated_position.strip():
                logger.info(f"{self.name} CHANGED position on {topic.title}")
                logger.debug(f"{self.name}: Old: {old_position}")
                logger.debug(f"{self.name}: New: {updated_position.strip()}")
            else:
                logger.debug(f"{self.name}: Position unchanged on {topic.title}")

        # Update memory
        self.state.memory += "Reviewed social media and updated positions based on public sentiment.\n"
        logger.debug(f"{self.name}: Memory updated. Total memory length: {len(self.state.memory)}")

    def craft_debate_statement(
        self,
        topic: Topic,
        turn_number: int,
        previous_statements: List
    ) -> CandidateStatement:
        """Craft LLM-generated debate statement using current policy position."""
        logger.debug(f"{self.name}: craft_debate_statement called for topic '{topic.title}', turn {turn_number}")

        # Get current policy position for this topic
        current_position = self.state.policy_positions.get(topic.id, "No position established yet")
        logger.debug(f"{self.name}: Using position: {current_position}")

        # Build prompt including policy position
        prompt = f"DEBATE TOPIC: {topic.title}\n{topic.description}\n\n"
        prompt += f"Your current position: {current_position}\n\n"
        prompt += f"Turn {turn_number + 1}\n\n"

        if previous_statements:
            logger.debug(f"{self.name}: Including {len(previous_statements)} previous statements in context")
            prompt += "Debate history:\n"
            for stmt in previous_statements:
                if isinstance(stmt, MediatorStatement):
                    prompt += f"MODERATOR: {stmt.statement}\n"
                else:  # CandidateStatement
                    prompt += f"- {stmt.candidate_name}: {stmt.statement}\n"
            prompt += "\n"
        else:
            logger.debug(f"{self.name}: No previous statements in context")

        prompt += "Your statement (2-3 sentences, consistent with your position):"

        # Generate response
        system_instruction = f"You are {self.name}, a political candidate in a debate. Provide clear, persuasive 2-3 sentence statements that align with your policy position."

        logger.debug(f"{self.name}: Calling LLM to generate debate statement")
        response = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        logger.info(f"{self.name}: Generated debate statement: {response.strip()[:100]}...")

        return CandidateStatement(
            candidate_id=self.id,
            candidate_name=self.name,
            statement=response.strip(),
            topic=topic
        )
