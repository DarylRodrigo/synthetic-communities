import logging
from typing import Dict, List, Any
from .mediator import Topic, CandidateStatement, MediatorStatement
from . import llm_client

logger = logging.getLogger(__name__)


class Candidate:
    def __init__(self, candidate_id: str, name: str, llm_client_instance):
        self.id = candidate_id
        self.name = name
        self.llm_client = llm_client_instance

    def read_social_media_signals(self, social_media_state: Dict[str, Any]) -> None:
        pass

    def craft_debate_statement(
        self,
        topic: Topic,
        turn_number: int,
        previous_statements: List
    ) -> CandidateStatement:
        """Craft LLM-generated debate statement."""
        # Build prompt
        prompt = f"DEBATE TOPIC: {topic.title}\n{topic.description}\n\nTurn {turn_number + 1}\n\n"

        if previous_statements:
            prompt += "Debate history:\n"
            for stmt in previous_statements:
                if isinstance(stmt, MediatorStatement):
                    prompt += f"MODERATOR: {stmt.statement}\n"
                else:  # CandidateStatement
                    prompt += f"- {stmt.candidate_name}: {stmt.statement}\n"
            prompt += "\n"

        prompt += "Your statement (2-3 sentences):"

        # Generate response
        system_instruction = f"You are {self.name}, a political candidate in a debate. Provide clear, persuasive 2-3 sentence statements."

        response = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        return CandidateStatement(
            candidate_id=self.id,
            candidate_name=self.name,
            statement=response.strip(),
            topic=topic
        )
