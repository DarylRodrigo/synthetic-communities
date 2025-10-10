from dataclasses import dataclass
from typing import List


@dataclass
class Topic:
    """Represents a debate topic."""
    id: str
    title: str
    description: str


@dataclass
class CandidateStatement:
    """A statement made by a candidate during a debate turn."""
    candidate_id: str
    candidate_name: str
    statement: str
    topic: Topic


@dataclass
class MediatorStatement:
    """A statement made by the mediator (e.g., topic introduction)."""
    mediator_id: str
    statement: str
    topic: Topic


@dataclass
class DebateTranscript:
    """Complete transcript of a debate session with all statements."""
    statements: List  # MediatorStatement + all CandidateStatements
    mediator_id: str
    epoch: int
    topic_index: int
    topic: Topic
