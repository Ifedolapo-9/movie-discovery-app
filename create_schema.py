import os
import requests
from dotenv import load_dotenv

load_dotenv()

WEAVIATE_URL     = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")

BASE_URL = f"https://{WEAVIATE_URL}"
HEADERS  = {
    "Authorization": f"Bearer {WEAVIATE_API_KEY}",
    "X-OpenAI-Api-Key": OPENAI_API_KEY,
    "Content-Type": "application/json",
}

# ── 1. Delete existing collection (clean slate) ────────────────────────────
resp = requests.delete(f"{BASE_URL}/v1/schema/Movie", headers=HEADERS)
if resp.status_code == 200:
    print("Deleted existing 'Movie' collection.")
elif resp.status_code != 404:
    print(f"Warning during delete: {resp.status_code} – {resp.text}")

# ── 2. Define schema with TWO named vectors ────────────────────────────────
#
#  multi2multivec-weaviate does NOT support text field vectorization at runtime.
#  Solution: split into two named vectors:
#    • image_vector  → multi2multivec-weaviate  (poster blob)
#    • text_vector   → text2vec-weaviate         (title text)
#  Both modules are confirmed enabled on this cluster.
schema = {
    "class": "Movie",
    "vectorConfig": {
        # Vector 1: visual embedding of the movie poster
        "image_vector": {
            "vectorizer": {
                "multi2multivec-weaviate": {
                    "imageFields": ["poster"],
                }
            },
            "vectorIndexType": "hnsw",
        },
        # Vector 2: text embedding of the movie title
        "text_vector": {
            "vectorizer": {
                "text2vec-weaviate": {
                    "properties": ["title"],
                    "vectorizeClassName": False,
                }
            },
            "vectorIndexType": "hnsw",
        },
    },
    # Generative module (RAG with OpenAI)
    "moduleConfig": {
        "generative-openai": {}
    },
    "properties": [
        {"name": "title",        "dataType": ["text"]},
        {"name": "description",  "dataType": ["text"],
         "moduleConfig": {
             "text2vec-weaviate": {"skip": True}  # skip description from text_vector
         }},
        {"name": "poster",       "dataType": ["blob"]},
        {"name": "release_year", "dataType": ["int"]},
    ],
}

# ── 3. Create the collection ───────────────────────────────────────────────
resp = requests.post(f"{BASE_URL}/v1/schema", headers=HEADERS, json=schema)
if not resp.ok:
    print(f"Error {resp.status_code}: {resp.text}")
    resp.raise_for_status()
print("'Movie' collection created successfully!\n")

# ── 4. Confirm by reading back the schema ─────────────────────────────────
resp = requests.get(f"{BASE_URL}/v1/schema/Movie", headers=HEADERS)
resp.raise_for_status()
result = resp.json()

print(f"  Name            : {result['class']}")
vc = result.get("vectorConfig", {})
print(f"  Named vectors   : {list(vc.keys())}")
for vec_name, vec_cfg in vc.items():
    print(f"    [{vec_name}] vectorizer: {list(vec_cfg.get('vectorizer', {}).keys())}")
mc = result.get("moduleConfig", {})
print(f"  Generative      : {list(mc.keys())}")
print("  Properties :")
for p in result.get("properties", []):
    print(f"    - {p['name']:<14} {p['dataType']}")
