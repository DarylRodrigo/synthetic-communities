import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from .config import Config
from .population import Population
from .candidate import Candidate
from .mediator import Mediator, DebateTranscript, MediatorStatement, CandidateStatement
from .social_media import SocialMedia, Post
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

        # Initialize simulation output path
        self.simulation_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.simulation_dir = None
        self.simulation_file = None

        # Initialize LLM client
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        self.llm_client = llm_client.create_client(api_key)
    
    def initialize_simulation_output(self, base_dir: str = "data/simulation") -> None:
        """
        Initialize the simulation output directory and file.

        Args:
            base_dir: Base directory for simulation outputs (default: "data/simulation")
        """
        # Create the simulation directory
        self.simulation_dir = Path(base_dir) / self.simulation_id
        self.simulation_dir.mkdir(parents=True, exist_ok=True)

        # Create the simulation file path
        self.simulation_file = self.simulation_dir / "epochs.jsonl"

        logger.info(f"Initialized simulation output at: {self.simulation_file}")

    def run(self) -> Dict[str, Any]:
        # Initialize simulation output if not already done
        if self.simulation_file is None:
            self.initialize_simulation_output()

        for epoch in range(self.config.num_epochs):
            self.current_epoch = epoch
            self._run_epoch()
            # Serialize state after each epoch
            self._serialize_epoch_state()

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
        logger.info(f"Candidates read latest posts")
        
        latest_feed = self.social_media.get_feed()
        logger.debug(f"Social Media Feed:\n{latest_feed}")

        for candidate in self.candidates:
            candidate.read_social_media_signals(latest_feed)
    
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
    
    def _serialize_epoch_state(self) -> None:
        """
        Serialize the current epoch state and append it to the epochs.jsonl file.

        The format matches the structure in backend/api/epoch.json with the following fields:
        - epoch: Current epoch number
        - debates: List of debate transcripts for this epoch
        - newsfeed: Social media posts from this epoch
        - candidates: Candidate states including policy positions and reflections
        - population_votes: Population voting intentions (if available)
        """
        if self.simulation_file is None:
            logger.warning("Simulation file not initialized. Call initialize_simulation_output() first.")
            return

        epoch_data = {
            "epoch": self.current_epoch,
            "debates": self._serialize_debates(),
            "newsfeed": self._serialize_social_media(),
            "candidates": self._serialize_candidates(),
            "population_votes": self._serialize_population_votes()
        }

        # Append to JSONL file (one JSON object per line)
        with open(self.simulation_file, 'a') as f:
            json.dump(epoch_data, f)
            f.write('\n')

        logger.info(f"Serialized epoch {self.current_epoch} to {self.simulation_file}")

    def _serialize_debates(self) -> List[Dict[str, Any]]:
        """Serialize debate transcripts for the current epoch."""
        debates = []

        for transcript in self.debate_transcripts:
            if transcript.epoch == self.current_epoch:
                debate_data = {
                    "topic": {
                        "id": transcript.topic.id,
                        "title": transcript.topic.title,
                        "description": transcript.topic.description
                    },
                    "statements": []
                }

                for statement in transcript.statements:
                    if isinstance(statement, MediatorStatement):
                        debate_data["statements"].append({
                            "type": "mediator",
                            "mediator_id": statement.mediator_id,
                            "statement": statement.statement
                        })
                    elif isinstance(statement, CandidateStatement):
                        debate_data["statements"].append({
                            "type": "candidate",
                            "candidate_id": statement.candidate_id,
                            "candidate_name": statement.candidate_name,
                            "statement": statement.statement
                        })

                debates.append(debate_data)

        return debates

    def _serialize_social_media(self) -> Dict[str, Any]:
        """Serialize social media posts."""
        if not self.social_media:
            return {"posts": []}

        posts = []
        for post in self.social_media.posts:
            posts.append({
                "id": post.id,
                "persona_id": post.persona_id,
                "content": post.content,
                "likes": post.likes,
                "dislikes": post.dislikes
            })

        return {"posts": posts}

    def _serialize_candidates(self) -> List[Dict[str, Any]]:
        """Serialize candidate states including policy positions and reflections."""
        candidates = []

        for candidate in self.candidates:
            candidate_data = {
                "id": candidate.id,
                "name": candidate.name,
                "policy_positions": candidate.state.policy_positions,
                "social_media_reflection": candidate.state.memory,
                "debate_reflection": candidate.state.memory
            }
            candidates.append(candidate_data)

        return candidates

    def _serialize_population_votes(self) -> List[Dict[str, Any]]:
        """Serialize population voting intentions and belief states."""
        votes = []

        for persona in self.population.personas:
            persona_data = {
                "id": persona.id,
                "name": getattr(persona, 'name', persona.id),
                "demographics": getattr(persona, 'features', {}),
                "policy_positions": {},
                "overall_vote": ""
            }

            # Add beliefs as policy positions with reasoning
            if hasattr(persona, 'beliefs') and persona.beliefs:
                for topic_id, belief in persona.beliefs.items():
                    persona_data["policy_positions"][topic_id] = {
                        "reasoning": belief,
                        "vote": ""  # Can be populated if vote tracking is implemented
                    }

            votes.append(persona_data)

        return votes

    def _finalize_experiment(self) -> Dict[str, Any]:
        pass

    def conduct_final_vote(self) -> Dict[str, Any]:
        candidate_names = [candidate.name for candidate in self.candidates]
        return self.population.conduct_vote(candidate_names)