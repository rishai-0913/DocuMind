"""
Quick smoke test for the Groq API key and model.
Run: python test_groq.py
"""

import os
import sys
from pathlib import Path

# Load .env from project root (one level up)
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except ImportError:
    print("python-dotenv not installed. Install with: pip install python-dotenv")
    print("Falling back to environment variables...\n")

from groq import Groq

# ── Config ────────────────────────────────────────────────────────────────────
MODEL = "llama-3.3-70b-versatile"
TEST_PROMPT = "In one sentence, explain what RAG (Retrieval-Augmented Generation) is."

# ── Run ───────────────────────────────────────────────────────────────────────
api_key = os.environ.get("GROQ_API_KEY")
if not api_key:
    print("❌  GROQ_API_KEY not found. Check your .env file.")
    sys.exit(1)

print(f"✅  API key loaded: {api_key[:8]}...{api_key[-4:]}")
print(f"🤖  Model: {MODEL}")
print(f"📨  Prompt: {TEST_PROMPT}\n")

client = Groq(api_key=api_key)

try:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": TEST_PROMPT}],
        temperature=0.3,
        max_tokens=200,
    )

    answer = response.choices[0].message.content
    usage = response.usage

    print(f"💬  Response:\n{answer}\n")
    print(f"📊  Tokens used  →  prompt: {usage.prompt_tokens}  |  completion: {usage.completion_tokens}  |  total: {usage.total_tokens}")
    print(f"⚡  Model: {response.model}")
    print("\n✅  Groq API is working correctly.")

except Exception as e:
    print(f"❌  API call failed: {e}")
    sys.exit(1)
