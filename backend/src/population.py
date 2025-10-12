import json
import logging
from typing import Dict, List, Any, Optional
from .persona import Persona
import asyncio

logger = logging.getLogger(__name__)


class Population:
    def __init__(self):
        self.personas: List[Persona] = []
    
    def load_from_jsonl(self, file_path: str, limit: Optional[int] = None) -> None:
        import random
        
        logger.debug(f"Loading personas from {file_path}" + (f" (limit: {limit})" if limit else ""))
        
        # First, read all lines from the file
        with open(file_path, 'r') as f:
            all_lines = [line.strip() for line in f if line.strip()]
        
        # If limit is specified and less than total lines, randomly sample
        if limit is not None and limit < len(all_lines):
            selected_lines = random.sample(all_lines, limit)
        else:
            selected_lines = all_lines
        
        # Load personas from selected lines
        personas_loaded = 0
        for line in selected_lines:
            persona_data = json.loads(line)
            persona = Persona(persona_data['id'], persona_data)  # Pass full data
            self.personas.append(persona)
            personas_loaded += 1
            
        logger.info(f"Loaded {personas_loaded} personas from {file_path} (randomly sampled from {len(all_lines)} total)")
    
    def add_persona(self, persona: Persona) -> None:
        self.personas.append(persona)

    def size(self) -> int:
        return len(self.personas)
    
    def consume_debate_content(self, debate_transcript: Dict[str, Any]) -> None:
        for persona in self.personas:
            persona.consume_debate_content(debate_transcript)
    
    def chat_with_peers(
        self,
        num_rounds_mean: int = 3,
        num_rounds_variance: int = 1
    ) -> List[Dict[str, Any]]:
        """
        Synchronous wrapper for parallel chat orchestration.
        
        Args:
            num_rounds_mean: Average number of message exchanges per pair
            num_rounds_variance: Variance in number of rounds (rounds will be mean ± variance)
        
        Returns:
            List of conversation records
        """
        logger.debug(f"Orchestrating peer chats: {len(self.personas)} personas, target {num_rounds_mean}±{num_rounds_variance} rounds")
        
        # Get or create persistent event loop (same pattern as belief updates)
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async version on persistent loop
        conversations = loop.run_until_complete(
            self.chat_with_peers_async(num_rounds_mean, num_rounds_variance)
        )
        
        logger.info(f"Completed {len(conversations)} paired conversations")
        return conversations
    
    def create_social_media_posts(self, post_probability: float = 0.07) -> List[Dict[str, Any]]:
        """Synchronous wrapper for parallel social media post creation."""
        logger.debug(f"Creating social media posts: {len(self.personas)} personas, {int(post_probability*100)}% probability")
        
        # Get or create persistent event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async version on persistent loop
        posts = loop.run_until_complete(
            self.create_social_media_posts_async(post_probability)
        )
        
        logger.info(f"Published {len(posts)} posts to social media")
        return posts
    
    def react_to_posts(
        self,
        posts: List[Dict[str, Any]],
        social_media_platform=None,
        reaction_probability: float = 0.4
    ) -> Dict[str, Any]:
        """Synchronous wrapper for parallel reactions to posts."""
        logger.debug(f"Processing reactions: {len(self.personas)} personas, {len(posts)} posts, {int(reaction_probability*100)}% probability")
        
        # Get or create persistent event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async version on persistent loop
        reaction_stats = loop.run_until_complete(
            self.react_to_posts_async(posts, social_media_platform, reaction_probability)
        )
        
        logger.info(f"Reactions: {reaction_stats['total_reactions']} total "
                   f"({reaction_stats['thumbs_up']} 👍, {reaction_stats['thumbs_down']} 👎)")
        return reaction_stats
    
    def conduct_vote(self, candidates: List[str]) -> Dict[str, int]:
        """Synchronous wrapper for parallel voting."""
        logger.debug(f"Conducting vote: {len(self.personas)} personas, {len(candidates)} candidates")
        
        # Get or create persistent event loop
        try:
            loop = asyncio.get_event_loop()
            if loop.is_closed():
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        
        # Run async version on persistent loop
        votes = loop.run_until_complete(
            self.conduct_vote_async(candidates)
        )
        
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

            for _ in range(num_rounds):
                # Persona A's turn
                message_a = await persona_a.chat_with_peers_async(
                    conversation_history, 
                    persona_b.id,
                    persona_b.features.get('name', persona_b.id)
                )
                conversation_history.append({
                    "speaker_id": persona_a.id,
                    "message": message_a
                })

                # Persona B's turn
                message_b = await persona_b.chat_with_peers_async(
                    conversation_history, 
                    persona_a.id,
                    persona_a.features.get('name', persona_a.id)
                )
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

        vote_counts = {candidate: 0 for candidate in candidates}

        # Collect all votes in parallel
        individual_votes = await asyncio.gather(*[
            persona.vote_async(candidates)
            for persona in self.personas
        ])

        # Tally votes
        for candidate_name in individual_votes:
            if candidate_name in vote_counts:
                vote_counts[candidate_name] += 1

        logger.info(f"Parallel vote completed: {sum(vote_counts.values())} votes cast across {len(candidates)} candidates")
        return vote_counts

    def _run_parallel_belief_updates(self, personas: List[Persona], knowledge_category: str, max_concurrent: int = 20, max_change_percentage: float = 0.5) -> None:
        """Common async orchestration logic for parallel belief updates."""
        logger.debug(f"Starting parallel belief updates for {knowledge_category} with {len(personas)} personas (max {max_concurrent} concurrent)")
        
        async def run_parallel():
            semaphore = asyncio.Semaphore(max_concurrent)
            
            async def limited_update(persona):
                async with semaphore:
                    return await persona.update_beliefs_async(knowledge_category, max_change_percentage)
            
            tasks = [limited_update(persona) for persona in personas]
            await asyncio.gather(*tasks)

        # Get or create event loop and run async function
        # This avoids creating/destroying event loops which breaks gRPC client
        try:
            loop = asyncio.get_running_loop()
            # If we're already in an async context, create a task
            raise RuntimeError("Already in async context - this shouldn't happen")
        except RuntimeError:
            # No running loop, so we need to get or create one
            try:
                loop = asyncio.get_event_loop()
                if loop.is_closed():
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
            except RuntimeError:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
            
            # Run the async function on the persistent loop
            loop.run_until_complete(run_parallel())
        
        logger.info(f"All personas updated beliefs from {knowledge_category} (parallel)")

    def update_beliefs_from_debate(self, max_concurrent: int = 20, max_change_percentage: float = 0.5) -> None:
        """Update all personas' beliefs based on debate knowledge in parallel."""
        self._run_parallel_belief_updates(self.personas, "debate_knowledge", max_concurrent, max_change_percentage)

    def update_beliefs_from_chat(self, max_concurrent: int = 20, max_change_percentage: float = 0.5) -> None:
        """Update all personas' beliefs based on chat conversations in parallel."""
        # Filter personas who have chats
        personas_with_chats = [persona for persona in self.personas if persona.chats]
        self._run_parallel_belief_updates(personas_with_chats, "chats", max_concurrent, max_change_percentage)

    def update_beliefs_from_social_media(self, max_concurrent: int = 20, max_change_percentage: float = 0.5) -> None:
        """Update all personas' beliefs based on social media knowledge in parallel."""
        # Filter personas who have social media knowledge
        personas_with_social = [persona for persona in self.personas if persona.social_media_knowledge]
        self._run_parallel_belief_updates(personas_with_social, "social_media_knowledge", max_concurrent, max_change_percentage)

    def get_voting_data(self) -> List[Dict[str, Any]]:
        """Serialize population dynamic state (beliefs and policy positions only)."""
        votes = []

        for persona in self.personas:
            persona_data = {
                "id": persona.id,
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