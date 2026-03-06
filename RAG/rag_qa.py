"""
rag_qa.py  —  RAG Question-Answering System for Solar Inverter Operators

Pipeline
--------
  1. Embed the user query with a HuggingFace sentence-transformer
  2. Retrieve the top-k most relevant chunks from the FAISS index
  3. Inject those chunks as grounded context into an LLM prompt
  4. Generate a factual, citation-aware answer

Returns
-------
  { "answer": str, "retrieved_sources": list[str] }
"""

import os
from typing import Optional

# ── retrieval helpers (already built) ──────────────────────────────────────
from retrieval import retrieve_documents          # embed query + FAISS search
from generate_explanation import _call_gemini, _call_openai  # LLM wrappers

# ───────────────────────────────────────────────────────────────────────────
# System prompt  –  scope the LLM strictly to the retrieved context
# ───────────────────────────────────────────────────────────────────────────
RAG_SYSTEM_PROMPT = """You are an expert solar plant operations assistant.

You will be given:
  • CONTEXT: one or more excerpts from inverter telemetry records retrieved from a live database.
  • QUESTION: a question submitted by a plant operator.

Rules:
  1. Answer ONLY using information present in the CONTEXT. Do not invent data.
  2. If the context does not contain enough information to answer, say so clearly.
  3. Cite the specific telemetry fields or record snippets that support your answer.
  4. Keep your answer concise, factual, and professional.
  5. Format your answer in plain text – no markdown headings."""


def build_rag_prompt(query: str, context_chunks: list[str]) -> str:
    """Assemble the user-side portion of the RAG prompt."""
    numbered = "\n\n".join(
        f"[Record {i+1}]\n{chunk}" for i, chunk in enumerate(context_chunks)
    )
    return (
        f"CONTEXT (retrieved inverter telemetry):\n"
        f"{numbered}\n\n"
        f"QUESTION: {query}\n\n"
        f"Answer (based only on the context above):"
    )


def _llm_answer(system: str, user: str, provider: str) -> str:
    """Call the selected LLM backend and return the generated text."""
    if provider == "gemini":
        return _call_gemini(system, user, model="gemini-2.0-flash")
    if provider == "openai":
        return _call_openai(system, user, model="gpt-4o-mini")
    raise ValueError(f"Unknown provider '{provider}'. Use 'gemini' or 'openai'.")


def _template_answer(query: str, chunks: list[str], scores: list[float]) -> str:
    """
    Deterministic fallback when no LLM API key is present.
    Summarises the top chunk's content as a structured answer.
    """
    if not chunks:
        return "No relevant inverter records were found for your query."

    best = chunks[0]
    best_score = scores[0] if scores else None

    summary = (
        f"Based on the most relevant telemetry record (similarity distance: "
        f"{best_score:.4f}):\n\n"
        f"{best}\n\n"
        f"Total matching records retrieved: {len(chunks)}.\n"
        f"(Note: Set GOOGLE_API_KEY or OPENAI_API_KEY to receive a richer LLM-generated answer.)"
    )
    return summary


# ───────────────────────────────────────────────────────────────────────────
# Main public function
# ───────────────────────────────────────────────────────────────────────────
def ask(
    query: str,
    k: int = 5,
    llm_provider: str = "gemini",   # "gemini" | "openai" | "none"
    embedding_model: str = "all-MiniLM-L6-v2",
    verbose: bool = True,
) -> dict:
    """
    Answer an operator's natural-language query using the RAG pipeline.

    Args:
        query          : The operator's question.
        k              : Number of chunks to retrieve from FAISS.
        llm_provider   : 'gemini', 'openai', or 'none' (template fallback).
        embedding_model: HuggingFace model name used for query embedding.
        verbose        : Print progress steps to stdout.

    Returns:
        {
            "answer"           : str   – natural-language answer
            "retrieved_sources": list  – raw text of retrieved chunks
            "similarity_scores": list  – corresponding L2 distances
        }
    """
    if verbose:
        print(f"\n🔍 Query: {query}")
        print(f"   Retrieving top {k} relevant chunks from FAISS...")

    # ── Step 1 & 2 : Embed query & retrieve chunks ─────────────────────────
    chunks, scores = retrieve_documents(
        query=query,
        k=k,
        model_name=embedding_model,
    )

    if not chunks:
        return {
            "answer": "No relevant records were found in the database for this query.",
            "retrieved_sources": [],
            "similarity_scores": [],
        }

    if verbose:
        print(f"   Retrieved {len(chunks)} chunk(s). Generating answer...")

    # ── Step 3 : Build prompt with retrieved context ───────────────────────
    user_prompt = build_rag_prompt(query, chunks)

    # ── Step 4 : Generate grounded answer ─────────────────────────────────
    if llm_provider in ("gemini", "openai"):
        try:
            answer = _llm_answer(RAG_SYSTEM_PROMPT, user_prompt, provider=llm_provider)
        except EnvironmentError as e:
            if verbose:
                print(f"   ⚠️  LLM call failed ({e}). Using template fallback.")
            answer = _template_answer(query, chunks, scores)
    else:
        answer = _template_answer(query, chunks, scores)

    return {
        "answer": answer,
        "retrieved_sources": chunks,
        "similarity_scores": scores,
    }


# ───────────────────────────────────────────────────────────────────────────
# CLI demo  –  runs three example operator queries
# ───────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    EXAMPLE_QUERIES = [
        "Which inverters have elevated risk this week?",
        "Why is the inverter overheating?",
        "What alarms are most common in the dataset?",
    ]

    for q in EXAMPLE_QUERIES:
        result = ask(q, k=5, llm_provider="gemini")

        print("\n" + "=" * 60)
        print(f"QUERY : {q}")
        print("=" * 60)
        print("\nANSWER:\n", result["answer"])
        print("\nRETRIEVED SOURCES (top 2 shown):")
        for i, (src, score) in enumerate(
            zip(result["retrieved_sources"][:2], result["similarity_scores"][:2])
        ):
            print(f"\n  [Source {i+1}]  (distance: {score:.4f})")
            print("  " + src.replace("\n", "\n  "))
        print()
