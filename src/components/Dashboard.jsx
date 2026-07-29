import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getAssetStats, getRecentAssets, getNextAvailableCode } from '../lib/assetFunctions';
import Scanner from './Scanner';

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

  async function handleScan(code) {
    setScannedCode(code);
    setScannedAsset(null);
    
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*')
        .eq('numero_serie', code)
        .single();
      
      if (error) throw error;
      setScannedAsset(data);
    } catch (error) {
      console.error('Asset non trovato:', error);
      setScannedAsset(null);
    }
  }

  // Funzione per navigare al dettaglio asset
  function goToAssetDetail(assetId) {
    window.location.href = `/asset/${assetId}`;
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">📦 Asset ENAIP Lombardia</h1>
      
      {/* Scanner */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">🔍 Scansiona un asset</h2>
        <Scanner onDetected={handleScan} />
        
        {scannedCode && (
          <div className="mt-3 p-3 bg-gray-100 rounded">
            <p>Codice rilevato: <strong>{scannedCode}</strong></p>
            {scannedAsset ? (
              <div className="mt-2 text-green-600">
                ✅ Asset trovato: {scannedAsset.marca} {scannedAsset.modello}
                <button 
                  className="ml-3 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  onClick={() => goToAssetDetail(scannedAsset.id)}
                >
                  Vedi dettaglio
                </button>
              </div>
            ) : (
              <p className="mt-2 text-red-600">❌ Asset non trovato.</p>
            )}
          </div>
        )}
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.totale}</div>
          <div className="text-sm">Totale</div>
        </div>
        <div className="bg-green-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.assegnati}</div>
          <div className="text-sm">Assegnati</div>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.magazzino}</div>
          <div className="text-sm">In Magazzino</div>
        </div>
        <div className="bg-orange-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.manutenzione}</div>
          <div className="text-sm">In Manutenzione</div>
        </div>
        <div className="bg-red-100 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.dismessi}</div>
          <div className="text-sm">Dismessi</div>
        </div>
      </div>

      {/* Pulsanti azione */}
      <div className="flex flex-wrap gap-2 mb-6">
        <a 
          href="/nuovo-asset"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
        >
          ➕ Nuovo Asset
        </a>
        <button 
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          onClick={() => alert('🔄 Funzione Assegna in sviluppo!')}
        >
          🔄 Assegna
        </button>
        <button 
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
          onClick={() => alert('📋 Funzione Censimento Rapido in sviluppo!')}
        >
          📋 Censimento Rapido
        </button>
        {nextCode && (
          <span className="bg-gray-200 px-4 py-2 rounded text-sm flex items-center">
            🔖 Prossimo codice: <strong className="ml-1">{nextCode}</strong>
          </span>
        )}
      </div>

      {/* Asset recenti */}
      <div>
        <h2 className="text-lg font-semibold mb-2">📋 Ultimi asset inseriti</h2>
        {loading ? (
          <p className="text-gray-500">Caricamento...</p>
        ) : recentAssets.length === 0 ? (
          <p className="text-gray-500">Nessun asset inserito. Inizia a censire!</p>
        ) : (
          <ul className="bg-white shadow rounded-lg divide-y">
            {recentAssets.map(asset => (
              <li 
                key={asset.id} 
                className="p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => goToAssetDetail(asset.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold">{asset.numero_serie || asset.codice_univoco || 'N/A'}</span>
                    <span className="text-gray-600 ml-2">- {asset.marca} {asset.modello}</span>
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
        )}
      </div>
    </div>
  );
}
