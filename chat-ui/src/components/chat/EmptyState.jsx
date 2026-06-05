import { Bot } from 'lucide-react';
import { StatusDot } from './StatusDot';
import { SuggestionChip } from './SuggestionChip';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 relative z-10 mt-10">
      {/* Avatar */}
      <div className="relative mb-10 avatar-float group cursor-default">
        <div className="absolute inset-0 bg-accent/20 rounded-[2.5rem] blur-2xl group-hover:bg-accent/40 transition-colors duration-500"></div>
        <div className="w-28 h-28 rounded-[2.5rem] glass-elevated flex items-center justify-center relative z-10">
          <div className="w-20 h-20 rounded-[1.8rem] bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-105 transition-transform duration-500">
             <Bot className="w-10 h-10 text-white drop-shadow-md" />
          </div>
        </div>
        <div className="absolute -top-2 -right-2 z-20">
          <StatusDot />
        </div>
      </div>

      {/* Greeting */}
      <h2 className="text-4xl sm:text-5xl font-display font-bold mb-5 tracking-tight leading-snug text-primary drop-shadow-sm">
        Hey there, I am <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-accent2">Diablo</span>
      </h2>

      <p className="text-lg text-secondary max-w-md leading-relaxed mb-12 animate-fade-in font-medium px-4">
        I am Linga Seetha Rama Raghavendra's personal AI. Let me help you get
        to know my master better — ask me about their background, skills,
        experience, or book an interview.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((text) => (
          <SuggestionChip key={text} text={text} onClick={() => onSelect(text)} />
        ))}
      </div>
    </div>
  );
}
