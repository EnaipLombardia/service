import { supabase } from '../lib/supabaseClient';

export default function ExportButton({ type = 'csv' }) {
  const handleExport = async () => {
    try {
      const { data } = await supabase.from('asset').select('*');
      
      if (type === 'csv') {
        // Crea CSV
        const headers = ['Seriale', 'Tipo', 'Marca', 'Modello', 'Sede', 'Stato', 'Note'];
        const rows = data.map(a => [
          a.numero_serie, a.tipo_asset, a.marca, a.modello, a.sede, a.stato, a.note || ''
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        
        // Scarica
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asset_enaip_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Errore export:', error);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 transition-colors"
    >
      📥 Esporta CSV
    </button>
  );
}
