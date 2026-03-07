"""
rag_retriever.py
----------------
Full RAG retriever with:
  1. FAISS similarity search for relevant chunks
  2. Groq LLM integration (llama-3.3-70b-versatile) for answer generation
  3. Standalone test mode

Usage:
  python rag_retriever.py                         # interactive test mode
  python rag_retriever.py "Why is temp high?"     # single query mode

From code:
  from rag_retriever import ask_rag
  answer = ask_rag("Why is inverter temperature increasing?")
"""

import faiss
import pickle
import numpy as np
import os
import sys
import json
import urllib.request
import urllib.error
from sentence_transformers import SentenceTransformer

# ---------------------------------------------------------------------------
# PATHS
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INDEX_PATH = os.path.join(SCRIPT_DIR, "faiss_index.bin")
CHUNKS_PATH = os.path.join(SCRIPT_DIR, "chunks.pkl")

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# ---------------------------------------------------------------------------
# GROQ CONFIG  (reads from env or .env in project root)
# ---------------------------------------------------------------------------
def _load_groq_key() -> str:
    """Try env var first, then read from .env file in project root."""
    key = os.environ.get("GROQ_API_KEY", "")
    if key:
        return key

    # Try project-root .env
    for candidate in [
        os.path.join(SCRIPT_DIR, "..", ".env"),
        os.path.join(SCRIPT_DIR, ".env"),
    ]:
        env_path = os.path.abspath(candidate)
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("GROQ_API_KEY="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


GROQ_API_KEY = _load_groq_key()
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# ---------------------------------------------------------------------------
# LOAD ARTIFACTS (lazy singleton)
# ---------------------------------------------------------------------------
_index = None
_chunks = None
_embed_model = None


def _load():
    global _index, _chunks, _embed_model
    if _index is None:
        _index = faiss.read_index(INDEX_PATH)
        with open(CHUNKS_PATH, "rb") as f:
            _chunks = pickle.load(f)
        _embed_model = SentenceTransformer(EMBEDDING_MODEL)
        print(f"[RAG] Loaded {len(_chunks)} chunks, {_index.ntotal} vectors")


# ---------------------------------------------------------------------------
# RETRIEVE
# ---------------------------------------------------------------------------
def retrieve(query: str, top_k: int = 5) -> list[dict]:
    """Return top_k relevant chunks with scores."""
    _load()
    query_emb = _embed_model.encode([query], normalize_embeddings=True).astype("float32")
    scores, indices = _index.search(query_emb, top_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < len(_chunks):
            results.append({
                "text": _chunks[idx],
                "score": float(score),
                "index": int(idx),
            })
    return results


# ---------------------------------------------------------------------------
# CALL GROQ LLM
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """You are Sunlytix AI, an expert solar energy monitoring assistant.
You help users understand their solar inverter data, diagnose issues, and recommend maintenance actions.

Rules:
- Use the provided context to give accurate, data-backed answers
- Reference specific values, thresholds, and alarm codes when relevant
- If the context doesn't contain enough information, say so honestly
- Be concise but thorough
- Always suggest actionable next steps when diagnosing problems
- Mention specific inverter names (INV-BB, INV-12, etc.) and plant numbers when relevant"""


def call_groq(prompt: str, context: str) -> str:
    """Call Groq API with context-augmented prompt."""
    if not GROQ_API_KEY:
        return "[ERROR] GROQ_API_KEY not set. Add it to your .env file."

    user_message = f"""Context from Sunlytix knowledge base:
---
{context}
---

User question: {prompt}

Provide a clear, helpful answer based on the context above."""

    payload = json.dumps({
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        "temperature": 0.3,
        "max_tokens": 1024,
    }).encode("utf-8")

    req = urllib.request.Request(
        GROQ_URL,
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "User-Agent": "Sunlytix/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode())
            return data["choices"][0]["message"]["content"]
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        return f"[ERROR] Groq API returned {e.code}: {body}"
    except Exception as e:
        return f"[ERROR] Groq API call failed: {e}"


# ---------------------------------------------------------------------------
# PUBLIC API
# ---------------------------------------------------------------------------
def ask_rag(question: str, top_k: int = 5) -> dict:
    """
    Full RAG pipeline: retrieve → augment → generate.

    Returns:
        {
            "answer": str,
            "sources": [{"text": str, "score": float}, ...],
        }
    """
    # Retrieve
    results = retrieve(question, top_k=top_k)
    context = "\n\n".join([r["text"] for r in results])

    # Generate
    answer = call_groq(question, context)

    return {
        "answer": answer,
        "sources": [{"text": r["text"][:200] + "...", "score": r["score"]} for r in results],
    }


# ---------------------------------------------------------------------------
# CLI TEST
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if len(sys.argv) > 1:
        question = " ".join(sys.argv[1:])
    else:
        print("=" * 60)
        print("  Sunlytix RAG — Interactive Test Mode")
        print("  Type 'quit' to exit")
        print("=" * 60)
        while True:
            question = input("\nQuestion: ").strip()
            if question.lower() in ("quit", "exit", "q"):
                break
            if not question:
                continue

            print("\nRetrieving...")
            result = ask_rag(question)

            print(f"\n--- Answer ---")
            print(result["answer"])

            print(f"\n--- Sources ({len(result['sources'])}) ---")
            for i, src in enumerate(result["sources"], 1):
                print(f"  [{i}] score={src['score']:.4f} | {src['text'][:100]}...")
            print()

        sys.exit(0)

    # Single query mode
    print(f"\nQuery: {question}\n")
    result = ask_rag(question)
    print(result["answer"])
    print(f"\n--- Sources ---")
    for i, src in enumerate(result["sources"], 1):
        print(f"  [{i}] score={src['score']:.4f}")
