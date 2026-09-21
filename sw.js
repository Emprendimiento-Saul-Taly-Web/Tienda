// Service Worker para recibir notificaciones cuando la app está cerrada o en segundo plano
self.addEventListener('push', function(event) {
    let data = { title: 'Emprendimiento Saul Taly', body: 'Tienes una nueva actualización.' };

    if (event.data) {
        try {
            // Intenta leerlo como JSON
            data = event.data.json();
        } catch (e) {
            // Si el servidor envía texto plano, lo asigna al cuerpo directamente
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body || data.message || 'Tienes una nueva actualización.',
        icon: 'img/logo.png',
        badge: 'img/logo.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || '/' }
    };

    event.waitUntil(
        self.registration.showNotification(data.title || 'Emprendimiento Saul Taly', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    // Obtiene la URL a abrir desde los datos de la notificación
    const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            // Si la app ya está abierta en una pestaña, la enfoca en lugar de abrir una nueva
            for (let i = 0; i < clientList.length; i++) {
                let client = clientList[i];
                if (client.url === targetUrl && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no está abierta, abre una nueva ventana
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});