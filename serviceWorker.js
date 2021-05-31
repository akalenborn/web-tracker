/*Quelle: https://gist.github.com/JMPerez/8ca8d5ffcc0cc45a8b4e1c279efd8a94 - JMPEREZ */

const VERSION = "1.0";
const CACHE_VERSION = "sw1" + VERSION;

let cacheablePages = [
    "index.php",
    "myscripts.js",
    "mycss.css",
    "bootstrap.min.css",
    "bootstrap.bundle.min.js",
    "jquery-3.6.0.min.js",
    "checkOnline.js"
];

// Pre-Cache all cacheable pags
// on install we download the routes we want to cache for offline
self.addEventListener('install', evt =>
    evt.waitUntil(
        caches.open(CACHE_VERSION).then(cache => {
            return cache.addAll(cacheablePages);
        })
    )
);

// Cleanup old cache storages
    self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (CACHE_VERSION !== cacheName) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// fetch the resource from the network
const fromNetwork = (request, timeout) =>
    new Promise((fulfill, reject) => {
        const timeoutId = setTimeout(reject, timeout);
        fetch(request).then(response => {
            clearTimeout(timeoutId);
            fulfill(response);
            update(request);
        }, reject);
    });

// fetch the resource from the browser cache
const fromCache = request =>
    caches
        .open(CACHE_VERSION)
        .then(cache =>
            cache
                .match(request)
                .then(matching => matching || cache.match('/offline/'))
        );

// cache the current page to make it available for offline
const update = request =>
    caches
        .open(CACHE_VERSION)
        .then(cache =>
            fetch(request).then(response => cache.put(request, response))
        );

// general strategy when making a request (eg if online try to fetch it
// from the network with a timeout, if something fails serve from cache)
self.addEventListener('fetch', evt => {
    evt.respondWith(
        fromNetwork(evt.request, 10000).catch(() => fromCache(evt.request))
    );
    evt.waitUntil(update(evt.request));
});