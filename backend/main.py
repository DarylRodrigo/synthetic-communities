from src.config import Config
from src.game_engine import GameEngine
from src.candidate import Candidate
from src.mediator import Mediator
from src.social_media import SocialMedia
import os


def main():
    config = Config(
        population_size=100,
        num_candidates=3,
        topics_per_epoch=2,
        turns_per_topic=3,
        num_epochs=5,
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
    
    # Initialize candidates
    engine.candidates = [
        Candidate("candidate_1", "Alice Johnson"),
        Candidate("candidate_2", "Bob Smith"), 
        Candidate("candidate_3", "Carol Davis")
    ]
    
    # Initialize mediator and social media
    engine.mediator = Mediator("mediator_1")
    engine.social_media = SocialMedia()
    
    print(f"Starting simulation with {len(engine.candidates)} candidates")
    print(f"Population size: {engine.population.size()}")
    
    results = engine.run()
    
    print("Simulation completed")
    print(f"Results: {results}")
    
    # Conduct final vote if we have population and candidates
    if engine.population.size() > 0 and engine.candidates:
        vote_results = engine.conduct_final_vote()
        print(f"Final vote results: {vote_results}")


if __name__ == "__main__":
    main()