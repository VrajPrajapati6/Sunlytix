import faiss
import numpy as np
import os
import pickle

# Default paths for persisting the FAISS index and the corresponding document chunks
DEFAULT_INDEX_PATH = "faiss_index.bin"
DEFAULT_CHUNKS_PATH = "chunks.pkl"

def create_faiss_index(embeddings, chunks=None, index_path=DEFAULT_INDEX_PATH, chunks_path=DEFAULT_CHUNKS_PATH):
    """
    Creates a FAISS index from document embeddings and saves it locally.
    Optionally saves the corresponding chunks (text) to map back from search results.
    
    Args:
        embeddings (list or np.ndarray): The document embeddings.
        chunks (list, optional): The original text chunks corresponding to the embeddings.
        index_path (str): The file path to save the FAISS index.
        chunks_path (str): The file path to save the text chunks.
        
    Returns:
        faiss.Index: The created FAISS index.
    """
    if len(embeddings) == 0:
        raise ValueError("Cannot create index with empty embeddings.")

    # Convert to float32 numpy array as required by FAISS
    embeddings_array = np.array(embeddings).astype('float32')
    dimension = embeddings_array.shape[1]
    
    # Create an L2 distance index
    index = faiss.IndexFlatL2(dimension)
    
    # Add vectors to the index
    index.add(embeddings_array)
    
    # Save the index to a local file
    faiss.write_index(index, index_path)
    print(f"✅ FAISS index with {index.ntotal} vectors saved to {index_path}")
    
    # Save the text chunks if provided
    if chunks is not None:
        with open(chunks_path, 'wb') as f:
            pickle.dump(chunks, f)
        print(f"✅ Document chunks saved to {chunks_path}")
        
    return index

def search_faiss_index(query_embedding, k=5, index_path=DEFAULT_INDEX_PATH):
    """
    Loads the saved FAISS index and retrieves the top-k nearest chunks for a query.
    
    Args:
        query_embedding (list or np.ndarray): The query's embedding vector.
        k (int): Number of nearest neighbors to retrieve.
        index_path (str): The file path of the saved FAISS index.
        
    Returns:
        tuple (distances, indices): The distances and indices of the top-k results.
    """
    if not os.path.exists(index_path):
        raise FileNotFoundError(f"FAISS index file not found at {index_path}. Please create it first.")
        
    # Load the index from the local file
    index = faiss.read_index(index_path)
    
    # Ensure the query embedding is a 2D float32 numpy array
    query_array = np.array(query_embedding).astype('float32')
    if len(query_array.shape) == 1:
        # Reshape to (1, dimension)
        query_array = np.expand_dims(query_array, axis=0)
        
    # Search the index for the nearest neighbors
    distances, indices = index.search(query_array, k)
    
    return distances, indices

def load_chunks(chunks_path=DEFAULT_CHUNKS_PATH):
    """
    Utility function to load the saved textual chunks to map to FAISS indices.
    """
    if not os.path.exists(chunks_path):
        raise FileNotFoundError(f"Chunks file not found at {chunks_path}.")
        
    with open(chunks_path, 'rb') as f:
        chunks = pickle.load(f)
    return chunks

if __name__ == "__main__":
    # --- Example Usage / Mock Data ---
    print("Testing FAISS vector database wrapper...")
    
    # 1. Generate 10 dummy text chunks
    mock_chunks = [f"This is chunk number {i}" for i in range(10)]
    
    # 2. Generate random 128-dimensional embeddings for the chunks
    mock_embeddings = np.random.rand(10, 128)
    
    # 3. Create and save the FAISS index along with chunks
    create_faiss_index(mock_embeddings, chunks=mock_chunks)
    
    # 4. Generate a random query embedding to search the index
    mock_query = np.random.rand(128)
    
    # 5. Search the FAISS index for the top 3 nearest matches
    distances, indices = search_faiss_index(mock_query, k=3)
    
    print("\nSearch Results (Top 3):")
    loaded_chunks = load_chunks()
    
    for rank, idx in enumerate(indices[0]):
        dist = distances[0][rank]
        chunk_text = loaded_chunks[idx]
        print(f"Rank {rank+1}: Source Index = {idx}, Distance = {dist:.4f}")
        print(f"  --> Text: '{chunk_text}'")
