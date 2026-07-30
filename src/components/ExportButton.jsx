import { supabase } from '../lib/supabaseClient';

export default function ExportButton() {
  const handleExport = async () => {
    try {
      const { data, error } = await supabase
        .from('asset')
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('📭 Nessun asset da esportare');
        return;
      }

      // Crea l'header del CSV
      const headers = ['Seriale', 'Tipo', 'Marca', 'Modello', 'Sede', 'Stato', 'Note'];
      const rows = data.map(a => [
        a.numero_serie || '',
        a.tipo_asset || '',
        a.marca || '',
        a.modello || '',
        a.sede || '',
        a.stato || '',
        a.note || ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Scarica il file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset_enaip_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'esportazione');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-teal-500 text-white px-3 py-1 rounded hover:bg-teal-600 transition-colors text-sm"
    >
      📥 Esporta CSV
    </button>
  );
}
