import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Code2, Boxes } from 'lucide-react';

const ICONS = {
  briefcase: BriefcaseBusiness,
  calendar: CalendarDays,
  code: Code2,
  projects: Boxes,
};

const COLOR_MAP = {
  briefcase: 'bg-[#ffde59]',
  code: 'bg-[#38bdf8]',
  calendar: 'bg-[#ff5c00]',
  projects: 'bg-[#4ade80]',
};

export function SuggestionChip({ suggestion, onClick }) {
  const Icon = ICONS[suggestion.icon] || Code2;
  const colorBg = COLOR_MAP[suggestion.icon] || 'bg-[#ffde59]';

  return (
    <button
      type="button"
      onClick={onClick}
      className="suggestion-card group flex items-start gap-3.5 p-4 rounded-xl border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000] hover:bg-[#fffdf7] text-left w-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
    >
      <span className={`w-9 h-9 rounded-xl ${colorBg} border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000] mt-0.5 text-black`}>
        <Icon className="w-4.5 h-4.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-black">
            {suggestion.title}
          </span>
          <ArrowUpRight className="w-4 h-4 text-black group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" aria-hidden="true" />
        </span>
        <span className="block text-xs text-zinc-700 font-medium mt-1 leading-relaxed">
          {suggestion.description}
        </span>
      </span>
    </button>
  );
}
