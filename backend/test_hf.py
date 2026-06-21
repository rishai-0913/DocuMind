"""Quick test: HuggingFace Inference API embedding."""
import os
import sys

from dotenv import load_dotenv

load_dotenv()

hf_token = os.getenv("HF_TOKEN", "")
if not hf_token:
    print("ERROR: HF_TOKEN not set in .env")
    sys.exit(1)

print(f"Token found: {hf_token[:8]}...")

from langchain_huggingface import HuggingFaceEndpointEmbeddings

embeddings = HuggingFaceEndpointEmbeddings(
    huggingfacehub_api_token=hf_token,
    model="BAAI/bge-small-en-v1.5",
)

print("Embedding test sentence...")
result = embeddings.embed_query("Hello, DocuMind!")

print(f"Success! Vector dimensions: {len(result)}")
print(f"First 5 values: {result[:5]}")
