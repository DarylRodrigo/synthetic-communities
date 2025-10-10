import pytest
import sys
from pathlib import Path

# Add parent directory to path to import SocialMedia
sys.path.insert(0, str(Path(__file__).parent.parent))
from src.social_media import SocialMedia, Post


class TestPost:
    """Test suite for Post dataclass"""

    def test_post_creation(self):
        """Test creating a Post instance with default likes/dislikes"""
        post = Post(id="post_1", persona_id="persona_123", content="Test content")
        assert post.id == "post_1"
        assert post.persona_id == "persona_123"
        assert post.content == "Test content"
        assert post.likes == 0
        assert post.dislikes == 0

    def test_post_to_string(self):
        """Test post to_string formatting with emojis"""
        post = Post(id="post_1", persona_id="Alice McCarthy", content="I cannot believe what i just saw...", likes=10, dislikes=4)
        expected = "Alice McCarthy [10 👍 / 4 👎]: I cannot believe what i just saw..."
        assert post.to_string() == expected

    def test_post_to_string_no_reactions(self):
        """Test post to_string with zero likes/dislikes"""
        post = Post(id="post_1", persona_id="Bob", content="Hello world")
        expected = "Bob [0 👍 / 0 👎]: Hello world"
        assert post.to_string() == expected


class TestSocialMedia:
    """Test suite for SocialMedia class"""

    @pytest.fixture
    def social_media(self):
        """Fixture to create a fresh SocialMedia instance for each test"""
        return SocialMedia()

    @pytest.fixture
    def sample_posts(self):
        """Fixture for multiple sample posts"""
        return [
            Post(id="post_1", persona_id="persona_123", content="First post about policy"),
            Post(id="post_2", persona_id="persona_456", content="Second post with opinion"),
            Post(id="post_3", persona_id="persona_123", content="Third post from persona 123"),
            Post(id="post_4", persona_id="persona_789", content="Fourth post here"),
        ]

    def test_add_and_retrieve_posts(self, social_media, sample_posts):
        """Test adding posts and retrieving them"""
        for post in sample_posts:
            social_media.add_post(post)

        assert len(social_media.posts) == 4
        assert social_media.posts[0] == sample_posts[0]
        assert social_media.posts[3] == sample_posts[3]

    def test_get_feed_returns_string(self, social_media, sample_posts):
        """Test that get_feed returns concatenated string of posts with like/dislike counts"""
        for post in sample_posts:
            social_media.add_post(post)

        feed = social_media.get_feed()
        assert isinstance(feed, str)
        assert "persona_123 [0 👍 / 0 👎]: First post about policy" in feed
        assert "persona_456 [0 👍 / 0 👎]: Second post with opinion" in feed
        assert "persona_789 [0 👍 / 0 👎]: Fourth post here" in feed

    def test_get_feed_with_limit(self, social_media, sample_posts):
        """Test that get_feed respects limit parameter and returns last N posts"""
        for post in sample_posts:
            social_media.add_post(post)

        # Get last 2 posts only
        feed = social_media.get_feed(limit=2)
        lines = feed.split("\n")

        assert len(lines) == 2
        assert "Third post from persona 123" in lines[0]
        assert "Fourth post here" in lines[1]

    def test_get_feed_by_personas(self, social_media, sample_posts):
        """Test filtering posts by specific personas"""
        for post in sample_posts:
            social_media.add_post(post)

        # Get only posts from persona_123
        filtered_posts = social_media.get_feed_by_personas(["persona_123"])
        assert len(filtered_posts) == 2
        assert all(post.persona_id == "persona_123" for post in filtered_posts)

        # Get posts from multiple personas
        filtered_posts = social_media.get_feed_by_personas(["persona_123", "persona_456"])
        assert len(filtered_posts) == 3
        assert filtered_posts[0].id == "post_1"
        assert filtered_posts[1].id == "post_2"
        assert filtered_posts[2].id == "post_3"

    def test_add_valid_reactions(self, social_media):
        """Test adding valid reactions (thumbs_up, thumbs_down) and updating post counts"""
        post = Post(id="post_1", persona_id="persona_123", content="Test post")
        social_media.add_post(post)

        social_media.add_reaction("post_1", "persona_456", "thumbs_up")
        social_media.add_reaction("post_1", "persona_789", "thumbs_up")
        social_media.add_reaction("post_1", "persona_999", "thumbs_down")

        # Check reactions are tracked
        assert len(social_media.reactions["post_1"]) == 3

        # Check post counts are updated
        assert post.likes == 2
        assert post.dislikes == 1

        # Check feed includes updated counts
        feed = social_media.get_feed()
        assert "persona_123 [2 👍 / 1 👎]: Test post" in feed

    def test_invalid_reaction_raises_error(self, social_media):
        """Test that invalid reactions raise ValueError"""
        with pytest.raises(ValueError, match="Invalid reaction"):
            social_media.add_reaction("post_1", "persona_123", "like")

        with pytest.raises(ValueError, match="Invalid reaction"):
            social_media.add_reaction("post_1", "persona_123", "love")

    def test_get_platform_state(self, social_media, sample_posts):
        """Test retrieving comprehensive platform state with like/dislike counts"""
        # Add posts
        for post in sample_posts:
            social_media.add_post(post)

        # Add reactions
        social_media.add_reaction("post_1", "persona_456", "thumbs_up")
        social_media.add_reaction("post_1", "persona_789", "thumbs_up")
        social_media.add_reaction("post_2", "persona_123", "thumbs_down")

        state = social_media.get_platform_state()

        assert state["total_posts"] == 4
        assert state["total_reactions"] == 3
        assert len(state["posts"]) == 4
        assert isinstance(state["posts"][0], dict)
        assert state["posts"][0]["id"] == "post_1"
        assert state["posts"][0]["likes"] == 2
        assert state["posts"][0]["dislikes"] == 0
        assert state["posts"][1]["likes"] == 0
        assert state["posts"][1]["dislikes"] == 1
        assert "post_1" in state["reactions"]
        assert "post_2" in state["reactions"]

    def test_empty_state(self, social_media):
        """Test platform state when empty"""
        feed = social_media.get_feed()
        assert feed == ""

        state = social_media.get_platform_state()
        assert state["total_posts"] == 0
        assert state["total_reactions"] == 0

        filtered = social_media.get_feed_by_personas(["persona_123"])
        assert filtered == []
