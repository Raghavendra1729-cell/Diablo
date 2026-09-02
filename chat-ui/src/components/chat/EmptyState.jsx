import { Flame, User } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';

export function EmptyState({ suggestions, onSelect, onOpenProfile }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full z-10 animate-fade-in text-center">
      {/* Brand Icon */}
      <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400 shadow-xl mb-5">
        <Flame className="w-7 h-7" />
      </div>

      {/* Greeting */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-3">
        Hey there, I'm <span className="text-orange-400">Diablo</span>
      </h2>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed mb-5">
        I'm Linga Seetha Rama Raghavendra's personal AI assistant. Let me help you get to know him better — ask me about his background, technical skills, projects, or book an interview.
      </p>

      {/* Quick Profile Pill */}
      {onOpenProfile && (
        <div className="flex items-center justify-center mb-7">
          <button
            type="button"
            onClick={onOpenProfile}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:text-white hover:border-orange-500/40 hover:bg-zinc-850 transition-all cursor-pointer shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-orange-400" />
            <span>Quick Candidate Profile (BITS & Scaler, Stack, Highlights)</span>
          </button>
        </div>
      )}

      {/* Suggestion Cards 2x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
        {suggestions.map((suggestion) => (
          <SuggestionChip
            key={suggestion.title}
            suggestion={suggestion}
            onClick={() => onSelect(suggestion.title)}
          />
        ))}
      </div>
    </div>
  );
}
