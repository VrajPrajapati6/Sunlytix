"""
create_chunks.py
----------------
Splits the knowledge base into document-level chunks using the '---DOC---'
delimiter. Each chunk is a self-contained document paragraph, NOT a single line.

Optionally splits very long documents into smaller overlapping sub-chunks
to stay within embedding model token limits (~256 tokens ≈ ~1200 chars).
"""

import pickle
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
KB_PATH = os.path.join(SCRIPT_DIR, "knowledge_base.txt")
CHUNKS_PATH = os.path.join(SCRIPT_DIR, "chunks.pkl")

DOC_SEPARATOR = "---DOC---"
MAX_CHUNK_CHARS = 1500   # soft limit per chunk (~300 tokens for MiniLM)
OVERLAP_CHARS = 200       # overlap between sub-chunks for context continuity


def split_long_doc(doc: str, max_chars: int = MAX_CHUNK_CHARS, overlap: int = OVERLAP_CHARS) -> list[str]:
    """Split a document into overlapping sub-chunks if it exceeds max_chars."""
    doc = doc.strip()
    if len(doc) <= max_chars:
        return [doc]

    # Split by paragraph boundaries (double newline) first
    paragraphs = [p.strip() for p in doc.split("\n\n") if p.strip()]

    chunks = []
    current = ""

    for para in paragraphs:
        candidate = (current + "\n\n" + para).strip() if current else para
        if len(candidate) > max_chars and current:
            chunks.append(current.strip())
            # Keep overlap from end of previous chunk
            overlap_text = current[-overlap:] if len(current) > overlap else current
            current = overlap_text + "\n\n" + para
        else:
            current = candidate

    if current.strip():
        chunks.append(current.strip())

    return chunks


def main():
    with open(KB_PATH, "r", encoding="utf-8") as f:
        text = f.read()

    # Split by document separator
    raw_docs = text.split(DOC_SEPARATOR)

    # Clean and split long docs
    chunks = []
    for doc in raw_docs:
        doc = doc.strip()
        if not doc:
            continue
        sub_chunks = split_long_doc(doc)
        chunks.extend(sub_chunks)

    # Remove duplicates while preserving order
    seen = set()
    unique_chunks = []
    for chunk in chunks:
        normalized = chunk.lower().strip()
        if normalized not in seen:
            seen.add(normalized)
            unique_chunks.append(chunk)

    # Save
    with open(CHUNKS_PATH, "wb") as f:
        pickle.dump(unique_chunks, f)

    # Stats
    lengths = [len(c) for c in unique_chunks]
    print(f"Chunks created: {len(unique_chunks)}")
    print(f"Duplicates removed: {len(chunks) - len(unique_chunks)}")
    print(f"Avg chunk length: {sum(lengths)/len(lengths):.0f} chars")
    print(f"Min chunk: {min(lengths)} chars | Max chunk: {max(lengths)} chars")
    print(f"Output: {CHUNKS_PATH}")


if __name__ == "__main__":
    main()
