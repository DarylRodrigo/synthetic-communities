from dataclasses import dataclass


@dataclass
class Config:
    # Core simulation parameters
    population_size: int
    questions_per_topic: int
    turns_per_question: int
    num_epochs: int
    random_seed: int
    
    # Social media parameters
    post_probability: float = 0.07
    reaction_probability: float = 0.4
    
    # Peer chat parameters
    num_rounds_mean: int = 3
    num_rounds_variance: int = 1
    
    # Belief update parameters
    max_change_percentage: float = 0.5
    max_concurrent: int = 20