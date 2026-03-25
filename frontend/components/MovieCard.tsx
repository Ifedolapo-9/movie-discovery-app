'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Bookmark, BookmarkCheck, Star, ChevronDown, ChevronUp } from 'lucide-react';
import clsx from 'clsx';
import type { Movie } from '@/types';

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ value }: { value: number }) {
  const rating = value / 2; // 0–10 → 0–5
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => {
          const filled = i <= Math.floor(rating);
          const half   = !filled && i <= Math.ceil(rating) && (rating % 1) >= 0.3;
          return (
            <Star
              key={i}
              size={11}
              className={clsx(
                filled ? 'fill-yellow-400 text-yellow-400' :
                half   ? 'fill-yellow-400/40 text-yellow-400' :
                         'text-gray-700',
              )}
            />
          );
        })}
      </div>
      <span className="text-[11px] text-gray-500 tabular-nums">{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Genre Tags ───────────────────────────────────────────────────────────────

function GenreTags({ genres }: { genres: string }) {
  const list = useMemo(() => {
    try {
      return (JSON.parse(genres || '[]') as { id: number; name: string }[]).slice(0, 3);
    } catch {
      return [] as { id: number; name: string }[];
    }
  }, [genres]);

  if (!list.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {list.map(g => (
        <span
          key={g.id}
          className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20"
        >
          {g.name}
        </span>
      ))}
    </div>
  );
}

// ─── MovieCard ────────────────────────────────────────────────────────────────

interface MovieCardProps {
  movie: Movie;
  inWatchlist: boolean;
  onToggleWatchlist: (movie: Movie) => void;
}

export default function MovieCard({ movie, inWatchlist, onToggleWatchlist }: MovieCardProps) {
  const [explainOpen, setExplainOpen] = useState(false);

  return (
    <div className="flex flex-col rounded-xl bg-[#161626] border border-[#252538] hover:border-green-500/30 transition-all duration-200 overflow-hidden group">

      {/* ── Poster ── */}
      <div className="relative aspect-[2/3] w-full bg-[#0E0E1A] overflow-hidden flex-shrink-0">
        {movie.poster ? (
          <Image
            src={movie.poster}
            alt={movie.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-xs">
            No Poster
          </div>
        )}

        {/* Year badge */}
        {movie.release_year && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/75 text-[10px] text-gray-300 backdrop-blur-sm">
            {movie.release_year}
          </span>
        )}

        {/* Watchlist button */}
        <button
          onClick={() => onToggleWatchlist(movie)}
          className={clsx(
            'absolute top-2 right-2 p-1.5 rounded-lg backdrop-blur-sm transition-all',
            inWatchlist
              ? 'bg-green-500/30 text-green-400'
              : 'bg-black/50 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-green-400 hover:bg-green-500/20',
          )}
          aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          {inWatchlist ? <BookmarkCheck size={13} /> : <Bookmark size={13} />}
        </button>
      </div>

      {/* ── Info ── */}
      <div className="p-3 flex flex-col flex-1 min-h-0">
        <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2">
          {movie.title}
        </h3>

        <StarRating value={movie.vote_average} />
        <GenreTags genres={movie.genres} />

        <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed flex-1">
          {movie.description}
        </p>

        {/* AI explanation (collapsible) */}
        {movie.explanation && (
          <div className="mt-2 pt-2 border-t border-[#252538]">
            <button
              onClick={() => setExplainOpen(v => !v)}
              className="flex items-center gap-1 text-[11px] text-green-400 hover:text-green-300 transition-colors"
            >
              <span>✨ AI Explanation</span>
              {explainOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {explainOpen && (
              <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed bg-green-500/5 rounded-lg p-2 border border-green-500/10">
                {movie.explanation}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
