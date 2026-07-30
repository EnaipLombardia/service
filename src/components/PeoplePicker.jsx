import { useState, useEffect } from 'react';
import { Client } from '@microsoft/microsoft-graph-client';

export default function PeoplePicker({ onSelect, selectedEmail, disabled, required }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('graphAccessToken');
    setIsLoggedIn(!!token);
  }, []);

  const getGraphClient = () => {
    const accessToken = localStorage.getItem('graphAccessToken');
    if (!accessToken) {
      throw new Error('Access token mancante. Effettua il login.');
    }
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  };

  // 🔥 FILTRO PER DOMINIO ENAIP 🔥
  const isEnaipUser = (user) => {
    const email = user.mail || user.userPrincipalName || '';
    return email.toLowerCase().endsWith('@enaip.lombardia.it');
  };

  const handleLogin = async () => {
    try {
      const { login } = await import('../lib/auth');
      await login();
      setIsLoggedIn(true);
      window.location.reload();
    } catch (e) {
      setError('❌ Errore login: ' + e.message);
      console.error('Errore login:', e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('graphAccessToken');
    localStorage.removeItem('userInfo');
    setIsLoggedIn(false);
    setSelectedUser(null);
    setSearchTerm('');
    setUsers([]);
    if (onSelect) onSelect(null);
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const client = getGraphClient();
      const response = await client
        .api('/users')
        .filter(`startswith(displayName, '${query}') or startswith(userPrincipalName, '${query}')`)
        .select('id,displayName,mail,userPrincipalName,department,jobTitle')
        .top(20)
        .get();

      const enaipUsers = (response.value || []).filter(isEnaipUser);
      setUsers(enaipUsers);

      if (enaipUsers.length === 0 && response.value && response.value.length > 0) {
        setError('🔍 Nessun utente trovato con dominio @enaip.lombardia.it');
      }
    } catch (error) {
      console.error('Errore ricerca utenti:', error);
      if (error.message.includes('accessToken') || error.statusCode === 401) {
        setError('🔑 Sessione scaduta. Effettua di nuovo il login.');
        setIsLoggedIn(false);
        localStorage.removeItem('graphAccessToken');
      } else {
        setError('❌ Errore nella ricerca: ' + error.message);
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.displayName);
    setUsers([]);
    setError(null);
    if (onSelect) onSelect(user);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setError(null);
    if (value.length >= 2 && isLoggedIn) {
      searchUsers(value);
    } else {
      setUsers([]);
    }
  };

  return (
    <div className="relative">
      {error && (
        <div className="mb-2 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      {!isLoggedIn ? (
        <div className="space-y-2">
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            🔑 Accedi con Microsoft 365
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Per cercare i dipendenti, devi autenticarti con il tuo account aziendale.
          </p>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Cerca un dipendente per nome o email..."
            className={`w-full border rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${required && !selectedUser ? 'border-red-500 dark:border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
            disabled={disabled}
          />
          
          {loading && (
            <div className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 p-2">
              <p className="text-gray-500 dark:text-gray-400 text-sm">⏳ Ricerca in corso...</p>
            </div>
          )}

          {users.length > 0 && !loading && (
            <ul className="absolute z-10 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
              {users.map(user => (
                <li
                  key={user.id}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                  onClick={() => handleSelect(user)}
                >
                  <div className="font-medium text-gray-900 dark:text-white">{user.displayName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.mail || user.userPrincipalName}</div>
                  {user.department && (
                    <div className="text-xs text-gray-400 dark:text-gray-500">{user.department}</div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {selectedUser && !users.length && !loading && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800 flex justify-between items-center">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                ✅ Selezionato: <strong>{selectedUser.displayName}</strong>
                <span className="text-gray-500 dark:text-gray-400 ml-2">({selectedUser.mail || selectedUser.userPrincipalName})</span>
              </div>
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setSearchTerm('');
                  if (onSelect) onSelect(null);
                }}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                ✕
              </button>
            </div>
          )}

          <div className="mt-1 flex justify-between items-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              💡 Digita almeno 2 caratteri per avviare la ricerca
            </p>
            <button
              onClick={handleLogout}
              className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              🔓 Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
