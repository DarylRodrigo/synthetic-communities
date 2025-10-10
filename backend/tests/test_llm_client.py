import pytest
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from project root (one level up from backend)
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Add parent directory to path to import llm_client
sys.path.insert(0, str(Path(__file__).parent.parent))
from src import llm_client


class TestLLMClient:
    """Test suite for LLM client (uses real API calls)"""

    @pytest.fixture
    def api_key(self):
        """Fixture to get API key from environment"""
        key = os.getenv('GEMINI_API_KEY')
        if not key:
            pytest.skip("GEMINI_API_KEY not set in environment")
        return key

    @pytest.mark.llm
    def test_create_client(self, api_key):
        """Test creating a Gemini client with valid API key"""
        client = llm_client.create_client(api_key)
        assert client is not None

    @pytest.mark.llm
    @pytest.mark.parametrize(
        "temperature", [None, 0.1], ids=["default_temperature", "low_temperature"])
    def test_generate_response_basic(self, api_key, temperature):
        """Test generating a basic response from LLM"""
        client = llm_client.create_client(api_key)

        prompt = "Say 'Hello, world!' and nothing else."
        system_instruction = "You are a helpful assistant."
        
        if temperature is not None:
            response = llm_client.generate_response(client, prompt, system_instruction, temperature=temperature)
        else:
            response = llm_client.generate_response(client, prompt, system_instruction)


        assert isinstance(response, str)
        assert len(response) > 0
