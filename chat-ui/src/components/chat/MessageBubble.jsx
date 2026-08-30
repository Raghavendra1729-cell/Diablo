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
    <div className="group/code relative my-4 rounded-xl overflow-hidden border border-slate-700/50 shadow-lg">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-slate-500 hover:text-slate-300 transition-colors focus:outline-none focus:text-accent"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {/* Code */}
      <pre className="!mt-0 !mb-0 !rounded-none !border-0 !shadow-none !bg-slate-900/90">
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
          className="bg-slate-100 text-rose-700 px-1.5 py-0.5 rounded-md text-[0.85em] font-medium font-mono border border-slate-200"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
};

/* ─── Component ─── */
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
        className={`w-8 h-8 shrink-0 shadow-sm ${
          isUser
            ? 'bg-white border border-border'
            : 'bg-gradient-to-br from-accent to-accent2 avatar-pulse'
        }`}
      >
        {isUser ? (
          <AvatarFallback className="bg-transparent">
            <User className="w-[15px] h-[15px] text-secondary/60" aria-label="User" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-transparent">
            <Bot className="w-[15px] h-[15px] text-white" aria-label="Diablo" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div
        className={`${hasRichWidget ? 'max-w-[calc(100%_-_2.75rem)] sm:max-w-[84%]' : 'max-w-[88%] sm:max-w-[72%]'} flex flex-col ${
          isUser ? 'items-end' : 'items-start'
        } gap-1 min-w-0`}
      >
        {/* Bubble */}
        <div
          className={`${
            isUser
              ? 'bg-gradient-to-br from-accent to-accent2 text-white rounded-[24px] rounded-tr-[4px] shadow-lg shadow-accent/20'
              : msg.isError
                ? 'error-card rounded-[20px] rounded-bl-[4px]'
                : 'glass rounded-[24px] rounded-bl-[4px] shadow-sm'
          } px-4 sm:px-5 py-3.5 sm:py-4 overflow-x-auto break-words min-w-0 max-w-full relative group/bubble transition-transform hover:-translate-y-0.5`}
        >
          <div className={`text-[15px] leading-relaxed ${isUser ? 'text-white' : 'chat-prose'} ${msg.isError ? 'flex gap-2.5 items-start' : ''}`}>
            {msg.isError && <AlertTriangle className="w-4 h-4 mt-1 shrink-0 text-danger" aria-hidden="true" />}
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
              className="retry-button mt-3"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
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
          className={`message-meta flex items-center gap-1 px-1 transition-opacity duration-200 ${
            isUser ? 'flex-row-reverse' : ''
          }`}
        >
          <span
            className="text-[10px] text-secondary/40 select-none font-medium uppercase tracking-wide"
            aria-hidden="true"
          >
            {timestamp}
          </span>
          {!isUser && !msg.isError && (
            <button
              type="button"
              onClick={handleCopy}
              className="copy-button text-secondary/50 hover:text-accent focus:outline-none focus:text-accent transition-all active:scale-90"
              title="Copy message"
              aria-label="Copy message"
            >
              {isCopied ? (
                <Check className="w-[12px] h-[12px]" />
              ) : (
                <Copy className="w-[12px] h-[12px]" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
