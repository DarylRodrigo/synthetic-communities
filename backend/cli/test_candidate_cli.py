#!/usr/bin/env python3
"""
Interactive CLI for testing the Candidate class.
Allows creating candidates, generating social media posts, and observing position changes.
"""

import sys
import os
import logging
from pathlib import Path
from typing import List, Optional
from dotenv import load_dotenv

# Add backend directory to path so we can import src modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.candidate import Candidate
from src.mediator import Topic
from src import llm_client

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(levelname)s - %(name)s - %(message)s'
)

# Default topics
DEFAULT_TOPICS = [
    Topic(
        id="climate",
        title="Climate Policy",
        description="Should governments implement carbon taxes to combat climate change?"
    ),
    Topic(
        id="healthcare",
        title="Healthcare Reform",
        description="Should the government provide universal healthcare coverage?"
    ),
    Topic(
        id="education",
        title="Education Funding",
        description="Should higher education be free and publicly funded?"
    )
]


class CandidateTesterCLI:
    def __init__(self):
        self.topics: List[Topic] = []
        self.candidate: Optional[Candidate] = None
        self.llm_client_instance = None

    def initialize_llm(self):
        """Initialize the LLM client."""
        print("\n🤖 Initializing LLM client...")
        try:
            # Try loading from both backend and root directories
            cli_dir = Path(__file__).parent
            backend_dir = cli_dir.parent
            root_dir = backend_dir.parent

            load_dotenv(backend_dir / '.env')
            load_dotenv(root_dir / '.env')

            api_key = os.getenv('GEMINI_API_KEY')
            if not api_key:
                print("✗ GEMINI_API_KEY not found in environment")
                print("  Please set GEMINI_API_KEY in your .env file")
                sys.exit(1)

            self.llm_client_instance = llm_client.create_client(api_key)
            print("✓ LLM client initialized successfully")
        except Exception as e:
            print(f"✗ Failed to initialize LLM client: {e}")
            sys.exit(1)

    def setup_topics(self):
        """Set up topics for the candidate."""
        print("\n📋 TOPIC SETUP")
        print("=" * 60)
        print("1. Use default topics")
        print("2. Create custom topics")

        choice = input("\nYour choice (1 or 2): ").strip()

        if choice == "1":
            self.topics = DEFAULT_TOPICS.copy()
            print("\n✓ Using default topics:")
            for i, topic in enumerate(self.topics, 1):
                print(f"  {i}. {topic.title}: {topic.description}")
        elif choice == "2":
            self.create_custom_topics()
        else:
            print("Invalid choice. Using default topics.")
            self.topics = DEFAULT_TOPICS.copy()

    def create_custom_topics(self):
        """Create custom topics interactively."""
        print("\n📝 Create custom topics (press Enter with empty title to finish)")

        while True:
            print("\n" + "-" * 60)
            title = input("Topic title (or press Enter to finish): ").strip()
            if not title:
                break

            description = input("Topic description: ").strip()
            if not description:
                print("Description cannot be empty. Skipping this topic.")
                continue

            topic_id = title.lower().replace(" ", "_")
            self.topics.append(Topic(id=topic_id, title=title, description=description))
            print(f"✓ Added topic: {title}")

        if not self.topics:
            print("\n⚠️  No topics created. Using default topics.")
            self.topics = DEFAULT_TOPICS.copy()

    def create_candidate(self):
        """Create a candidate with the configured topics."""
        print("\n👤 CANDIDATE CREATION")
        print("=" * 60)

        name = input("Enter candidate name (default: 'Test Candidate'): ").strip()
        if not name:
            name = "Test Candidate"

        candidate_id = name.lower().replace(" ", "_")

        print(f"\n🔄 Creating candidate '{name}' and initializing policy positions...")
        print("This will take a moment as the LLM generates initial positions...\n")

        try:
            self.candidate = Candidate(
                candidate_id=candidate_id,
                name=name,
                topics=self.topics,
                llm_client_instance=self.llm_client_instance
            )

            print(f"\n✓ Candidate '{name}' created successfully!")
            self.display_positions()

        except Exception as e:
            print(f"\n✗ Failed to create candidate: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    def display_positions(self):
        """Display current candidate positions."""
        if not self.candidate:
            print("No candidate created yet.")
            return

        print(f"\n📊 CURRENT POSITIONS FOR {self.candidate.name.upper()}")
        print("=" * 60)

        for topic in self.topics:
            position = self.candidate.state.policy_positions.get(topic.id, "No position")
            print(f"\n🏷️  {topic.title}")
            print(f"   Position: {position}")

    def generate_social_media_post(self) -> Optional[str]:
        """
        Generate a social media post using LLM.

        The format matches SocialMedia.get_feed() format:
        username [likes 👍 / dislikes 👎]: content
        """
        print("\n📱 GENERATE SOCIAL MEDIA POST")
        print("=" * 60)
        print("Describe the type of social media post you want to generate.")
        print("Example: 'Generate angry posts about climate change denialism'")
        print("Example: 'Create supportive posts about universal healthcare'")
        print("\nNote: Posts will be formatted as: username [likes 👍 / dislikes 👎]: content")

        prompt = input("\nYour prompt: ").strip()
        if not prompt:
            print("No prompt provided.")
            return None

        print("\n🔄 Generating social media post...")

        try:
            # Create a prompt for generating social media posts in the correct format
            full_prompt = f"""Generate a realistic social media feed with 3-5 posts from different users about the following topic:

{prompt}

IMPORTANT: Format each post EXACTLY like this:
username [X 👍 / Y 👎]: Post content here

Examples:
@climate_activist [15 👍 / 2 👎]: We need carbon taxes NOW! Our planet can't wait any longer.
@concerned_voter [8 👍 / 12 👎]: Universal healthcare sounds great but how will we pay for it?
@student2024 [23 👍 / 1 👎]: Free college education changed my life. Everyone deserves this opportunity!

Generate 3-5 posts following this EXACT format. Use realistic usernames, like/dislike counts, and authentic-sounding content."""

            system_instruction = "You are a social media content generator. Create realistic posts in the exact format specified: username [likes 👍 / dislikes 👎]: content"

            post = llm_client.generate_response(
                self.llm_client_instance,
                full_prompt,
                system_instruction
            )

            return post.strip()

        except Exception as e:
            print(f"✗ Failed to generate post: {e}")
            return None

    def preview_and_submit_post(self):
        """Generate, preview, and optionally submit a social media post."""
        post = self.generate_social_media_post()

        if not post:
            return

        print("\n📄 GENERATED POST PREVIEW")
        print("=" * 60)
        print(post)
        print("=" * 60)

        choice = input("\n✓ Submit this post? (y/n): ").strip().lower()

        if choice == 'y':
            print("\n🔄 Processing social media signals and updating positions...")
            print("This may take a moment...\n")

            # Store old positions for comparison
            old_positions = {
                topic.id: self.candidate.state.policy_positions[topic.id]
                for topic in self.topics
            }

            # Update positions based on social media
            self.candidate.read_social_media_signals(post)

            # Show changes
            print("\n🔄 POSITION CHANGES")
            print("=" * 60)

            changes_detected = False
            for topic in self.topics:
                old_pos = old_positions[topic.id]
                new_pos = self.candidate.state.policy_positions[topic.id]

                if old_pos != new_pos:
                    changes_detected = True
                    print(f"\n🏷️  {topic.title}")
                    print(f"   OLD: {old_pos}")
                    print(f"   NEW: {new_pos}")
                    print(f"   {'↑' if len(new_pos) > len(old_pos) else '↓'} Changed")
                else:
                    print(f"\n🏷️  {topic.title}")
                    print(f"   ➡️  No change")

            if not changes_detected:
                print("\n⚠️  No positions were changed by this social media post.")
            else:
                print("\n✓ Positions updated successfully!")
        else:
            print("Post discarded.")

    def main_loop(self):
        """Main interactive loop."""
        while True:
            print("\n" + "=" * 60)
            print("CANDIDATE TESTING CLI - MAIN MENU")
            print("=" * 60)
            print("1. View current positions")
            print("2. Generate and submit social media post")
            print("3. Create debate statement")
            print("4. View candidate memory")
            print("5. Start over (new candidate)")
            print("6. Exit")

            choice = input("\nYour choice: ").strip()

            if choice == "1":
                self.display_positions()
            elif choice == "2":
                self.preview_and_submit_post()
            elif choice == "3":
                self.create_debate_statement()
            elif choice == "4":
                self.view_memory()
            elif choice == "5":
                if input("\n⚠️  Start over? This will create a new candidate (y/n): ").lower() == 'y':
                    self.run()
                    break
            elif choice == "6":
                print("\n👋 Goodbye!")
                sys.exit(0)
            else:
                print("Invalid choice. Please try again.")

    def create_debate_statement(self):
        """Create a debate statement for a topic."""
        print("\n🎤 CREATE DEBATE STATEMENT")
        print("=" * 60)
        print("Select a topic:")

        for i, topic in enumerate(self.topics, 1):
            print(f"{i}. {topic.title}")

        choice = input("\nTopic number: ").strip()

        try:
            topic_idx = int(choice) - 1
            if topic_idx < 0 or topic_idx >= len(self.topics):
                print("Invalid topic number.")
                return

            topic = self.topics[topic_idx]

            print(f"\n🔄 Generating debate statement for '{topic.title}'...")

            statement = self.candidate.craft_debate_statement(
                topic=topic,
                turn_number=0,
                previous_statements=[]
            )

            print("\n💬 DEBATE STATEMENT")
            print("=" * 60)
            print(f"Candidate: {statement.candidate_name}")
            print(f"Topic: {statement.topic.title}")
            print(f"\nStatement:\n{statement.statement}")
            print("=" * 60)

        except ValueError:
            print("Invalid input. Please enter a number.")
        except Exception as e:
            print(f"Error generating statement: {e}")

    def view_memory(self):
        """Display candidate's memory."""
        print("\n🧠 CANDIDATE MEMORY")
        print("=" * 60)

        if not self.candidate.state.memory:
            print("(empty)")
        else:
            print(self.candidate.state.memory)

        print("=" * 60)

    def run(self):
        """Run the CLI application."""
        print("\n" + "=" * 60)
        print("🎯 CANDIDATE TESTER CLI")
        print("=" * 60)
        print("Test how social media influences candidate policy positions!")

        self.initialize_llm()
        self.setup_topics()
        self.create_candidate()
        self.main_loop()


def main():
    try:
        cli = CandidateTesterCLI()
        cli.run()
    except KeyboardInterrupt:
        print("\n\n👋 Interrupted by user. Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
