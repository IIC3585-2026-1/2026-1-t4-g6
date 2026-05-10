const cacheName = "banglent-v3";
const CONFIG_PLACEHOLDER = "REEMPLAZA_CON_TU_";

const filesToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/css/main.css",
  "/js/app.js",
  "/js/config/firebase-config.js",
  "/js/services/notifications.js",
  "/js/controller/MainController.js",
  "/js/models/NoteModel.js",
  "/js/utils/storage.js",
  "/js/views/EditorView.js",
  "/js/views/SidebarView.js",
  "/images/pwa-icon-256.png",
  "/images/pwa-icon-512.png",
];

function hasFirebaseConfig() {
  const config = self.BANGLENT_FIREBASE_CONFIG;
  const vapidKey = self.BANGLENT_FIREBASE_VAPID_KEY;

  if (!config || !vapidKey) return false;

  return Object.values(config).every(
    (value) => typeof value === "string" && !value.includes(CONFIG_PLACEHOLDER),
  ) && !vapidKey.includes(CONFIG_PLACEHOLDER);
}

try {
  importScripts("/js/config/firebase-config.js");

  if (hasFirebaseConfig()) {
    importScripts(
      "https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js",
      "https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js",
    );

    firebase.initializeApp(self.BANGLENT_FIREBASE_CONFIG);

    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      const notification = payload.notification || {};
      const data = payload.data || {};
      const title = notification.title || data.title || "Banglen't";
      const options = {
        body:
          notification.body ||
          data.body ||
          "Tienes una nueva actualizacion en tus notas.",
        icon: "/images/pwa-icon-256.png",
        badge: "/images/pwa-icon-256.png",
        data: {
          url: payload.fcmOptions?.link || data.url || "/index.html",
        },
      };

      return self.registration.showNotification(title, options);
    });
  }
} catch (error) {
  console.warn(
    "Firebase Messaging no esta disponible en el service worker.",
    error,
  );
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(cacheName).then(function (cache) {
      return cache.addAll(filesToCache);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cName) => {
            if (cName !== cacheName) {
              return caches.delete(cName);
            }

            return null;
          }),
        );
      }),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  e.respondWith(
    caches.match(e.request).then((response) => {
      return (
        response ||
        fetch(e.request).catch(async () => {
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }

          return new Response("", {
            status: 503,
            statusText: "Offline",
          });
        })
      );
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(
    event.notification.data?.url || "/index.html",
    self.location.origin,
  ).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        const existingClient = clientList.find((client) =>
          client.url.startsWith(self.location.origin),
        );

        if (existingClient) {
          existingClient.focus();
          return existingClient.navigate(targetUrl);
        }

        return clients.openWindow(targetUrl);
      }),
  );
});
