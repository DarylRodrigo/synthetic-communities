from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
import os
from dataclasses import dataclass

import logging
from . import llm_client
import uuid
from .social_media import Post
import json
import asyncio

logger = logging.getLogger(__name__)


@dataclass
class ChatEntry:
    """Represents a chat conversation between two personas."""
    peer_id: str
    peer_name: str
    conversation: List[Dict[str, str]]  # List of {"speaker_id": str, "message": str}


class Persona:
    def __init__(self, persona_id: str, persona_data: Dict[str, Any] = None):
        self.id = persona_id
        self.features = persona_data if persona_data else {}  # Store ALL persona data
        self.debate_knowledge = []  # List of debate transcript strings
        self.chats = []  # List of chat conversations
        self.social_media_knowledge = []  # List of social media posts seen
        self.posts = []  # List of posts made by this persona
        self.beliefs = {}  # Dict of current beliefs (evolve via LLM, don't use prior_beliefs)

        # Initialize LLM client for persona
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        self.llm_client = llm_client.create_client(api_key)

    def _format_full_identity(self) -> str:
        """Format complete persona identity for use in prompts."""
        if not self.features:
            return f"ID: {self.id}\n(No persona data available)"

        lines = []
        lines.append(f"Name: {self.features.get('name', 'Unknown')}")
        lines.append(f"Age: {self.features.get('age')}, {self.features.get('gender')}")
        lines.append(f"Profession: {self.features.get('job')} at {self.features.get('company')}")
        lines.append(f"Location: {self.features.get('city')}, {self.features.get('country')}")
        lines.append(f"Education: {self.features.get('education_level')}")
        lines.append(f"Background: {self.features.get('ethnicity')}, {self.features.get('cultural_background')}")
        if self.features.get('religion'):
            lines.append(f"Religion: {self.features.get('religion')}")

        # Biography and personality
        lines.append(f"\nBiography: {self.features.get('backstory', 'No backstory available')}")
        lines.append(f"\nDemeanour: {self.features.get('demeanour', 'No description')}")

        if self.features.get('interests'):
            lines.append(f"Interests: {', '.join(self.features.get('interests', []))}")

        # Personality traits (Big Five)
        traits = self.features.get('personality_traits', {})
        if traits:
            lines.append(f"\nPersonality Traits:")
            lines.append(f"  Openness: {traits.get('openness', 0):.2f}")
            lines.append(f"  Conscientiousness: {traits.get('conscientiousness', 0):.2f}")
            lines.append(f"  Extraversion: {traits.get('extraversion', 0):.2f}")
            lines.append(f"  Agreeableness: {traits.get('agreeableness', 0):.2f}")
            lines.append(f"  Neuroticism: {traits.get('neuroticism', 0):.2f}")

        return "\n".join(lines)

    def _format_chat(self, chat: ChatEntry, max_messages: int = 5) -> str:
        """
        Format a chat conversation nicely with proper names.

        Args:
            chat: The ChatEntry to format
            max_messages: Maximum number of recent messages to show (default: 5)

        Returns:
            Formatted chat string with "You: " for self and peer's name for others
        """
        lines = []
        lines.append(f"Conversation with {chat.peer_name}:")

        for msg in chat.conversation[-max_messages:]:
            if msg["speaker_id"] == self.id:
                lines.append(f"  You: {msg['message']}")
            else:
                lines.append(f"  {chat.peer_name}: {msg['message']}")

        return "\n".join(lines)

    def consume_debate_content(self, debate_transcript: Dict[str, Any]) -> None:
        """
        Process and store new debate content, comparing against previous knowledge.

        Args:
            debate_transcript: A DebateTranscript object containing statements from the debate
        """
        logger.debug(f"Persona {self.id}: Consuming debate content (current rounds: {len(self.debate_knowledge)})")

        # Convert debate transcript to string representation
        transcript_str = self._format_debate_transcript(debate_transcript)

        # If there's previous debate knowledge, compare and extract only new content
        is_incremental = False
        if self.debate_knowledge:
            last_transcript = self.debate_knowledge[-1]
            # Remove the round prefix to get the actual content for comparison
            last_content = last_transcript.split(']', 1)[1] if ']' in last_transcript else last_transcript

            # If the new transcript contains the previous content, extract only what's new
            if last_content.strip() and transcript_str.startswith(last_content.strip()):
                transcript_str = transcript_str[len(last_content.strip()):].strip()
                is_incremental = True

        # Determine the round number based on current list length
        round_number = len(self.debate_knowledge) + 1

        # Prepend the round indicator and append to debate knowledge
        formatted_transcript = f"[round {round_number} debate transcript] {transcript_str}"
        self.debate_knowledge.append(formatted_transcript)

        logger.debug(f"Persona {self.id}: Debate round {round_number} stored ({'incremental' if is_incremental else 'full'}, {len(transcript_str)} chars)")

    def _format_debate_transcript(self, debate_transcript: Dict[str, Any]) -> str:
        """
        Convert a DebateTranscript object into a readable string format.

        Args:
            debate_transcript: A DebateTranscript object

        Returns:
            Formatted string representation of the debate
        """
        lines = []

        # Add topic information only if this is the first round
        if len(self.debate_knowledge) == 0:
            topic = debate_transcript.topic
            lines.append(f"Topic: {topic.title}")
            lines.append(f"Description: {topic.description}")
            lines.append("")

        # Add all statements in order
        for statement in debate_transcript.statements:
            if hasattr(statement, 'raw_text'):
                # Raw text from test (no speaker prefix)
                lines.append(statement.raw_text)
            elif hasattr(statement, 'candidate_name'):
                # CandidateStatement
                lines.append(f"{statement.candidate_name}: {statement.statement}")
            else:
                # MediatorStatement
                lines.append(f"Mediator: {statement.statement}")

        return "\n".join(lines)
    
    def update_beliefs(
        self,
        knowledge_category: str = "debate_knowledge",
        max_change_percentage: float = 0.5
    ) -> None:
        """
        Update beliefs based on accumulated knowledge using LLM.

        Args:
            knowledge_category: Which knowledge was just updated
                               ("debate_knowledge", "chats", "social_media_knowledge")
            max_change_percentage: Maximum percentage of beliefs that can change (0.0 to 1.0)
        """
    
        # Build context for LLM
        context = self._build_belief_update_context(knowledge_category)
        logger.debug(f"Persona {self.id}: Updating beliefs from {knowledge_category} with context: {context}")

        # Create prompt for LLM
        prompt = f"""You are updating the beliefs of a person based on new information they have received.

{context}

Based on all this information, please update the person's beliefs. You may slightly to moderately revise their beliefs, but you cannot change more than {int(max_change_percentage * 100)}% of their existing beliefs.

Return the updated beliefs as a JSON object with belief categories as keys and belief statements as values.

Example format:
{{
    "healthcare": "I believe in universal healthcare coverage",
    "economy": "I support progressive taxation",
    "climate": "Climate change requires immediate action"
}}

If the person has no existing beliefs, create initial beliefs based on their features and the knowledge they've consumed.

Return ONLY the JSON object, no additional text."""

        system_instruction = "You are a belief update system. You analyze information and update a person's beliefs accordingly, maintaining consistency and gradual change."

        # Get updated beliefs from LLM
        try:
            logger.debug(f"Persona {self.id}: Calling LLM to update beliefs")
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )
            
            # Remove markdown code blocks if present
            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.startswith("```"):
                response_clean = response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]

            updated_beliefs = json.loads(response_clean.strip())

            # Update the persona's beliefs
            old_belief_count = len(self.beliefs)
            self.beliefs = updated_beliefs
            logger.info(f"Persona {self.id}: Beliefs updated ({old_belief_count} → {len(self.beliefs)} beliefs)")

        except Exception as e:
            logger.debug(f"Persona {self.id}: Error updating beliefs - {e}")
            # Keep existing beliefs if update fails

    def _build_belief_update_context(self, knowledge_category: str) -> str:
        """
        Build a formatted context string for belief updates.

        Args:
            knowledge_category: The category of knowledge that was just updated

        Returns:
            Formatted context string for LLM
        """
        lines = []

        # Add full persona identity
        lines.append("=== YOUR IDENTITY ===")
        lines.append(self._format_full_identity())
        lines.append("")

        # Add current beliefs
        lines.append("=== CURRENT BELIEFS ===")
        if self.beliefs:
            for key, value in self.beliefs.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(No existing beliefs)")
        lines.append("")

        # Add the most recently updated knowledge
        lines.append(f"=== RECENTLY UPDATED: {knowledge_category.upper()} ===")

        if knowledge_category == "debate_knowledge":
            if self.debate_knowledge:
                # Show only the last entry
                lines.append(self.debate_knowledge[-1])
            else:
                lines.append("(No debate knowledge)")
        elif knowledge_category == "chats":
            if self.chats:
                # Show only the last chat
                lines.append(self._format_chat(self.chats[-1], max_messages=5))
            else:
                lines.append("(No chat history)")
        elif knowledge_category == "social_media_knowledge":
            if self.social_media_knowledge:
                # Show only the last social media knowledge
                lines.append(str(self.social_media_knowledge[-1]))
            else:
                lines.append("(No social media knowledge)")

        lines.append("")

        # Add summary of all knowledge for context
        lines.append("=== KNOWLEDGE SUMMARY ===")
        lines.append(f"Debate rounds consumed: {len(self.debate_knowledge)}")
        lines.append(f"Chats participated in: {len(self.chats)}")
        lines.append(f"Social media posts seen: {len(self.social_media_knowledge)}")
        lines.append(f"Posts made: {len(self.posts)}")

        return "\n".join(lines)
    
    def chat_with_peers(self, conversation_history: List[Dict[str, Any]], peer_id: str, peer_name: str) -> str:
        """
        Generate a chat message based on conversation history with a peer.

        Args:
            conversation_history: List of messages in the conversation so far
                                 Each message: {"speaker_id": str, "message": str}
            peer_id: The ID of the peer being chatted with
            peer_name: The name of the peer being chatted with

        Returns:
            The chat message as a string
        """

        # Build context for LLM
        context = self._build_chat_context(conversation_history, peer_id)

        # Create prompt for LLM
        prompt = f"""You are role-playing as a person in a conversation about recent debates and topics.

        {context}

        Based on your personality, beliefs, and the conversation so far, generate a natural, conversational response.
        Keep it brief (1-3 sentences). Be authentic to your character.

        Return ONLY the message text, no additional formatting or labels."""

        system_instruction = "You are generating authentic conversation responses for a person based on their personality and beliefs."

        response = llm_client.generate_response(
            self.llm_client,
            prompt,
            system_instruction
        )

        message = response.strip()

        # Store the conversation in chats
        chat_entry = ChatEntry(
            peer_id=peer_id,
            peer_name=peer_name,
            conversation=conversation_history + [{"speaker_id": self.id, "message": message}]
        )
        self.chats.append(chat_entry)
        logger.debug(f"Persona {self.id} chat message: {message}")

        return message

    def _build_chat_context(self, conversation_history: List[Dict[str, Any]], peer_id: str) -> str:
        """
        Build a formatted context string for chat generation.

        Args:
            conversation_history: List of messages in the conversation
            peer_id: The ID of the peer being chatted with

        Returns:
            Formatted context string for LLM
        """
        lines = []

        # Add full persona identity
        lines.append("=== YOUR IDENTITY ===")
        lines.append(self._format_full_identity())
        lines.append("")

        # Add current beliefs
        lines.append("=== YOUR BELIEFS ===")
        if self.beliefs:
            for key, value in self.beliefs.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(You haven't formed strong beliefs yet)")
        lines.append("")

        # Add recent debate knowledge
        if self.debate_knowledge:
            lines.append("=== RECENT DEBATE YOU WATCHED ===")
            lines.append(self.debate_knowledge[-1])
            lines.append("")

        # Add conversation history
        lines.append("=== CONVERSATION SO FAR ===")
        if conversation_history:
            for msg in conversation_history:
                speaker = "You" if msg["speaker_id"] == self.id else "Peer"
                lines.append(f"{speaker}: {msg['message']}")
        else:
            lines.append("(This is the start of the conversation)")
        lines.append("")

        lines.append(f"=== YOUR TURN ===")
        lines.append(f"You are chatting with peer {peer_id}. Respond naturally based on your beliefs and the conversation.")

        return "\n".join(lines)
    
    def create_social_media_post(self, existing_posts: List[Dict[str, Any]]) -> Optional[str]:
        """
        Generate a social media post based on persona's context and existing posts.

        Args:
            existing_posts: List of existing posts in the social media feed
                           Each post: {"persona_id": str, "content": str}

        Returns:
            The post content as a string, or None if generation fails
        """
        logger.debug(f"Persona {self.id}: Creating social media post (feed size: {len(existing_posts)})")

        # Build context for LLM
        context = self._build_post_context(existing_posts)

        # Create prompt for LLM
        prompt = f"""You are creating a social media post as this person.

{context}

Based on your personality, beliefs, recent experiences (debates, conversations), and the social media feed, create a brief social media post (1-2 sentences, max 280 characters).

The post should:
- Reflect your beliefs and personality
- Be authentic to your character
- Optionally respond to or reference recent posts in the feed
- Be conversational and natural

Return ONLY the post text, no hashtags, no additional formatting."""

        system_instruction = "You are generating authentic social media posts for a person based on their personality, beliefs, and context."

        try:
            logger.debug(f"Persona {self.id}: Generating social media post")
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            post_content = response.strip()

            # Limit to 280 characters
            if len(post_content) > 280:
                post_content = post_content[:277] + "..."

            # Store the post
            post = {
                "persona_id": self.id,
                "content": post_content
            }
            self.posts.append(post)

            post_id = f"{self.id}_{uuid.uuid4().hex[:8]}"
            logger.info(f"Persona {self.id}: Social media post created: '{post_content[:50]}...'")

            return Post(
                id=post_id,
                persona_id=self.id,
                content=post_content,
                likes=0,
                dislikes=0
            )

        except Exception as e:
            logger.debug(f"Persona {self.id}: Error generating social media post - {e}")
            return None

    def _build_post_context(self, existing_posts: List[Dict[str, Any]]) -> str:
        """
        Build a formatted context string for post generation.

        Args:
            existing_posts: List of existing posts in the social media feed

        Returns:
            Formatted context string for LLM
        """
        lines = []

        # Add full persona identity
        lines.append("=== YOUR IDENTITY ===")
        lines.append(self._format_full_identity())
        lines.append("")

        # Add current beliefs
        lines.append("=== YOUR BELIEFS ===")
        if self.beliefs:
            for key, value in self.beliefs.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(You haven't formed strong beliefs yet)")
        lines.append("")

        # Add recent debate knowledge
        if self.debate_knowledge:
            lines.append("=== RECENT DEBATE YOU WATCHED ===")
            lines.append(self.debate_knowledge[-1])
            lines.append("")

        # Add recent chats
        if self.chats:
            lines.append("=== RECENT CONVERSATION ===")
            lines.append(self._format_chat(self.chats[-1], max_messages=3))
            lines.append("")

        # Add social media feed
        lines.append("=== SOCIAL MEDIA FEED ===")
        if existing_posts:
            # Show last 5 posts
            for post in existing_posts[-5:]:
                lines.append(f"@{post.get('persona_id', 'Unknown')}: {post.get('content', '')}")
        else:
            lines.append("(No posts yet)")
        lines.append("")

        lines.append("=== YOUR TURN ===")
        lines.append("Create a post that reflects your personality and beliefs.")

        return "\n".join(lines)

    
    def react_to_post(self, post: Dict[str, Any]) -> Optional[str]:
        """
        Generate a reaction (thumbs_up or thumbs_down) to a social media post using LLM.

        Args:
            post: The post to react to
                  {"persona_id": str, "content": str, "likes": int, "dislikes": int}

        Returns:
            Reaction string: "thumbs_up" or "thumbs_down", or None if error
        """
        # Don't react to your own posts
        if post.get("persona_id") == self.id:
            return None

        logger.debug(f"Persona {self.id}: Reacting to post from {post.get('persona_id')}")

        # Build context for LLM
        context = self._build_reaction_context(post)

        # Create prompt for LLM
        prompt = f"""You are deciding how to react to a social media post.

{context}

Based on your beliefs, personality, and the post content, decide whether to give a thumbs up 👍 or thumbs down 👎.

Consider:
- Does this align with your beliefs?
- Does this resonate with your values?
- Current reactions: {post.get('likes', 0)} likes, {post.get('dislikes', 0)} dislikes

Respond with ONLY one of these exact words:
- thumbs_up
- thumbs_down"""

        system_instruction = "You are making authentic social media reactions based on a person's beliefs and personality."

        try:
            logger.debug(f"Persona {self.id}: Generating reaction to post")
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            reaction = response.strip().lower()

            # Validate reaction
            if reaction not in ["thumbs_up", "thumbs_down"]:
                # Try to extract valid reaction
                if "up" in reaction:
                    reaction = "thumbs_up"
                elif "down" in reaction:
                    reaction = "thumbs_down"
                else:
                    logger.debug(f"Persona {self.id}: Invalid reaction '{reaction}', skipping")
                    return None

            logger.debug(f"Persona {self.id}: Reaction generated: {reaction}")
            return reaction

        except Exception as e:
            logger.debug(f"Persona {self.id}: Error generating reaction - {e}")
            return None

    def _build_reaction_context(self, post: Dict[str, Any]) -> str:
        """
        Build a formatted context string for reaction generation.

        Args:
            post: The post to react to

        Returns:
            Formatted context string for LLM
        """
        lines = []

        # Add full persona identity
        lines.append("=== YOUR IDENTITY ===")
        lines.append(self._format_full_identity())
        lines.append("")

        # Add current beliefs
        lines.append("=== YOUR BELIEFS ===")
        if self.beliefs:
            for key, value in self.beliefs.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(You haven't formed strong beliefs yet)")
        lines.append("")

        # Add the post
        lines.append("=== POST TO REACT TO ===")
        lines.append(f"Author: @{post.get('persona_id', 'Unknown')}")
        lines.append(f"Content: {post.get('content', '')}")
        lines.append(f"Current reactions: {post.get('likes', 0)} 👍 / {post.get('dislikes', 0)} 👎")

        return "\n".join(lines)
    
    def vote(self, candidates: List[str]) -> str:
        """
        Vote for a candidate based on all accumulated knowledge and beliefs.

        Args:
            candidates: List of candidate IDs to choose from

        Returns:
            The chosen candidate ID
        """
        logger.debug(f"Persona {self.id}: Voting (candidates: {candidates})")

        if not candidates:
            return ""

        if len(candidates) == 1:
            return candidates[0]

        # Build context for LLM
        context = self._build_voting_context(candidates)

        # Create prompt for LLM
        prompt = f"""You are voting for a candidate in an election based on everything you've experienced.

{context}

Based on your beliefs, the debates you watched, conversations you had, and social media posts you've seen, choose which candidate to vote for.

You must vote for ONE of these candidates:
{', '.join(candidates)}

Consider:
- Which candidate aligns best with your beliefs?
- What did they say in the debates?
- How do their positions match your values?

Respond with ONLY the candidate ID, nothing else."""

        system_instruction = "You are making an authentic voting decision based on a person's complete experience and beliefs."

        try:
            logger.debug(f"Persona {self.id}: Calling LLM for voting decision")
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            chosen_candidate = response.strip()

            # Validate the choice
            if chosen_candidate in candidates:
                logger.info(f"Persona {self.id}: Voted for {chosen_candidate}")
                return chosen_candidate
            else:
                # Try to find a match
                for candidate in candidates:
                    if candidate.lower() in chosen_candidate.lower():
                        logger.info(f"Persona {self.id}: Voted for {candidate} (matched from '{chosen_candidate}')")
                        return candidate

                # Default to first candidate if no valid match
                logger.debug(f"Persona {self.id}: Invalid vote '{chosen_candidate}', defaulting to {candidates[0]}")
                return candidates[0]

        except Exception as e:
            logger.debug(f"Persona {self.id}: Error generating vote - {e}, defaulting to {candidates[0]}")
            return candidates[0]

    def _build_voting_context(self, candidates: List[str]) -> str:
        """
        Build a comprehensive context string for voting decision.

        Args:
            candidates: List of candidate IDs

        Returns:
            Formatted context string for LLM
        """
        lines = []

        # Add full persona identity
        lines.append("=== YOUR IDENTITY ===")
        lines.append(self._format_full_identity())
        lines.append("")

        # Add current beliefs - MOST IMPORTANT
        lines.append("=== YOUR BELIEFS ===")
        if self.beliefs:
            for key, value in self.beliefs.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(No strong beliefs formed yet)")
        lines.append("")

        # Add all debate knowledge
        lines.append("=== DEBATES YOU WATCHED ===")
        if self.debate_knowledge:
            for debate in self.debate_knowledge:
                lines.append(debate)
                lines.append("")
        else:
            lines.append("(No debates watched)")
            lines.append("")

        # Add chat conversations
        lines.append("=== YOUR CONVERSATIONS ===")
        if self.chats:
            for idx, chat in enumerate(self.chats[-5:], 1):  # Last 5 chats
                lines.append(f"Conversation {idx}:")
                lines.append(self._format_chat(chat, max_messages=3))
                lines.append("")
        else:
            lines.append("(No conversations)")
            lines.append("")

        # Add social media knowledge
        lines.append("=== SOCIAL MEDIA YOU'VE SEEN ===")
        if self.social_media_knowledge:
            for post in self.social_media_knowledge[-10:]:  # Last 10 posts
                lines.append(f"@{post.get('persona_id', 'Unknown')}: {post.get('content', '')}")
                lines.append(f"  [{post.get('likes', 0)} 👍 / {post.get('dislikes', 0)} 👎]")
        else:
            lines.append("(No social media seen)")
        lines.append("")

        # Add knowledge summary
        lines.append("=== YOUR EXPERIENCE SUMMARY ===")
        lines.append(f"Debates watched: {len(self.debate_knowledge)}")
        lines.append(f"Conversations: {len(self.chats)}")
        lines.append(f"Social media posts seen: {len(self.social_media_knowledge)}")
        lines.append(f"Posts you made: {len(self.posts)}")
        lines.append("")

        lines.append("=== CANDIDATES ===")
        lines.append(f"You must choose from: {', '.join(candidates)}")

        return "\n".join(lines)

    # ========== ASYNC VERSIONS FOR PARALLELIZATION ==========

    async def update_beliefs_async(
        self,
        knowledge_category: str = "debate_knowledge",
        max_change_percentage: float = 0.5
    ) -> None:
        """Async version of update_beliefs for parallel execution."""
        context = self._build_belief_update_context(knowledge_category)

        prompt = f"""You are updating the beliefs of a person based on new information they have received.

{context}

Based on all this information, please update the person's beliefs. You may slightly to moderately revise their beliefs, but you cannot change more than {int(max_change_percentage * 100)}% of their existing beliefs.

Return the updated beliefs as a JSON object with belief categories as keys and belief statements as values.

Example format:
{{
    "healthcare": "I believe in universal healthcare coverage",
    "economy": "I support progressive taxation",
    "climate": "Climate change requires immediate action"
}}

If the person has no existing beliefs, create initial beliefs based on their features and the knowledge they've consumed.

Return ONLY the JSON object, no additional text."""

        system_instruction = "You are a belief update system. You analyze information and update a person's beliefs accordingly, maintaining consistency and gradual change."

        try:
            response = await llm_client.generate_response_async(
                self.llm_client,
                prompt,
                system_instruction
            )

            response_clean = response.strip()
            if response_clean.startswith("```json"):
                response_clean = response_clean[7:]
            if response_clean.startswith("```"):
                response_clean = response_clean[3:]
            if response_clean.endswith("```"):
                response_clean = response_clean[:-3]

            updated_beliefs = json.loads(response_clean.strip())
            self.beliefs = updated_beliefs

        except Exception as e:
            logger.error(f"Error updating beliefs for {self.id}: {e}")

    async def chat_with_peers_async(self, conversation_history: List[Dict[str, Any]], peer_id: str) -> str:
        """Async version of chat_with_peers for parallel execution."""
        context = self._build_chat_context(conversation_history, peer_id)

        prompt = f"""You are role-playing as a person in a conversation about recent debates and topics.

{context}

Based on your personality, beliefs, and the conversation so far, generate a natural, conversational response.
Keep it brief (1-3 sentences). Be authentic to your character.

Return ONLY the message text, no additional formatting or labels."""

        system_instruction = "You are generating authentic conversation responses for a person based on their personality and beliefs."

        try:
            response = await llm_client.generate_response_async(
                self.llm_client,
                prompt,
                system_instruction
            )

            message = response.strip()

            chat_entry = {
                "peer_id": peer_id,
                "conversation": conversation_history + [{"speaker_id": self.id, "message": message}]
            }
            self.chats.append(chat_entry)

            return message

        except Exception as e:
            logger.error(f"Error generating chat message for {self.id}: {e}")
            return "I see what you mean."

    async def create_social_media_post_async(self, existing_posts: List[Dict[str, Any]]) -> Optional['Post']:
        """Async version of create_social_media_post for parallel execution."""
        context = self._build_post_context(existing_posts)

        prompt = f"""You are creating a social media post as this person.

{context}

Based on your personality, beliefs, recent experiences (debates, conversations), and the social media feed, create a brief social media post (1-2 sentences, max 280 characters).

The post should:
- Reflect your beliefs and personality
- Be authentic to your character
- Optionally respond to or reference recent posts in the feed
- Be conversational and natural

Return ONLY the post text, no hashtags, no additional formatting."""

        system_instruction = "You are generating authentic social media posts for a person based on their personality, beliefs, and context."

        try:
            response = await llm_client.generate_response_async(
                self.llm_client,
                prompt,
                system_instruction
            )

            post_content = response.strip()

            if len(post_content) > 280:
                post_content = post_content[:277] + "..."

            post = {
                "persona_id": self.id,
                "content": post_content
            }
            self.posts.append(post)

            post_id = f"{self.id}_{uuid.uuid4().hex[:8]}"

            return Post(
                id=post_id,
                persona_id=self.id,
                content=post_content,
                likes=0,
                dislikes=0
            )

        except Exception as e:
            logger.error(f"Error generating social media post for {self.id}: {e}")
            return None

    async def react_to_post_async(self, post: Dict[str, Any]) -> Optional[str]:
        """Async version of react_to_post for parallel execution."""
        if post.get("persona_id") == self.id:
            return None

        context = self._build_reaction_context(post)

        prompt = f"""You are deciding how to react to a social media post.

{context}

Based on your beliefs, personality, and the post content, decide whether to give a thumbs up 👍 or thumbs down 👎.

Consider:
- Does this align with your beliefs?
- Does this resonate with your values?
- Current reactions: {post.get('likes', 0)} likes, {post.get('dislikes', 0)} dislikes

Respond with ONLY one of these exact words:
- thumbs_up
- thumbs_down"""

        system_instruction = "You are making authentic social media reactions based on a person's beliefs and personality."

        try:
            response = await llm_client.generate_response_async(
                self.llm_client,
                prompt,
                system_instruction
            )

            reaction = response.strip().lower()

            if reaction not in ["thumbs_up", "thumbs_down"]:
                if "up" in reaction:
                    reaction = "thumbs_up"
                elif "down" in reaction:
                    reaction = "thumbs_down"
                else:
                    return None

            return reaction

        except Exception as e:
            logger.error(f"Error generating reaction for {self.id}: {e}")
            return None

    async def vote_async(self, candidates: List[str]) -> str:
        """Async version of vote for parallel execution."""
        if not candidates:
            return ""

        if len(candidates) == 1:
            return candidates[0]

        context = self._build_voting_context(candidates)

        prompt = f"""You are voting for a candidate in an election based on everything you've experienced.

{context}

Based on your beliefs, the debates you watched, conversations you had, and social media posts you've seen, choose which candidate to vote for.

You must vote for ONE of these candidates:
{', '.join(candidates)}

Consider:
- Which candidate aligns best with your beliefs?
- What did they say in the debates?
- How do their positions match your values?

Respond with ONLY the candidate ID, nothing else."""

        system_instruction = "You are making an authentic voting decision based on a person's complete experience and beliefs."

        try:
            response = await llm_client.generate_response_async(
                self.llm_client,
                prompt,
                system_instruction
            )

            chosen_candidate = response.strip()

            if chosen_candidate in candidates:
                return chosen_candidate
            else:
                for candidate in candidates:
                    if candidate.lower() in chosen_candidate.lower():
                        return candidate

                return candidates[0]

        except Exception as e:
            logger.error(f"Error generating vote for {self.id}: {e}")
            return candidates[0]