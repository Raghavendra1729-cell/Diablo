import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

export function useCalendar() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setSlots(res.data.slots || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to fetch slots.');
    } finally {
      setLoading(false);
    }
  };

  return { slots, loading, error, fetchSlots, setSlots, setError };
}
