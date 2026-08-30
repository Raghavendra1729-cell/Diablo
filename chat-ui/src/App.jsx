import { useEffect } from 'react';
import { Bot, ChevronDown, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { useChat } from './models/useChat';
import { useServiceStatus } from './models/useServiceStatus';
import { EdgeGlows } from './components/chat/EdgeGlows';
import { StatusDot } from './components/chat/StatusDot';
import { EmptyState } from './components/chat/EmptyState';
import { MessageBubble } from './components/chat/MessageBubble';
import { TypingIndicator } from './components/chat/TypingIndicator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const SUGGESTIONS = [
  { title: 'Why hire Linga?', description: 'Evidence-backed candidate brief', icon: 'briefcase' },
  { title: 'Technical strengths', description: 'Skills, systems, and engineering depth', icon: 'code' },
  { title: 'Book an interview', description: 'Check live availability', icon: 'calendar' },
  { title: 'Explore his projects', description: 'Architecture and implementation details', icon: 'projects' },
];

const STATUS_COPY = {
  checking: 'Checking services',
  online: 'All systems ready',
  degraded: 'Portfolio search limited',
  offline: 'Service unavailable',
};

export default function App() {
  const serviceStatus = useServiceStatus();
  const {
    messages,
    input,
    setInput,
    loading,
    showScrollBtn,
    chatRef,
    textareaRef,
    messagesEndRef,
    scrollToBottom,
    sendMessage,
    handleSubmit,
    handleKeyDown,
  } = useChat();

  useEffect(() => {
    document.title = "Diablo | AI Portfolio Concierge";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Explore Linga Seetha Rama Raghavendra's engineering work and interview availability with Diablo.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Explore Linga Seetha Rama Raghavendra's engineering work and interview availability with Diablo.";
      document.head.appendChild(meta);
    }
  }, []);

  const hasMessages = messages.length > 0;

  return (
    <div className="app-shell h-[100dvh] flex flex-col text-primary overflow-hidden selection:bg-accent/20 selection:text-primary">
      <EdgeGlows />

      {/* ─── Header ─── */}
      <header className="shrink-0 px-4 sm:px-6 py-3.5 header-glass z-20">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <Avatar className="w-10 h-10 shadow-md avatar-pulse bg-gradient-to-br from-accent to-accent2">
                <AvatarFallback className="bg-transparent"><Bot className="w-5 h-5 text-white" /></AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-[2px] -right-[2px]">
                  <StatusDot status={serviceStatus} />
              </span>
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-bold tracking-tight text-primary">Diablo</h1>
                <p className="text-[11px] text-secondary font-medium mt-0.5">
                  {STATUS_COPY[serviceStatus]}
                </p>
            </div>
          </div>
          <div className="identity-pill text-[10px] sm:text-[11px] uppercase tracking-[0.16em] font-semibold flex items-center px-3 py-1.5 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-accent" />
            <span className="hidden sm:inline">Portfolio intelligence</span>
            <Sparkles className="w-3.5 h-3.5 sm:hidden text-accent" />
          </div>
        </div>
      </header>

      {/* ─── Chat ─── */}
      <main ref={chatRef} className="flex-1 overflow-y-auto scroll-smooth z-10">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-7 min-h-full flex flex-col relative">
          {!hasMessages && !loading && (
            <EmptyState suggestions={SUGGESTIONS} onSelect={sendMessage} />
          )}

          <div role="log" aria-live="polite" aria-atomic="false" className={`w-full ${hasMessages ? 'space-y-6 pb-2' : (loading ? 'flex-1 flex items-center justify-center' : 'hidden')}`}>
            {messages.map((msg, idx) => (
              <MessageBubble key={`${idx}-${msg.role}`} msg={msg} onSendMessage={sendMessage} isDisabled={idx !== messages.length - 1 || loading} />
            ))}
            {loading && <TypingIndicator />}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ─── Scroll FAB ─── */}
      {showScrollBtn && (
        <Button
          variant="secondary"
          size="icon"
          onClick={() => scrollToBottom()}
          className="fab fixed bottom-28 right-6 sm:right-8 w-11 h-11 flex items-center justify-center z-20 rounded-full"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </Button>
      )}

      {/* ─── Input ─── */}
      <footer className="composer-footer shrink-0 px-3 sm:px-6 pb-4 sm:pb-6 pt-3 z-20">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-3 input-wrap px-4 sm:px-5 py-3 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Diablo about Linga's work or availability..."
                className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-1.5 text-[15px] text-primary placeholder-secondary/50 scrollbar-none leading-relaxed font-medium min-w-0"
                rows={1}
                disabled={loading}
                aria-label="Message input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-send disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/50 w-11 h-11 flex items-center justify-center"
                aria-label="Send Message"
              >
                <Send className="w-5 h-5 translate-x-px translate-y-px drop-shadow-md" />
              </button>
            </div>
            <p className="text-center mt-3 text-[10px] text-secondary/40 uppercase tracking-widest font-semibold select-none flex items-center justify-center gap-2">
              <span className="w-4 h-[1px] bg-secondary/20"></span>
              Grounded in Linga's portfolio
              <span className="w-4 h-[1px] bg-secondary/20"></span>
            </p>
          </form>
        </div>
      </footer>
    </div>
  );
}
