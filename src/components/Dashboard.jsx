import { useState, useEffect } from 'react';
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

  useEffect(() => {
    loadDashboardData();
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
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <h1 className="text-2xl font-bold text-enaip-brown dark:text-enaip-brown-light">📦 Asset ENAIP Lombardia</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showScanner ? 'bg-enaip-green text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showScanner ? '📷 Nascondi Scanner' : '📷 Scanner Codici'}
          </button>
          <button
            onClick={() => setShowOcr(!showOcr)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              showOcr ? 'bg-enaip-brown text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {showOcr ? '📷 Nascondi OCR' : '📷 Leggi seriale'}
          </button>
          <ExportButton />
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              notificationsEnabled 
                ? 'bg-enaip-green text-white hover:bg-enaip-green/80' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {notificationsEnabled ? '🔔 On' : '🔕 Off'}
          </button>
        </div>
      </div>
      
      {showScanner && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔍 Scansiona un asset</h2>
          <Scanner onDetected={handleScan} />
          
          {scannedCode && !scannedAsset && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
              <p className="text-yellow-700 dark:text-yellow-400">
                ⏳ Codice "{scannedCode}" rilevato. Cerco in database...
              </p>
            </div>
          )}
          
          {scannedAsset && (
            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded">
              <p className="text-green-700 dark:text-green-400">
                ✅ Asset trovato: <strong>{scannedAsset.marca} {scannedAsset.modello}</strong>
                <br />
                <span className="text-sm">Seriale: {scannedAsset.numero_serie}</span>
                <button 
                  className="ml-3 bg-enaip-green hover:bg-enaip-green/80 text-white px-3 py-1 rounded text-sm transition-colors"
                  onClick={() => goToAssetDetail(scannedAsset.id)}
                >
                  Vedi dettaglio
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {showOcr && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded">
          <p className="text-purple-700 dark:text-purple-400">
            📝 Testo riconosciuto: <strong>{ocrResult}</strong>
          </p>
        </div>
      )}

      <div className="mb-4 relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Cerca per seriale, marca, modello, tipo o codice..."
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-enaip-green transition-colors"
          />
          <button 
            type="submit"
            className="bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded transition-colors"
          >
            Cerca
          </button>
          {searchTerm && (
            <button 
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded transition-colors"
            >
              Cancella
            </button>
          )}
        </form>

        {searchResults.length > 0 && (
          <div className="mt-3 bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
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
                      <span className="text-gray-500 dark:text-gray-500 ml-2 text-sm">({asset.tipo_asset})</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      asset.stato === 'Assegnato' ? 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300' :
                      'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300'
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
            <AnimatedCounter value={stats.totale} />
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Totale</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-700 dark:text-green-300">
            <AnimatedCounter value={stats.assegnati} />
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">Assegnati</div>
        </div>
        <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            <AnimatedCounter value={stats.magazzino} />
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-400">In Magazzino</div>
        </div>
        <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            <AnimatedCounter value={stats.manutenzione} />
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">In Manutenzione</div>
        </div>
        <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-red-700 dark:text-red-300">
            <AnimatedCounter value={stats.dismessi} />
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">Dismessi</div>
        </div>
      </div>

      {/* ============================================================
          PULSANTI CON COLORI ENAIP (VERDE E MARRONE)
          ============================================================ */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a 
          href="/nuovo-asset"
          className="bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          ➕ Nuovo Asset
        </a>
        <a
          href="/censimento"
          className="bg-enaip-brown hover:bg-enaip-brown/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          📋 Censimento Rapido
        </a>
        <a
          href="/statistiche"
          className="bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          📊 Statistiche
        </a>
        <a
          href="/storico"
          className="bg-enaip-brown hover:bg-enaip-brown/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          📜 Storico Generale
        </a>
        <a
          href="/admin"
          className="bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          📊 Admin
        </a>
        <a
          href="/audit"
          className="bg-enaip-brown hover:bg-enaip-brown/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          📜 Audit
        </a>
        <a
          href="/scadenze"
          className="bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded inline-block transition-colors"
        >
          🔔 Scadenze
        </a>
        {nextCode && (
          <span className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded text-sm flex items-center text-gray-700 dark:text-gray-300">
            🔖 Prossimo codice: <strong className="ml-1">{nextCode}</strong>
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">📋 Ultimi asset inseriti</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {recentAssets.length > 0 && `Mostrando ${recentAssets.length} asset`}
          </span>
        </div>
        {loading ? (
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : recentAssets.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">📭 Nessun asset inserito. Inizia a censire!</p>
            <a 
              href="/nuovo-asset" 
              className="mt-3 inline-block bg-enaip-green hover:bg-enaip-green/80 text-white px-4 py-2 rounded transition-colors"
            >
              ➕ Inserisci il primo asset
            </a>
          </div>
        ) : (
          <ul className="bg-white dark:bg-gray-800 shadow rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
            {recentAssets.map(asset => (
              <li 
                key={asset.id} 
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                onClick={() => goToAssetDetail(asset.id)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                    <span className="text-gray-600 dark:text-gray-400 ml-2">- {asset.marca} {asset.modello}</span>
                    <span className="text-gray-500 dark:text-gray-500 ml-2 text-sm">({asset.tipo_asset})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      asset.stato === 'Assegnato' ? 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-300' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300' :
                      'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300'
                    }`}>
                      {asset.stato}
                    </span>
                    <span className="text-gray-400 dark:text-gray-500 text-sm">
                      {new Date(asset.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-400 dark:text-gray-500">
        <p className="text-enaip-brown dark:text-enaip-brown-light font-medium">ENAIP Lombardia - Sistema di Gestione Asset v1.0</p>
        <p className="text-xs mt-1">
          {notificationsEnabled ? '🔔 Notifiche attive' : '🔕 Notifiche disattivate'}
        </p>
      </div>
    </div>
  );
}
