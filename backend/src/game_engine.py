import os
import logging
from typing import Dict, List, Any
from dotenv import load_dotenv
from .config import Config
from .population import Population
from .candidate import Candidate
from .mediator import Mediator, DebateTranscript, MediatorStatement
from .social_media import SocialMedia
from . import llm_client

logger = logging.getLogger(__name__)


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
        self._personas_update_beliefs_from_chat()
        self._personas_post_to_social_media()
        self._population_react_to_posts()
        self._personas_update_beliefs_from_social()
    
    def _candidates_read_social_media(self) -> None:
        pass
    
    def _conduct_debate_on_topic(self, topic_index: int) -> None:
        """
        Conduct a full debate on a single topic with multiple turns.

        This implements the core debate loop:
        1. Mediator proposes a topic and introduces it
        2. For each turn (k times):
           - Candidates craft statements with full debate history as context
           - Mediator orchestrates turn
        3. Publish and store transcript (to be used by population in _population_consume_debate)

        Args:
            topic_index: Index of the topic to debate (used to select from mediator's topic pool)
        """
        if not self.mediator or not self.candidates:
            raise ValueError("No mediator or candidates configured")

        topic = self.mediator.propose_topic(topic_index)
        logger.info(f"Starting debate on topic: '{topic.title}'")
        
        # Create mediator introduction statement
        introduction = self.mediator.introduce_topic(topic)
        mediator_intro = MediatorStatement(
            mediator_id=self.mediator.id,
            statement=introduction,
            topic=topic
        )

        # Track all statements (mediator intro + all candidate statements)
        all_statements = [mediator_intro]

        # Step 2: Conduct k turns of debate
        for turn in range(self.config.turns_per_topic):
            turn_statements = self.mediator.orchestrate_debate_turn(
                topic=topic,
                candidates=self.candidates,
                turn_number=turn,
                previous_statements=all_statements
            )
            all_statements.extend(turn_statements)  # Accumulate all statements
            logger.info(f"Turn {turn + 1}/{self.config.turns_per_topic} completed with {len(turn_statements)} statements")

        # Step 3: Publish transcript and store it
        transcript = self.mediator.publish_debate_transcript(
            all_statements=all_statements,
            topic=topic,
            epoch=self.current_epoch,
            topic_index=topic_index
        )
        self.debate_transcripts.append(transcript)

        logger.info(f"Debate transcript published (total statements: {len(all_statements)})")
    
    def _population_consume_debate(self) -> None:
        """Have all personas consume the latest debate transcript."""
        if self.debate_transcripts:
            latest_transcript = self.debate_transcripts[-1]
            self.population.consume_debate_content(latest_transcript)
            logger.info(f"Population consumed debate on topic: {latest_transcript.topic.title}")

    def _personas_update_beliefs_from_debate(self) -> None:
        """Update all personas' beliefs based on debate knowledge."""
        for persona in self.population.get_all_personas():
            persona.update_beliefs(knowledge_category="debate_knowledge")
        logger.info("All personas updated beliefs from debate")

    def _personas_chat_with_peers(self) -> None:
        """Orchestrate paired conversations between personas."""
        conversations = self.population.chat_with_peers()
        logger.info(f"Completed {len(conversations)} paired conversations")

    def _personas_update_beliefs_from_chat(self) -> None:
        """Update all personas' beliefs based on chat conversations."""
        for persona in self.population.get_all_personas():
            if persona.chats:  # Only update if they chatted
                persona.update_beliefs(knowledge_category="chats")
        logger.info("All personas updated beliefs from chats")

    
    def _personas_post_to_social_media(self) -> None:
        """Have personas create and publish social media posts."""
        posts = self.population.create_social_media_posts()
        if self.social_media:
            # Add posts to social media platform and get their IDs
            post_ids = []
            for post in posts:
                post_id = self.social_media.add_post(post)
                post_ids.append(post_id)
            logger.info(f"Published {len(post_ids)} posts to social media")

    def _population_react_to_posts(self) -> None:
        """Have personas react to social media posts."""
        if self.social_media:
            # Convert Post objects to dicts with updated like/dislike counts
            posts_as_dicts = []
            for post in self.social_media.posts:
                posts_as_dicts.append({
                    "id": post.id,
                    "persona_id": post.persona_id,
                    "content": post.content,
                    "likes": post.likes,
                    "dislikes": post.dislikes
                })

            reaction_stats = self.population.react_to_posts(
                posts_as_dicts,
                self.social_media
            )
            logger.info(f"Reactions: {reaction_stats['total_reactions']} total "
                       f"({reaction_stats['thumbs_up']} 👍, {reaction_stats['thumbs_down']} 👎)")

    def _personas_update_beliefs_from_social(self) -> None:
        """Update all personas' beliefs based on social media knowledge."""
        for persona in self.population.get_all_personas():
            if persona.social_media_knowledge:  # Only update if they've seen posts
                persona.update_beliefs(knowledge_category="social_media_knowledge")
        logger.info("All personas updated beliefs from social media")
    
    def _finalize_experiment(self) -> Dict[str, Any]:
        pass
    
    def conduct_final_vote(self) -> Dict[str, Any]:
        candidate_names = [candidate.name for candidate in self.candidates]
        return self.population.conduct_vote(candidate_names)