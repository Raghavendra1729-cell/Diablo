import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Code2, Boxes } from 'lucide-react';

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
      className="suggestion-card group flex items-start gap-3.5 p-4 rounded-xl border border-white/[0.07] bg-zinc-900/50 hover:bg-zinc-900/90 hover:border-orange-500/40 transition-all text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50"
    >
      <span className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0 group-hover:bg-orange-500/20 transition-all mt-0.5">
        <Icon className="w-4 h-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {suggestion.title}
          </span>
          <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" aria-hidden="true" />
        </span>
        <span className="block text-xs text-zinc-400 group-hover:text-zinc-300 mt-1 leading-relaxed">
          {suggestion.description}
        </span>
      </span>
    </button>
  );
}
