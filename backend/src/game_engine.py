import os
from typing import Dict, List, Any
from dotenv import load_dotenv
from .config import Config
from .population import Population
from .candidate import Candidate
from .mediator import Mediator, DebateTranscript, DebateTurn
from .social_media import SocialMedia
from . import llm_client


class GameEngine:
    def __init__(self, config: Config):
        self.config = config
        self.current_epoch = 0
        self.population: Population = Population()
        self.candidates: List[Candidate] = []
        self.mediator: Mediator = None
        self.social_media: SocialMedia = None
        self.debate_transcripts: List[DebateTranscript] = []

        # Initialize LLM client
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        self.llm_client = llm_client.create_client(api_key)
    
    def run(self) -> Dict[str, Any]:
        for epoch in range(self.config.num_epochs):
            self.current_epoch = epoch
            self._run_epoch()
        
        return self._finalize_experiment()
    
    def _run_epoch(self) -> None:
        self._candidates_read_social_media()
        
        for topic_index in range(self.config.topics_per_epoch):
            self._conduct_debate_on_topic(topic_index)
        
        self._population_consume_debate()
        self._personas_update_beliefs_from_debate()
        self._personas_chat_with_peers()
        self._personas_post_to_social_media()
        self._personas_update_beliefs_from_social()
        self._population_react_to_posts()
    
    def _candidates_read_social_media(self) -> None:
        pass
    
    def _conduct_debate_on_topic(self, topic_index: int) -> None:
        """
        Conduct a full debate on a single topic with multiple turns.

        This implements the core debate loop:
        1. Mediator proposes a topic
        2. For each turn (k times):
           - Candidates craft statements
           - Mediator orchestrates turn
        3. Publish and store transcript (to be used by population in _population_consume_debate)

        Args:
            topic_index: Index of the topic to debate (used to select from mediator's topic pool)
        """
        if not self.mediator or not self.candidates:
            raise ValueError("No mediator or candidates configured")

        topic = self.mediator.propose_topic(topic_index)
        introduction = self.mediator.introduce_topic(topic)
        print(f"  Topic: '{topic.title}'")
        print(f"  {introduction}")

        # Step 2: Conduct k turns of debate
        debate_session: List[DebateTurn] = []
        for turn in range(self.config.turns_per_topic):
            turn_result = self.mediator.orchestrate_debate_turn(
                topic=topic,
                candidates=self.candidates,
                turn_number=turn
            )
            debate_session.append(turn_result)
            print(f"    Turn {turn + 1}/{self.config.turns_per_topic} completed with {len(turn_result.statements)} statements")

        # Step 3: Publish transcript and store it
        transcript = self.mediator.publish_debate_transcript(
            debate_session=debate_session,
            epoch=self.current_epoch,
            topic_index=topic_index
        )
        self.debate_transcripts.append(transcript)

        print(f"  Debate transcript published (total turns: {transcript.num_turns})")
    
    def _population_consume_debate(self) -> None:
        pass
    
    def _personas_update_beliefs_from_debate(self) -> None:
        self.population.update_beliefs([])
    
    def _personas_chat_with_peers(self) -> None:
        self.population.chat_with_peers()
    
    def _personas_update_beliefs_from_social(self) -> None:
        self.population.update_beliefs([])
    
    def _personas_post_to_social_media(self) -> None:
        posts = self.population.create_social_media_posts()
        if self.social_media:
            for post in posts:
                self.social_media.add_post(post)
    
    def _population_react_to_posts(self) -> None:
        if self.social_media:
            posts = self.social_media.posts
            self.population.react_to_posts(posts)
    
    def _finalize_experiment(self) -> Dict[str, Any]:
        pass
    
    def conduct_final_vote(self) -> Dict[str, Any]:
        candidate_names = [candidate.name for candidate in self.candidates]
        return self.population.conduct_vote(candidate_names)