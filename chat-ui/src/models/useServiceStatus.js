import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');

export function useServiceStatus() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const controller = new AbortController();

    axios.get(`${API_URL}/ready`, { signal: controller.signal, timeout: 8000 })
      .then((response) => setStatus(response.data?.ready === true ? 'online' : 'degraded'))
      .catch((error) => {
        if (error.code === 'ERR_CANCELED') return;
        setStatus(error.response ? 'degraded' : 'offline');
      });

    return () => controller.abort();
  }, []);

  return status;
}
