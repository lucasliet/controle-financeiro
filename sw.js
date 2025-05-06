const CACHE_NAME = 'financial-control-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/images/icon-192x192.png', // Adicione o caminho real dos seus ícones
  '/images/icon-512x512.png'  // Adicione o caminho real dos seus ícones
  // Adicione outros assets estáticos que você queira cachear
];

// Evento de Instalação: Cacheia os assets principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento Fetch: Serve do cache primeiro, depois rede
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, retorna a resposta do cache
        if (response) {
          return response;
        }
        // Senão, busca na rede
        return fetch(event.request);
      }
    )
  );
});

// Evento Activate: Limpa caches antigos (opcional, mas boa prática)
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
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
