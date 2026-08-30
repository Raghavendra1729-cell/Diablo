import { SuggestionChip } from './SuggestionChip';
import heroGraphic from '@/assets/hero.png';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="empty-state flex-1 flex flex-col items-center justify-start sm:justify-center text-center px-1 sm:px-4 relative z-10 py-3 sm:py-6">
      <div className="hero-mark relative mb-3 sm:mb-5" aria-hidden="true">
        <div className="hero-orbit" />
        <img src={heroGraphic} alt="" className="w-20 h-20 sm:w-28 sm:h-28 object-contain relative z-10" />
      </div>

      <p className="hero-eyebrow mb-2">AI portfolio concierge</p>
      <h2 className="text-[2rem] sm:text-5xl font-display font-bold mb-3 tracking-[-0.04em] leading-[1.05] text-primary">
        Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">Diablo</span>
      </h2>

      <p className="text-sm sm:text-[17px] text-secondary max-w-xl leading-relaxed mb-4 sm:mb-6 animate-fade-in font-medium px-2">
        Explore Linga Seetha Rama Raghavendra's engineering work, technical depth,
        and live interview availability through one focused assistant.
      </p>

      <div className="capability-strip mb-4 sm:mb-6" aria-label="Capabilities">
        <span>Portfolio intelligence</span>
        <span>Project architecture</span>
        <span>Interview scheduling</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl">
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
