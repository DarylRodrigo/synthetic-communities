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
    
    def chat_with_peers(self) -> None:
        for persona in self.personas:
            peer_messages = []
            persona.chat_with_peers(peer_messages)
    
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