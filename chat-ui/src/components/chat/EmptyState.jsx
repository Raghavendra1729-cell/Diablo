import { Flame } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full z-10 animate-fade-in text-center">
      {/* Brand Icon */}
      <div className="w-13 h-13 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400 shadow-xl mb-4">
        <Flame className="w-6 h-6" />
      </div>

      {/* Greeting */}
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100 mb-2.5">
        Hey, I'm <span className="text-orange-400">Diablo</span>
      </h2>

      {/* Intro */}
      <p className="text-sm sm:text-base text-zinc-400 max-w-lg leading-relaxed mb-8">
        I'm Linga's personal AI assistant. Ask me about his engineering background, technical skills, open-source projects, or book an interview.
      </p>

      {/* 2x2 Suggestion Grid */}
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
