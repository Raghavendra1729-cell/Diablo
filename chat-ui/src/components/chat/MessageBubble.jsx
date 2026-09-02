import { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, AlertTriangle, RotateCcw } from 'lucide-react';
import { BookingWidget } from '../widgets/BookingWidget';
import { CalendarWidget } from '../widgets/CalendarWidget';
import { BookingReceipt } from '../widgets/BookingReceipt';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

/* ─── Custom markdown renderers ─── */
function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef(null);
  const language = className?.replace('language-', '') || '';

  const handleCopy = useCallback(() => {
    if (timeout.current) clearTimeout(timeout.current);
    navigator.clipboard.writeText(String(children)).then(() => {
      setCopied(true);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    });
  }, [children]);

  return (
    <div className="group/code relative my-4 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none p-1 rounded hover:bg-zinc-800"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {/* Code body */}
      <pre className="!mt-0 !mb-0 !rounded-none !border-0 !shadow-none !bg-zinc-950 p-4 overflow-x-auto text-sm leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

const markdownComponents = {
  pre: ({ children }) => children,
  code: ({ children, className, node, ...props }) => {
    void node;
    const match = /language-(\w+)/.exec(className || '');
    const hasNewline = String(children).includes('\n');
    if (!match && !hasNewline) {
      return (
        <code
          className="bg-zinc-800/80 text-orange-300 px-1.5 py-0.5 rounded-md text-[0.85em] font-mono border border-zinc-700/50"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

/* ─── MessageBubble Component ─── */
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
  const contentWithoutWidget = contentStr;
  const bookingUI = !isUser && msg.ui?.type === 'booking' ? msg.ui : null;
  const calendarUI = !isUser && msg.ui?.type === 'calendar';
  const hasRichWidget = Boolean(bookingUI || calendarUI || msg.booking_confirmed);
  const timestamp = msg.createdAt
    ? new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' }).format(msg.createdAt)
    : '';

  const handleCopy = useCallback(async () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    try {
      await navigator.clipboard.writeText(contentWithoutWidget.trim());
    } catch {
      const ta = document.createElement('textarea');
      ta.value = contentWithoutWidget.trim();
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setIsCopied(true);
    copyTimeout.current = setTimeout(() => setIsCopied(false), 2000);
  }, [contentWithoutWidget]);

  return (
    <div
      className={`flex items-start gap-3 group animate-message-in ${
        isUser ? 'flex-row-reverse' : ''
      }`}
    >
      {/* Avatar */}
      <Avatar
        className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center shadow-sm ${
          isUser
            ? 'bg-zinc-800 border border-zinc-700 text-zinc-300'
            : 'bg-zinc-900 border border-zinc-800 text-orange-400'
        }`}
      >
        {isUser ? (
          <AvatarFallback className="bg-transparent">
            <User className="w-3.5 h-3.5" aria-label="User" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-transparent">
            <Bot className="w-4 h-4" aria-label="Diablo" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div
        className={`${
          hasRichWidget ? 'max-w-[calc(100%_-_2.5rem)] sm:max-w-[85%]' : 'max-w-[88%] sm:max-w-[78%]'
        } flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5 min-w-0`}
      >
        {/* Bubble */}
        <div
          className={`${
            isUser
              ? 'bg-zinc-800/90 border border-zinc-700/60 text-zinc-100 rounded-2xl rounded-tr-sm shadow-sm'
              : msg.isError
                ? 'bg-rose-950/30 border border-rose-800/50 text-rose-200 rounded-2xl rounded-tl-sm shadow-sm'
                : 'bg-zinc-900/70 border border-zinc-800/70 text-zinc-200 rounded-2xl rounded-tl-sm shadow-sm'
          } px-4 sm:px-5 py-3 sm:py-3.5 overflow-x-auto break-words min-w-0 max-w-full`}
        >
          <div className={`text-[14.5px] leading-relaxed ${isUser ? 'text-zinc-100' : 'chat-prose'} ${msg.isError ? 'flex gap-2.5 items-start' : ''}`}>
            {msg.isError && <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" aria-hidden="true" />}
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {contentWithoutWidget}
            </ReactMarkdown>
          </div>

          {msg.isError && msg.retryText && (
            <button
              type="button"
              onClick={() => onSendMessage(msg.retryText)}
              disabled={isDisabled}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-300 bg-rose-900/30 border border-rose-800/50 hover:bg-rose-900/50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry request
            </button>
          )}

          {/* Booking widget */}
          {bookingUI && (
            <BookingWidget
              date={bookingUI.date}
              slots={bookingUI.slots}
              onConfirm={onSendMessage}
              disabled={isDisabled}
            />
          )}

          {/* Calendar widget */}
          {calendarUI && (
            <CalendarWidget onConfirm={onSendMessage} disabled={isDisabled} />
          )}

          {/* Booking receipt */}
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

        {/* Meta row: timestamp + copy */}
        <div
          className={`flex items-center gap-1.5 px-1 ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          {timestamp && (
            <span
              className="text-[11px] text-zinc-500 select-none font-mono"
              aria-hidden="true"
            >
              {timestamp}
            </span>
          )}
          {!isUser && !msg.isError && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 opacity-70 group-hover:opacity-100 transition-all focus:opacity-100"
              title="Copy message"
              aria-label="Copy message"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
