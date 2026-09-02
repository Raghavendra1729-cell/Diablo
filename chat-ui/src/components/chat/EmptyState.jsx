import { Flame } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 max-w-2xl mx-auto w-full z-10 animate-fade-in text-center">
      {/* Brand Sticker Box */}
      <div className="w-14 h-14 rounded-2xl bg-[#ffde59] border-2 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-black mb-4">
        <Flame className="w-7 h-7" />
      </div>

      {/* Greeting */}
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-black mb-2">
        Hey, I'm <span className="underline decoration-4 decoration-[#ff5c00] underline-offset-4">Diablo</span>
      </h2>

      {/* Intro */}
      <p className="text-sm sm:text-base text-zinc-700 font-medium max-w-lg leading-relaxed mb-8">
        I'm Linga's personal AI assistant. Ask me about his engineering background, technical skills, open-source projects, or book an interview.
      </p>

      {/* 2x2 Suggestion Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full">
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
