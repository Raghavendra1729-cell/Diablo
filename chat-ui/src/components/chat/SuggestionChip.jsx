import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Code2, Boxes } from 'lucide-react';

const ICONS = {
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  code: Code2,
  projects: Boxes,
};

export function SuggestionChip({ suggestion, index, onClick }) {
  const Icon = ICONS[suggestion.icon] || Code2;
  return (
    <button
      type="button"
      onClick={onClick}
      className="suggestion-chip group text-left focus:outline-none focus:ring-2 focus:ring-accent/50"
    >
      <span className="suggestion-index" aria-hidden="true">0{index}</span>
      <span className="suggestion-icon"><Icon className="w-4 h-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] sm:text-sm font-semibold text-primary transition-colors">
          {suggestion.title}
        </span>
        <span className="block text-[11px] sm:text-xs text-secondary mt-0.5">
          {suggestion.description}
        </span>
      </span>
      <ArrowUpRight className="suggestion-arrow" aria-hidden="true" />
    </button>
  );
}
