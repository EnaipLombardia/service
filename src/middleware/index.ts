import { defineMiddleware } from 'astro/middleware';
import { supabase } from '../lib/supabaseClient';

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.url);
  
  // 🔓 Pagine pubbliche (non richiedono login)
  const publicPaths = ['/login', '/logout', '/_astro', '/images', '/manifest.json', '/sw.js'];
  
  // Se è una pagina pubblica, lascia passare
  if (publicPaths.some(path => url.pathname.startsWith(path))) {
    return next();
  }

  // 🔒 Verifica se l'utente è loggato
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Se non loggato, reindirizza al login
      return context.redirect('/login');
    }
    
    // Se loggato, continua
    return next();
  } catch (error) {
    console.error('❌ Errore middleware:', error);
    return context.redirect('/login');
  }
});
