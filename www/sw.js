// sw.js - Service Worker para Notificaciones en Segundo Plano y App Cerrada

// 1. Importar scripts de Firebase Messaging dentro del Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAwdXNniflYWXCGxJPCbBlFMr8NB09XgRY",
    authDomain: "web-emprendimiento-saul-taly.firebaseapp.com",
    databaseURL: "https://web-emprendimiento-saul-taly-default-rtdb.firebaseio.com",
    projectId: "web-emprendimiento-saul-taly",
    storageBucket: "web-emprendimiento-saul-taly.firebasestorage.app",
    messagingSenderId: "1074941413246",
    appId: "1:1074941413246:web:b943421f8e08c8b696152f"
};

const messaging = firebase.messaging();

// 3. Activación e instalación inmediata en segundo plano
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

// 4. Manejador de mensajes Push vía Firebase (FCM) cuando la app está cerrada o en 2do plano
messaging.onBackgroundMessage((payload) => {
    const title = (payload.notification && payload.notification.title) || "🛒 ¡Nuevo Pedido Recibido!";
    const options = {
        body: (payload.notification && payload.notification.body) || "Tienes una nueva actualización en la tienda.",
        icon: 'img/logo.png',
        badge: 'img/logo.png',
        vibrate: [300, 100, 300, 100, 300],
        requireInteraction: true,
        data: payload.data
    };

    return self.registration.showNotification(title, options);
});

// 5. Manejador de eventos Push estándar (Tu código original)
self.addEventListener('push', function(event) {
    const data = event.data ? event.data.json() : {};
    const title = data.title || "Emprendimiento Saul Taly";
    const options = {
        body: data.message || "Tienes una nueva actualización",
        icon: 'img/logo.png',
        badge: 'img/logo.png',
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// 6. Acción al hacer clic en la notificación (Abre o enfoca la aplicación)
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});