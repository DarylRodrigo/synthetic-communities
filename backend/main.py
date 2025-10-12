import logging
import argparse
from src.config import Config
from src.game_engine import GameEngine
from src.candidate import Candidate
from src.mediator import Mediator, Topic
from src.social_media import SocialMedia
import os

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(levelname)s - %(message)s'
)


def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Run the synthetic communities simulation')
    parser.add_argument(
        '--config',
        type=str,
        default='src/configs/config.yaml',
        help='Path to configuration YAML file (default: src/configs/config.yaml)'
    )
    args = parser.parse_args()

    # Load configuration from YAML file
    config = Config.from_yaml(args.config)
    print(f"Loaded configuration from: {args.config}")

    # Display world information if loaded
    if config.world_story:
        print(f"World story loaded from: {config.world_file}")
        # Extract world title from the first line of the markdown
        first_line = config.world_story.split('\n')[0].strip('#').strip()
        print(f"World: {first_line}")
    else:
        print("No world story loaded")

    engine = GameEngine(config, config_path=args.config)

    # Load population from JSONL file
    if os.path.exists(config.population_file):
        engine.population.load_from_jsonl(config.population_file, limit=config.population_size)
        print(f"Loaded {engine.population.size()} personas from {config.population_file}")
    else:
        print(f"Warning: {config.population_file} not found, running with empty population")

    # Initialize mediator with debate topics from config
    topics = [
        Topic(
            id=topic_data["id"],
            title=topic_data["title"],
            description=topic_data["description"]
        )
        for topic_data in config.topics
    ]

    # Initialize candidates from config
    engine.candidates = [
        Candidate(
            candidate_data["id"],
            candidate_data["name"],
            candidate_data["description"],
            topics,
            engine.llm_client,
            world_story=config.world_story
        )
        for candidate_data in config.candidates
    ]

    engine.mediator = Mediator("mediator_1", topics=topics, llm_client_instance=engine.llm_client, world_story=config.world_story)
    engine.social_media = SocialMedia()

    print(f"Loaded {len(topics)} debate topics")
    
    print(f"Starting simulation with {len(engine.candidates)} candidates")
    print(f"Population size: {engine.population.size()}")
    
    results = engine.run()
    
    print("\nSimulation completed")
    print(f"Results: {results}")
    print(f"\nTotal debate transcripts generated: {len(engine.debate_transcripts)}")

    # Print summary of debates
    if engine.debate_transcripts:
        print("\n=== Debate Summary ===")
        for i, transcript in enumerate(engine.debate_transcripts):
            topic_title = transcript.topic.title
            num_statements = len(transcript.statements)
            print(f"  Debate {i+1}: Epoch {transcript.epoch}, Topic '{topic_title}', {num_statements} statements")

    # Conduct final vote if we have population and candidates
    if engine.population.size() > 0 and engine.candidates:
        vote_results = engine.conduct_final_vote()
        engine.save_final_vote(vote_results)
        print(f"\nFinal vote results: {vote_results}")


if __name__ == "__main__":
    main()