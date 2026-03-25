import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Movie Discovery — Weaviate',
  description: 'AI-powered movie discovery with Weaviate vector search',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased bg-[#0E0E1A] text-white`}>
        {children}
      </body>
    </html>
  );
}
