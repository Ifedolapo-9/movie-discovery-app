'use client';

import { createContext, useContext, useState } from 'react';
import {
  Search, MessageSquare, Download,
  X, ChevronLeft, ChevronRight, Bookmark, BookmarkCheck,
  DatabaseZap, Sparkles, Bot, Zap,
} from 'lucide-react';
import clsx from 'clsx';
import type { Movie, ViewMode } from '@/types';

// ─── Sidebar Context ──────────────────────────────────────────────────────────

interface SidebarCtx {
  open: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarCtx>({ open: true, toggle: () => {} });

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(v => !v) }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ─── Weaviate Logo ────────────────────────────────────────────────────────────

function WeaviateLogoMark({ className }: { className?: string }) {
  return (
    // Official Weaviate logo mark — interconnected node graph
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Connection lines */}
      <line x1="50" y1="12" x2="88" y2="35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <line x1="88" y1="35" x2="88" y2="65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <line x1="88" y1="65" x2="50" y2="88" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <line x1="50" y1="88" x2="12" y2="65" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <line x1="12" y1="65" x2="12" y2="35" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      <line x1="12" y1="35" x2="50" y2="12" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.5"/>
      {/* Cross-connections */}
      <line x1="50" y1="12" x2="12" y2="65" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="50" y1="12" x2="88" y2="65" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="12" y1="35" x2="88" y2="65" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="88" y1="35" x2="12" y2="65" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="12" y1="35" x2="50" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="88" y1="35" x2="50" y2="88" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      {/* Outer nodes */}
      <circle cx="50" cy="12" r="8" fill="currentColor"/>
      <circle cx="88" cy="35" r="8" fill="currentColor"/>
      <circle cx="88" cy="65" r="8" fill="currentColor"/>
      <circle cx="50" cy="88" r="8" fill="currentColor"/>
      <circle cx="12" cy="65" r="8" fill="currentColor"/>
      <circle cx="12" cy="35" r="8" fill="currentColor"/>
      {/* Centre node */}
      <circle cx="50" cy="50" r="10" fill="currentColor"/>
      <line x1="50" y1="12" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="88" y1="35" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="88" y1="65" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="50" y1="88" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="12" y1="65" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
      <line x1="12" y1="35" x2="50" y2="50" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}

function WeaviateLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0 p-1.5">
        <WeaviateLogoMark className="w-full h-full text-green-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-none tracking-wide">weaviate</p>
        <p className="text-[10px] text-green-400 leading-none mt-0.5 font-medium">Movie Discovery</p>
      </div>
    </div>
  );
}

// ─── Agent Skills ─────────────────────────────────────────────────────────────

const AGENT_SKILLS = [
  {
    icon: DatabaseZap,
    label: 'Import Data',
    desc: 'Batch-imports 100 movies into a Weaviate collection with text2vec-openai auto-vectorization.',
    skill: 'weaviate/import_data',
  },
  {
    icon: Search,
    label: 'Vector Search',
    desc: 'near_text semantic search — find movies by concept, mood, or theme, not just keywords.',
    skill: 'weaviate/query',
  },
  {
    icon: Sparkles,
    label: 'Generative Search',
    desc: 'RAG via generate.near_text — per-movie explanations (single_prompt) and movie-night plans (grouped_task).',
    skill: 'weaviate/generative',
  },
  {
    icon: Bot,
    label: 'Query Agent',
    desc: 'Weaviate QueryAgent handles multi-turn chat with full conversation history over the Movie collection.',
    skill: 'weaviate/query_agent',
  },
  {
    icon: Zap,
    label: 'Frontend Interface',
    desc: 'Next.js + FastAPI cookbook pattern — React UI consuming REST endpoints backed by Weaviate Cloud.',
    skill: 'weaviate-cookbooks/frontend_interface',
  },
];

// ─── AppSidebar ───────────────────────────────────────────────────────────────

interface AppSidebarProps {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  watchlist: Movie[];
  onRemoveFromWatchlist: (title: string) => void;
}

