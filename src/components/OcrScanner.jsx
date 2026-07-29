import { useState, useRef } from 'react';
import { createWorker } from 'tesseract.js';

export default function OcrScanner({ onDetected, onError, onCancel }) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const captureAndRecognize = async () => {
    if (!videoRef.current) return;

    setIsProcessing(true);
    setRecognizedText('');
    setError(null);

    try {
      // Cattura un frame dal video
      const canvas = document.createElement('canvas');
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Converti in formato base64
      const imageData = canvas.toDataURL('image/png');

      // Usa Tesseract.js per riconoscere il testo
      const worker = await createWorker('ita');
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      // Pulisci il testo riconosciuto (rimuovi spazi extra, caratteri strani)
      const cleanedText = text.trim().replace(/\s+/g, ' ');
      
      setRecognizedText(cleanedText);
      
      // Se c'è testo, lo restituiamo al componente padre
      if (cleanedText.length > 0 && onDetected) {
        onDetected(cleanedText);
      }

    } catch (err) {
      console.error('Errore nel riconoscimento:', err);
      setError('Errore durante il riconoscimento. Riprova.');
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const stopAndClose = () => {
    stopScanner();
    if (onCancel) onCancel();
  };

  return (
    <div className="ocr-scanner bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">📷 Lettura Seriali (OCR)</h3>
      <p className="text-sm text-gray-600 mb-3">Inquadra il seriale sulla targhetta e clicca su "Riconosci"</p>

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
          <div className="text-center p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600 mb-3">📷 Fotocamera non attiva</p>
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
                disabled={isProcessing}
                className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
              >
                {isProcessing ? '⏳ Riconoscimento...' : '🔍 Riconosci'}
              </button>
              <button
                onClick={stopAndClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                ✕
              </button>
            </div>

            {isProcessing && (
              <div className="text-center text-gray-600">
                ⏳ Elaborazione in corso...
              </div>
            )}

            {recognizedText && !isProcessing && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-gray-600">Testo riconosciuto:</p>
                <p className="font-mono font-bold text-lg">{recognizedText}</p>
                {onDetected && (
                  <button
                    onClick={() => {
                      onDetected(recognizedText);
                      stopAndClose();
                    }}
                    className="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    Usa questo seriale
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
