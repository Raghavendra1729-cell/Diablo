import { Flame } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-3 animate-message-in"
      role="status"
      aria-label="Diablo is thinking"
    >
      <Avatar className="w-8 h-8 shrink-0 rounded-xl bg-[#ffde59] border-2 border-black shadow-[2px_2px_0px_0px_#000] flex items-center justify-center text-black">
        <AvatarFallback className="bg-transparent">
          <Flame className="w-4.5 h-4.5" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-white border-2 border-black shadow-[3px_3px_0px_0px_#000] rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs font-bold text-black uppercase tracking-wider">Thinking</span>
        <div className="flex items-center gap-1.5 h-3 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-bounce" />
        </div>
      </div>
    </div>
  );
}
