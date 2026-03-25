import json
import os
from dotenv import load_dotenv
import weaviate
from weaviate.auth import Auth
from weaviate.classes.config import Configure, Property, DataType, VectorDistances

load_dotenv()

client = weaviate.connect_to_weaviate_cloud(
    cluster_url=os.getenv("WEAVIATE_URL"),
    auth_credentials=Auth.api_key(os.getenv("WEAVIATE_API_KEY")),
    headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")},
)

try:
    # Drop existing collection if present
    if client.collections.exists("Movie"):
        client.collections.delete("Movie")
        print("Deleted existing 'Movie' collection.")

    # Create collection with text2vec-openai vectorizer
    client.collections.create(
        name="Movie",
        vector_config=Configure.Vectors.text2vec_openai(name="default"),
        generative_config=Configure.Generative.openai(),
        properties=[
            Property(name="tmdb_id",             data_type=DataType.INT),
            Property(name="title",               data_type=DataType.TEXT),
            Property(name="original_title",      data_type=DataType.TEXT),
            Property(name="overview",            data_type=DataType.TEXT),
            Property(name="tagline",             data_type=DataType.TEXT),
            Property(name="status",              data_type=DataType.TEXT),
            Property(name="release_date",        data_type=DataType.TEXT),
            Property(name="original_language",   data_type=DataType.TEXT),
            Property(name="homepage",            data_type=DataType.TEXT),
            Property(name="poster_url",          data_type=DataType.TEXT),
            Property(name="budget",              data_type=DataType.INT),
            Property(name="revenue",             data_type=DataType.INT),
            Property(name="runtime",             data_type=DataType.INT),
            Property(name="popularity",          data_type=DataType.NUMBER),
            Property(name="vote_average",        data_type=DataType.NUMBER),
            Property(name="vote_count",          data_type=DataType.INT),
            Property(name="genres",              data_type=DataType.TEXT),
            Property(name="keywords",            data_type=DataType.TEXT),
            Property(name="production_companies",data_type=DataType.TEXT),
            Property(name="production_countries",data_type=DataType.TEXT),
            Property(name="spoken_languages",    data_type=DataType.TEXT),
        ],
    )
    print("Created 'Movie' collection.")

    # Load movies
    with open("movies.json", encoding="utf-8") as f:
        movies = json.load(f)

    collection = client.collections.get("Movie")

    def safe_int(val, default=0):
        try:
            return int(float(val)) if val not in (None, "", "nan") else default
        except (ValueError, TypeError):
            return default

    def safe_float(val, default=0.0):
        try:
            return float(val) if val not in (None, "", "nan") else default
        except (ValueError, TypeError):
            return default

    # Batch import
    with collection.batch.dynamic() as batch:
        for movie in movies:
            batch.add_object({
                "tmdb_id":              safe_int(movie["id"]),
                "title":                movie.get("title") or "",
                "original_title":       movie.get("original_title") or "",
                "overview":             movie.get("overview") or "",
                "tagline":              movie.get("tagline") or "",
                "status":               movie.get("status") or "",
                "release_date":         movie.get("release_date") or "",
                "original_language":    movie.get("original_language") or "",
                "homepage":             movie.get("homepage") or "",
                "poster_url":           movie.get("poster_url") or "",
                "budget":               safe_int(movie["budget"]),
                "revenue":              safe_int(movie["revenue"]),
                "runtime":              safe_int(movie["runtime"]),
                "popularity":           safe_float(movie["popularity"]),
                "vote_average":         safe_float(movie["vote_average"]),
                "vote_count":           safe_int(movie["vote_count"]),
                "genres":               movie.get("genres") or "",
                "keywords":             movie.get("keywords") or "",
                "production_companies": movie.get("production_companies") or "",
                "production_countries": movie.get("production_countries") or "",
                "spoken_languages":     movie.get("spoken_languages") or "",
            })

    failed = collection.batch.failed_objects
    imported = len(movies) - len(failed)
    print(f"Imported {imported}/{len(movies)} movies into 'Movie' collection.")
    if failed:
        for f in failed[:5]:
            print(f"  Failed: {f}")

finally:
    client.close()
