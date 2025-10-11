import json
import logging
from typing import Dict, List, Any, Optional
from .persona import Persona
import asyncio

logger = logging.getLogger(__name__)


class Population:
    def __init__(self):
        self.personas: List[Persona] = []
    
    def load_from_jsonl(self, file_path: str) -> None:
        logger.debug(f"Loading personas from {file_path}")
        personas_loaded = 0
        with open(file_path, 'r') as f:
            for line in f:
                persona_data = json.loads(line.strip())
                persona = Persona(persona_data['id'])
                self.personas.append(persona)
                personas_loaded += 1
        logger.info(f"Loaded {personas_loaded} personas from {file_path}")
    
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
    
    def update_beliefs(self, knowledge_category: str = "debate_knowledge") -> None:
        for persona in self.personas:
            persona.update_beliefs(knowledge_category)
    
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

        logger.debug(f"Orchestrating peer chats: {len(self.personas)} personas, target {num_rounds_mean}±{num_rounds_variance} rounds")

        # Create pairs
        available_personas = self.personas.copy()
        random.shuffle(available_personas)

        pairs = []
        for i in range(0, len(available_personas) - 1, 2):
            pairs.append((available_personas[i], available_personas[i + 1]))

        # If odd number, last persona doesn't chat this round
        logger.info(f"Created {len(pairs)} conversation pairs from {len(available_personas)} personas")
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
    
    def create_social_media_posts(self, post_probability: float = 0.07) -> List[Dict[str, Any]]:
        """
        Have personas create social media posts with a given probability.

        Args:
            post_probability: Probability (0.0-1.0) that each persona will post (default 7%)

        Returns:
            List of posts created (each post: {"persona_id": str, "content": str})
        """
        import random

        logger.debug(f"Creating social media posts: {len(self.personas)} personas, {int(post_probability*100)}% probability")

        posts = []
        existing_posts = []  # Accumulate posts as they're created
        eligible_count = 0

        for persona in self.personas:
            # Random chance to post
            if random.random() < post_probability:
                eligible_count += 1
                post_content = persona.create_social_media_post(existing_posts)
                if post_content:
                    post = {
                        "persona_id": persona.id,
                        "content": post_content
                    }
                    posts.append(post)
                    existing_posts.append(post)  # Add to feed for next personas

        logger.debug(f"Posts created: {len(posts)} from {eligible_count} eligible personas")
        return posts
    
    def react_to_posts(
        self,
        posts: List[Dict[str, Any]],
        social_media_platform=None,
        reaction_probability: float = 0.4
    ) -> Dict[str, Any]:
        """
        Have personas react to social media posts with a given probability.

        Args:
            posts: List of posts to react to
            social_media_platform: SocialMedia instance to record reactions
            reaction_probability: Probability (0.0-1.0) that each persona will react to each post (default 40%)

        Returns:
            Dict with reaction statistics
        """
        import random

        logger.debug(f"Processing reactions: {len(self.personas)} personas, {len(posts)} posts, {int(reaction_probability*100)}% probability")

        total_reactions = 0
        reactions_by_type = {"thumbs_up": 0, "thumbs_down": 0}

        for persona in self.personas:
            # Store all posts in social_media_knowledge
            for post in posts:
                # Don't store your own posts in knowledge
                if post.get("persona_id") != persona.id:
                    persona.social_media_knowledge.append(post)

            # React to posts with probability
            for post in posts:
                # Random chance to react
                if random.random() < reaction_probability:
                    reaction = persona.react_to_post(post)
                    if reaction and social_media_platform:
                        # Record reaction in social media platform
                        post_id = post.get("id")
                        if post_id:
                            social_media_platform.add_reaction(post_id, persona.id, reaction)
                            total_reactions += 1
                            reactions_by_type[reaction] = reactions_by_type.get(reaction, 0) + 1

        return {
            "total_reactions": total_reactions,
            "thumbs_up": reactions_by_type["thumbs_up"],
            "thumbs_down": reactions_by_type["thumbs_down"]
        }
    
    def conduct_vote(self, candidates: List[str]) -> Dict[str, int]:
        logger.debug(f"Conducting vote: {len(self.personas)} personas, {len(candidates)} candidates")
        votes = {}
        for candidate in candidates:
            votes[candidate] = 0

        for persona in self.personas:
            vote = persona.vote(candidates)
            if vote in votes:
                votes[vote] += 1

        logger.info(f"Vote completed: {sum(votes.values())} votes cast across {len(candidates)} candidates")
        return votes

    # ========== ASYNC VERSIONS FOR PARALLELIZATION ==========

    async def update_beliefs_async(self, knowledge_category: str = "debate_knowledge") -> None:
        """
        Update beliefs for all personas in parallel using async.

        This is MUCH faster than the sequential version when you have many personas,
        as all LLM API calls happen concurrently.
        """
        logger.debug(f"Starting parallel belief updates for {len(self.personas)} personas")

        # Create tasks for all personas
        tasks = [
            persona.update_beliefs_async(knowledge_category)
            for persona in self.personas
        ]

        # Execute all tasks in parallel
        await asyncio.gather(*tasks)

        logger.info(f"Completed parallel belief updates for {len(self.personas)} personas")

    async def chat_with_peers_async(
        self,
        num_rounds_mean: int = 3,
        num_rounds_variance: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Orchestrate paired conversations between personas with parallelized LLM calls.

        Within each pair, personas still alternate turns (synchronous within pair),
        but all pairs chat in parallel, dramatically speeding up the process.
        """
        import random

        logger.debug(f"Orchestrating parallel peer chats: {len(self.personas)} personas, target {num_rounds_mean}±{num_rounds_variance} rounds")

        # Create pairs
        available_personas = self.personas.copy()
        random.shuffle(available_personas)

        pairs = []
        for i in range(0, len(available_personas) - 1, 2):
            pairs.append((available_personas[i], available_personas[i + 1]))

        logger.info(f"Created {len(pairs)} conversation pairs from {len(available_personas)} personas")

        # Define async function for a single pair conversation
        async def chat_pair(persona_a: Persona, persona_b: Persona) -> Dict[str, Any]:
            num_rounds = max(1, num_rounds_mean + random.randint(-num_rounds_variance, num_rounds_variance))
            conversation_history = []

            for round_num in range(num_rounds):
                # Persona A's turn
                message_a = await persona_a.chat_with_peers_async(conversation_history, persona_b.id)
                conversation_history.append({
                    "speaker_id": persona_a.id,
                    "message": message_a
                })

                # Persona B's turn
                message_b = await persona_b.chat_with_peers_async(conversation_history, persona_a.id)
                conversation_history.append({
                    "speaker_id": persona_b.id,
                    "message": message_b
                })

            return {
                "participants": [persona_a.id, persona_b.id],
                "num_rounds": num_rounds,
                "conversation": conversation_history
            }

        # Execute all pair conversations in parallel
        all_conversations = await asyncio.gather(*[
            chat_pair(persona_a, persona_b)
            for persona_a, persona_b in pairs
        ])

        return all_conversations

    async def create_social_media_posts_async(self, post_probability: float = 0.07) -> List[Dict[str, Any]]:
        """
        Have personas create social media posts in parallel.

        All eligible personas generate posts concurrently, dramatically speeding up the process.
        """
        import random

        logger.debug(f"Creating social media posts in parallel: {len(self.personas)} personas, {int(post_probability*100)}% probability")

        # Determine which personas will post
        posting_personas = [
            persona for persona in self.personas
            if random.random() < post_probability
        ]

        logger.debug(f"{len(posting_personas)} personas eligible to post")

        if not posting_personas:
            return []

        # Get existing posts (empty for first batch, or could pass in existing)
        existing_posts = []

        # Generate all posts in parallel
        posts = await asyncio.gather(*[
            persona.create_social_media_post_async(existing_posts)
            for persona in posting_personas
        ])

        # Filter out None values (failed posts)
        valid_posts = [
            {
                "persona_id": post.persona_id,
                "content": post.content,
                "id": post.id
            }
            for post in posts if post is not None
        ]

        logger.info(f"Posts created in parallel: {len(valid_posts)} from {len(posting_personas)} eligible personas")
        return valid_posts

    async def react_to_posts_async(
        self,
        posts: List[Dict[str, Any]],
        social_media_platform=None,
        reaction_probability: float = 0.4
    ) -> Dict[str, Any]:
        """
        Have personas react to social media posts in parallel.

        All reactions happen concurrently, dramatically speeding up the process.
        """
        import random

        logger.debug(f"Processing reactions in parallel: {len(self.personas)} personas, {len(posts)} posts, {int(reaction_probability*100)}% probability")

        # First, store all posts in social_media_knowledge (sequential, fast)
        for persona in self.personas:
            for post in posts:
                if post.get("persona_id") != persona.id:
                    persona.social_media_knowledge.append(post)

        # Collect all reaction tasks
        reaction_tasks = []
        task_metadata = []  # Track which persona/post each task corresponds to

        for persona in self.personas:
            for post in posts:
                if random.random() < reaction_probability:
                    reaction_tasks.append(persona.react_to_post_async(post))
                    task_metadata.append({
                        "persona_id": persona.id,
                        "post": post
                    })

        logger.debug(f"Created {len(reaction_tasks)} reaction tasks")

        # Execute all reactions in parallel
        reactions = await asyncio.gather(*reaction_tasks)

        # Process results
        total_reactions = 0
        reactions_by_type = {"thumbs_up": 0, "thumbs_down": 0}

        for reaction, metadata in zip(reactions, task_metadata):
            if reaction and social_media_platform:
                post_id = metadata["post"].get("id")
                if post_id:
                    social_media_platform.add_reaction(post_id, metadata["persona_id"], reaction)
                    total_reactions += 1
                    reactions_by_type[reaction] = reactions_by_type.get(reaction, 0) + 1

        logger.info(f"Completed parallel reactions: {total_reactions} reactions")

        return {
            "total_reactions": total_reactions,
            "thumbs_up": reactions_by_type["thumbs_up"],
            "thumbs_down": reactions_by_type["thumbs_down"]
        }

    async def conduct_vote_async(self, candidates: List[str]) -> Dict[str, int]:
        """
        Conduct voting for all personas in parallel.

        All personas vote concurrently, dramatically speeding up the process.
        """
        logger.debug(f"Conducting parallel vote: {len(self.personas)} personas, {len(candidates)} candidates")

        votes = {candidate: 0 for candidate in candidates}

        # Collect all votes in parallel
        vote_results = await asyncio.gather(*[
            persona.vote_async(candidates)
            for persona in self.personas
        ])

        # Tally votes
        for vote in vote_results:
            if vote in votes:
                votes[vote] += 1

        logger.info(f"Parallel vote completed: {sum(votes.values())} votes cast across {len(candidates)} candidates")
        return votes