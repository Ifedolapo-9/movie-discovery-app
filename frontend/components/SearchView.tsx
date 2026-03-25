'use client';

import { useState, useRef } from 'react';
import { Search, Sparkles, Calendar, Loader2, AlertCircle } from 'lucide-react';
import type { Movie } from '@/types';
import { searchMovies, explainMovies, planMovies } from '@/lib/api';
import MovieCard from './MovieCard';

type LoadingState = 'search' | 'explain' | 'plan' | null;

interface SearchViewProps {
  watchlist: Movie[];
  onToggleWatchlist: (movie: Movie) => void;
}

export default function SearchView({ watchlist, onToggleWatchlist }: SearchViewProps) {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [plan, setPlan]       = useState<string | null>(null);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError]     = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  const isInWatchlist = (m: Movie) => watchlist.some(w => w.title === m.title);

  const run = async (mode: LoadingState) => {
    if (!query.trim() || !mode) return;
    setLoading(mode);
    setError(null);
    if (mode === 'search') setPlan(null);

    try {
      if (mode === 'search') {
        setResults(await searchMovies(query.trim(), 6));
      } else if (mode === 'explain') {
        setResults(await explainMovies(query.trim(), results.length || 6));
      } else {
        const data = await planMovies(query.trim(), 4);
        setPlan(data.plan);
        setResults(data.results);
      }
    } catch {
      setError(
        mode === 'search'
          ? 'Search failed. Is the backend running on port 8000?'
          : `${mode === 'explain' ? 'Explain' : 'Plan'} failed.`,
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-[#0E0E1A]/95 backdrop-blur border-b border-[#252538] px-6 py-4">
        <div className="max-w-3xl mx-auto">

          {/* Search bar */}
          <form onSubmit={e => { e.preventDefault(); run('search'); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search movies… e.g. 'space adventure' or 'dark psychological thriller'"
                className="w-full pl-9 pr-4 py-2.5 bg-[#161626] border border-[#252538] rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading !== null}
              className="px-4 py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              {loading === 'search'
                ? <Loader2 size={14} className="animate-spin" />
                : <Search size={14} />}
              Search
            </button>
          </form>

          {/* AI action buttons */}
          {results.length > 0 && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => run('explain')}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 disabled:opacity-50 transition-colors"
              >
                {loading === 'explain'
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Sparkles size={12} />}
                Explain Results
              </button>
              <button
                onClick={() => run('plan')}
                disabled={loading !== null}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
              >
                {loading === 'plan'
                  ? <Loader2 size={12} className="animate-spin" />
                  : <Calendar size={12} />}
                Plan a Night
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-6xl mx-auto">

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Movie Night Plan */}
          {plan && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={13} className="text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-300">Movie Night Plan</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{plan}</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && results.length === 0 && !error && (
            <div className="flex flex-col items-center justify-center h-72 text-gray-600 select-none">
              <Search size={42} className="mb-3 opacity-20" />
              <p className="text-sm font-medium text-gray-500">Find your next movie</p>
              <p className="text-xs mt-1.5 text-gray-600">Try: &quot;action hero&quot;, &quot;sci-fi epic&quot;, &quot;feel-good comedy&quot;</p>
            </div>
          )}

          {/* Skeleton while searching */}
          {loading === 'search' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-[#161626] border border-[#252538] animate-pulse overflow-hidden">
                  <div className="aspect-[2/3] bg-[#1F1F35]" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-[#1F1F35] rounded w-4/5" />
                    <div className="h-2 bg-[#1F1F35] rounded w-1/2" />
                    <div className="h-2 bg-[#1F1F35] rounded w-2/3 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grid */}
          {results.length > 0 && loading !== 'search' && (
            <>
              <p className="text-xs text-gray-600 mb-4">
                {results.length} result{results.length !== 1 ? 's' : ''} for &quot;{query}&quot;
                {loading && <span className="ml-2 text-green-400 animate-pulse">· updating…</span>}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {results.map(movie => (
                  <MovieCard
                    key={movie.title}
                    movie={movie}
                    inWatchlist={isInWatchlist(movie)}
                    onToggleWatchlist={onToggleWatchlist}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
