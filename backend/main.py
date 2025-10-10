from src.config import Config
from src.game_engine import GameEngine
from src.candidate import Candidate
from src.mediator import Mediator, Topic
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
        Candidate("candidate_1", "Alice Johnson", engine.llm_client),
        Candidate("candidate_2", "Bob Smith", engine.llm_client),
        Candidate("candidate_3", "Carol Davis", engine.llm_client)
    ]
    
    # Initialize mediator with debate topics
    topics = [
        Topic(
            id="topic_1",
            title="Healthcare Reform",
            description="Should the government implement universal healthcare?"
        ),
        Topic(
            id="topic_2",
            title="Climate Policy",
            description="What measures should be taken to address climate change?"
        ),
        Topic(
            id="topic_3",
            title="Education Funding",
            description="How should public education be funded and reformed?"
        ),
        Topic(
            id="topic_4",
            title="Economic Policy",
            description="What economic policies will create jobs and growth?"
        ),
        Topic(
            id="topic_5",
            title="Immigration Reform",
            description="What should be the approach to immigration policy?"
        )
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
            topic_title = transcript.transcript[0].topic.title if transcript.transcript else 'Unknown'
            print(f"  Debate {i+1}: Epoch {transcript.epoch}, Topic '{topic_title}', {transcript.num_turns} turns")

    # Conduct final vote if we have population and candidates
    if engine.population.size() > 0 and engine.candidates:
        vote_results = engine.conduct_final_vote()
        print(f"\nFinal vote results: {vote_results}")


if __name__ == "__main__":
    main()