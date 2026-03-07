"""
build_faiss_index.py
--------------------
Encodes all chunks with sentence-transformers (all-MiniLM-L6-v2)
and builds a FAISS flat L2 index for fast similarity search.
"""

import pickle
import faiss
import numpy as np
import os
from sentence_transformers import SentenceTransformer

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CHUNKS_PATH = os.path.join(SCRIPT_DIR, "chunks.pkl")
INDEX_PATH = os.path.join(SCRIPT_DIR, "faiss_index.bin")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
BATCH_SIZE = 64


def main():
    # Load chunks
    with open(CHUNKS_PATH, "rb") as f:
        chunks = pickle.load(f)

    print(f"Loaded {len(chunks)} chunks")
    print(f"Loading embedding model: {EMBEDDING_MODEL} ...")

    model = SentenceTransformer(EMBEDDING_MODEL)

    # Encode in batches
    print("Encoding chunks ...")
    embeddings = model.encode(
        chunks,
        batch_size=BATCH_SIZE,
        show_progress_bar=True,
        normalize_embeddings=True,  # cosine similarity via dot product
    )
    embeddings = np.array(embeddings).astype("float32")

    print(f"Embedding shape: {embeddings.shape}")

    # Build FAISS index (Inner Product for normalized vectors = cosine similarity)
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatIP(dimension)  # IP = inner product (cosine for normalized)
    index.add(embeddings)

    print(f"Vectors in index: {index.ntotal}")

    # Save
    faiss.write_index(index, INDEX_PATH)
    print(f"FAISS index saved: {INDEX_PATH}")


if __name__ == "__main__":
    main()
