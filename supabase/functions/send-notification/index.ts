import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID') || '';

serve(async (req) => {
  try {
    const { action, asset, user } = await req.json();
    
    let message = '';
    if (action === 'assign') {
      message = `📦 **Nuova Assegnazione**\n\nAsset: ${asset.marca} ${asset.modello}\nAssegnato a: ${user}`;
    } else if (action === 'return') {
      message = `📤 **Restituzione Asset**\n\nAsset: ${asset.marca} ${asset.modello}\nRestituito da: ${user}`;
    }

    // Invia Telegram
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
