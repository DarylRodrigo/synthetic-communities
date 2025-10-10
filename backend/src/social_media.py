from typing import Dict, List, Any


class SocialMedia:
    def __init__(self):
        self.posts: List[Dict[str, Any]] = []
        self.reactions: Dict[str, List[Dict[str, Any]]] = {}
    
    def add_post(self, post: Dict[str, Any]) -> None:
        self.posts.append(post)
    
    def get_feed(self, persona_id: str) -> List[Dict[str, Any]]:
        return self.posts
    
    def add_reaction(self, post_id: str, persona_id: str, reaction: str) -> None:
        if post_id not in self.reactions:
            self.reactions[post_id] = []
        self.reactions[post_id].append({"persona_id": persona_id, "reaction": reaction})
    
    def get_trending_topics(self) -> List[str]:
        return []
    
    def get_platform_state(self) -> Dict[str, Any]:
        return {
            "total_posts": len(self.posts),
            "total_reactions": sum(len(reactions) for reactions in self.reactions.values()),
            "posts": self.posts,
            "reactions": self.reactions
        }