import csv
import json
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from dotenv import load_dotenv
import time
import urllib.request
import urllib.error

load_dotenv()

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500"
TMDB_API_BASE = "https://api.themoviedb.org/3/movie"
INPUT_CSV = "tmdb_5000_movies.csv"
OUTPUT_JSON = "movies.json"
LIMIT = 100
MAX_WORKERS = 10


def fetch_poster(row_index, movie_id, title, retries=3, delay=2):
    url = f"{TMDB_API_BASE}/{movie_id}?api_key={TMDB_API_KEY}"
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=10) as resp:
                data = json.loads(resp.read().decode())
                poster_path = data.get("poster_path")
                return row_index, f"{TMDB_IMAGE_BASE}{poster_path}" if poster_path else None
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return row_index, None
            raise
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(delay)
            else:
                print(f"  Warning: failed for '{title}' (id={movie_id}): {e}", file=sys.stderr)
                return row_index, None


def main():
    print(f"Reading first {LIMIT} rows from {INPUT_CSV}...")
    with open(INPUT_CSV, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = [next(reader) for _ in range(LIMIT)]

    print(f"Fetching poster URLs for {LIMIT} movies...")
    poster_map = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {
            executor.submit(fetch_poster, i, row["id"], row["title"]): i
            for i, row in enumerate(rows)
        }
        for future in as_completed(futures):
            row_index, poster_url = future.result()
            poster_map[row_index] = poster_url

    movies = []
    for i, row in enumerate(rows):
        movie = dict(row)
        movie["poster_url"] = poster_map.get(i)
        movies.append(movie)

    print(f"Writing {OUTPUT_JSON}...")
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(movies, f, ensure_ascii=False, indent=2)

    found = sum(1 for m in movies if m["poster_url"])
    print(f"Done. {found}/{LIMIT} movies have poster URLs -> {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
