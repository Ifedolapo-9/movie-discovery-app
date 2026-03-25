'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Bot, User, Loader2, Film } from 'lucide-react';
import Image from 'next/image';
import clsx from 'clsx';
import type { ChatMessage, Movie } from '@/types';
import { chatWithAgent } from '@/lib/api';

// ─── Source citation card ─────────────────────────────────────────────────────

function SourceCard({ movie }: { movie: Movie }) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#131320] border border-[#252538] min-w-0">
      {movie.poster && (
        <div className="relative w-8 h-11 flex-shrink-0 rounded overflow-hidden">
          <Image src={movie.poster} alt={movie.title} fill sizes="32px" className="object-cover" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-white truncate leading-none">{movie.title}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{movie.release_year}</p>
      </div>
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={clsx('flex gap-2.5', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={clsx(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
          isUser
            ? 'bg-green-500/20 text-green-400'
            : 'bg-[#1A1A2E] text-purple-400 border border-purple-500/30',
        )}
      >
        {isUser ? <User size={13} /> : <Bot size={13} />}
      </div>

      {/* Content */}
      <div className={clsx('flex flex-col max-w-[80%]', isUser && 'items-end')}>
        <div
          className={clsx(
            'px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap',
            isUser
              ? 'bg-green-600/20 text-white rounded-tr-sm border border-green-500/20'
              : 'bg-[#161626] text-gray-200 rounded-tl-sm border border-[#252538]',
          )}
        >
          {message.content}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <div className="mt-2 w-full max-w-sm">
            <p className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1">
              <Film size={10} />
              Sources from Weaviate
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {message.sources.map(src => (
                <SourceCard key={src.title} movie={src} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Suggestion prompts ───────────────────────────────────────────────────────

const SUGGESTIONS = [
  'What sci-fi movies are in the collection?',
  'Recommend something for a family night',
  'Which movie has the highest rating?',
  'Tell me about action thrillers',
];

// ─── ChatView ─────────────────────────────────────────────────────────────────

export default function ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: ChatMessage = { role: 'user', content };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const res = await chatWithAgent(
        updated.map(({ role, content: c }) => ({ role, content: c })),
      );
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: res.answer, sources: res.sources },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Could not reach the agent. Is the backend running on port 8000?' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#252538] bg-[#0E0E1A]/95 backdrop-blur flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
            <Bot size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">Weaviate Query Agent</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Answers questions about the Movie collection</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-[#252538] hover:border-red-500/30 transition-all"
          >
            <Trash2 size={12} />
            Clear
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

        {/* Empty state with suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 select-none">
            <Bot size={40} className="text-gray-700 mb-3" />
            <p className="text-sm font-medium text-gray-500 mb-4">Ask anything about the movies</p>
            <div className="w-full max-w-xs space-y-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="w-full text-left text-xs text-gray-500 border border-[#252538] rounded-lg px-3 py-2 hover:border-green-500/30 hover:text-green-400 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#1A1A2E] text-purple-400 border border-purple-500/30 mt-0.5 flex-shrink-0">
              <Bot size={13} />
            </div>
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#161626] border border-[#252538] flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-purple-400" />
              <span className="text-sm text-gray-500">Thinking…</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="flex-shrink-0 border-t border-[#252538] p-4 bg-[#0E0E1A]/95 backdrop-blur">
        <form
          onSubmit={e => { e.preventDefault(); send(); }}
          className="flex gap-2 max-w-3xl mx-auto"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about movies…"
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#161626] border border-[#252538] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
