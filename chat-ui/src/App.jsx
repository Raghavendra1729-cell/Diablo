import { useState, useRef, useEffect, useCallback, memo, useLayoutEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, ChevronDown, Copy, Check, Sparkles } from 'lucide-react';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

/* ─── Hooks ─── */

// useCopy removed - handled locally in MessageBubble for better performance

function useAutoResize(ref, value) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }, [value, ref]);
}

/* ─── Sub-components ─── */

function StatusDot() {
  return (
    <span className="relative inline-flex w-[10px] h-[10px] align-middle">
      <span className="status-ring bg-success/30" style={{ animationDelay: '0s' }} />
      <span className="status-ring bg-success/20" style={{ animationDelay: '0.8s' }} />
      <span className="relative w-[10px] h-[10px] rounded-full bg-success shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-message-in" role="status" aria-label="Assistant is typing">
      <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-md avatar-pulse">
        <Bot className="w-[15px] h-[15px] text-white" />
      </div>
      <div className="bg-elevated border border-border backdrop-blur-md rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
        <span className="text-xs font-semibold text-secondary/70 tracking-wide uppercase">Thinking</span>
        <div className="flex items-center gap-1 h-3">
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function SuggestionChip({ text, onClick }) {
  return <button type="button" onClick={onClick} className="suggestion-chip truncate focus:outline-none focus:ring-2 focus:ring-accent/50" title={text}>{text}</button>;
}



function BookingReceipt({ id, date, time, email, meet_url, onAction, disabled }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl bg-surface backdrop-blur-md border border-accent/20 shadow-sm animate-pop-in">
      <div className="bg-gradient-to-r from-success/90 to-success text-white px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
          <Check className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[13px] font-bold tracking-wide uppercase">Booking Confirmed</h3>
          <p className="text-[11px] text-white/90 font-medium tracking-wider">ID: {id}</p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium flex-1 min-w-0">{date}</span>
        </div>
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium flex-1 min-w-0">{time}</span>
        </div>
        <div className="flex items-center gap-3 text-sm w-full">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <span className="text-primary/90 font-medium break-all flex-1 min-w-0">{email}</span>
        </div>
        {meet_url && (
          <div className="flex items-center gap-3 text-sm pt-2 border-t border-border/50 mt-3 w-full">
             <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
               <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
               </svg>
             </div>
             <a href={meet_url} target="_blank" rel="noopener noreferrer" aria-label="Join Meeting (opens in a new tab)" className="text-accent hover:text-accent2 font-semibold underline decoration-2 underline-offset-2 transition-colors break-all focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-sm">
               Join Meeting
             </a>
          </div>
        )}
        <div className="flex gap-3 pt-3 border-t border-border/50 mt-3 w-full">
          <button 
            type="button"
            disabled={disabled}
            onClick={() => onAction && onAction(`Cancel my meeting for ${date} at ${time}.`)} 
            className="flex-1 py-2 text-xs font-bold text-danger border border-danger/30 rounded-xl hover:bg-danger/10 transition-colors focus:outline-none focus:ring-2 focus:ring-danger/50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel Meeting
          </button>
          <button 
            type="button"
            disabled={disabled}
            onClick={() => onAction && onAction(`Reschedule my meeting on ${date} at ${time}.`)} 
            className="flex-1 py-2 text-xs font-bold text-accent border border-accent/30 rounded-xl hover:bg-accent/10 transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="mt-4 p-4 bg-surface backdrop-blur-md border border-accent/20 rounded-2xl shadow-sm">
      <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider mb-3">Schedule Meeting for {date}</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div role="group" aria-labelledby={`booking-time-label-${date}`}>
          <div id={`booking-time-label-${date}`} className="text-xs font-semibold text-secondary mb-1.5 block">Select a Time</div>
          <div className="flex flex-wrap gap-2">
            {slots.map(slot => (
              <button
                key={slot}
                type="button"
                aria-pressed={selectedSlot === slot}
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  selectedSlot === slot 
                    ? 'bg-accent text-white shadow-md' 
                    : 'bg-elevated text-primary border border-border hover:border-accent/50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
        
        {selectedSlot && (
          <div className="space-y-2 pt-2 animate-slide-up">
            <input 
              type="text" 
              required 
              placeholder="Your Full Name" 
              aria-label="Your Full Name"
              className="w-full px-3 py-2 text-sm bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={disabled}
            />
            <input 
              type="email" 
              required 
              placeholder="Your Email Address" 
              aria-label="Your Email Address"
              className="w-full px-3 py-2 text-sm bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={disabled}
            />
            <button 
              type="submit"
              disabled={disabled}
              className="w-full mt-2 bg-gradient-to-r from-accent to-accent2 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Confirm Meeting
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
    if (!selectedDate) return;
    setLoading(true);
    setError('');
    setSlots([]);
    setSelectedSlot('');
    try {
      const res = await axios.get(`${API_URL}/v1/calendar/slots?date=${selectedDate}`);
      setSlots(res.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch slots.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const d = e.target.value;
    setDate(d);
    fetchSlots(d);
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
    <div className="mt-4 p-4 bg-surface backdrop-blur-md border border-accent/20 rounded-2xl shadow-sm">
      <h3 className="text-[13px] font-bold text-accent uppercase tracking-wider mb-3">Schedule a Meeting</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="calendar-date" className="text-xs font-semibold text-secondary mb-1.5 block">Select a Date</label>
          <input 
            id="calendar-date"
            type="date" 
            required 
            min={localToday}
            disabled={disabled}
            className="w-full px-3 py-2 text-sm bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
            value={date}
            onChange={handleDateChange}
          />
        </div>

        {loading && <p className="text-xs font-medium text-secondary animate-pulse" role="status">Loading available slots...</p>}
        {error && <p className="text-xs font-medium text-red-500" role="alert">{error}</p>}
        
        {date && !loading && !error && slots.length === 0 && (
          <p className="text-xs font-medium text-secondary" role="status">No slots available on this date.</p>
        )}

        {date && slots.length > 0 && (
          <div className="animate-slide-up" role="group" aria-labelledby="calendar-time-label">
            <div id="calendar-time-label" className="text-xs font-semibold text-secondary mb-1.5 block">Select a Time</div>
            <div className="flex flex-wrap gap-2">
              {slots.map(slot => (
                <button
                  key={slot}
                  type="button"
                  aria-pressed={selectedSlot === slot}
                  onClick={() => setSelectedSlot(slot)}
                  disabled={disabled}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                    selectedSlot === slot 
                      ? 'bg-accent text-white shadow-md' 
                      : 'bg-elevated text-primary border border-border hover:border-accent/50'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {selectedSlot && (
          <div className="space-y-2 pt-2 animate-slide-up border-t border-border/50 mt-3">
            <input 
              type="text" 
              required 
              placeholder="Your Full Name" 
              aria-label="Your Full Name"
              disabled={disabled}
              className="w-full px-3 py-2 text-sm bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <input 
              type="email" 
              required 
              placeholder="Your Email Address" 
              aria-label="Your Email Address"
              disabled={disabled}
              className="w-full px-3 py-2 text-sm bg-elevated border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button 
              type="submit"
              disabled={disabled || loading}
              className="w-full mt-2 bg-gradient-to-r from-accent to-accent2 text-white font-semibold py-2 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Confirm Meeting
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

const widgetRegex = /\[BOOKING_WIDGET\s+date="([^"]+)"\s+slots="([^"]+)"\]/;
const calendarWidgetRegex = /\[CALENDAR_WIDGET\]/;

const MessageBubble = memo(function MessageBubble({ msg, idx, onSendMessage, isDisabled }) {
  const isUser = msg.role === 'user';
  const [isCopied, setIsCopied] = useState(false);
  const copyTimeout = useRef(null);
  
  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    const handleSuccess = () => {
      setIsCopied(true);
      copyTimeout.current = setTimeout(() => setIsCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(msg.content);
      handleSuccess();
    } catch {
      const ta = document.createElement('textarea');
      ta.value = msg.content;
      ta.style.cssText = 'position:fixed;opacity:0;';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      handleSuccess();
    }
  }, [msg.content]);

  // Extract Booking Widget or Calendar Widget tag if present
  const match = !isUser ? msg.content.match(widgetRegex) : null;
  const calendarMatch = !isUser ? msg.content.match(calendarWidgetRegex) : null;
  
  let contentWithoutWidget = msg.content || '';
  if (match) contentWithoutWidget = contentWithoutWidget.replace(widgetRegex, '');
  if (calendarMatch) contentWithoutWidget = contentWithoutWidget.replace(calendarWidgetRegex, '');

  return (
    <div className={`flex items-start gap-3 group animate-message-in ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center shadow-sm ${
        isUser
          ? 'bg-elevated border border-border/50'
          : 'bg-gradient-to-br from-accent to-accent2 avatar-pulse'
      }`}>
        {isUser
          ? <User className="w-[15px] h-[15px] text-secondary/70" aria-label="User" />
          : <Bot className="w-[15px] h-[15px] text-white" aria-label="Diablo" />
        }
      </div>

      {/* Content */}
      <div className={`max-w-[82%] sm:max-w-[72%] flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1 min-w-0`}>
        {/* Bubble */}
        <div className={`${
          isUser
            ? 'bg-gradient-to-br from-accent to-accent2 text-white rounded-[20px] rounded-tr-sm shadow-md'
            : 'bg-ai-bg border border-border backdrop-blur-md rounded-2xl rounded-bl-sm shadow-sm'
        } px-5 py-4 overflow-x-auto break-words min-w-0 max-w-full`}>
          <div className={`text-[15px] leading-relaxed ${
            isUser ? 'text-white' : 'chat-prose'
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

function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
      {/* Avatar */}
      <div className="relative mb-8 avatar-float">
        <div className="w-24 h-24 rounded-[2rem] bg-elevated border border-border shadow-xl flex items-center justify-center backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-inner">
             <Bot className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1">
          <StatusDot />
        </div>
      </div>

      {/* Greeting */}
      <h2 className="text-3xl font-display font-semibold mb-4 tracking-tight leading-snug text-primary">
        Hey there, I am <span className="text-accent">Diablo</span>
      </h2>

      <p className="text-base text-secondary max-w-md leading-relaxed mb-10 animate-fade-in font-medium">
        I am Linga Seetha Rama Raghavendra's personal butler. Let me help you get
        to know my master better — ask me about their background, skills,
        experience, or book an interview.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {suggestions.map((text) => (
          <SuggestionChip key={text} text={text} onClick={() => onSelect(text)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Edge Corner Glows ─── */

function EdgeGlows() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2]" aria-hidden="true">
      {/* Corner gradients — static ambient glow */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px]" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(59,130,246,0.1) 0%, transparent 65%)',
      }} />
      <div className="absolute top-1/2 -right-32 w-[400px] h-[400px]" style={{
        background: 'radial-gradient(circle at 50% 50%, rgba(168,85,247,0.06) 0%, transparent 65%)',
      }} />
    </div>
  );
}

/* ─── App ─── */

const SUGGESTIONS = [
  'Tell me about your master',
  'What skills does he have?',
  'Book an interview',
  'His experience & projects',
];

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const loadingRef = useRef(loading);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  useAutoResize(textareaRef, input);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
    fn();
    el.addEventListener('scroll', fn, { passive: true });
    return () => el.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loadingRef.current) return;
    const userMsg = text.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const history = messagesRef.current.map((m) => ({ role: m.role, content: m.content }));
      const res = await axios.post(`${API_URL}/v1/chat`, {
        message: userMsg, history, channel: 'web',
      });
      const { response: aiText, booking_confirmed, booking_details } = res.data;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: aiText || '', booking_confirmed, booking_details },
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Unable to reach the server.';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `**Connection error** — ${detail}\n\nMake sure the backend is running at \`${API_URL}\`.` },
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
    <div className="h-[100dvh] flex flex-col text-primary overflow-hidden selection:bg-accent/20 selection:text-primary">

      <EdgeGlows />

      {/* ─── Header ─── */}
      <header className="shrink-0 px-5 sm:px-6 py-4 header-glass z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center shadow-md avatar-pulse">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-[2px] -right-[2px]">
                <StatusDot />
              </span>
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-bold tracking-tight text-primary">Diablo</h1>
              <p className="text-[11px] text-secondary font-medium flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                At your service
              </p>
            </div>
          </div>
          <div className="text-secondary/60 text-[11px] uppercase tracking-widest font-semibold flex items-center bg-surface px-3 py-1.5 rounded-full border border-border shadow-sm backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 inline-block align-middle mr-1.5 text-accent" />
            <span className="hidden sm:inline align-middle">Butler &bull; Personal AI</span>
          </div>
        </div>
      </header>

      {/* ─── Chat ─── */}
      <main ref={chatRef} className="flex-1 overflow-y-auto scroll-smooth z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-h-full flex flex-col relative">
          {!hasMessages && !loading && (
            <EmptyState suggestions={SUGGESTIONS} onSelect={sendMessage} />
          )}

          <div role="log" aria-live="polite" aria-atomic="false" className={`w-full ${hasMessages ? 'space-y-6 pb-2' : (loading ? 'flex-1 flex items-center justify-center' : 'hidden')}`}>
            {messages.map((msg, idx) => (
              <MessageBubble key={`${idx}-${msg.role}`} msg={msg} idx={idx} onSendMessage={sendMessage} isDisabled={idx !== messages.length - 1 || loading} />
            ))}
            {loading && <TypingIndicator />}
          </div>

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ─── Scroll FAB ─── */}
      {showScrollBtn && (
        <button
          type="button"
          onClick={() => scrollToBottom()}
          className="fab fixed bottom-28 right-6 sm:right-8 w-11 h-11 flex items-center justify-center z-20 rounded-full focus:outline-none focus:ring-2 focus:ring-accent/50"
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="w-5 h-5" />
        </button>
      )}

      {/* ─── Input ─── */}
      <footer className="shrink-0 px-4 sm:px-6 pb-6 pt-4 z-20">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit}>
            <div className="flex items-end gap-3 input-wrap px-4 py-3 focus-within:ring-2 focus-within:ring-accent/50 rounded-2xl transition-shadow">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about my master..."
                className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 focus:outline-none resize-none py-1.5 text-[15px] text-primary placeholder-secondary/50 scrollbar-none leading-relaxed font-medium min-w-0"
                rows={1}
                disabled={loading}
                aria-label="Message input"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-send disabled:opacity-40 disabled:cursor-not-allowed mb-0.5 shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/50 rounded-lg p-1"
                aria-label="Send Message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-center mt-3 text-[10px] text-secondary/40 uppercase tracking-widest font-semibold select-none flex items-center justify-center gap-2">
              <span className="w-4 h-[1px] bg-secondary/20"></span>
              Diablo &mdash; at your service
              <span className="w-4 h-[1px] bg-secondary/20"></span>
            </p>
          </form>
        </div>
      </footer>
    </div>
  );
}
