import { CalendarCheck2, Flame, GitFork, Trophy } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-3xl mx-auto w-full z-10 animate-fade-in text-center">
      {/* Brand Badge */}
      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800/80 text-xs font-medium text-zinc-400 mb-6 shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>Diablo Concierge</span>
        <span className="text-zinc-600">·</span>
        <span className="text-zinc-400">Live Portfolio & Interview Agent</span>
      </div>

      {/* Hero Icon */}
      <div className="w-14 h-14 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-orange-400 shadow-xl mb-4 shadow-orange-500/5">
        <Flame className="w-7 h-7" />
      </div>

      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 max-w-lg mb-3">
        Explore Linga's engineering depth and availability.
      </h2>

      {/* Subtitle */}
      <p className="text-sm sm:text-[15px] text-zinc-400 max-w-xl leading-relaxed mb-8">
        Ask Diablo about architecture decisions across 24+ GitHub repositories, inspect production AI agent implementations, or schedule an interview directly.
      </p>

      {/* Suggestion Cards 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mb-8">
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion.title}
            suggestion={suggestion}
            onClick={() => onSelect(suggestion.title)}
          />
        ))}
      </div>

      {/* Proof row badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-zinc-500">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
          <GitFork className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-300">24+</span> Repositories
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
          <Trophy className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-300">900+</span> Problems Solved
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
          <CalendarCheck2 className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-300">Live</span> Cal.com Sync
        </div>
      </div>
    </div>
  );
}
