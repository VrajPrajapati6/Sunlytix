import os
import numpy as np
from vector_db import search_faiss_index, load_chunks
from langchain_huggingface import HuggingFaceEmbeddings

# Use the same default embedding model you used for chunking (adjust if different)
DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"

def retrieve_documents(query: str, k: int = 5, model_name: str = DEFAULT_MODEL_NAME):
    """
    Given a user query, converts it to an embedding, searches the FAISS index,
    and returns the top-k most relevant document chunks along with their similarity scores.
    
    Args:
        query (str): The natural language query from the user.
        k (int): The number of relevant chunks to retrieve.
        model_name (str): The HuggingFace sentence transformer model used for embeddings.
        
    Returns:
        tuple (list, list): A tuple containing the retrieved text chunks and their similarity scores.
    """
    print(f"Loading embedding model '{model_name}'...")
    # Initialize the embedding model (this will use a cached version if already downloaded)
    embeddings_model = HuggingFaceEmbeddings(model_name=model_name)
    
    print(f"Embedding query: '{query}'")
    # Step 1: Convert the user query into an embedding
    query_embedding = embeddings_model.embed_query(query)
    
    print("Searching FAISS vector database...")
    # Step 2: Search the FAISS vector database
    # FAISS returns L2 distances (lower is better/more similar)
    distances, indices = search_faiss_index(query_embedding, k=k)
    
    # Step 3: Retrieve the top-k relevant document chunks
    loaded_chunks = load_chunks()
    
    retrieved_chunks = []
    similarity_scores = []
    
    # FAISS search results are returned as a batch of queries, so we access index 0
    for rank, idx in enumerate(indices[0]):
        if idx == -1:
            # -1 means FAISS didn't find enough neighbors (e.g., k > total documents)
            continue
            
        dist = distances[0][rank]
        chunk_text = loaded_chunks[idx]
        
        retrieved_chunks.append(chunk_text)
        similarity_scores.append(dist)
        
    return retrieved_chunks, similarity_scores

if __name__ == "__main__":
    # --- Example Usage ---
    # NOTE: This requires the FAISS index and chunks.pkl to already exist 
    # from your previous ingestion / vector DB creation step.
    
    sample_query = "What is the average temperature for inverter alarms?"
    
    try:
        chunks, scores = retrieve_documents(sample_query, k=5)
        
        print("\n" + "="*50)
        print(f"QUERY: {sample_query}")
        print("="*50)
        
        for i, (chunk, score) in enumerate(zip(chunks, scores)):
            print(f"\n--- Result {i+1} (L2 Distance Score: {score:.4f}) ---")
            print(chunk)
            
    except Exception as e:
        print(f"Error during retrieval: {e}")
