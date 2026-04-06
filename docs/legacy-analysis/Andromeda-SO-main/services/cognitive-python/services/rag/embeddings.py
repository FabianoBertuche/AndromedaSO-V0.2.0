from typing import List

class EmbeddingService:
    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Placeholder for embedding generation logic."""
        # TODO: Integrate with OpenAI, Anthropic or local model
        # For now, return dummy embeddings of size 1536
        return [[0.1] * 1536 for _ in texts]

    async def generate_query_embedding(self, query: str) -> List[float]:
        """Generates embedding for a single query string."""
        return [0.1] * 1536
