
import { supabase } from './supabaseClient';

export async function searchAssetByCode(codice) {
  const { data, error } = await supabase
    .from('asset')
    .select('*')
    .eq('codice_univoco', codice)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createAsset(assetData) {
  const { data, error } = await supabase
    .from('asset')
    .insert([assetData])
    .select();
  
  if (error) throw error;
  
  await supabase
    .from('etichette_disponibili')
    .update({ 
      usato: true, 
      data_utilizzo: new Date().toISOString().split('T')[0] 
    })
    .eq('codice_univoco', assetData.codice_univoco);
  
  return data[0];
}

export async function assignAsset(assetId, dipendenteEmail, dipendenteNome, motivo) {
  await supabase
    .from('assegnazioni')
    .update({ data_fine: new Date().toISOString().split('T')[0] })
    .eq('asset_id', assetId)
    .is('data_fine', null);
  
  const { data, error } = await supabase
    .from('assegnazioni')
    .insert([{
      asset_id: assetId,
      dipendente_email: dipendenteEmail,
      dipendente_nome: dipendenteNome,
      data_inizio: new Date().toISOString().split('T')[0],
      motivo: motivo
    }])
    .select();
  
  await supabase
    .from('asset')
    .update({ stato: 'Assegnato' })
    .eq('id', assetId);
  
  if (error) throw error;
  return data[0];
}

export async function returnAsset(assetId) {
  const { data, error } = await supabase
    .from('assegnazioni')
    .update({ data_fine: new Date().toISOString().split('T')[0] })
    .eq('asset_id', assetId)
    .is('data_fine', null)
    .select();
  
  await supabase
    .from('asset')
    .update({ stato: 'In Magazzino' })
    .eq('id', assetId);
  
  if (error) throw error;
  return data[0];
}

export async function getAssetHistory(assetId) {
  const { data, error } = await supabase
    .from('assegnazioni')
    .select('*')
    .eq('asset_id', assetId)
    .order('data_inizio', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getNextAvailableCode() {
  const { data, error } = await supabase
    .from('etichette_disponibili')
    .select('codice_univoco')
    .eq('usato', false)
    .order('codice_univoco', { ascending: true })
    .limit(1)
    .single();
  
  if (error) throw error;
  return data.codice_univoco;
}

export async function getAssetStats() {
  const { data, error } = await supabase
    .from('asset')
    .select('stato');
  
  if (error) throw error;
  
  const stats = {
    totale: data.length,
    assegnati: data.filter(a => a.stato === 'Assegnato').length,
    magazzino: data.filter(a => a.stato === 'In Magazzino').length,
    manutenzione: data.filter(a => a.stato === 'In Manutenzione').length,
    dismessi: data.filter(a => a.stato === 'Dismesso').length
  };
  
  return stats;
}

export async function getRecentAssets(limit = 10) {
  const { data, error } = await supabase
    .from('asset')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}
