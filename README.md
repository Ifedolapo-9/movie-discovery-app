# Movie Discovery App

A Streamlit web app that lets you find films using natural language, powered by [Weaviate](https://weaviate.io) (vector database) and OpenAI.

## Features

- **Semantic search** — describe a mood or theme and get matching movies via `near_text`
- **AI explanations** — per-movie write-ups generated with `single_prompt` (RAG)
- **Movie Night Planner** — a viewing order, snack pairings, and theme summary via `grouped_task`
- **Conversational chat** — ask anything about the collection; the Weaviate Query Agent answers with source citations
- **Watchlist** — save movies during your session and export the list as a `.txt` file
- **Poster download** — download any movie poster as a JPEG

## Weaviate Concepts Demonstrated

| Feature | Role |
|---|---|
| Named Vectors | Two vector spaces per object: `text_vector` (title) and `image_vector` (poster) |
| `text2vec-weaviate` | Embeds movie titles for semantic text search |
| `multi2multivec-weaviate` | Embeds poster images using ModernVBERT / colmodernvbert |
| `generative-openai` | Connects OpenAI GPT to Weaviate for RAG |
| `near_text` | Semantic similarity search over the text vector |
| `single_prompt` | Per-movie AI explanation generated at query time |
| `grouped_task` | One cohesive AI response across all results |
| Query Agent | Conversational AI chat with source citations via `weaviate-agents` |

## Project Structure

```
movie-discovery-app/
├── app.py              # Streamlit UI (search, chat, watchlist)
├── create_schema.py    # Creates the Movie collection via Weaviate REST API
├── ingest_movies.py    # Ingests 10 sample movies with base64 poster images
├── check_modules.py    # Lists enabled modules on the Weaviate cluster
├── requirements.txt    # Python dependencies
└── .env                # API keys (not committed)
```

## Prerequisites

- Python 3.10+
- A [Weaviate Cloud](https://console.weaviate.cloud) cluster with these modules enabled:
  - `text2vec-weaviate`
  - `multi2multivec-weaviate`
  - `generative-openai`
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

### 1. Clone and create a virtual environment

```bash
git clone <repo-url>
cd movie-discovery-app
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
WEAVIATE_URL=your-cluster-host.weaviate.network
WEAVIATE_API_KEY=your-weaviate-api-key
OPENAI_API_KEY=your-openai-api-key
```

> **Note:** `WEAVIATE_URL` should be the bare hostname — no `https://` prefix.

### 4. Create the Weaviate schema

```bash
python create_schema.py
```

This creates a `Movie` collection with two named vectors (`text_vector` and `image_vector`) and enables RAG via `generative-openai`.

### 5. Ingest sample movies

```bash
python ingest_movies.py
```

Downloads posters from TMDB and Wikipedia, encodes them as base64 blobs, and inserts 10 classic films into the collection.

### 6. Run the app

```bash
streamlit run app.py
```

The app opens at `http://localhost:8501`.

## Sample Movies

The dataset includes 10 classic films:

- The Godfather (1972)
- The Shawshank Redemption (1994)
- Pulp Fiction (1994)
- The Dark Knight (2008)
- Inception (2010)
- Forrest Gump (1994)
- The Matrix (1999)
- Interstellar (2014)
- Fight Club (1999)
- Schindler's List (1993)

## Tech Stack

| Component | Technology |
|---|---|
| Vector database | Weaviate Cloud (v4 SDK) |
| AI agents | weaviate-agents (Query Agent) |
| Generative AI | OpenAI (via Weaviate's `generative-openai` module) |
| Frontend | Streamlit |
| Image handling | base64 + TMDB public CDN |
