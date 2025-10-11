#!/usr/bin/env python3
"""
Interactive CLI for testing the Mediator class.
Allows testing how mediator builds contextual awareness from social media and
previous debates, and how this influences topic introductions.
"""

import sys
import os
import logging
from pathlib import Path
from typing import List, Optional, Dict
from datetime import datetime
from dotenv import load_dotenv

# Add backend directory to path so we can import src modules
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from src.mediator import Mediator, Topic, Question, DebateTranscript, CandidateStatement, MediatorStatement
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
    )
]


class MediatorTesterCLI:
    def __init__(self):
        self.topics: List[Topic] = []
        self.mediator: Optional[Mediator] = None
        self.llm_client_instance = None
        self.previous_transcripts: List[DebateTranscript] = []
        self.introduction_history: List[Dict] = []

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
        """Set up topics for the mediator."""
        print("\n📋 TOPIC SETUP")
        print("=" * 60)
        print("1. Use default topics")
        print("2. Create custom topics")

        choice = input("\nYour choice (1 or 2): ").strip().rstrip('.')

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

    def create_mediator(self):
        """Create a mediator with the configured topics."""
        print("\n🎙️  MEDIATOR CREATION")
        print("=" * 60)

        mediator_id = "test_mediator"
        name = "Debate Moderator"

        print(f"\n🔄 Creating mediator '{name}'...")

        try:
            self.mediator = Mediator(
                mediator_id=mediator_id,
                topics=self.topics,
                llm_client_instance=self.llm_client_instance
            )

            print(f"\n✓ Mediator created successfully!")
            print(f"   ID: {self.mediator.id}")
            print(f"   Topics: {len(self.topics)}")
            print(f"   Memory: (empty)")

        except Exception as e:
            print(f"\n✗ Failed to create mediator: {e}")
            import traceback
            traceback.print_exc()
            sys.exit(1)

    def display_memory(self):
        """Display current mediator memory."""
        if not self.mediator:
            print("No mediator created yet.")
            return

        print(f"\n🧠 MEDIATOR MEMORY")
        print("=" * 60)

        if not self.mediator.state.memory:
            print("(empty)")
        else:
            print(self.mediator.state.memory)

        print("=" * 60)
        print(f"Total memory length: {len(self.mediator.state.memory)} characters")

    def show_memory_delta(self, before: str, after: str):
        """Show what was added to memory."""
        if before == after:
            print("\n⚠️  No memory changes detected.")
            return

        new_content = after[len(before):]
        print("\n📝 NEW MEMORY ADDED:")
        print("-" * 60)
        print(new_content.strip())
        print("-" * 60)

    def generate_social_media_feed(self) -> Optional[str]:
        """Generate a social media feed using LLM."""
        print("\n📱 GENERATE SOCIAL MEDIA FEED")
        print("=" * 60)
        print("Describe the type of social media posts you want to generate.")
        print("Example: 'Generate concerned posts about rising healthcare costs'")
        print("Example: 'Create optimistic posts about climate action progress'")

        prompt = input("\nYour prompt: ").strip()
        if not prompt:
            print("No prompt provided.")
            return None

        print("\n🔄 Generating social media feed...")

        try:
            full_prompt = f"""Generate a realistic social media feed with 3-5 posts from different users about the following:

{prompt}

IMPORTANT: Format each post EXACTLY like this:
username [X 👍 / Y 👎]: Post content here

Examples:
@climate_warrior [25 👍 / 3 👎]: We're seeing real progress on renewable energy! Keep pushing forward.
@voter_jane [12 👍 / 8 👎]: Healthcare costs are crushing families. We need systemic change now.
@professor_smith [31 👍 / 2 👎]: Free college opened doors for my students. Education is a right!

Generate 3-5 posts following this EXACT format. Use realistic usernames, like/dislike counts, and authentic-sounding content."""

            system_instruction = "You are a social media content generator. Create realistic posts in the exact format specified: username [likes 👍 / dislikes 👎]: content"

            feed = llm_client.generate_response(
                self.llm_client_instance,
                full_prompt,
                system_instruction
            )

            return feed.strip()

        except Exception as e:
            print(f"✗ Failed to generate feed: {e}")
            return None

    def preview_and_submit_social_media(self):
        """Generate, preview, and optionally submit social media feed."""
        feed = self.generate_social_media_feed()

        if not feed:
            return

        print("\n📄 GENERATED FEED PREVIEW")
        print("=" * 60)
        print(feed)
        print("=" * 60)

        choice = input("\n✓ Submit this feed to mediator? (y/n): ").strip().lower()

        if choice == 'y':
            print("\n🔄 Mediator analyzing social media signals...")
            print("This may take a moment...\n")

            # Store memory before
            before_memory = self.mediator.state.memory

            # Submit to mediator
            self.mediator.read_social_media_signals(feed)

            # Show what changed
            after_memory = self.mediator.state.memory
            self.show_memory_delta(before_memory, after_memory)

            print("\n✓ Social media analysis complete!")
        else:
            print("Feed discarded.")

    def get_example_debates(self) -> Dict[str, DebateTranscript]:
        """Get pre-built example debates for quick testing."""
        examples = {}

        # Example 1: Progressive climate debate
        climate_topic = next((t for t in self.topics if "climate" in t.id.lower()), self.topics[0])
        climate_q1 = Question(
            id="climate_q1",
            text="Should carbon taxes be the primary tool to combat climate change?",
            topic=climate_topic
        )
        examples["climate_progressive"] = DebateTranscript(
            statements=[
                MediatorStatement("mediator", "Welcome to our climate policy debate.", climate_q1),
                CandidateStatement("c1", "Alice", "We must implement carbon taxes immediately. The science is clear - we're running out of time to prevent catastrophic climate change. A carbon tax will incentivize clean energy and fund adaptation measures.", climate_q1),
                CandidateStatement("c2", "Bob", "I agree climate action is urgent. My plan includes aggressive renewable energy subsidies and binding emissions targets. We can't afford half-measures anymore.", climate_q1)
            ],
            mediator_id="mediator",
            epoch=0,
            topic_index=0,
            question_index=0,
            topic=climate_topic,
            question=climate_q1
        )

        # Example 2: Conservative healthcare debate
        healthcare_topic = next((t for t in self.topics if "health" in t.id.lower()), self.topics[0])
        healthcare_q1 = Question(
            id="healthcare_q1",
            text="Is universal healthcare fiscally responsible?",
            topic=healthcare_topic
        )
        examples["healthcare_conservative"] = DebateTranscript(
            statements=[
                MediatorStatement("mediator", "Let's discuss healthcare reform.", healthcare_q1),
                CandidateStatement("c1", "Alice", "Universal healthcare sounds appealing, but it's fiscally irresponsible. We should focus on market-based solutions that preserve choice and competition.", healthcare_q1),
                CandidateStatement("c2", "Bob", "I share concerns about government overreach. Let's expand health savings accounts and allow insurance competition across state lines instead.", healthcare_q1)
            ],
            mediator_id="mediator",
            epoch=0,
            topic_index=0,
            question_index=0,
            topic=healthcare_topic,
            question=healthcare_q1
        )

        # Example 3: Mixed education debate
        edu_topic = next((t for t in self.topics if "edu" in t.id.lower()), self.topics[0])
        edu_q1 = Question(
            id="edu_q1",
            text="Should higher education be free and publicly funded?",
            topic=edu_topic
        )
        examples["education_mixed"] = DebateTranscript(
            statements=[
                MediatorStatement("mediator", "Today we're debating education funding.", edu_q1),
                CandidateStatement("c1", "Alice", "Free college is an investment in our future. Countries with free higher education see stronger economic growth and more social mobility.", edu_q1),
                CandidateStatement("c2", "Bob", "While education is important, free college is regressive - it benefits those who'd succeed anyway. Let's focus on K-12 improvements and targeted scholarships for low-income students.", edu_q1)
            ],
            mediator_id="mediator",
            epoch=1,
            topic_index=0,
            question_index=0,
            topic=edu_topic,
            question=edu_q1
        )

        return examples

    def create_mock_debate(self):
        """Create a mock previous debate."""
        print("\n🎭 CREATE MOCK PREVIOUS DEBATE")
        print("=" * 60)
        print("1. Use example debate (quick)")
        print("2. Generate custom debate from description (uses LLM)")

        choice = input("\nYour choice (1 or 2): ").strip()

        if choice == "1":
            self.select_example_debate()
        elif choice == "2":
            self.generate_custom_debate()
        else:
            print("Invalid choice.")

    def select_example_debate(self):
        """Select and add an example debate."""
        examples = self.get_example_debates()

        print("\n📚 AVAILABLE EXAMPLE DEBATES:")
        print("=" * 60)
        example_list = list(examples.items())
        for i, (key, transcript) in enumerate(example_list, 1):
            print(f"\n{i}. {key.replace('_', ' ').title()}")
            print(f"   Topic: {transcript.topic.title}")
            print(f"   Statements: {len([s for s in transcript.statements if isinstance(s, CandidateStatement)])} candidates")

        choice = input("\nSelect debate number: ").strip()

        try:
            idx = int(choice) - 1
            if idx < 0 or idx >= len(example_list):
                print("Invalid selection.")
                return

            key, transcript = example_list[idx]
            self.previous_transcripts.append(transcript)

            print(f"\n✓ Added '{key}' to previous debates")
            print(f"   Total previous debates: {len(self.previous_transcripts)}")

            # Preview
            print("\n📄 DEBATE PREVIEW:")
            print("-" * 60)
            for stmt in transcript.statements:
                if isinstance(stmt, CandidateStatement):
                    print(f"{stmt.candidate_name}: {stmt.statement[:80]}...")
            print("-" * 60)

        except (ValueError, IndexError):
            print("Invalid input.")

    def generate_custom_debate(self):
        """Generate a custom debate using LLM."""
        print("\n📝 GENERATE CUSTOM DEBATE")
        print("=" * 60)

        # Select topic
        print("Select topic for this debate:")
        for i, topic in enumerate(self.topics, 1):
            print(f"{i}. {topic.title}")

        choice = input("\nTopic number: ").strip()

        try:
            topic_idx = int(choice) - 1
            if topic_idx < 0 or topic_idx >= len(self.topics):
                print("Invalid topic number.")
                return

            topic = self.topics[topic_idx]

            print(f"\nDescribe the debate scenario:")
            print("Example: 'Two candidates arguing for strong climate action'")
            print("Example: 'Conservative vs progressive debate on healthcare'")
            description = input("\nDescription: ").strip()

            if not description:
                print("No description provided.")
                return

            print("\n🔄 Generating debate...")

            # Generate debate using LLM
            full_prompt = f"""Generate a realistic political debate with 2-3 candidate statements on the topic: {topic.title}

Topic Description: {topic.description}
Scenario: {description}

For each candidate, generate ONE substantive debate statement (2-3 sentences).
Format your response exactly like this:

CANDIDATE Alice:
[statement here]

CANDIDATE Bob:
[statement here]

Make the statements realistic, substantive, and reflective of the scenario described."""

            system_instruction = "You are generating realistic political debate statements. Follow the exact format specified."

            response = llm_client.generate_response(
                self.llm_client_instance,
                full_prompt,
                system_instruction
            )

            # Create question for this debate
            question = Question(
                id=f"{topic.id}_custom_{len(self.previous_transcripts)}",
                text=f"Question about {topic.title}: {description[:50]}...",
                topic=topic
            )

            # Parse response into candidate statements
            statements = [MediatorStatement("mediator", f"Debate on {topic.title}", question)]

            # Simple parsing - split by "CANDIDATE"
            parts = response.split("CANDIDATE")[1:]  # Skip first empty part
            for i, part in enumerate(parts):
                lines = part.strip().split('\n', 1)
                if len(lines) >= 2:
                    name = lines[0].strip(':').strip()
                    statement = lines[1].strip()
                    statements.append(CandidateStatement(
                        f"c{i+1}",
                        name,
                        statement,
                        question
                    ))

            # Create transcript
            transcript = DebateTranscript(
                statements=statements,
                mediator_id="mediator",
                epoch=len(self.previous_transcripts),
                topic_index=0,
                question_index=0,
                topic=topic,
                question=question
            )

            self.previous_transcripts.append(transcript)

            print(f"\n✓ Generated and added custom debate")
            print(f"   Total previous debates: {len(self.previous_transcripts)}")

            # Preview
            print("\n📄 DEBATE PREVIEW:")
            print("-" * 60)
            for stmt in statements:
                if isinstance(stmt, CandidateStatement):
                    print(f"{stmt.candidate_name}: {stmt.statement[:80]}...")
            print("-" * 60)

        except (ValueError, Exception) as e:
            print(f"Error generating debate: {e}")

    def preview_and_submit_debates(self):
        """Submit previous debates for analysis."""
        if not self.previous_transcripts:
            print("\n⚠️  No previous debates created yet.")
            print("   Use option 3 to create mock debates first.")
            return

        print(f"\n🔄 Analyzing {len(self.previous_transcripts)} previous debate(s)...")
        print("This may take a moment...\n")

        # Store memory before
        before_memory = self.mediator.state.memory

        # Submit to mediator
        self.mediator.read_previous_debates(self.previous_transcripts)

        # Show what changed
        after_memory = self.mediator.state.memory
        self.show_memory_delta(before_memory, after_memory)

        print("\n✓ Analysis complete!")

    def propose_and_introduce_question(self):
        """Propose a question for a topic, then introduce it."""
        print("\n❓ PROPOSE & INTRODUCE QUESTION")
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

            print(f"\n🔄 Mediator proposing question for '{topic.title}'...")
            print("(Using context from previous debates and social media)\n")

            # Mediator proposes question (context-aware)
            question = self.mediator.propose_question(
                topic=topic,
                previous_transcripts=self.previous_transcripts
            )

            print(f"📋 PROPOSED QUESTION")
            print("=" * 60)
            print(f"{question.text}")
            print("=" * 60)

            print(f"\n🔄 Mediator introducing question...")

            # Mediator introduces question
            introduction = self.mediator.introduce_question(question)

            print(f"\n💬 QUESTION INTRODUCTION")
            print("=" * 60)
            print(f"Topic: {topic.title}")
            print(f"Question: {question.text}")
            print(f"\nIntroduction:\n{introduction}")
            print("=" * 60)

            # Save to history
            self.introduction_history.append({
                "topic": topic.title,
                "question": question.text,
                "introduction": introduction,
                "memory_snapshot": self.mediator.state.memory,
                "timestamp": datetime.now()
            })

            print(f"\n✓ Saved to history (total: {len(self.introduction_history)})")

        except (ValueError, Exception) as e:
            print(f"Error: {e}")

    def compare_introductions(self):
        """Compare introduction history to see evolution."""
        if not self.introduction_history:
            print("\n⚠️  No history yet.")
            print("   Use option 5 to propose & introduce questions first.")
            return

        print(f"\n📊 INTRODUCTION HISTORY ({len(self.introduction_history)} total)")
        print("=" * 60)

        for i, entry in enumerate(self.introduction_history, 1):
            print(f"\n{'=' * 60}")
            print(f"ENTRY #{i}")
            print(f"Topic: {entry['topic']}")
            print(f"Question: {entry.get('question', 'N/A')}")
            print(f"Generated: {entry['timestamp'].strftime('%H:%M:%S')}")
            print(f"Memory length: {len(entry['memory_snapshot'])} chars")
            print(f"\nIntroduction:")
            print(entry['introduction'])

        print(f"\n{'=' * 60}")
        print("\n💡 Notice how introductions evolve as the mediator gains more context!")

    def clear_memory(self):
        """Clear mediator memory."""
        print("\n🗑️  CLEAR MEMORY")
        print("=" * 60)
        print("This will reset the mediator's memory but keep previous debates.")
        choice = input("\n⚠️  Are you sure? (y/n): ").strip().lower()

        if choice == 'y':
            self.mediator.state.memory = ""
            print("\n✓ Memory cleared")
        else:
            print("Cancelled.")

    def clear_all(self):
        """Clear everything."""
        print("\n🗑️  CLEAR ALL")
        print("=" * 60)
        print("This will reset memory, previous debates, and introduction history.")
        choice = input("\n⚠️  Are you sure? (y/n): ").strip().lower()

        if choice == 'y':
            self.mediator.state.memory = ""
            self.previous_transcripts = []
            self.introduction_history = []
            print("\n✓ Everything cleared - fresh start!")
        else:
            print("Cancelled.")

    def main_loop(self):
        """Main interactive loop."""
        while True:
            print("\n" + "=" * 60)
            print("MEDIATOR TESTING CLI - MAIN MENU")
            print("=" * 60)
            print("1. View memory")
            print("2. Submit social media")
            print("3. Create mock debate")
            print("4. Submit debates for analysis")
            print("5. Propose & introduce question")
            print("6. View history")
            print("7. Clear memory")
            print("8. Clear all")
            print("9. Start over")
            print("10. Exit")

            choice = input("\nYour choice: ").strip()

            if choice == "1":
                self.display_memory()
            elif choice == "2":
                self.preview_and_submit_social_media()
            elif choice == "3":
                self.create_mock_debate()
            elif choice == "4":
                self.preview_and_submit_debates()
            elif choice == "5":
                self.propose_and_introduce_question()
            elif choice == "6":
                self.compare_introductions()
            elif choice == "7":
                self.clear_memory()
            elif choice == "8":
                self.clear_all()
            elif choice == "9":
                if input("\n⚠️  Start over? (y/n): ").lower() == 'y':
                    self.run()
                    break
            elif choice == "10":
                print("\n👋 Goodbye!")
                sys.exit(0)
            else:
                print("Invalid choice.")

    def run(self):
        """Run the CLI application."""
        print("\n" + "=" * 60)
        print("🎙️  MEDIATOR TESTER CLI")
        print("=" * 60)
        print("Test how mediator builds contextual awareness and influences introductions!")

        self.initialize_llm()
        self.setup_topics()
        self.create_mediator()
        self.main_loop()


def main():
    try:
        cli = MediatorTesterCLI()
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
