import { useState, useRef, useEffect, useCallback, memo, useLayoutEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

function useAutoResize(ref, value) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }, [value, ref]);
}

function StatusText() {
  return (
    <div className="flex items-center gap-2 text-[10px] tracking-widest uppercase font-semibold text-accent">
      <span className="w-1.5 h-1.5 bg-accent rounded-none shadow-[0_0_8px_rgba(205,160,119,0.5)]"></span>
      Online
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex flex-col gap-1 animate-message-in px-4 sm:px-6 mt-6" role="status" aria-label="Assistant is typing">
      <span className="text-[10px] uppercase tracking-[0.2em] font-display font-semibold text-accent mb-2">Diablo</span>
      <div className="flex items-center gap-2 h-4">
        <div className="typing-dot" style={{ animationDelay: '0ms' }} />
        <div className="typing-dot" style={{ animationDelay: '200ms' }} />
        <div className="typing-dot" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick }) {
  return <button type="button" onClick={onClick} className="suggestion-chip" title={text}>{text}</button>;
}

function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-8 border border-border bg-surface p-6 sm:p-8 animate-fade-in rounded-none">
      <div className="border-b border-border pb-5 mb-6">
        <h3 className="text-sm font-display font-semibold tracking-wider uppercase text-accent">Booking Confirmed</h3>
        <p className="text-xs text-secondary mt-2">Ref: {id}</p>
      </div>
      <div className="space-y-5 text-sm font-light">
        <div className="flex items-center justify-between">
          <span className="text-secondary uppercase text-[10px] tracking-widest font-semibold">Date</span>
          <span className="text-primary">{date}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-secondary uppercase text-[10px] tracking-widest font-semibold">Time</span>
          <span className="text-primary">{time}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-secondary uppercase text-[10px] tracking-widest font-semibold">Email</span>
          <span className="text-primary">{email}</span>
        </div>
        {meet_url && (
          <div className="pt-5 border-t border-border flex justify-end">
             <a href={meet_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:text-primary transition-colors text-[11px] tracking-widest uppercase font-semibold flex items-center gap-2">
               Join Meeting <ArrowRight className="w-3 h-3" />
             </a>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-border mt-2">
          <button 
            type="button"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)} 
            className="flex-1 py-3 text-[11px] tracking-widest uppercase font-semibold text-secondary hover:text-primary border border-border hover:border-primary transition-all disabled:opacity-50 rounded-none cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="button"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)} 
            className="flex-1 py-3 text-[11px] tracking-widest uppercase font-semibold text-base bg-accent hover:bg-primary transition-all disabled:opacity-50 rounded-none cursor-pointer"
          >
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingWidget({ date, slotsStr, onConfirm, disabled }) {
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const slots = slotsStr ? slotsStr.split(',').map(s => s.trim()).filter(Boolean) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedSlot && name && email && !disabled) {
      onConfirm(`Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`);
    }
  };

  return (
    <div className="mt-8 border border-border bg-surface p-6 sm:p-8">
      <h3 className="text-sm font-display font-semibold tracking-[0.15em] uppercase text-accent mb-6 border-b border-border pb-4">Schedule for {date}</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-4 block">Select Time</span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {slots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`py-3 text-xs font-medium border transition-all rounded-none cursor-pointer ${
                  selectedSlot === slot 
                    ? 'border-accent bg-accent text-base' 
                    : 'border-border text-primary hover:border-accent'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
        
        {selectedSlot && (
          <div className="space-y-6 pt-6 border-t border-border animate-slide-up">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-2 block">Name</span>
              <input 
                type="text" required placeholder="John Doe" 
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-accent transition-colors text-primary placeholder-border rounded-none"
                value={name} onChange={e => setName(e.target.value)} disabled={disabled}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-2 block">Email Address</span>
              <input 
                type="email" required placeholder="john@example.com" 
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-accent transition-colors text-primary placeholder-border rounded-none"
                value={email} onChange={e => setEmail(e.target.value)} disabled={disabled}
              />
            </div>
            <button 
              type="submit" disabled={disabled}
              className="w-full mt-6 bg-primary text-base tracking-[0.2em] uppercase font-semibold text-[11px] py-4 hover:bg-accent hover:text-base transition-colors disabled:opacity-50 rounded-none cursor-pointer"
            >
              Confirm Appointment
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function CalendarWidget({ onConfirm, disabled }) {
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = async (selectedDate) => {
    if (!selectedDate) {
      setSlots([]); setSelectedSlot(''); setError(''); return;
    }
    setLoading(true); setError(''); setSlots([]); setSelectedSlot('');
    try {
      const res = await axios.get(`${API_URL}/v1/calendar/slots?date=${selectedDate}`);
      setSlots(res.data.slots || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to fetch availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const d = e.target.value; setDate(d); fetchSlots(d);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (date && selectedSlot && name && email && !disabled) {
      onConfirm(`Let's do ${date} at ${selectedSlot}. My name is ${name} and my email is ${email}.`);
    }
  };

  const today = new Date();
  const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

  return (
    <div className="mt-8 border border-border bg-surface p-6 sm:p-8">
      <h3 className="text-sm font-display font-semibold tracking-[0.15em] uppercase text-accent mb-6 border-b border-border pb-4">Schedule Meeting</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="calendar-date" className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-3 block">Select Date</label>
          <input 
            id="calendar-date" type="date" required min={localToday} disabled={disabled}
            className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-accent transition-colors text-primary rounded-none"
            value={date} onChange={handleDateChange}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {loading && <p className="text-[11px] tracking-widest uppercase font-semibold text-accent italic">Retrieving Slots...</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
        {date && !loading && !error && slots.length === 0 && <p className="text-xs text-secondary italic">No availability.</p>}

        {date && slots.length > 0 && (
          <div className="animate-slide-up">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-4 block">Select Time</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {slots.map(slot => (
                <button
                  key={slot} type="button" onClick={() => setSelectedSlot(slot)} disabled={disabled}
                  className={`py-3 text-xs font-medium border transition-all rounded-none cursor-pointer ${
                    selectedSlot === slot ? 'border-accent bg-accent text-base' : 'border-border text-primary hover:border-accent'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedSlot && (
          <div className="space-y-6 pt-6 border-t border-border animate-slide-up">
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-2 block">Name</span>
              <input 
                type="text" required placeholder="Your Name" disabled={disabled}
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-accent transition-colors text-primary placeholder-border rounded-none"
                value={name} onChange={e => setName(e.target.value)}
              />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-secondary mb-2 block">Email Address</span>
              <input 
                type="email" required placeholder="your@email.com" disabled={disabled}
                className="w-full bg-transparent border-b border-border py-2 text-sm focus:outline-none focus:border-accent transition-colors text-primary placeholder-border rounded-none"
                value={email} onChange={e => setEmail(e.target.value)}
              />
            </div>
            <button 
              type="submit" disabled={disabled || loading}
              className="w-full mt-6 bg-primary text-base tracking-[0.2em] uppercase font-semibold text-[11px] py-4 hover:bg-accent hover:text-base transition-colors disabled:opacity-50 rounded-none cursor-pointer"
            >
              Confirm Appointment
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const widgetRegex = /\[BOOKING_WIDGET\s+date="([^"]+)"\s+slots="([^"]*)"\]/;
const calendarWidgetRegex = /\[CALENDAR_WIDGET\]/;

const MessageBubble = memo(function MessageBubble({ msg, idx, onSendMessage, isDisabled }) {
  const isUser = msg.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef(null);
  
  useEffect(() => {
    return () => { if (copyTimeout.current) clearTimeout(copyTimeout.current); };
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
      ta.value = contentWithoutWidget; ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta); handleSuccess();
    }
  }, [contentWithoutWidget]);

  return (
    <div className={`group animate-message-in px-4 sm:px-6 w-full ${isUser ? 'py-10 bg-surface border-y border-border' : 'py-10'}`}>
      <div className={`max-w-4xl mx-auto flex flex-col ${isUser ? 'items-end text-right' : 'items-start text-left'}`}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          {isUser ? (
             <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">Inquiry</span>
          ) : (
             <span className="text-[10px] uppercase tracking-[0.2em] font-display font-semibold text-accent">Diablo</span>
          )}
        </div>

        {/* Content */}
        <div className={`w-full max-w-3xl ${isUser ? 'text-primary' : 'chat-prose'}`}>
          {isUser ? (
             <div className="text-xl font-light leading-relaxed tracking-wide">{contentWithoutWidget}</div>
          ) : (
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{contentWithoutWidget}</ReactMarkdown>
          )}
          
          {match && !isUser && (
             <BookingWidget date={match[1]} slotsStr={match[2]} onConfirm={onSendMessage} disabled={isDisabled} />
          )}

          {calendarMatch && !isUser && (
             <CalendarWidget onConfirm={onSendMessage} disabled={isDisabled} />
          )}

          {msg.booking_confirmed && msg.booking_details && (
             <BookingReceipt 
               id={msg.booking_details.booking_id} date={msg.booking_details.date} time={msg.booking_details.time}
               email={msg.booking_details.email} meet_url={msg.booking_details.meet_url}
               onAction={onSendMessage} disabled={isDisabled}
             />
          )}
        </div>

        {/* Actions */}
        {!isUser && (
          <div className="mt-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button" onClick={handleCopy}
              className="text-[10px] uppercase tracking-widest font-semibold text-secondary hover:text-accent transition-colors flex items-center gap-2 cursor-pointer"
              title="Copy"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4 mt-20 sm:mt-32">
      <h1 className="text-6xl sm:text-8xl font-display italic text-primary mb-8 tracking-tight opacity-90">
        Diablo.
      </h1>
      <p className="text-sm sm:text-base text-secondary max-w-xl leading-loose mb-16 font-light">
        A personal intelligence interface for Linga Seetha Rama Raghavendra.<br/>
        Inquire about his background, experience, or arrange a meeting.
      </p>
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
        {suggestions.map((text) => (
          <SuggestionChip key={text} text={text} onClick={() => onSelect(text)} />
        ))}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  'Why hire Linga?',
  'What skills does he have?',
  'Book an interview',
  'His experience & projects',
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const loadingRef = useRef(loading);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  useEffect(() => {
    document.title = "Diablo | Personal Intelligence";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Personal intelligence interface for Linga Seetha Rama Raghavendra.");
    } else {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = "Personal intelligence interface for Linga Seetha Rama Raghavendra.";
      document.head.appendChild(meta);
    }
  }, []);

  useAutoResize(textareaRef, input);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loadingRef.current) return;
    const userMsg = text.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    if (userMsg.length > 2000) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Message exceeds allowed length.' }]);
      setLoading(false);
      return;
    }

    try {
      const history = [...messagesRef.current, { role: 'user', content: userMsg }]
          .map((m) => ({ role: m.role, content: m.content }));
      const res = await axios.post(`${API_URL}/v1/chat`, {
        message: userMsg, history, channel: 'web',
      });
      const { response: aiText, booking_confirmed, booking_details } = res.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiText || '', booking_confirmed, booking_details },
      ]);
    } catch (err) {
      const rawDetail = err.response?.data?.detail;
      const detail = typeof rawDetail === 'string' ? rawDetail : (rawDetail ? JSON.stringify(rawDetail) : err.message || 'Server unreachable.');
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Error:** ${detail}` },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }, []);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="h-[100dvh] flex flex-col bg-base text-primary overflow-hidden">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-base z-20">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-2xl font-display font-semibold tracking-wide italic text-primary">Diablo.</h1>
          <StatusText />
        </div>
      </header>

      {/* Chat Area */}
      <main ref={chatRef} className="flex-1 overflow-y-auto scroll-smooth z-10 w-full relative">
        <div className="min-h-full flex flex-col">
          {!hasMessages && !loading && (
            <EmptyState suggestions={SUGGESTIONS} onSelect={sendMessage} />
          )}

          <div role="log" aria-live="polite" className={`w-full ${hasMessages ? 'pb-12' : (loading ? 'flex-1 flex flex-col justify-end pb-12' : 'hidden')}`}>
            {messages.map((msg, idx) => (
              <MessageBubble key={`${idx}-${msg.role}`} msg={msg} idx={idx} onSendMessage={sendMessage} isDisabled={idx !== messages.length - 1 || loading} />
            ))}
            {loading && (
              <div className="max-w-4xl mx-auto w-full">
                <TypingIndicator />
              </div>
            )}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="shrink-0 px-4 sm:px-6 pb-8 pt-6 bg-base border-t border-border z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="input-wrap flex items-end p-2 pl-6">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Inquire..."
                className="flex-1 max-h-40 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-4 text-[15px] text-primary placeholder-secondary font-light scrollbar-none"
                rows={1}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-send w-14 h-14 flex items-center justify-center shrink-0 disabled:opacity-20 disabled:cursor-not-allowed ml-4"
                aria-label="Send"
              >
                <ArrowRight className="w-5 h-5 text-base" />
              </button>
            </div>
            <div className="mt-4 flex justify-between items-center px-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-medium">Intelligence Engine</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-secondary font-medium">Strictly Confidential</span>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}

