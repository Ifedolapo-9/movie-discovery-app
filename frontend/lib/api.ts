import type { Movie, ChatMessage } from '@/types';

const base = () =>
  `http://${process.env.NEXT_PUBLIC_BACKEND_HOST ?? 'localhost:8000'}`;

export async function searchMovies(q: string, limit = 6): Promise<Movie[]> {
  const res = await fetch(
    `${base()}/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  const data = await res.json();
  return data.results as Movie[];
}

export async function explainMovies(query: string, limit = 6): Promise<Movie[]> {
  const res = await fetch(`${base()}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`Explain failed: ${res.statusText}`);
  const data = await res.json();
  return data.results as Movie[];
}

export async function planMovies(
  query: string,
  limit = 4
): Promise<{ plan: string; results: Movie[] }> {
  const res = await fetch(`${base()}/ai/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit }),
  });
  if (!res.ok) throw new Error(`Plan failed: ${res.statusText}`);
  return res.json();
}

export async function chatWithAgent(
  messages: Pick<ChatMessage, 'role' | 'content'>[]
): Promise<{ answer: string; sources: Movie[] }> {
  const res = await fetch(`${base()}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error(`Chat failed: ${res.statusText}`);
  return res.json();
}
