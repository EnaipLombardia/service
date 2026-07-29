import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAssetStats, getRecentAssets, getNextAvailableCode } from '../lib/assetFunctions';
import Scanner from './Scanner';
import OcrScanner from './OcrScanner';

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
    } finally {
      setLoading(false);
    }
  }

  // Gestisce la scansione del codice a barre
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
        // Mostra un feedback visivo
        setTimeout(() => {
          if (confirm(`✅ Asset trovato: ${data.marca} ${data.modello}\nVuoi vedere i dettagli?`)) {
            goToAssetDetail(data.id);
          }
        }, 500);
      } else {
        setScannedAsset(null);
        if (confirm(`❌ Asset con codice "${code}" non trovato.\nVuoi creare un nuovo asset con questo seriale?`)) {
          window.location.href = `/nuovo-asset?seriale=${code}`;
        }
      }
    } catch (error) {
      console.error('Errore nella scansione:', error);
      setScannedAsset(null);
    }
  }

  // Gestisce la scansione OCR
  async function handleOcrDetected(text) {
    // Pulisci il testo: prendi solo la prima parte che sembra un seriale
    const seriale = text.split(' ')[0] || text;
    setOcrResult(seriale);
    
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .ilike('numero_serie', `%${seriale}%`)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setScannedAsset(data);
        alert(`✅ Asset trovato: ${data.marca} ${data.modello}`);
        setTimeout(() => goToAssetDetail(data.id), 1000);
      } else {
        if (confirm(`🔍 Seriale "${seriale}" non trovato.\nVuoi creare un nuovo asset con questo seriale?`)) {
          window.location.href = `/nuovo-asset?seriale=${seriale}`;
        }
      }
    } catch (error) {
      console.error('Errore nella ricerca OCR:', error);
      alert(`❌ Errore nella ricerca del seriale "${seriale}"`);
    }
    
    setShowOcr(false);
  }

  // Funzione per navigare al dettaglio asset
  function goToAssetDetail(assetId) {
    window.location.href = `/asset/${assetId}`;
  }

  // Funzione per la ricerca rapida
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
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">📦 Asset ENAIP Lombardia</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-3 py-1 rounded text-sm ${
              showScanner ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showScanner ? '📷 Nascondi Scanner' : '📷 Scanner Codici'}
          </button>
          <button
            onClick={() => setShowOcr(!showOcr)}
            className={`px-3 py-1 rounded text-sm ${
              showOcr ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showOcr ? '📷 Nascondi OCR' : '📷 Leggi seriale'}
          </button>
        </div>
      </div>
      
      {/* Scanner Codici a Barre */}
      {showScanner && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">🔍 Scansiona un asset</h2>
          <Scanner onDetected={handleScan} />
          
          {scannedCode && !scannedAsset && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700">
                ⏳ Codice "{scannedCode}" rilevato. Cerco in database...
              </p>
            </div>
          )}
          
          {scannedAsset && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-green-700">
                ✅ Asset trovato: <strong>{scannedAsset.marca} {scannedAsset.modello}</strong>
                <br />
                <span className="text-sm">Seriale: {scannedAsset.numero_serie}</span>
                <button 
                  className="ml-3 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={() => goToAssetDetail(scannedAsset.id)}
                >
                  Vedi dettaglio
                </button>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Scanner OCR (Modal) */}
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
                alert('❌ Errore durante il riconoscimento. Riprova.');
              }}
            />
          </div>
        </div>
      )}

      {ocrResult && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded">
          <p className="text-purple-700">
            📝 Testo riconosciuto: <strong>{ocrResult}</strong>
          </p>
        </div>
      )}

      {/* Ricerca rapida */}
      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="🔍 Cerca per seriale, marca, modello, tipo o codice..."
            className="flex-1 border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancella
            </button>
          )}
        </form>

        {/* Risultati ricerca */}
        {searchResults.length > 0 && (
          <div className="mt-3 bg-white shadow rounded-lg overflow-hidden">
            <h3 className="p-3 font-semibold border-b bg-gray-50">
              Risultati della ricerca ({searchResults.length})
            </h3>
            <ul className="divide-y max-h-96 overflow-y-auto">
              {searchResults.map(asset => (
                <li 
                  key={asset.id} 
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => goToAssetDetail(asset.id)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                      <span className="text-gray-600 ml-2">- {asset.marca} {asset.modello}</span>
                      <span className="text-gray-500 ml-2 text-sm">({asset.tipo_asset})</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      asset.stato === 'Assegnato' ? 'bg-green-200 text-green-800' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-200 text-yellow-800' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-200 text-orange-800' :
                      'bg-red-200 text-red-800'
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
          <p className="mt-2 text-gray-500">⏳ Caricamento risultati...</p>
        )}
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-blue-700">{stats.totale}</div>
          <div className="text-sm text-blue-600">Totale</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-green-700">{stats.assegnati}</div>
          <div className="text-sm text-green-600">Assegnati</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-yellow-700">{stats.magazzino}</div>
          <div className="text-sm text-yellow-600">In Magazzino</div>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-orange-700">{stats.manutenzione}</div>
          <div className="text-sm text-orange-600">In Manutenzione</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center hover:shadow-md transition-shadow">
          <div className="text-2xl font-bold text-red-700">{stats.dismessi}</div>
          <div className="text-sm text-red-600">Dismessi</div>
        </div>
      </div>

      {/* Pulsanti azione */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a 
          href="/nuovo-asset"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block transition-colors"
        >
          ➕ Nuovo Asset
        </a>
        <a
          href="/censimento"
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 inline-block transition-colors"
        >
          📋 Censimento Rapido
        </a>
        <a
          href="/statistiche"
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 inline-block transition-colors"
        >
          📊 Statistiche
        </a>
        <a
          href="/storico"
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 inline-block transition-colors"
        >
          📜 Storico Generale
        </a>
        {nextCode && (
          <span className="bg-gray-200 px-4 py-2 rounded text-sm flex items-center">
            🔖 Prossimo codice: <strong className="ml-1">{nextCode}</strong>
          </span>
        )}
      </div>

      {/* Asset recenti */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">📋 Ultimi asset inseriti</h2>
          <span className="text-sm text-gray-500">
            {recentAssets.length > 0 && `Mostrando ${recentAssets.length} asset`}
          </span>
        </div>
        {loading ? (
          <p className="text-gray-500">⏳ Caricamento...</p>
        ) : recentAssets.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">📭 Nessun asset inserito. Inizia a censire!</p>
            <a 
              href="/nuovo-asset" 
              className="mt-3 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              ➕ Inserisci il primo asset
            </a>
          </div>
        ) : (
          <ul className="bg-white shadow rounded-lg divide-y">
            {recentAssets.map(asset => (
              <li 
                key={asset.id} 
                className="p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => goToAssetDetail(asset.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                    <span className="text-gray-600 ml-2">- {asset.marca} {asset.modello}</span>
                    <span className="text-gray-500 ml-2 text-sm">({asset.tipo_asset})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      asset.stato === 'Assegnato' ? 'bg-green-200 text-green-800' :
                      asset.stato === 'In Magazzino' ? 'bg-yellow-200 text-yellow-800' :
                      asset.stato === 'In Manutenzione' ? 'bg-orange-200 text-orange-800' :
                      'bg-red-200 text-red-800'
                    }`}>
                      {asset.stato}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {new Date(asset.created_at).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
