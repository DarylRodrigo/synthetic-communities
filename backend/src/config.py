from dataclasses import dataclass


@dataclass
class Config:
    population_size: int
    questions_per_topic: int
    turns_per_question: int
    num_epochs: int
    random_seed: int