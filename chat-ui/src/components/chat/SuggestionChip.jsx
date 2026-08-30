import { BriefcaseBusiness, CalendarDays, Code2, Boxes } from 'lucide-react';

const ICONS = {
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  code: Code2,
  projects: Boxes,
};

export function SuggestionChip({ suggestion, onClick }) {
  const Icon = ICONS[suggestion.icon] || Code2;
  return (
    <button
      type="button"
      onClick={onClick}
      className="suggestion-chip group text-left focus:outline-none focus:ring-2 focus:ring-accent/50"
    >
      <span className="suggestion-icon"><Icon className="w-4 h-4" /></span>
      <span className="min-w-0">
        <span className="block text-[13px] sm:text-sm font-semibold text-primary group-hover:text-accent transition-colors">
          {suggestion.title}
        </span>
        <span className="block text-[11px] sm:text-xs text-secondary/70 mt-0.5 truncate">
          {suggestion.description}
        </span>
      </span>
    </button>
  );
}