export default function AppSidebar({
  view, onViewChange, watchlist, onRemoveFromWatchlist,
}: AppSidebarProps) {
  const { open, toggle } = useSidebar();

  const exportWatchlist = () => {
    const blob = new Blob([JSON.stringify(watchlist, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'watchlist.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      className={clsx(
        'relative flex flex-col h-full bg-[#09091A] border-r border-[#252538] flex-shrink-0 transition-all duration-300',
        open ? 'w-64' : 'w-14',
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-5 z-20 w-6 h-6 rounded-full bg-[#09091A] border border-[#252538] flex items-center justify-center text-gray-500 hover:text-white hover:border-green-500/50 transition-colors"
        aria-label="Toggle sidebar"
      >
        {open ? <ChevronLeft size={11} /> : <ChevronRight size={11} />}
      </button>

      {/* Logo */}
      <div className={clsx('p-4 border-b border-[#252538]', !open && 'flex justify-center px-3')}>
        {open ? (
          <WeaviateLogo />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center p-1.5">
            <WeaviateLogoMark className="w-full h-full text-green-400" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="p-2 border-b border-[#252538]">
        {open && (
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider px-2 mb-1.5">
            Navigation
          </p>
        )}
        <nav className="space-y-1">
          {([
            { id: 'search' as ViewMode, icon: Search,         label: 'Search' },
            { id: 'chat'   as ViewMode, icon: MessageSquare,  label: 'AI Chat' },
          ] as const).map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => onViewChange(id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm font-medium transition-colors',
                view === id
                  ? 'bg-green-500/15 text-green-400 border border-green-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent',
                !open && 'justify-center px-0',
              )}
            >
              <Icon size={15} />
              {open && <span>{label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Agent Skills */}
      {open && (
        <div className="p-3 border-b border-[#252538]">
          <div className="flex items-center gap-1.5 px-1 mb-2.5">
            <WeaviateLogoMark className="w-3 h-3 text-green-500" />
            <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
              Agent Skills
            </p>
          </div>
          <ul className="space-y-3">
            {AGENT_SKILLS.map(({ icon: Icon, label, desc, skill }) => (
              <li key={label} className="flex items-start gap-2.5 px-1 group">
                <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-md bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <Icon size={10} className="text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-200 leading-none">{label}</p>
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">{desc}</p>
                  <p className="text-[9px] text-green-600/70 mt-0.5 font-mono">{skill}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Watchlist */}
      <div className="flex-1 overflow-hidden flex flex-col p-2 min-h-0">
        {open ? (
          <>
            <div className="flex items-center justify-between px-1 mb-2">
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">
                Watchlist
              </p>
              <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full font-medium">
                {watchlist.length}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1">
              {watchlist.length === 0 ? (
                <p className="text-[11px] text-gray-600 px-1 italic mt-1">No movies saved yet.</p>
              ) : (
                watchlist.map(m => (
                  <div
                    key={m.title}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#131320] group"
                  >
                    <BookmarkCheck size={10} className="text-green-400 flex-shrink-0" />
                    <span className="text-xs text-gray-300 truncate flex-1 leading-none">{m.title}</span>
                    <button
                      onClick={() => onRemoveFromWatchlist(m.title)}
                      className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all flex-shrink-0"
                      aria-label={`Remove ${m.title}`}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex justify-center mt-3">
            <div className="relative">
              <Bookmark size={15} className="text-gray-600" />
              {watchlist.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-green-500 rounded-full text-[8px] text-black flex items-center justify-center font-bold">
                  {watchlist.length}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export */}
      {open && watchlist.length > 0 && (
        <div className="p-2 border-t border-[#252538]">
          <button
            onClick={exportWatchlist}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-green-400 border border-green-500/25 hover:bg-green-500/10 transition-colors"
          >
            <Download size={12} />
            Export Watchlist
          </button>
        </div>
      )}
    </aside>
  );
}
