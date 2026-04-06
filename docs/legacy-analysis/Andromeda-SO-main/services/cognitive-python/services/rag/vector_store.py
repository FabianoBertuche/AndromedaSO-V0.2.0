from typing import List, Dict, Any
import numpy as np

class SimpleVectorStore:
    def __init__(self):
        self.vectors = {} # document_id -> List[np.ndarray]
        self.metadata = {} # document_id -> List[Dict[str, Any]]

    def add_chunks(self, document_id: str, embeddings: List[List[float]], chunk_metadata: List[Dict[str, Any]]):
        """Adds chunks and their embeddings to the store."""
        self.vectors[document_id] = [np.array(e) for e in embeddings]
        self.metadata[document_id] = chunk_metadata

    def search(self, query_embedding: List[float], top_k: int = 5) -> List[Dict[str, Any]]:
        """Performs simple cosine similarity search."""
        query_vec = np.array(query_embedding)
        results = []

        for doc_id, doc_vectors in self.vectors.items():
            for i, vec in enumerate(doc_vectors):
                # Cosine similarity
                norm_a = np.linalg.norm(query_vec)
                norm_b = np.linalg.norm(vec)
                if norm_a == 0 or norm_b == 0:
                    score = 0
                else:
                    score = np.dot(query_vec, vec) / (norm_a * norm_b)
                
                results.append({
                    "document_id": doc_id,
                    "chunk": self.metadata[doc_id][i],
                    "score": float(score)
                })

        # Sort by score descending
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]
