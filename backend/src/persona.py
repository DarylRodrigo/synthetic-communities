from typing import Dict, List, Any, Optional
from dotenv import load_dotenv
import os
import sys
from . import llm_client

class Persona:
    def __init__(self, persona_id: str):
        self.id = persona_id
        self.features = {}  # Dict of persona features/characteristics
        self.debate_knowledge = []  # List of debate transcript strings
        self.chats = []  # List of chat conversations
        self.social_media_knowledge = []  # List of social media posts seen
        self.posts = []  # List of posts made by this persona
        self.beliefs = {}  # Dict of current beliefs

        # Initialize LLM client for persona
        load_dotenv()
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")
        self.llm_client = llm_client.create_client(api_key)
    
    def consume_debate_content(self, debate_transcript: Dict[str, Any]) -> None:
        """
        Process and store new debate content, comparing against previous knowledge.

        Args:
            debate_transcript: A DebateTranscript object containing statements from the debate
        """
        # Convert debate transcript to string representation
        transcript_str = self._format_debate_transcript(debate_transcript)

        # If there's previous debate knowledge, compare and extract only new content
        if self.debate_knowledge:
            last_transcript = self.debate_knowledge[-1]
            # Remove the round prefix to get the actual content for comparison
            last_content = last_transcript.split(']', 1)[1] if ']' in last_transcript else last_transcript

            # If the new transcript contains the previous content, extract only what's new
            if last_content.strip() and transcript_str.startswith(last_content.strip()):
                transcript_str = transcript_str[len(last_content.strip()):].strip()

        # Determine the round number based on current list length
        round_number = len(self.debate_knowledge) + 1

        # Prepend the round indicator and append to debate knowledge
        formatted_transcript = f"[round {round_number} debate transcript] {transcript_str}"
        self.debate_knowledge.append(formatted_transcript)

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
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            # Parse the JSON response
            import json
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
            self.beliefs = updated_beliefs

        except Exception as e:
            print(f"Error updating beliefs: {e}")
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

        # Add persona features
        lines.append("=== PERSONA FEATURES ===")
        if self.features:
            for key, value in self.features.items():
                lines.append(f"{key}: {value}")
        else:
            lines.append("(No features defined)")
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
                lines.append(str(self.chats[-1]))
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
    
    def chat_with_peers(self, conversation_history: List[Dict[str, Any]], peer_id: str) -> str:
        """
        Generate a chat message based on conversation history with a peer.

        Args:
            conversation_history: List of messages in the conversation so far
                                 Each message: {"speaker_id": str, "message": str}
            peer_id: The ID of the peer being chatted with

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

        try:
            response = llm_client.generate_response(
                self.llm_client,
                prompt,
                system_instruction
            )

            message = response.strip()

            # Store the conversation in chats
            chat_entry = {
                "peer_id": peer_id,
                "conversation": conversation_history + [{"speaker_id": self.id, "message": message}]
            }
            self.chats.append(chat_entry)

            return message

        except Exception as e:
            print(f"Error generating chat message: {e}")
            return "I see what you mean."

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

        # Add persona info
        lines.append("=== YOUR IDENTITY ===")
        lines.append(f"ID: {self.id}")
        if self.features:
            for key, value in list(self.features.items())[:5]:  # Show first 5 features
                lines.append(f"{key}: {value}")
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
    
    def create_social_media_post(self) -> Optional[Dict[str, Any]]:
        return "Random Post"
    
    def react_to_post(self, post: Dict[str, Any]) -> Optional[str]:
        return None
    
    def vote(self, candidates: List[str]) -> str:
        return candidates[0] if candidates else ""