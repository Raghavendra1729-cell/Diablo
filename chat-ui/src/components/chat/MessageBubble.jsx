import { useState, useRef, useEffect, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, AlertTriangle, RotateCcw, ArrowUpRight } from 'lucide-react';
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
    <div className="group/code relative my-3 rounded-xl overflow-hidden border-2 border-black bg-[#18181b] shadow-[3px_3px_0px_0px_#000]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#27272a] border-b-2 border-black">
        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-200 font-bold">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-zinc-300 hover:text-white transition-colors focus:outline-none p-1 rounded hover:bg-zinc-700 cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#4ade80]" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      {/* Code body */}
      <pre className="!mt-0 !mb-0 !rounded-none !border-0 !shadow-none !bg-[#18181b] p-4 overflow-x-auto text-sm leading-relaxed text-zinc-100">
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
          className="bg-[#ffde59] text-black px-1.5 py-0.5 rounded text-[0.85em] font-mono font-bold border-[1.5px] border-black shadow-[1px_1px_0px_0px_#000]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return <CodeBlock className={className}>{children}</CodeBlock>;
  },
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-black font-bold underline decoration-2 underline-offset-2 hover:bg-[#ffde59] px-1 rounded transition-colors"
    >
      <span>{children}</span>
      <ArrowUpRight className="w-3.5 h-3.5 inline-block" aria-hidden="true" />
    </a>
  ),
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
        className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_#000] ${
          isUser
            ? 'bg-white text-black'
            : 'bg-[#ffde59] text-black'
        }`}
      >
        {isUser ? (
          <AvatarFallback className="bg-transparent">
            <User className="w-4 h-4" aria-label="User" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-transparent">
            <Bot className="w-4.5 h-4.5" aria-label="Diablo" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content */}
      <div
        className={`${
          hasRichWidget ? 'max-w-[calc(100%_-_2.75rem)] sm:max-w-[85%]' : 'max-w-[88%] sm:max-w-[80%]'
        } flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1.5 min-w-0`}
      >
        {/* Bubble */}
        <div
          className={`${
            isUser
              ? 'bg-[#ffde59] border-2 border-black text-black font-medium rounded-2xl rounded-tr-sm shadow-[3px_3px_0px_0px_#000]'
              : msg.isError
                ? 'bg-[#fee2e2] border-2 border-black text-red-950 rounded-2xl rounded-tl-sm shadow-[3px_3px_0px_0px_#000]'
                : 'bg-white border-2 border-black text-black rounded-2xl rounded-tl-sm shadow-[4px_4px_0px_0px_#000]'
          } px-4 sm:px-5 py-3 sm:py-3.5 overflow-x-auto break-words min-w-0 max-w-full`}
        >
          <div className={`text-[14.5px] leading-relaxed ${isUser ? 'text-black' : 'chat-prose'} ${msg.isError ? 'flex gap-2.5 items-start' : ''}`}>
            {msg.isError && <AlertTriangle className="w-4.5 h-4.5 mt-0.5 shrink-0 text-red-600" aria-hidden="true" />}
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
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-yellow-200 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
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
              className="text-[11px] text-zinc-500 font-mono font-medium"
              aria-hidden="true"
            >
              {timestamp}
            </span>
          )}
          {!isUser && !msg.isError && (
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md border border-black bg-white shadow-[1.5px_1.5px_0px_0px_#000] hover:bg-[#ffde59] text-black transition-all cursor-pointer"
              title="Copy message"
              aria-label="Copy message"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-[#15803d]" />
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
