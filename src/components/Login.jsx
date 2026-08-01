import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js');
      const supabase = createClient(
        'https://bpjdjigfworwvyrgwsqh.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwamRqaWdmd29ydnZ5cmd3c3FoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMDIxMjEsImV4cCI6MjEwMDg3ODEyMX0.ZKaUnOhz6LZ6X2eVExgvedHek_NSaUWnUht5_KI1Dbk'
      );
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });

      if (error) throw error;
      
      setMessage('✅ Login effettuato!');
      setTimeout(() => window.location.href = '/', 1000);
      
    } catch (error) {
      setMessage('❌ ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-[#8b5a2b] dark:text-[#c49a6c] mb-6">🔐 Accesso</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: '#006a4e', color: 'white' }}
            className="w-full py-2 rounded hover:opacity-80 transition"
          >
            {loading ? '⏳ Caricamento...' : 'Accedi'}
          </button>
          {message && (
            <div className={`p-3 rounded ${message.includes('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}