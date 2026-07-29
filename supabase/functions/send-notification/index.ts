import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';

serve(async (req) => {
  try {
    const { asset, assignment, action } = await req.json();
    
    let message = '';
    if (action === 'assign') {
      message = `📦 **Nuova Assegnazione Asset**\n\n` +
                `**Asset:** ${asset.marca} ${asset.modello}\n` +
                `**Seriale:** ${asset.numero_serie}\n` +
                `**Assegnato a:** ${assignment.dipendente_nome}\n` +
                `**Email:** ${assignment.dipendente_email}\n` +
                `**Data:** ${new Date().toLocaleDateString('it-IT')}`;
    } else if (action === 'return') {
      message = `📤 **Restituzione Asset**\n\n` +
                `**Asset:** ${asset.marca} ${asset.modello}\n` +
                `**Seriale:** ${asset.numero_serie}\n` +
                `**Restituito da:** ${assignment.dipendente_nome}\n` +
                `**Data:** ${new Date().toLocaleDateString('it-IT')}`;
    } else if (action === 'warranty') {
      message = `⚠️ **Garanzia in Scadenza**\n\n` +
                `**Asset:** ${asset.marca} ${asset.modello}\n` +
                `**Seriale:** ${asset.numero_serie}\n` +
                `**Scade il:** ${new Date(asset.scadenza_garanzia).toLocaleDateString('it-IT')}`;
    }
    
    // Invia a Telegram
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: 'Markdown'
      })
    });
    
    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
