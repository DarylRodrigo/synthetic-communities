from dataclasses import dataclass
from typing import List, Dict, Any
import yaml


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

    # Data files
    population_file: str = "data/personas/swiss_population_50.jsonl"
    world_file: str = None

    # Topics and candidates
    topics: List[Dict[str, str]] = None
    candidates: List[Dict[str, str]] = None

    # World data (loaded from world_file if provided)
    world_story: str = None

    @classmethod
    def from_yaml(cls, yaml_path: str) -> 'Config':
        """Load configuration from a YAML file."""
        with open(yaml_path, 'r') as f:
            config_dict = yaml.safe_load(f)

        # Load world story if world_file is specified
        world_file = config_dict.get('world_file')
        if world_file:
            try:
                with open(world_file, 'r') as f:
                    config_dict['world_story'] = f.read()
            except FileNotFoundError:
                print(f"Warning: World file '{world_file}' not found")
                config_dict['world_story'] = None

        # Create Config instance with the loaded data
        return cls(**config_dict)