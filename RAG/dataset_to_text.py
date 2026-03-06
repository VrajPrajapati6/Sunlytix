import pandas as pd
import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from vector_db import create_faiss_index

DEFAULT_MODEL_NAME = "all-MiniLM-L6-v2"

def load_and_convert_dataset(csv_path: str):
    """
    Loads a CSV dataset, inspects columns, validates rows, and converts each row
    into a formatted readable text document.
    """
    # Step 1: Load the CSV file using pandas
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at {csv_path}")
        
    print(f"Loading dataset from {csv_path}...")
    try:
        df = pd.read_csv(csv_path, encoding='latin1')
    except Exception:
        print("CSV load failed. Attempting as Excel file...")
        df = pd.read_excel(csv_path, engine='openpyxl')
    
    # Step 2: Inspect column names and ensure all rows are valid
    expected_columns = [
        'Temperature', 'DC Voltage', 'AC Power', 
        'Efficiency', 'Alarm', 'Timestamp'
    ]
    
    # Check if all expected columns are present (case-insensitive check is often good,
    # but we will just check if required keys exist or lower-case them for safety).
    # Let's standardize the column names to lowercase to make mapping easier.
    df.columns = df.columns.str.strip().str.lower()
    
    required_cols = ['temperature', 'dc_voltage', 'ac_power', 'efficiency', 'alarm', 'timestamp']
    # Standardize column names based on actual dataset schema
    rename_map = {
        'inverter_temp': 'temperature',
        'pv1_voltage': 'dc_voltage',
        'inverter_power': 'ac_power',
        'inverters_alarm_code': 'alarm',
        'datetime': 'timestamp'
    }
    df.rename(columns=rename_map, inplace=True)
    
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Warning: The following expected columns are missing: {missing_cols}")
        print(f"Available columns: {df.columns.tolist()}")
    
    # Drop rows with NaN in the critical columns to ensure "all rows are valid"
    initial_row_count = len(df)
    df.dropna(subset=[c for c in required_cols if c in df.columns], inplace=True)
    valid_row_count = len(df)
    print(f"Validated rows: kept {valid_row_count} out of {initial_row_count} rows.")

    # Step 3: Convert each row into a readable text document
    documents = []
    
    # Fast iteration using dictionaries instead of iterrows for millions of rows
    # Convert all columns to strings before filling NA to avoid ValueError on datetime/numeric clashes
    df = df.astype(str)
    df.fillna('N/A', inplace=True)
    records = df.to_dict(orient='records')
    
    for row in records:
        doc = (
            f"Inverter record:\n"
            f"Temperature: {row.get('temperature', 'N/A')} C\n"
            f"DC Voltage: {row.get('dc_voltage', 'N/A')} V\n"
            f"AC Power: {row.get('ac_power', 'N/A')} W\n"
            f"Efficiency: {row.get('efficiency', 'N/A')}\n"
            f"Alarm: {row.get('alarm', 'N/A')}\n"
            f"Timestamp: {row.get('timestamp', 'N/A')}"
        )
        documents.append(doc)
        
    print(f"Successfully converted {len(documents)} rows into text documents.")
    return documents

def chunk_documents(documents: list, chunk_size: int = 500, chunk_overlap: int = 50):
    """
    Splits all documents into chunks suitable for RAG using LangChain's RecursiveCharacterTextSplitter.
    """
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    chunks = text_splitter.create_documents(documents)
    print(f"Created {len(chunks)} chunks from {len(documents)} documents.")
    return chunks

if __name__ == "__main__":
    # Example usage:
    # Update this path to where your actual CSV file is stored
    csv_file_path = "Processed/solar_ml_master_dataset.csv"
    
    try:
        text_documents = load_and_convert_dataset(csv_file_path)
        
        # Split documents into chunks for RAG
        document_chunks = chunk_documents(text_documents, chunk_size=500, chunk_overlap=50)
        
        # Sample a subset of chunks for timely execution on 1,000,000+ rows
        # (Processing 400,000 chunks will take hours locally, so we take the first 10,000)
        max_chunks = 10000
        print(f"\nProcessing up to {max_chunks} chunks for local vector DB...")
        subset_chunks = [chunk.page_content for chunk in document_chunks[:max_chunks]]
        
        print(f"Loading embedding model '{DEFAULT_MODEL_NAME}'...")
        embeddings_model = HuggingFaceEmbeddings(model_name=DEFAULT_MODEL_NAME)
        
        print(f"Embedding {len(subset_chunks)} chunks (this will take a few minutes)...")
        # Generate embeddings for the chunks
        embeddings = embeddings_model.embed_documents(subset_chunks)
        
        print("Creating FAISS index...")
        # Create and save the FAISS database and chunks
        create_faiss_index(embeddings, chunks=subset_chunks)
        
        print("\n✅ Data processing and Vector DB pipeline completed successively!")
            
    except Exception as e:
        print(f"Error processing dataset: {e}")
