export interface Movie {
  title: string;
  description: string;
  release_year: string;
  poster: string;
  genres: string; // JSON string: [{id, name}, ...]
  vote_average: number;
  explanation?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Movie[];
}

export type ViewMode = 'search' | 'chat';
