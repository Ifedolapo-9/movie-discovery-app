import os
import time
import base64
import requests
import weaviate
from weaviate.auth import AuthApiKey
from dotenv import load_dotenv

load_dotenv()

# ── Credentials ───────────────────────────────────────────────────────────────
WEAVIATE_URL     = os.getenv("WEAVIATE_URL")
WEAVIATE_API_KEY = os.getenv("WEAVIATE_API_KEY")
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY")

# ── 10 sample movies — posters from TMDB's public image CDN ──────────────────
# Format: https://image.tmdb.org/t/p/w500/{poster_path}
TMDB_IMG = "https://image.tmdb.org/t/p/w500"

MOVIES = [
    {
        "title": "The Godfather",
        "description": "The aging patriarch of an organized crime dynasty transfers control "
                       "of his empire to his reluctant son.",
        "release_year": 1972,
        "poster_url": "https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg",
    },
    {
        "title": "The Shawshank Redemption",
        "description": "Two imprisoned men bond over the years, finding solace and redemption "
                       "through acts of common decency.",
        "release_year": 1994,
        "poster_url": f"{TMDB_IMG}/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    },
    {
        "title": "Pulp Fiction",
        "description": "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine "
                       "in four tales of violence and redemption.",
        "release_year": 1994,
        "poster_url": f"{TMDB_IMG}/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    },
    {
        "title": "The Dark Knight",
        "description": "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon "
                       "and DA Harvey Dent against the anarchic Joker.",
        "release_year": 2008,
        "poster_url": f"{TMDB_IMG}/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    },
    {
        "title": "Inception",
        "description": "A thief who steals corporate secrets through dream-sharing technology is given "
                       "the inverse task of planting an idea into the mind of a C.E.O.",
        "release_year": 2010,
        "poster_url": f"{TMDB_IMG}/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
    },
    {
        "title": "Forrest Gump",
        "description": "The presidencies of Kennedy and Johnson, the Vietnam War, and other events "
                       "unfold through the perspective of an Alabama man with a low IQ.",
        "release_year": 1994,
        "poster_url": f"{TMDB_IMG}/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    },
    {
        "title": "The Matrix",
        "description": "A computer hacker learns from mysterious rebels about the true nature "
                       "of his reality and his role in the war against its controllers.",
        "release_year": 1999,
        "poster_url": f"{TMDB_IMG}/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    },
    {
        "title": "Interstellar",
        "description": "A team of explorers travel through a wormhole in space in an attempt "
                       "to ensure humanity's survival.",
        "release_year": 2014,
        "poster_url": f"{TMDB_IMG}/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    },
    {
        "title": "Fight Club",
        "description": "An insomniac office worker and a devil-may-care soap maker form an "
                       "underground fight club that evolves into something much more.",
        "release_year": 1999,
        "poster_url": f"{TMDB_IMG}/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
    },
    {
        "title": "Schindler's List",
        "description": "In German-occupied Poland during World War II, industrialist Oskar Schindler "
                       "gradually becomes concerned for his Jewish workforce after witnessing their persecution.",
        "release_year": 1993,
        "poster_url": f"{TMDB_IMG}/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    },
]

# ── Helper: download poster → base64 string ───────────────────────────────────
def fetch_poster_b64(url: str) -> str:
    """Download an image from a URL and return it as a base64-encoded string."""
    resp = requests.get(
        url,
        headers={"User-Agent": "MovieDiscoveryApp/1.0 (educational demo)"},
        timeout=15,
    )
    resp.raise_for_status()
    return base64.b64encode(resp.content).decode("utf-8")

# ── Connect to Weaviate ───────────────────────────────────────────────────────
client = weaviate.connect_to_weaviate_cloud(
    cluster_url=WEAVIATE_URL,
    auth_credentials=AuthApiKey(WEAVIATE_API_KEY),
    headers={"X-OpenAI-Api-Key": OPENAI_API_KEY},
    skip_init_checks=True,
)

try:
    collection = client.collections.get("Movie")

    print(f"Ingesting {len(MOVIES)} movies into 'Movie' collection...\n")

    success_count = 0
    for movie in MOVIES:
        title = movie["title"]
        try:
            # 1. Download poster and encode as base64
            print(f"  [{title}] Downloading poster...", end=" ", flush=True)
            poster_b64 = fetch_poster_b64(movie["poster_url"])
            print(f"OK ({len(poster_b64):,} chars)")

            # 2. Insert into Weaviate — vectorizer runs server-side automatically
            print(f"  [{title}] Inserting...", end=" ", flush=True)
            obj_id = collection.data.insert(
                properties={
                    "title":        movie["title"],
                    "description":  movie["description"],
                    "release_year": movie["release_year"],
                    "poster":       poster_b64,
                }
            )
            print(f"OK  ->  id: {obj_id}")
            success_count += 1

        except Exception as e:
            print(f"FAILED — {e}")

        time.sleep(0.5)   # small delay between inserts

    print(f"\nDone. {success_count}/{len(MOVIES)} movies ingested successfully.")

    # ── Quick verification: count objects in collection ───────────────────────
    total = collection.aggregate.over_all(total_count=True).total_count
    print(f"Total objects in 'Movie' collection: {total}")

finally:
    client.close()
