#!/usr/bin/env python3
"""
CLI testing tool for Persona class.
Tests various Persona methods interactively.
"""

import sys
import os

# Add parent directory to path to import from src
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.persona import Persona


def test_consume_debate(persona):
    """Test the consume_debate_content method."""
    print("\n" + "-" * 60)
    print("TEST: consume_debate_content")
    print("-" * 60)
    print()

    debate_count = 0

    while True:
        debate_count += 1
        print(f"\n[Debate #{debate_count}]")
        print("Enter debate transcript (multi-line, type 'END' on a new line to finish):")
        print("(or type 'stop' to quit)")

        lines = []
        while True:
            try:
                line = input()
                if line.strip().lower() == 'stop':
                    debate_count -= 1
                    break
                if line.strip() == 'END':
                    break
                lines.append(line)
            except EOFError:
                break

        if not lines or (len(lines) == 1 and lines[0].strip().lower() == 'stop'):
            break

        debate_transcript = "\n".join(lines)

        # Create a mock debate transcript object
        class MockTopic:
            def __init__(self):
                self.title = "Test Topic"
                self.description = "Test Description"

        class MockStatement:
            def __init__(self, text):
                # Store as raw text - no speaker prefix needed for testing
                self.raw_text = text

        class MockDebateTranscript:
            def __init__(self, content):
                self.topic = MockTopic()
                # Create a single statement with the debate content
                self.statements = [MockStatement(content)]

        mock_transcript = MockDebateTranscript(debate_transcript)

        # Call consume_debate_content
        try:
            persona.consume_debate_content(mock_transcript)
            print(f"✓ Debate #{debate_count} consumed successfully")
        except Exception as e:
            print(f"✗ Error consuming debate: {e}")
            import traceback
            traceback.print_exc()

    # Output the debate knowledge
    print("\nself.debate_knowledge:")
    print("=" * 60)

    for knowledge in persona.debate_knowledge:
        print(knowledge)
        print()


def test_load_persona_features():
    """Test loading and displaying persona features from personas.jsonl."""
    print("\n" + "-" * 60)
    print("TEST: Load Persona Features")
    print("-" * 60)
    print()

    # Ask for persona ID
    persona_id = input("Enter persona ID (or press Enter for default): ").strip()
    if not persona_id:
        persona_id = "e2b58b68-ef7e-436f-9ade-1ee0c11bcbb2"  # Default from your selection

    print(f"\nSearching for persona ID: {persona_id}")

    # Load from personas.jsonl
    import json
    personas_file = os.path.join(os.path.dirname(__file__), '..', '..', 'personas.jsonl')

    try:
        with open(personas_file, 'r') as f:
            for line in f:
                persona_data = json.loads(line.strip())
                if persona_data.get('id') == persona_id:
                    print("✓ Persona found!")
                    print()
                    print("=" * 60)
                    print("PERSONA FEATURES")
                    print("=" * 60)
                    print(json.dumps(persona_data, indent=2))
                    return

        print(f"✗ Persona with ID '{persona_id}' not found in personas.jsonl")

    except FileNotFoundError:
        print(f"✗ File not found: {personas_file}")
    except Exception as e:
        print(f"✗ Error loading persona: {e}")
        import traceback
        traceback.print_exc()


def test_display_persona_state(persona):
    """Display all internal state of a persona instance."""
    print("\n" + "-" * 60)
    print("TEST: Display Persona State")
    print("-" * 60)
    print()

    print("=" * 60)
    print("PERSONA INTERNAL STATE")
    print("=" * 60)
    print()

    # Display ID
    print("ID:")
    print(f"  {persona.id}")
    print()

    # Display features
    print("features:")
    if persona.features:
        import json
        print(json.dumps(persona.features, indent=2))
    else:
        print("  {}")
    print()

    # Display debate_knowledge
    print("debate_knowledge:")
    if persona.debate_knowledge:
        for idx, knowledge in enumerate(persona.debate_knowledge, 1):
            print(f"  [{idx}] {knowledge}")
    else:
        print("  []")
    print()

    # Display chats
    print("chats:")
    if persona.chats:
        import json
        print(json.dumps(persona.chats, indent=2))
    else:
        print("  []")
    print()

    # Display social_media_knowledge
    print("social_media_knowledge:")
    if persona.social_media_knowledge:
        import json
        print(json.dumps(persona.social_media_knowledge, indent=2))
    else:
        print("  []")
    print()

    # Display posts
    print("posts:")
    if persona.posts:
        import json
        print(json.dumps(persona.posts, indent=2))
    else:
        print("  []")
    print()

    # Display beliefs
    print("beliefs:")
    if persona.beliefs:
        import json
        print(json.dumps(persona.beliefs, indent=2))
    else:
        print("  {}")
    print()


