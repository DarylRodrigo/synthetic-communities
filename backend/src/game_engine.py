import os
import json
import logging
from typing import Dict, List, Any
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from dataclasses import asdict, is_dataclass
from .config import Config
from .population import Population
from .candidate import Candidate
from .mediator import Mediator, DebateTranscript, MediatorStatement, CandidateStatement
from .social_media import SocialMedia, Post
from . import llm_client

logger = logging.getLogger(__name__)


class DataclassJSONEncoder(json.JSONEncoder):
    """Custom JSON encoder that handles dataclass instances."""
    def default(self, obj):
        if is_dataclass(obj):
            return asdict(obj)
        return super().default(obj)


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
        self._personas_update_beliefs_from_chat()
        self._personas_post_to_social_media()
        self._population_react_to_posts()
        self._personas_update_beliefs_from_social()
    
    def _candidates_read_social_media(self) -> None:
        logger.info(f"Candidates read latest posts")
        
        latest_feed = self.social_media.get_feed()
        logger.debug(f"Social Media Feed:\n{latest_feed}")

        for candidate in self.candidates:
            candidate.read_social_media_signals(latest_feed)
    
    def _conduct_debate_on_topic(self, topic_index: int) -> None:
        """
        Conduct a full debate on a topic with multiple questions.

        New flow:
        1. For each question:
           - Mediator proposes question (context-aware)
           - Mediator introduces question
           - Conduct turns on that question
           - Publish transcript

        Args:
            topic_index: Index of the topic to debate
        """
        if not self.mediator or not self.candidates:
            raise ValueError("No mediator or candidates configured")

        topic = self.mediator.topics[topic_index]
        logger.info(f"Starting debate on topic: '{topic.title}'")

        # Loop through questions for this topic
        for question_index in range(self.config.questions_per_topic):
            logger.info(f"Question {question_index + 1}/{self.config.questions_per_topic} for topic '{topic.title}'")

            # Step 1: Mediator proposes a question (context-aware)
            question = self.mediator.propose_question(
                topic=topic,
                previous_transcripts=self.debate_transcripts
            )

            # Step 2: Mediator introduces the question
            introduction = self.mediator.introduce_question(question)
            mediator_intro = MediatorStatement(
                mediator_id=self.mediator.id,
                statement=introduction,
                question=question
            )

            # Track all statements for this question
            all_statements = [mediator_intro]

            # Step 3: Conduct turns on this specific question
            for turn in range(self.config.turns_per_question):
                turn_statements = self.mediator.orchestrate_debate_turn(
                    question=question,
                    candidates=self.candidates,
                    turn_number=turn,
                    previous_statements=all_statements
                )
                all_statements.extend(turn_statements)
                logger.info(f"Turn {turn + 1}/{self.config.turns_per_question} completed with {len(turn_statements)} statements")


            # Step 4: Publish transcript for this question
            transcript = self.mediator.publish_debate_transcript(
                all_statements=all_statements,
                topic=topic,
                question=question,
                epoch=self.current_epoch,
                topic_index=topic_index,
                question_index=question_index
            )
            self.debate_transcripts.append(transcript)


            for candidate in self.candidates:
                candidate.reflect_on_debate(question, transcript)

            logger.info(f"Question debate complete. Transcript published (total statements: {len(all_statements)})")
    
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
            json.dump(epoch_data, f, cls=DataclassJSONEncoder)
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
                "state_memory": candidate.state.memory
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