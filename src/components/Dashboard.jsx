import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAssetStats, getRecentAssets, getNextAvailableCode } from '../lib/assetFunctions';
import Scanner from './Scanner';
import OcrScanner from './OcrScanner';
import AnimatedCounter from './AnimatedCounter';
import Toast from './Toast';
import SkeletonCard from './SkeletonCard';
import ExportButton from './ExportButton';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totale: 0,
    assegnati: 0,
    magazzino: 0,
    manutenzione: 0,
    dismessi: 0
  });
  const [recentAssets, setRecentAssets] = useState([]);
  const [scannedCode, setScannedCode] = useState('');
  const [scannedAsset, setScannedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nextCode, setNextCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);
  const [showWelcome, setShowWelcome] = useState(false);

  // 🔥 PROTEZIONE LOGIN LATO CLIENT 🔥
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) {
          window.location.href = '/login';
          return;
        }
        setUser(data.user);
        setAuthLoading(false);
        loadDashboardData();
        // Mostra toast di benvenuto
        setShowWelcome(true);
        setTimeout(() => setShowWelcome(false), 4000);
      } catch (err) {
        console.error('❌ Errore verifica login:', err);
        window.location.href = '/login';
      }
    };
    checkAuth();
  }, []);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const statsData = await getAssetStats();
      setStats(statsData);
      
      const recentData = await getRecentAssets(10);
      setRecentAssets(recentData);
      
      const code = await getNextAvailableCode();
      setNextCode(code);
    } catch (error) {
      console.error('Errore nel caricamento:', error);
      setToast({ message: '❌ Errore nel caricamento dei dati', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  // 🔥 RICERCA CON SUGGERIMENTI (Typeahead) 🔥
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('asset')
          .select('id, numero_serie, marca, modello, tipo_asset, stato')
          .or(`numero_serie.ilike.%${searchTerm}%, marca.ilike.%${searchTerm}%, modello.ilike.%${searchTerm}%`)
          .limit(5);
        
        if (error) throw error;
        setSuggestions(data || []);
      } catch (error) {
        console.error('Errore suggerimenti:', error);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  async function handleScan(code) {
    setScannedCode(code);
    setScannedAsset(null);
    
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .or(`numero_serie.ilike.%${code}%, codice_univoco.ilike.%${code}%`)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setScannedAsset(data);
        setToast({ 
          message: `✅ Asset trovato: ${data.marca} ${data.modello}`, 
          type: 'success' 
        });
        setTimeout(() => {
          if (confirm(`✅ Asset trovato: ${data.marca} ${data.modello}\nVuoi vedere i dettagli?`)) {
            goToAssetDetail(data.id);
          }
        }, 500);
      } else {
        setScannedAsset(null);
        setToast({ 
          message: `❌ Asset con codice "${code}" non trovato`, 
          type: 'error' 
        });
        if (confirm(`❌ Asset con codice "${code}" non trovato.\nVuoi creare un nuovo asset con questo seriale?`)) {
          window.location.href = `/nuovo-asset?seriale=${code}`;
        }
      }
    } catch (error) {
      console.error('Errore nella scansione:', error);
      setScannedAsset(null);
      setToast({ message: '❌ Errore durante la scansione', type: 'error' });
    }
  }

  async function handleOcrDetected(text) {
    const seriale = text.split(' ')[0] || text;
    setOcrResult(seriale);
    setShowOcr(false);
    
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .ilike('numero_serie', `%${seriale}%`)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setScannedAsset(data);
        setToast({ 
          message: `✅ Asset trovato: ${data.marca} ${data.modello}`, 
          type: 'success' 
        });
        setTimeout(() => goToAssetDetail(data.id), 1000);
      } else {
        setToast({ 
          message: `🔍 Seriale "${seriale}" non trovato`, 
          type: 'warning' 
        });
        if (confirm(`🔍 Seriale "${seriale}" non trovato.\nVuoi creare un nuovo asset con questo seriale?`)) {
          window.location.href = `/nuovo-asset?seriale=${seriale}`;
        }
      }
    } catch (error) {
      console.error('Errore nella ricerca OCR:', error);
      setToast({ message: '❌ Errore nella ricerca del seriale', type: 'error' });
    }
  }

  function goToAssetDetail(assetId) {
    window.location.href = `/asset/${assetId}`;
  }

  async function handleSearch(e) {
    e.preventDefault();
    const term = searchTerm.trim();
    if (!term) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .or(`numero_serie.ilike.%${term}%, marca.ilike.%${term}%, modello.ilike.%${term}%, codice_univoco.ilike.%${term}%, tipo_asset.ilike.%${term}%`)
        .limit(30);
      
      if (error) throw error;
      setSearchResults(data || []);
      if (data && data.length === 0) {
        setToast({ message: '🔍 Nessun risultato trovato', type: 'info' });
      }
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      setSearchResults([]);
      setToast({ message: '❌ Errore durante la ricerca', type: 'error' });
    } finally {
      setIsSearching(false);
      setSuggestions([]);
    }
  }

  const enaipGreen = '#006a4e';
  const enaipBrown = '#8b5a2b';

  // 🕐 SALUTO DINAMICO
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅 Buongiorno';
    if (hour < 18) return '☀️ Buon pomeriggio';
    return '🌙 Buonasera';
  };

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">⏳</div>
          <p className="text-gray-600 dark:text-gray-400">Verifica accesso in corso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="p-4 max-w-7xl mx-auto">
      {/* TOAST DI BENVENUTO */}
      {showWelcome && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-[#006a4e] text-white px-6 py-3 rounded-xl shadow-lg animate-bounce-in">
          👋 {getGreeting()}, {user?.email?.split('@')[0] || 'Admin'}! Benvenuto su Asset ENAIP.
        </div>
      )}

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* HEADER CON BENVENUTO DINAMICO */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 animate-fade-in-down">
        <div>
          <h1 className="text-2xl font-bold text-[#8b5a2b] dark:text-[#c49a6c]">📦 Asset ENAIP Lombardia</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {getGreeting()}, <span className="font-medium text-gray-700 dark:text-gray-300">{user?.email?.split('@')[0] || 'Admin'}</span>
            <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">
              ({new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })})
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showScanner 
                ? 'bg-[#006a4e] text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showScanner ? '📷 Nascondi Scanner' : '📷 Scanner Codici'}
          </button>
          <button
            onClick={() => setShowOcr(!showOcr)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              showOcr 
                ? 'bg-[#8b5a2b] text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {showOcr ? '📷 Nascondi OCR' : '📷 Leggi seriale'}
          </button>
          <ExportButton />
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              notificationsEnabled 
                ? 'bg-[#006a4e] text-white hover:bg-[#005a3e]' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {notificationsEnabled ? '🔔 On' : '🔕 Off'}
          </button>
        </div>
      </div>

      {/* SCANNER (toggle) */}
      {showScanner && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔍 Scansiona un asset</h2>
          <Scanner onDetected={handleScan} />
          {scannedCode && !scannedAsset && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
              <p className="text-yellow-700 dark:text-yellow-400">⏳ Codice "{scannedCode}" rilevato. Cerco in database...</p>
            </div>
          )}
          {scannedAsset && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
              <p className="text-green-700 dark:text-green-400">✅ Asset trovato: <strong>{scannedAsset.marca} {scannedAsset.modello}</strong></p>
              <button 
                className="mt-2 bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-1.5 rounded-lg text-sm transition-all"
                onClick={() => goToAssetDetail(scannedAsset.id)}
              >
                Vedi dettaglio →
              </button>
            </div>
          )}
        </div>
      )}

      {/* OCR (modal) */}
      {showOcr && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
          <div className="max-w-md w-full">
            <OcrScanner 
              onDetected={handleOcrDetected}
              onCancel={() => {
                setShowOcr(false);
                setOcrResult(null);
              }}
              onError={(err) => {
                console.error('OCR Error:', err);
                setToast({ message: '❌ Errore durante il riconoscimento OCR', type: 'error' });
              }}
            />
          </div>
        </div>
      )}

      {ocrResult && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg animate-fade-in-up">
          <p className="text-purple-700 dark:text-purple-400">📝 Testo riconosciuto: <strong>{ocrResult}</strong></p>
        </div>
      )}

      {/* RICERCA CON SUGGERIMENTI (Typeahead) */}
      <div className="mb-6 animate-fade-in-up animation-delay-100">
        <form onSubmit={handleSearch} className="relative flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Cerca per seriale, marca, modello, tipo o codice..."
              className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006a4e] transition-all"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 overflow-hidden">
                {suggestions.map((asset) => (
                  <div
                    key={asset.id}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors flex justify-between items-center"
                    onClick={() => {
                      setSearchTerm(asset.numero_serie || asset.marca || '');
                      setSuggestions([]);
                      goToAssetDetail(asset.id);
                    }}
                  >
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {asset.numero_serie || asset.codice_univoco || 'N/A'}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        {asset.marca} {asset.modello}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">
                        ({asset.tipo_asset})
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      asset.stato === 'Assegnato' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                      'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}>
                      {asset.stato}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit"
            className="bg-[#006a4e] hover:bg-[#005a3e] text-white px-6 py-3 rounded-xl font-medium transition-all"
          >
            Cerca
          </button>
          {searchTerm && (
            <button 
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSearchResults([]);
                setSuggestions([]);
                searchInputRef.current?.focus();
              }}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-xl transition-all"
            >
              ✕
            </button>
          )}
        </form>

        {searchResults.length > 0 && (
          <div className="mt-3 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in-up">
            <h3 className="p-3 font-semibold border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
              Risultati della ricerca ({searchResults.length})
            </h3>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
              {searchResults.map(asset => (
                <li 
                  key={asset.id} 
                  className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => goToAssetDetail(asset.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2">- {asset.marca} {asset.modello}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">({asset.tipo_asset})</span>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      asset.stato === 'Assegnato' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                      'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                    }`}>
                      {asset.stato}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isSearching && (
          <p className="mt-2 text-gray-500 dark:text-gray-400">⏳ Caricamento risultati...</p>
        )}
      </div>

      {/* STATISTICHE - 5 CARD */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900 p-5 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up animation-delay-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-2xl font-bold"><AnimatedCounter value={stats.totale} /></div>
              <div className="text-sm opacity-90">Totale</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 dark:from-green-800 dark:to-green-900 p-5 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up animation-delay-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">👤</span>
            <div>
              <div className="text-2xl font-bold"><AnimatedCounter value={stats.assegnati} /></div>
              <div className="text-sm opacity-90">Assegnati</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 dark:from-yellow-800 dark:to-yellow-900 p-5 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up animation-delay-300">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <div className="text-2xl font-bold"><AnimatedCounter value={stats.magazzino} /></div>
              <div className="text-sm opacity-90">In Magazzino</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-800 dark:to-orange-900 p-5 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up animation-delay-400">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔧</span>
            <div>
              <div className="text-2xl font-bold"><AnimatedCounter value={stats.manutenzione} /></div>
              <div className="text-sm opacity-90">In Manutenzione</div>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 dark:from-red-800 dark:to-red-900 p-5 rounded-xl shadow-lg text-white hover:shadow-xl transition-all hover:scale-[1.02] animate-fade-in-up animation-delay-500">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗑️</span>
            <div>
              <div className="text-2xl font-bold"><AnimatedCounter value={stats.dismessi} /></div>
              <div className="text-sm opacity-90">Dismessi</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 PULSANTI AZIONE - CON SFONDI SEMPRE VISIBILI 🔥 */}
      <div className="flex flex-wrap gap-2 mb-6 animate-fade-in-up animation-delay-300">
        <a href="/nuovo-asset" className="bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          ➕ Nuovo Asset
        </a>
        <a href="/censimento" className="bg-[#8b5a2b] hover:bg-[#7a4a1b] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📋 Censimento Rapido
        </a>
        <a href="/statistiche" className="bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📊 Statistiche
        </a>
        <a href="/storico" className="bg-[#8b5a2b] hover:bg-[#7a4a1b] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📜 Storico
        </a>
        <a href="/admin" className="bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📊 Admin
        </a>
        <a href="/audit" className="bg-[#8b5a2b] hover:bg-[#7a4a1b] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📜 Audit
        </a>
        <a href="/scadenze" className="bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          🔔 Scadenze
        </a>
        <a href="/importa-excel" className="bg-[#8b5a2b] hover:bg-[#7a4a1b] text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg">
          📥 Importa Excel
        </a>
        {nextCode && (
          <span className="bg-gray-100 dark:bg-gray-700 px-4 py-2.5 rounded-xl text-sm flex items-center text-gray-700 dark:text-gray-300">
            🔖 Prossimo codice: <strong className="ml-1">{nextCode}</strong>
          </span>
        )}
      </div>

      {/* ULTIMI ASSET INSERITI */}
      <div className="animate-fade-in-up animation-delay-500">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📋 Ultimi asset inseriti</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {recentAssets.length > 0 && `Mostrando ${recentAssets.length} asset`}
          </span>
        </div>
        {loading ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl divide-y divide-gray-200 dark:divide-gray-700">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recentAssets.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <p className="text-gray-500 dark:text-gray-400">📭 Nessun asset inserito. Inizia a censire!</p>
            <a href="/nuovo-asset" className="mt-3 inline-block bg-[#006a4e] hover:bg-[#005a3e] text-white px-4 py-2 rounded-xl transition-all">➕ Inserisci il primo asset</a>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow rounded-xl divide-y divide-gray-200 dark:divide-gray-700 overflow-hidden">
            {recentAssets.map(asset => (
              <div 
                key={asset.id} 
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2"
                onClick={() => goToAssetDetail(asset.id)}
              >
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                  <span className="text-gray-600 dark:text-gray-400 ml-2">- {asset.marca} {asset.modello}</span>
                  <span className="text-gray-500 dark:text-gray-400 ml-2 text-sm">({asset.tipo_asset})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                    asset.stato === 'Assegnato' ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' :
                    asset.stato === 'In Magazzino' ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300' :
                    asset.stato === 'In Manutenzione' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300' :
                    'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
                  }`}>
                    {asset.stato}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 text-xs">
                    {new Date(asset.created_at).toLocaleDateString('it-IT')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400 dark:text-gray-500">
        <p className="text-[#8b5a2b] dark:text-[#c49a6c] font-medium">ENAIP Lombardia - Sistema di Gestione Asset v1.0</p>
        <p className="text-xs mt-1">{notificationsEnabled ? '🔔 Notifiche attive' : '🔕 Notifiche disattivate'}</p>
      </div>
    </div>
  );
}
