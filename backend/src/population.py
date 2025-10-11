import json
from typing import Dict, List, Any, Optional
from .persona import Persona


class Population:
    def __init__(self):
        self.personas: List[Persona] = []
    
    def load_from_jsonl(self, file_path: str) -> None:
        with open(file_path, 'r') as f:
            for line in f:
                persona_data = json.loads(line.strip())
                persona = Persona(persona_data['id'])
                self.personas.append(persona)
    
    def add_persona(self, persona: Persona) -> None:
        self.personas.append(persona)
    
    def get_persona(self, persona_id: str) -> Optional[Persona]:
        for persona in self.personas:
            if persona.id == persona_id:
                return persona
        return None
    
    def get_all_personas(self) -> List[Persona]:
        return self.personas
    
    def size(self) -> int:
        return len(self.personas)
    
    def consume_debate_content(self, debate_transcript: Dict[str, Any]) -> None:
        for persona in self.personas:
            persona.consume_debate_content(debate_transcript)
    
    def update_beliefs(self, messages: List[Dict[str, Any]]) -> None:
        for persona in self.personas:
            persona.update_beliefs(messages)
    
    def chat_with_peers(
        self,
        num_rounds_mean: int = 3,
        num_rounds_variance: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Orchestrate paired conversations between personas.

        Args:
            num_rounds_mean: Average number of message exchanges per pair
            num_rounds_variance: Variance in number of rounds (rounds will be mean ± variance)

        Returns:
            List of conversation records
        """
        import random

        # Create pairs
        available_personas = self.personas.copy()
        random.shuffle(available_personas)

        pairs = []
        for i in range(0, len(available_personas) - 1, 2):
            pairs.append((available_personas[i], available_personas[i + 1]))

        # If odd number, last persona doesn't chat this round
        all_conversations = []

        # For each pair, orchestrate a conversation
        for persona_a, persona_b in pairs:
            # Determine number of rounds for this conversation
            num_rounds = max(1, num_rounds_mean + random.randint(-num_rounds_variance, num_rounds_variance))

            conversation_history = []

            # Back and forth conversation
            for round_num in range(num_rounds):
                # Persona A's turn
                message_a = persona_a.chat_with_peers(conversation_history, persona_b.id)
                conversation_history.append({
                    "speaker_id": persona_a.id,
                    "message": message_a
                })

                # Persona B's turn
                message_b = persona_b.chat_with_peers(conversation_history, persona_a.id)
                conversation_history.append({
                    "speaker_id": persona_b.id,
                    "message": message_b
                })

            # Record the full conversation
            conversation_record = {
                "participants": [persona_a.id, persona_b.id],
                "num_rounds": num_rounds,
                "conversation": conversation_history
            }
            all_conversations.append(conversation_record)

        return all_conversations
    
    def create_social_media_posts(self) -> List[Dict[str, Any]]:
        posts = []
        for persona in self.personas:
            post = persona.create_social_media_post()
            if post:
                posts.append(post)
        return posts
    
    def react_to_posts(self, posts: List[Dict[str, Any]]) -> None:
        for persona in self.personas:
            for post in posts:
                persona.react_to_post(post)
    
    def conduct_vote(self, candidates: List[str]) -> Dict[str, int]:
        votes = {}
        for candidate in candidates:
            votes[candidate] = 0
        
        for persona in self.personas:
            vote = persona.vote(candidates)
            if vote in votes:
                votes[vote] += 1
        
        return votes