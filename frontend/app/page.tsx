'use client';

import { useState } from 'react';
import type { Movie, ViewMode } from '@/types';
import { SidebarProvider } from '@/components/AppSidebar';
import AppSidebar from '@/components/AppSidebar';
import SearchView from '@/components/SearchView';
import ChatView from '@/components/ChatView';

export default function Home() {
  const [view, setView]           = useState<ViewMode>('search');
  const [watchlist, setWatchlist] = useState<Movie[]>([]);

  const toggleWatchlist = (movie: Movie) =>
    setWatchlist(prev =>
      prev.some(m => m.title === movie.title)
        ? prev.filter(m => m.title !== movie.title)
        : [...prev, movie],
    );

  const removeFromWatchlist = (title: string) =>
    setWatchlist(prev => prev.filter(m => m.title !== title));

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-[#0E0E1A]">
        <AppSidebar
          view={view}
          onViewChange={setView}
          watchlist={watchlist}
          onRemoveFromWatchlist={removeFromWatchlist}
        />
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
          {view === 'search' ? (
            <SearchView watchlist={watchlist} onToggleWatchlist={toggleWatchlist} />
          ) : (
            <ChatView />
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
