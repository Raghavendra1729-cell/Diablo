import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import axios from 'axios';
import { parseChatResponse } from '@/lib/chatResponse';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

export function useAutoResize(ref, value) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 128) + 'px';
  }, [value, ref]);
}

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const messagesRef = useRef(messages);
  const loadingRef = useRef(loading);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  useEffect(() => {
    if (messages.length > 0 || loading) scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    const el = chatRef.current;
    if (!el) return;
    const fn = () => setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150);
    fn();
    el.addEventListener('scroll', fn, { passive: true });
    return () => el.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) textareaRef.current?.focus();
  }, []);

  useAutoResize(textareaRef, input);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim() || loadingRef.current) return;
    const userMsg = text.trim();
    setInput('');

    loadingRef.current = true; // Sync lock prevents rapid click double-fire
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg, createdAt: Date.now() }]);

    if (userMsg.length > 2000) {
      if (isMounted.current) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Message too long. Please keep it under 2000 characters.',
          isError: true,
          createdAt: Date.now(),
        }]);
        setLoading(false);
      }
      loadingRef.current = false;
      return;
    }

    try {
      const history = [...messagesRef.current, { role: 'user', content: userMsg }]
          .filter((message) => !message.isError)
          .map((m) => ({
            role: m.role,
            content: m.booking_details ? `${m.content}\n[Booking ID: ${m.booking_details.booking_id}]` : m.content
          }))
          .slice(-20);
      const res = await axios.post(`${API_URL}/v1/chat`, {
        message: userMsg, history, channel: 'web',
      }, { timeout: 35000 });
      const parsed = parseChatResponse(res.data);
      if (isMounted.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: parsed.response,
            ui: parsed.ui,
            booking_confirmed: parsed.bookingConfirmed,
            booking_details: parsed.bookingDetails,
            createdAt: Date.now(),
          },
        ]);
      }
    } catch (err) {
      if (isMounted.current) {
        const isRateLimited = err.response?.status === 429;
        const detail = isRateLimited
          ? 'Diablo is handling several requests. Please wait a moment and retry.'
          : 'Diablo could not complete that request. Your message was not lost.';
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: detail,
            isError: true,
            retryText: userMsg,
            createdAt: Date.now(),
          },
        ]);
      }
    } finally {
      loadingRef.current = false;
      if (isMounted.current) {
        setLoading(false);
        textareaRef.current?.focus();
      }
    }
  }, []);

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return {
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
  };
}
