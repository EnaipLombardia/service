import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCode({ 
  value, 
  size = 200, 
  margin = 2,
  colorDark = '#000000',
  colorLight = '#ffffff',
  onGenerated,
  className = ''
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!value) {
      console.warn('QRCode: nessun valore fornito');
      return;
    }

    // Genera il QR code
    QRCode.toCanvas(
      canvasRef.current,
      value,
      {
        width: size,
        margin: margin,
        color: {
          dark: colorDark,
          light: colorLight
        },
        errorCorrectionLevel: 'H' // Alto livello di correzione errori
      },
      (error) => {
        if (error) {
          console.error('Errore generazione QR Code:', error);
          if (onGenerated) onGenerated(error);
        } else {
          if (onGenerated) onGenerated(null);
        }
      }
    );
  }, [value, size, margin, colorDark, colorLight, onGenerated]);

  return (
    <canvas 
      ref={canvasRef} 
      className={className}
      style={{ 
        width: size, 
        height: size,
        imageRendering: 'pixelated'
      }}
    />
  );
}