def test_update_beliefs(persona):
    """Test the update_beliefs method."""
    print("\n" + "-" * 60)
    print("TEST: update_beliefs")
    print("-" * 60)
    print()

    # First, let's set up some persona features and knowledge
    print("Setting up test data...")

    # Add some features
    persona.features = {
        "age": "35",
        "occupation": "Teacher",
        "education": "Master's degree",
        "political_leaning": "Moderate"
    }

    # Add some debate knowledge
    class MockTopic:
        def __init__(self):
            self.title = "Healthcare Policy"
            self.description = "Discussion on healthcare reform"

    class MockStatement:
        def __init__(self, text):
            self.raw_text = text

    class MockDebateTranscript:
        def __init__(self, content):
            self.topic = MockTopic()
            self.statements = [MockStatement(content)]

    debate_content = """Candidate A: We need universal healthcare for all citizens
Candidate B: Private healthcare provides better quality and choice
Moderator: Both systems have merits and drawbacks"""

    mock_transcript = MockDebateTranscript(debate_content)
    persona.consume_debate_content(mock_transcript)

    print("✓ Test data set up")
    print()

    # Ask if user wants to set initial beliefs
    set_beliefs = input("Do you want to set initial beliefs? (y/n, default n): ").strip().lower()

    if set_beliefs == 'y':
        print("\nEnter initial beliefs as JSON (e.g., {\"healthcare\": \"I support universal coverage\"})")
        print("Or enter beliefs one by one. Type 'done' when finished.")
        print()

        beliefs_input = input("Enter JSON or type 'manual' for one-by-one entry: ").strip()

        if beliefs_input.lower() == 'manual':
            # Manual entry mode
            beliefs = {}
            while True:
                key = input("Enter belief category (or 'done' to finish): ").strip()
                if key.lower() == 'done':
                    break
                value = input(f"Enter belief for '{key}': ").strip()
                beliefs[key] = value
            persona.beliefs = beliefs
        else:
            # JSON mode
            try:
                import json
                persona.beliefs = json.loads(beliefs_input)
                print("✓ Initial beliefs set")
            except Exception as e:
                print(f"✗ Error parsing JSON: {e}")
                print("Continuing with empty beliefs...")

    # Show initial state
    print("\nInitial beliefs:")
    if persona.beliefs:
        import json
        print(json.dumps(persona.beliefs, indent=2))
    else:
        print("(None)")
    print()

    # Loop until user says stop
    while True:
        # Get max_change_percentage from user
        max_change_input = input("Enter max_change_percentage (0.0-1.0, default 0.5): ").strip()
        max_change = float(max_change_input) if max_change_input else 0.5

        # Call update_beliefs
        print(f"\nCalling update_beliefs(knowledge_category='debate_knowledge', max_change_percentage={max_change})...")
        print("(This will call the LLM, please wait...)")
        print()

        try:
            persona.update_beliefs(
                knowledge_category="debate_knowledge",
                max_change_percentage=max_change
            )
            print("✓ Beliefs updated successfully")
        except Exception as e:
            print(f"✗ Error updating beliefs: {e}")
            import traceback
            traceback.print_exc()

        # Display updated beliefs
        print()
        print("=" * 60)
        print("self.beliefs:")
        print("=" * 60)
        if persona.beliefs:
            import json
            print(json.dumps(persona.beliefs, indent=2))
        else:
            print("(No beliefs)")
        print()

        # Ask if user wants to continue
        continue_test = input("Update beliefs again? (y/n, or 'stop' to quit): ").strip().lower()
        if continue_test in ['n', 'stop']:
            break
        print()


