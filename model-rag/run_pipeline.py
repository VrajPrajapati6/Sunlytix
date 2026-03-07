"""
run_pipeline.py
---------------
Runs the full RAG pipeline in order:
  1. Generate knowledge base from dataset
  2. Create chunks from knowledge base
  3. Build FAISS index from chunks
  4. (Optional) Test retrieval with sample queries

Usage:
  python run_pipeline.py           # build everything
  python run_pipeline.py --test    # build + run test queries
"""

import subprocess
import sys
import os
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PYTHON = sys.executable


def run_step(name: str, script: str):
    """Run a pipeline step and report timing."""
    print(f"\n{'='*60}")
    print(f"  Step: {name}")
    print(f"{'='*60}")
    start = time.time()

    result = subprocess.run(
        [PYTHON, os.path.join(SCRIPT_DIR, script)],
        cwd=SCRIPT_DIR,
        capture_output=False,
    )

    elapsed = time.time() - start
    if result.returncode != 0:
        print(f"\n  FAILED (exit code {result.returncode}) after {elapsed:.1f}s")
        sys.exit(1)
    else:
        print(f"\n  Done in {elapsed:.1f}s")


def test_retrieval():
    """Quick retrieval test with sample queries."""
    print(f"\n{'='*60}")
    print(f"  Step: Test Retrieval")
    print(f"{'='*60}")

    # Import locally to use freshly built artifacts
    sys.path.insert(0, SCRIPT_DIR)
    from rag_retriever import retrieve

    test_queries = [
        "Why is inverter temperature increasing?",
        "What does alarm code 548 mean?",
        "Tell me about Plant 2 performance",
        "How do I prevent inverter failures?",
        "What is op state 5120?",
    ]

    for q in test_queries:
        results = retrieve(q, top_k=3)
        print(f"\n  Q: {q}")
        for i, r in enumerate(results, 1):
            preview = r["text"][:100].replace("\n", " ")
            print(f"    [{i}] score={r['score']:.4f} | {preview}...")

    print("\n  Retrieval test passed!")


def main():
    print("\n" + "=" * 60)
    print("  Sunlytix RAG Pipeline Builder")
    print("=" * 60)

    run_step("Generate Knowledge Base", "generate_knowledge_base.py")
    run_step("Create Chunks", "create_chunks.py")
    run_step("Build FAISS Index", "build_faiss_index.py")

    if "--test" in sys.argv:
        test_retrieval()

    print(f"\n{'='*60}")
    print("  Pipeline complete!")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
