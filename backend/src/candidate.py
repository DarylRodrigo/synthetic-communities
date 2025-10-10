from typing import Dict, List, Any
from .mediator import Topic, CandidateStatement
from . import llm_client


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
        previous_statements: List[CandidateStatement]
    ) -> CandidateStatement:
        """Craft LLM-generated debate statement."""
        # Build prompt
        prompt = f"DEBATE TOPIC: {topic.title}\n{topic.description}\n\nTurn {turn_number + 1}\n\n"

        if previous_statements:
            prompt += "Previous statements this turn:\n"
            for stmt in previous_statements:
                prompt += f"- {stmt.candidate_id}: {stmt.statement}\n"
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
            statement=response.strip(),
            topic=topic
        )

    def respond_to_opponent(
        self,
        opponent_statement: CandidateStatement,
        topic: Topic
    ) -> CandidateStatement:
        """
        Respond to an opponent's statement.

        Args:
            opponent_statement: The opponent's CandidateStatement
            topic: The Topic being debated

        Returns:
            CandidateStatement with the response
        """
        return CandidateStatement(
            candidate_id=self.id,
            statement="Default response",
            topic=topic
        )