import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          window.location.href = '/login';
          return;
        }
        setIsAuthenticated(true);
      } catch (err) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) {
    return <div className="p-4 text-center">⏳ Verifica accesso...</div>;
  }

  return isAuthenticated ? children : null;
}
