import { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check } from 'lucide-react';
import { BookingWidget } from '../widgets/BookingWidget';
import { CalendarWidget } from '../widgets/CalendarWidget';
import { BookingReceipt } from '../widgets/BookingReceipt';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const widgetRegex = /\[BOOKING_WIDGET\s+date="([^"]+)"\s+slots="([^"]*)"\]/;
const calendarWidgetRegex = /\[CALENDAR_WIDGET\]/;

export const MessageBubble = memo(function MessageBubble({ msg, onSendMessage, isDisabled }) {
  const isUser = msg.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef(null);
  
  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const contentStr = typeof msg.content === 'string' ? msg.content : '';

  const match = !isUser ? contentStr.match(widgetRegex) : null;
  const calendarMatch = !isUser ? contentStr.match(calendarWidgetRegex) : null;
  
  let contentWithoutWidget = contentStr;
  if (match) contentWithoutWidget = contentWithoutWidget.replace(widgetRegex, '');
  if (calendarMatch) contentWithoutWidget = contentWithoutWidget.replace(calendarWidgetRegex, '');

  const handleCopy = useCallback(async () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    const handleSuccess = () => {
      setIsCopied(true);
      copyTimeout.current = setTimeout(() => setIsCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(contentWithoutWidget);
      handleSuccess();
    } catch {
      const ta = document.createElement('textarea');
      ta.value = contentWithoutWidget;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      handleSuccess();
    }
  }, [contentWithoutWidget]);

  return (
    <div className={`flex items-start gap-3 group animate-message-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <Avatar className={`w-8 h-8 shrink-0 shadow-sm ${isUser ? 'bg-elevated border border-border/50' : 'bg-gradient-to-br from-accent to-accent2 avatar-pulse'}`}>
        {isUser ? (
          <AvatarFallback className="bg-transparent"><User className="w-[15px] h-[15px] text-secondary/70" aria-label="User" /></AvatarFallback>
        ) : (
          <AvatarFallback className="bg-transparent"><Bot className="w-[15px] h-[15px] text-blue-900" aria-label="Diablo" /></AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div className={`max-w-[82%] sm:max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1 min-w-0`}>
        {/* Bubble */}
        <div className={`${
          isUser
            ? 'bg-gradient-to-br from-accent to-accent2 text-blue-900 rounded-[24px] rounded-tr-[4px] shadow-lg shadow-accent/20'
            : 'glass rounded-[24px] rounded-bl-[4px] shadow-md'
        } px-6 py-4.5 overflow-x-auto break-words min-w-0 max-w-full relative group/bubble transition-transform hover:-translate-y-0.5`}>
          <div className={`text-[15px] leading-relaxed ${
            isUser ? 'text-blue-900' : 'chat-prose'
          }`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentWithoutWidget}</ReactMarkdown>
          </div>
          
          {match && !isUser && (
             <BookingWidget 
               date={match[1]} 
               slotsStr={match[2]} 
               onConfirm={onSendMessage} 
               disabled={isDisabled}
             />
          )}

          {calendarMatch && !isUser && (
             <CalendarWidget onConfirm={onSendMessage} disabled={isDisabled} />
          )}

          {msg.booking_confirmed && msg.booking_details && (
             <BookingReceipt 
               id={msg.booking_details.booking_id}
               date={msg.booking_details.date}
               time={msg.booking_details.time}
               email={msg.booking_details.email}
               meet_url={msg.booking_details.meet_url}
               onAction={onSendMessage}
               disabled={isDisabled}
             />
          )}
        </div>

        {/* Meta row */}
        <div className={`flex items-center gap-2 px-1 opacity-100 sm:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-[10px] text-secondary/40 select-none font-medium uppercase tracking-wide" aria-hidden="true">just now</span>
          {!isUser && (
            <button
              type="button"
              onClick={handleCopy}
              className="text-secondary/40 hover:text-accent focus:outline-none focus:text-accent transition-all hover:scale-110 active:scale-90"
              title="Copy"
              aria-label="Copy message"
            >
              {isCopied
                ? <Check className="w-[12px] h-[12px]" />
                : <Copy className="w-[12px] h-[12px]" />
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
