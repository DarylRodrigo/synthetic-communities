import logging
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
    config = Config(
        population_size=100,
        num_candidates=3,
        topics_per_epoch=1,
        turns_per_topic=3,
        num_epochs=1,
        random_seed=42
    )
    
    engine = GameEngine(config)
    
    # Load population from JSONL file
    population_file = "data/personas.jsonl"
    if os.path.exists(population_file):
        engine.population.load_from_jsonl(population_file)
        print(f"Loaded {engine.population.size()} personas from {population_file}")
    else:
        print(f"Warning: {population_file} not found, running with empty population")
    
    # Initialize mediator with debate topics
    topics = [
        Topic(
            id="topic_1",
            title="Healthcare Reform",
            description="Should the government implement universal healthcare?"
        ),
    ]

    # Initialize candidates with topics so they can form policy positions
    engine.candidates = [
        Candidate("candidate_1", "Alice Johnson", topics, engine.llm_client),
        Candidate("candidate_2", "Bob Smith", topics, engine.llm_client),
        Candidate("candidate_3", "Carol Davis", topics, engine.llm_client)
    ]

    engine.mediator = Mediator("mediator_1", topics=topics, llm_client_instance=engine.llm_client)
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
        print(f"\nFinal vote results: {vote_results}")


if __name__ == "__main__":
    main()