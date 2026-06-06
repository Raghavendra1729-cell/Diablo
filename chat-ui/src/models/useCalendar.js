import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

export function useCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const fetchSlots = async (selectedDate) => {
    if (!selectedDate) {
      setSlots([]);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    setSlots([]);
    try {
      const res = await axios.get(`${API_URL}/v1/calendar/slots?date=${selectedDate}`);
      if (isMounted.current) setSlots(res.data.slots || []);
    } catch (err) {
      if (isMounted.current) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : 'Failed to fetch slots.');
      }
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  return { slots, loading, error, fetchSlots, setSlots, setError };
}
