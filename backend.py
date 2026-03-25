import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import weaviate
from weaviate.auth import Auth
from weaviate.agents.query import QueryAgent

load_dotenv()

# ---------------------------------------------------------------------------
# Weaviate client — shared across requests
# ---------------------------------------------------------------------------
_client: weaviate.WeaviateClient | None = None


def get_client() -> weaviate.WeaviateClient:
    if _client is None:
        raise RuntimeError("Weaviate client not initialised")
    return _client


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _client
    _client = weaviate.connect_to_weaviate_cloud(
        cluster_url=os.getenv("WEAVIATE_URL"),
        auth_credentials=Auth.api_key(os.getenv("WEAVIATE_API_KEY")),
        headers={"X-OpenAI-Api-Key": os.getenv("OPENAI_API_KEY")},
        skip_init_checks=True,
    )
    print("Weaviate connected.")
    yield
    _client.close()
    print("Weaviate disconnected.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Movie Discovery API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RETURN_PROPS = [
    "title", "overview", "release_date", "poster_url",
    "genres", "vote_average",
]


def _format_movie(props: dict) -> dict:
    release_date = props.get("release_date") or ""
    return {
        "title":        props.get("title", ""),
        "description":  props.get("overview", ""),
        "release_year": release_date[:4] if release_date else "",
        "poster":       props.get("poster_url", ""),
        "genres":       props.get("genres", ""),
        "vote_average": props.get("vote_average", 0.0),
    }


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(3, ge=1, le=20)):
    collection = get_client().collections.get("Movie")
    result = collection.query.near_text(
        query=q,
        limit=limit,
        target_vector="default",
        return_properties=RETURN_PROPS,
    )
    return {"results": [_format_movie(obj.properties) for obj in result.objects]}


# ---------------------------------------------------------------------------
# AI routes
# ---------------------------------------------------------------------------

class ExplainRequest(BaseModel):
    query: str
    limit: int = 3
    prompt: str = "In one short paragraph, explain why '{title}' is worth watching based on this overview: {overview}"


class PlanRequest(BaseModel):
    query: str
    limit: int = 3
    task: str = "Based on these movies, suggest a themed movie night plan with a brief intro for each film."


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


@app.post("/ai/explain")
def ai_explain(req: ExplainRequest):
    collection = get_client().collections.get("Movie")
    result = collection.generate.near_text(
        query=req.query,
        limit=req.limit,
        target_vector="default",
        return_properties=RETURN_PROPS,
        single_prompt=req.prompt,
    )
    movies = []
    for obj in result.objects:
        movie = _format_movie(obj.properties)
        movie["explanation"] = obj.generated if obj.generated else ""
        movies.append(movie)
    return {"results": movies}


@app.post("/ai/plan")
def ai_plan(req: PlanRequest):
    collection = get_client().collections.get("Movie")
    result = collection.generate.near_text(
        query=req.query,
        limit=req.limit,
        target_vector="default",
        return_properties=RETURN_PROPS,
        grouped_task=req.task,
    )
    return {
        "plan":    result.generated,
        "results": [_format_movie(obj.properties) for obj in result.objects],
    }


@app.post("/chat")
def chat(req: ChatRequest):
    if not req.messages:
        raise HTTPException(status_code=400, detail="messages cannot be empty")

    client = get_client()
    collection = client.collections.get("Movie")

    agent = QueryAgent(client=client, collections=["Movie"])

    # Embed prior turns into the query so the agent has full context
    last_message = req.messages[-1].content
    if len(req.messages) > 1:
        history_text = "\n".join(
            f"{m.role.capitalize()}: {m.content}" for m in req.messages[:-1]
        )
        query = f"Conversation so far:\n{history_text}\n\nUser: {last_message}"
    else:
        query = last_message

    response = agent.ask(query)

    # Fetch full properties for each source object
    collection = client.collections.get("Movie")
    sources = []
    for src in (response.sources or []):
        obj = collection.query.fetch_object_by_id(src.object_id, return_properties=RETURN_PROPS)
        if obj:
            sources.append(_format_movie(obj.properties))

    return {
        "answer":  response.final_answer,
        "sources": sources,
    }
