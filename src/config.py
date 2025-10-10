from dataclasses import dataclass


@dataclass
class Config:
    population_size: int
    num_candidates: int
    topics_per_epoch: int
    turns_per_topic: int
    num_epochs: int
    random_seed: int