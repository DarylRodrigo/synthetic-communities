from typing import Dict, List, Any
from dataclasses import dataclass, asdict, field


@dataclass
class Post:
    """Represents a post on the social media platform"""
    id: str
    persona_id: str
    content: str
    likes: int = 0
    dislikes: int = 0

    def to_string(self) -> str:
        """Format post as a readable string with like/dislike counts"""
        return f"{self.persona_id} [{self.likes} 👍 / {self.dislikes} 👎]: {self.content}"


class SocialMedia:
    VALID_REACTIONS = ["thumbs_up", "thumbs_down"]

    def __init__(self):
        self.posts: List[Post] = []
        self.reactions: Dict[str, List[Dict[str, Any]]] = {}

    def add_post(self, post: Post) -> None:
        self.posts.append(post)

    def get_feed(self, limit: int = 100) -> str:
        """Returns the last `limit` posts as a concatenated string"""
        recent_posts = self.posts[-limit:] if len(self.posts) > limit else self.posts
        return "\n".join([post.to_string() for post in recent_posts])

    def get_feed_by_personas(self, personas: List[str]) -> List[Post]:
        """Returns only posts made by the specified personas"""
        return [post for post in self.posts if post.persona_id in personas]

    def add_reaction(self, post_id: str, persona_id: str, reaction: str) -> None:
        if reaction not in self.VALID_REACTIONS:
            raise ValueError(f"Invalid reaction: {reaction}. Must be one of {self.VALID_REACTIONS}")

        # Find the post and increment its like/dislike count
        post = next((p for p in self.posts if p.id == post_id), None)
        if post:
            if reaction == "thumbs_up":
                post.likes += 1
            elif reaction == "thumbs_down":
                post.dislikes += 1

        # Track the reaction
        if post_id not in self.reactions:
            self.reactions[post_id] = []
        self.reactions[post_id].append({"persona_id": persona_id, "reaction": reaction})

    def get_trending_topics(self) -> List[str]:
        return []

    def get_platform_state(self) -> Dict[str, Any]:
        return {
            "total_posts": len(self.posts),
            "total_reactions": sum(len(reactions) for reactions in self.reactions.values()),
            "posts": [asdict(post) for post in self.posts],
            "reactions": self.reactions
        }