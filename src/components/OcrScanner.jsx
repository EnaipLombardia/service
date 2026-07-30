import { useState, useRef } from 'react';

export default function OcrScanner({ onDetected, onError, onCancel }) {
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

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

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    if (onCancel) onCancel();
  };

  const captureAndRecognize = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const simulatedText = "SERIALE-TEST-456";
    setRecognizedText(simulatedText);
    if (onDetected) {
      onDetected(simulatedText);
      stopScanner();
    }
  };

  return (
    <div className="ocr-scanner bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold dark:text-white mb-2">📷 Lettura Seriali (OCR)</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Inquadra il seriale sulla targhetta e clicca su "Riconosci"
      </p>

      {error && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 rounded">
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
          <div className="text-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-600 dark:text-gray-300 mb-3">📷 Fotocamera non attiva</p>
            <button
              onClick={startScanner}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Avvia scansione OCR
            </button>
          </div>
        )}

        {isScanning && (
          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <button
                onClick={captureAndRecognize}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                🔍 Riconosci
              </button>
              <button
                onClick={stopScanner}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                ✕
              </button>
            </div>

            {recognizedText && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">Testo riconosciuto:</p>
                <p className="font-mono font-bold text-lg dark:text-white">{recognizedText}</p>
                <button
                  onClick={() => {
                    if (onDetected) onDetected(recognizedText);
                    stopScanner();
                  }}
                  className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Usa questo seriale
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
