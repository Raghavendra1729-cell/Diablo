import { Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TypingIndicator() {
  return (
    <div
      className="flex items-start gap-3 animate-message-in"
      role="status"
      aria-label="Assistant is typing"
    >
      <Avatar className="w-8 h-8 shrink-0 bg-gradient-to-br from-accent to-accent2 shadow-md avatar-pulse">
        <AvatarFallback className="bg-transparent">
          <Bot className="w-[15px] h-[15px] text-white" />
        </AvatarFallback>
      </Avatar>
      <div className="glass rounded-[20px] rounded-tl-sm px-5 py-3 shadow-sm flex items-center gap-3">
        <span className="text-[11px] font-bold text-secondary tracking-widest uppercase">
          Thinking
        </span>
        <div className="flex items-center gap-1.5 h-3">
          <div className="typing-dot" style={{ animationDelay: '0ms' }} />
          <div className="typing-dot" style={{ animationDelay: '150ms' }} />
          <div className="typing-dot" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
