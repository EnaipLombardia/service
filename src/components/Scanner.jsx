import { useState, useRef } from 'react';

export default function Scanner({ onDetected, onError }) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Avvia la fotocamera
  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        setError(null);
      }
    } catch (err) {
      setError('Impossibile accedere alla fotocamera. Verifica i permessi.');
      if (onError) onError(err);
    }
  };

  // Ferma la fotocamera
  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  // Cattura un frame
  const captureFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Per ora, simula la lettura di un codice (solo per test)
    const simulatedCode = "ENAIP-TEST-123";
    if (onDetected) {
      onDetected(simulatedCode);
      stopScanner();
    }
  };

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
          <div className="mt-3 flex gap-2">
            <button
              onClick={captureFrame}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex-1"
            >
              📸 Cattura e Riconosci
            </button>
            <button
              onClick={stopScanner}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Ferma
            </button>
          </div>
        )}
      </div>
      {/* Test manuale */}
      <div className="mt-3">
        <p className="text-sm text-gray-500 mb-1">🔧 Test manuale (inserisci codice):</p>
        <div className="flex gap-2">
          <input
            type="text"
            id="manualCode"
            placeholder="Es. ENAIP-0001"
            className="border rounded px-3 py-1 flex-1"
          />
          <button
            onClick={() => {
              const input = document.getElementById('manualCode');
              if (input.value) {
                onDetected(input.value);
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
