import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

export function useCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMounted = useRef(true);
  const requestId = useRef(0);
  const activeRequest = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      activeRequest.current?.abort();
    };
  }, []);

  const fetchSlots = async (selectedDate) => {
    if (!selectedDate) {
      activeRequest.current?.abort();
      requestId.current += 1;
      setSlots([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    setSlots([]);
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    const currentRequest = ++requestId.current;
    try {
      const res = await axios.get(`${API_URL}/v1/calendar/slots`, {
        params: { date: selectedDate },
        signal: controller.signal,
        timeout: 20000,
      });
      if (isMounted.current && currentRequest === requestId.current) {
        setSlots(Array.isArray(res.data?.slots) ? res.data.slots : []);
      }
    } catch (err) {
      if (err.code === 'ERR_CANCELED') return;
      if (isMounted.current && currentRequest === requestId.current) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Failed to fetch slots.');
      }
    } finally {
      if (isMounted.current && currentRequest === requestId.current) setLoading(false);
    }
  };

  return { slots, loading, error, fetchSlots, setSlots, setError };
}
