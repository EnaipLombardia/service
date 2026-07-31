import { supabase } from '../lib/supabaseClient';

export default function ExportButton() {
  const handleExport = async () => {
    try {
      const loading = document.createElement('div');
      loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      loading.innerHTML = '<div class="bg-[#006a4e] hover:bg-[#005a3e] text-white"><p class="bg-[#006a4e] hover:bg-[#005a3e] text-white">⏳ Esportazione in corso...</p></div>';
      document.body.appendChild(loading);

      const { data, error } = await supabase
        .from('asset')
        .select('*');

      if (error) throw error;

      if (!data || data.length === 0) {
        alert('📭 Nessun asset da esportare');
        document.body.removeChild(loading);
        return;
      }

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

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asset_enaip_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      document.body.removeChild(loading);
      alert('✅ Esportazione completata con successo!');

    } catch (error) {
      console.error('Errore export:', error);
      alert('❌ Errore durante l\'esportazione');
    }
  };

  return (
    <button
      onClick={handleExport}
      className="bg-[#8b5a2b] hover:bg-[#7a4a1b] text-white px-3 py-1 rounded text-sm transition-colors"
    >
      📥 Esporta CSV
    </button>
  );
}
