import logging
from typing import Dict, List, Any
from dataclasses import dataclass
from .mediator import Topic, Question, CandidateStatement, MediatorStatement
from . import llm_client

logger = logging.getLogger(__name__)


@dataclass
class CandidateState:
    """State of a candidate."""
    id: str
    name: str
    character: str  # brief description of political character/leaning
    policy_positions: Dict[str, str]  # topic_id -> position string
    memory: str


class Candidate:
    def __init__(self, candidate_id: str, name: str, character: str, topics: List[Topic], llm_client_instance):
        self.id = candidate_id
        self.name = name
        self.character = character
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
            prompt = f"You are {self.name}, a political candidate with the following character: {self.character}. What is your position on: {topic.title}? {topic.description}. Answer in 2-3 sentences, reflecting your political character."
            system_instruction = f"You are {self.name}, a political candidate. Character: {self.character}. Provide clear, concise policy positions consistent with your character."

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
            character=self.character,
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

        # Generate rich memory reflection using LLM
        memory_prompt = f"""You are {self.name}, a political candidate. You just reviewed social media and considered whether to adjust your positions.

Reflect on this experience in 2-3 sentences as a personal, introspective memory. Focus on:
- What stood out to you in the public discourse - what moved you emotionally or intellectually?
- Did anything challenge your beliefs or reinforce them? How did that feel?
- If you changed your position, why? What made you reconsider? If you held firm, what kept you grounded?
- How do you balance staying true to your convictions while being responsive to constituents?

Social media posts you saw:
{social_media_feed[:400]}...

Write an authentic, first-person reflection as if writing in a private journal. Be honest about your internal reasoning and feelings:"""

        system_instruction = f"You are {self.name}, reflecting privately and honestly. Write in first person. Be introspective, thoughtful, and reveal your authentic reasoning - not a public statement, but a private thought."

        memory_reflection = llm_client.generate_response(
            self.llm_client,
            memory_prompt,
            system_instruction
        )

        # Update memory with rich reflection
        self.state.memory += f"{memory_reflection.strip()}\n"
        logger.debug(f"{self.name}: Memory updated with reflection. Total memory length: {len(self.state.memory)}")

    def craft_debate_statement(
        self,
        question: Question,
        turn_number: int,
        previous_statements: List
    ) -> CandidateStatement:
        """
        Craft LLM-generated debate statement using current policy position, memory, and debate context.

        The candidate will consider their policy position, past experiences (memory), and the ongoing
        debate to craft strategic responses that may include rebuttals to opponents.
        """
        logger.debug(f"{self.name}: craft_debate_statement called for topic '{question.topic.title}', turn {turn_number}")

        # Get current policy position for parent topic
        current_position = self.state.policy_positions.get(
            question.topic.id,
            "No position established yet"
        )
        logger.debug(f"{self.name}: Using position: {current_position}")

        # Build comprehensive prompt with position, memory, and debate history
        prompt = f"""DEBATE TOPIC: {question.topic.title}
            {question.topic.description}

            YOUR CORE POSITION: {current_position}

            YOUR MEMORY & EXPERIENCE:
            {self.state.memory if self.state.memory else "No prior experiences recorded."}

            DEBATE TURN: {turn_number + 1}
            """

        # Add debate history with context
        if previous_statements:
            logger.debug(f"{self.name}: Including {len(previous_statements)} previous statements in context")
            prompt += "\nDEBATE HISTORY:\n"

            # Separate own statements from opponent statements for strategic analysis
            own_statements = []
            opponent_statements = []
            moderator_statements = []

            for stmt in previous_statements:
                if isinstance(stmt, MediatorStatement):
                    moderator_statements.append(stmt)
                    prompt += f"MODERATOR: {stmt.statement}\n"
                elif stmt.candidate_name == self.name:
                    own_statements.append(stmt)
                    prompt += f"YOU ({self.name}): {stmt.statement}\n"
                else:
                    opponent_statements.append(stmt)
                    prompt += f"OPPONENT ({stmt.candidate_name}): {stmt.statement}\n"

            prompt += "\n"
            logger.debug(f"{self.name}: Debate context - Own: {len(own_statements)}, Opponent: {len(opponent_statements)}, Moderator: {len(moderator_statements)}")
        else:
            logger.debug(f"{self.name}: No previous statements - opening statement")

        # Strategic instructions
        prompt += """INSTRUCTIONS:
            Craft a compelling 2-3 sentence statement that:
            1. Aligns with YOUR CORE POSITION and reflects your experiences
            2. If opponents made weak arguments or contradictions, REBUT them directly
            3. If opponents raised valid concerns, ACKNOWLEDGE but pivot to your strengths
            4. Stay on message while engaging substantively with the debate

            Your statement:"""

        # Generate response with strategic system instruction
        system_instruction = f"""You are {self.name}, a skilled political debater. You are strategic, persuasive, and principled.

            Key traits:
            - Stay true to your core position while being tactically flexible
            - Directly challenge opponents when they make weak or contradictory arguments
            - Use your memory and experiences to add credibility
            - Be concise but impactful (2-3 sentences)
            - Sound authentic and conversational, not robotic"""

        logger.debug(f"{self.name}: Calling LLM to generate strategic debate statement")
        
        response = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        generated_statement = response.strip()
        logger.info(f"{self.name}: Generated debate statement: {generated_statement[:100]}...")

        # Update memory with debate participation
        self.state.memory += f"Participated in debate on {question.topic.title}. Made statement: {generated_statement}...\n"

        return CandidateStatement(
            candidate_id=self.id,
            candidate_name=self.name,
            statement=generated_statement,
            question=question
        )

    def reflect_on_debate(self, question: Question, debate_transcript: str) -> None:
        """
        Reflect on the completed debate and update memory with insights and belief changes.

        This allows the candidate to process the full debate, consider opponents' arguments,
        evaluate their own performance, and potentially update their beliefs and understanding.
        """
        logger.debug(f"{self.name}: reflect_on_debate called for question '{question.text}' on topic '{question.topic.title}'")
        logger.debug(f"{self.name}: Debate transcript length: {len(debate_transcript)}")

        # Get current position for the parent topic
        current_position = self.state.policy_positions.get(question.topic.id, "No position established yet")

        # Generate reflective memory
        reflection_prompt = f"""You are {self.name}, a political candidate. A debate just concluded on the question: "{question.text}"

        This question was about the broader topic: {question.topic.title}

        YOUR POSITION ON {question.topic.title.upper()}: {current_position}

        FULL DEBATE TRANSCRIPT:
        {debate_transcript}

        YOUR MEMORY & PAST EXPERIENCES:
        {self.state.memory if self.state.memory else "No prior experiences recorded."}

        Now reflect deeply on this debate in 3-4 sentences. Consider:
        - What did you learn from your opponents' arguments? Did any points resonate or make you reconsider anything?
        - How did you perform? What felt authentic vs. what felt forced?
        - Did the debate strengthen your convictions or expose weaknesses in your reasoning?
        - What will you carry forward from this experience - what changed in how you think about this issue?

        Write an honest, introspective reflection as if writing in a private journal after the cameras are off:"""

        system_instruction = f"""You are {self.name}, reflecting privately after a debate.
        Be brutally honest with yourself. Acknowledge when opponents made good points.
        Admit doubts or uncertainties. Show intellectual growth and humility where appropriate.
        Write in first person, be vulnerable and authentic - this is for you alone."""

        logger.debug(f"{self.name}: Calling LLM to generate post-debate reflection")
        reflection = llm_client.generate_response(
            self.llm_client,
            reflection_prompt,
            system_instruction
        )

        # Update memory with reflection
        self.state.memory += f"\n--- After debate on '{question.text}' ({question.topic.title}) ---\n{reflection.strip()}\n"
        logger.info(f"{self.name}: Completed reflection on debate question: '{question.text}' (topic: {question.topic.title})")
        logger.debug(f"{self.name}: Memory now {len(self.state.memory)} characters")
