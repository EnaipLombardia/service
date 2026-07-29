import { useEffect, useRef, useState } from 'react';

export default function Scanner({ onDetected, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      console.error('Errore fotocamera:', err);
      setError('Impossibile accedere alla fotocamera. Verifica i permessi.');
      if (onError) onError(err);
    }
  };

  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const simulateScan = (code) => {
    if (onDetected) onDetected(code);
  };

  useEffect(() => {
    return () => stopScanner();
  }, []);

  return (
    <div className="scanner-container">
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-3">
          ⚠️ {error}
        </div>
      )}
      
      <div className="relative">
        <video
          ref={videoRef}
          className={`w-full max-w-md rounded-lg border-2 border-gray-300 ${!isScanning ? 'hidden' : ''}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        
        {!isScanning && !error && (
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600 mb-3">📷 Fotocamera non attiva</p>
            <button
              onClick={startScanner}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Avvia scansione
            </button>
          </div>
        )}
        
        {isScanning && (
          <button
            onClick={stopScanner}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Ferma scansione
          </button>
        )}
      </div>
      
      <div className="mt-3">
        <p className="text-sm text-gray-500 mb-1">🔧 Test manuale (inserisci codice):</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Es. ENAIP-0001"
            className="border rounded px-3 py-1 flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.target.value) {
                simulateScan(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('.scanner-container input');
              if (input && input.value) {
                simulateScan(input.value);
                input.value = '';
              }
            }}
            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
          >
            Simula
          </button>
        </div>
      </div>
    </div>
  );
}