def test_chat_with_peers():
    """Test the chat_with_peers functionality with two personas."""
    print("\n" + "-" * 60)
    print("TEST: chat_with_peers")
    print("-" * 60)
    print()

    # Ask for two persona IDs
    print("Enter two persona IDs to chat with each other")
    persona_id_a = input("Persona A ID (or press Enter for default): ").strip()
    if not persona_id_a:
        persona_id_a = "e2b58b68-ef7e-436f-9ade-1ee0c11bcbb2"

    persona_id_b = input("Persona B ID (or press Enter for default): ").strip()
    if not persona_id_b:
        persona_id_b = "76c9f08d-e6fa-4c67-9ba4-044ba4168d99"

    print(f"\nLoading personas from personas.jsonl...")

    # Load personas from file
    import json
    personas_file = os.path.join(os.path.dirname(__file__), '..', '..', 'personas.jsonl')

    persona_a_data = None
    persona_b_data = None

    try:
        with open(personas_file, 'r') as f:
            for line in f:
                persona_data = json.loads(line.strip())
                if persona_data.get('id') == persona_id_a:
                    persona_a_data = persona_data
                if persona_data.get('id') == persona_id_b:
                    persona_b_data = persona_data
                if persona_a_data and persona_b_data:
                    break

        if not persona_a_data:
            print(f"✗ Persona A with ID '{persona_id_a}' not found")
            return
        if not persona_b_data:
            print(f"✗ Persona B with ID '{persona_id_b}' not found")
            return

        print("✓ Both personas found")
        print(f"  Persona A: {persona_a_data.get('name', 'Unknown')} ({persona_a_data.get('job', 'Unknown')})")
        print(f"  Persona B: {persona_b_data.get('name', 'Unknown')} ({persona_b_data.get('job', 'Unknown')})")
        print()

    except FileNotFoundError:
        print(f"✗ File not found: {personas_file}")
        return
    except Exception as e:
        print(f"✗ Error loading personas: {e}")
        return

    # Create Persona instances
    try:
        persona_a = Persona(persona_a_data['id'])
        # Load features from personas.jsonl
        persona_a.features = {
            "name": persona_a_data.get('name'),
            "age": persona_a_data.get('age'),
            "job": persona_a_data.get('job'),
            "education_level": persona_a_data.get('education_level'),
            "city": persona_a_data.get('city')
        }
        # Load prior beliefs
        persona_a.beliefs = persona_a_data.get('prior_beliefs', {})

        persona_b = Persona(persona_b_data['id'])
        persona_b.features = {
            "name": persona_b_data.get('name'),
            "age": persona_b_data.get('age'),
            "job": persona_b_data.get('job'),
            "education_level": persona_b_data.get('education_level'),
            "city": persona_b_data.get('city')
        }
        persona_b.beliefs = persona_b_data.get('prior_beliefs', {})

        print("✓ Personas initialized with features and beliefs")
        print()

        # Optionally add debate knowledge
        add_debate = input("Add debate knowledge to both? (y/n, default n): ").strip().lower()
        if add_debate == 'y':
            class MockTopic:
                def __init__(self):
                    self.title = "Healthcare Policy"
                    self.description = "Discussion on healthcare reform"

            class MockStatement:
                def __init__(self, text):
                    self.raw_text = text

            class MockDebateTranscript:
                def __init__(self, content):
                    self.topic = MockTopic()
                    self.statements = [MockStatement(content)]

            debate_content = "Candidate A: Healthcare is a human right\nCandidate B: Market competition improves healthcare"
            mock_transcript = MockDebateTranscript(debate_content)

            persona_a.consume_debate_content(mock_transcript)
            persona_b.consume_debate_content(mock_transcript)
            print("✓ Both personas have consumed debate content")
            print()

    except Exception as e:
        print(f"✗ Error creating personas: {e}")
        import traceback
        traceback.print_exc()
        return

    # Get number of rounds from user
    rounds_input = input("Enter number of message exchanges (default 3): ").strip()
    num_rounds = int(rounds_input) if rounds_input else 3

    print(f"\nStarting conversation with {num_rounds} rounds...")
    print(f"(This will make {num_rounds * 2} LLM calls, please wait...)")
    print()
    print("=" * 60)

    conversation_history = []

    # Back and forth conversation
    for round_num in range(num_rounds):
        print(f"\n[Round {round_num + 1}]")
        print("-" * 60)

        # Persona A's turn
        try:
            message_a = persona_a.chat_with_peers(conversation_history, persona_b.id)
            conversation_history.append({
                "speaker_id": persona_a.id,
                "message": message_a
            })
            print(f"{persona_a_data['name']} (A): {message_a}")
        except Exception as e:
            print(f"✗ Error from persona A: {e}")
            import traceback
            traceback.print_exc()
            break

        # Persona B's turn
        try:
            message_b = persona_b.chat_with_peers(conversation_history, persona_a.id)
            conversation_history.append({
                "speaker_id": persona_b.id,
                "message": message_b
            })
            print(f"{persona_b_data['name']} (B): {message_b}")
        except Exception as e:
            print(f"✗ Error from persona B: {e}")
            import traceback
            traceback.print_exc()
            break

    print()
    print("=" * 60)
    print("CONVERSATION COMPLETE")
    print("=" * 60)
    print(f"Total messages exchanged: {len(conversation_history)}")


def main():
    """Interactive CLI for testing Persona methods."""
    print("=" * 60)
    print("PERSONA TESTING TOOL")
    print("=" * 60)
    print()

    # Test selection menu
    print("=" * 60)
    print("SELECT TEST TO RUN")
    print("=" * 60)
    print("1. Test consume_debate_content")
    print("2. Test update_beliefs")
    print("3. Load and display persona features by ID")
    print("4. Display all persona state (features, debate_knowledge, beliefs, etc)")
    print("5. Test chat_with_peers (two personas chatting)")
    print("=" * 60)

    choice = input("\nEnter test number: ").strip()

    # Tests 3 and 5 don't need a persona instance from user input
    if choice == "3":
        test_load_persona_features()
        return
    elif choice == "5":
        test_chat_with_peers()
        return

    # For tests 1, 2, and 4, create a persona
    print()
    persona_id = input("Enter persona ID (or press Enter for 'test-persona'): ").strip()
    if not persona_id:
        persona_id = "test-persona"

    print(f"\nCreating persona with ID: {persona_id}")
    try:
        persona = Persona(persona_id)
        print("✓ Persona created successfully")
    except Exception as e:
        print(f"✗ Error creating persona: {e}")
        return

    if choice == "1":
        test_consume_debate(persona)
    elif choice == "2":
        test_update_beliefs(persona)
    elif choice == "4":
        test_display_persona_state(persona)
    else:
        print(f"Invalid choice: {choice}")


if __name__ == "__main__":
    main()
