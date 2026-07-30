import { useState, useEffect } from 'react';
import { Client } from '@microsoft/microsoft-graph-client';

export default function PeoplePicker({ onSelect, selectedEmail, disabled }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Inizializza il client Graph
  const getGraphClient = () => {
    // Assicurati di avere il token di accesso (dovrai implementare il login)
    const accessToken = localStorage.getItem('graphAccessToken');
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setLoading(true);
    try {
      const client = getGraphClient();
      const response = await client
        .api('/users')
        .filter(`startswith(displayName, '${query}') or startswith(userPrincipalName, '${query}')`)
        .select('id,displayName,mail,userPrincipalName,department,jobTitle')
        .top(10)
        .get();

      setUsers(response.value);
    } catch (error) {
      console.error('Errore ricerca utenti:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user) => {
    setSelectedUser(user);
    setSearchTerm(user.displayName);
    setUsers([]);
    if (onSelect) onSelect(user);
  };

  useEffect(() => {
    if (selectedEmail) {
      // Carica l'utente selezionato
      const loadUser = async () => {
        try {
          const client = getGraphClient();
          const response = await client
            .api(`/users/${selectedEmail}`)
            .select('id,displayName,mail,userPrincipalName')
            .get();
          setSelectedUser(response);
          setSearchTerm(response.displayName);
        } catch (error) {
          console.error('Errore caricamento utente:', error);
        }
      };
      loadUser();
    }
  }, [selectedEmail]);

  return (
    <div className="relative">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          searchUsers(e.target.value);
        }}
        placeholder="Cerca un dipendente per nome o email..."
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {selectedUser && !users.length && (
        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            ✅ Selezionato: <strong>{selectedUser.displayName}</strong>
            <span className="text-gray-500 dark:text-gray-400 ml-2">({selectedUser.mail || selectedUser.userPrincipalName})</span>
          </div>
        </div>
      )}
    </div>
  );
}
