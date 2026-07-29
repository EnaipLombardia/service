import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

export default function QRCode({ value, size = 200, onGenerated }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      }, (error) => {
        if (error) console.error('Errore QR:', error);
        else if (onGenerated) onGenerated();
      });
    }
  }, [value, size, onGenerated]);

  return <canvas ref={canvasRef} />;
}
