const CACHE_NAME = 'enaip-asset-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/nuovo-asset',
  '/censimento',
  '/statistiche',
  '/storico',
  '/admin',
  '/audit',
  '/scadenze'
];

// Installa il service worker e cache delle risorse
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Gestisce le richieste offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se trova in cache, restituisce quello
        if (response) {
          return response;
        }
        // Altrimenti fa la richiesta di rete
        return fetch(event.request)
          .then(response => {
            // Se la risposta è valida, la mette in cache
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
  );
});

// Aggiorna la cache quando il service worker viene attivato
self.addEventListener('activate', event => {
  const cacheWhitelist = ['enaip-asset-v1'];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
