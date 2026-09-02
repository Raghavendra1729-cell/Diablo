import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-3 animate-message-in"
      role="status"
      aria-label="Diablo is thinking"
    >
      <Avatar className="w-7 h-7 shrink-0 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-orange-400">
        <AvatarFallback className="bg-transparent">
          <Bot className="w-4 h-4" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-2xl rounded-tl-sm px-4 py-2.5 flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-400">Thinking</span>
        <div className="flex items-center gap-1 h-3 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" />
        </div>
      </div>
    </div>
  );
}
