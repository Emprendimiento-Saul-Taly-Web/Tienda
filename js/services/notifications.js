function enviarNotificacionTelefono(titulo, mensaje) {
    if (typeof reproducirSonidoNotificacion === "function") {
        reproducirSonidoNotificacion();
    }

    // 1. Si la App está corriendo dentro de Android WebView (APK)
    if (window.AndroidNative && typeof window.AndroidNative.enviarNotificacionBarra === "function") {
        window.AndroidNative.enviarNotificacionBarra(titulo, mensaje);
        return;
    }

    // 2. Si la App está corriendo en Navegador Web estándar
    if (!("Notification" in window)) return;

    const iconoLogo = (typeof currentConfig !== "undefined" && currentConfig.logo)
        ? currentConfig.logo
        : "img/logo.png";

    if (Notification.permission === "granted") {
        mostrarNotificacionPush(titulo, mensaje, iconoLogo);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                mostrarNotificacionPush(titulo, mensaje, iconoLogo);
            }
        });
    }
}

function mostrarNotificacionPush(titulo, mensaje) {
    const iconoLogo = (typeof currentConfig !== "undefined" && currentConfig.logo)
        ? currentConfig.logo
        : "img/logo.png";

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(titulo, {
                body: mensaje,
                icon: iconoLogo,
                badge: iconoLogo,
                vibrate: [200, 100, 200],
                tag: 'notif-saul-taly-' + Date.now(),
                renotify: true,
                requireInteraction: true
            });
        }).catch(err => {
            console.warn("Fallo al mostrar con Service Worker, reintentando de forma estándar:", err);
            if (window.AndroidNative && window.AndroidNative.enviarNotificacionBarra) {
                window.AndroidNative.enviarNotificacionBarra(titulo, mensaje);
            }
        });
    }
}
function reproducirSonidoNotificacion() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Nota La5
        gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5); // Sonido de 0.5 segundos
    } catch (e) {
        console.warn("No se pudo emitir el tono de notificación:", e);
    }
}
// 1. Solicita permiso al usuario para enviar notificaciones (Optimizado para WebView)
function solicitarPermisoNotificaciones() {
    // Si la API de Notificaciones Web no está disponible (común en WebView)
    if (!("Notification" in window)) {
        console.log("ℹ️ Las notificaciones del sistema se gestionan a nivel nativo en Android.");
        // Intentamos registrar el Service Worker si existe en tu app
        if ('serviceWorker' in navigator) {
            registrarServiceWorker();
        }
        return; // Salimos silenciosamente sin mostrar ningún alert()
    }

    // Si el navegador o WebView sí soporta la API Notification
    Notification.requestPermission().then(permission => {
        if (permission === "granted") {
            console.log("✅ Permiso de notificaciones concedido.");
            registrarServiceWorker();
        } else if (permission === "denied") {
            console.log("⚠️ Permiso de notificaciones denegado en la web.");
        }
    }).catch(err => {
        console.log("Error al solicitar permiso en WebView:", err);
    });
}
// Función para registrar el Service Worker con tus logs originales
function registrarServiceWorker() {
    // Los Service Workers requieren HTTPS o localhost
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
        navigator.serviceWorker.register('sw.js')
            .then(reg => {
                console.log('✅ Service Worker registrado con éxito:', reg);
            })
            .catch(err => {
                console.warn('⚠️ Error al registrar Service Worker:', err);
            });
    } else {
        console.log('ℹ️ Service Worker ignorado (entorno local file:// o no compatible).');
    }
}

// Solicitar permiso de notificaciones a visitantes no registrados
function solicitarPermisosVisitante() {
    if ("Notification" in window) {
        if (Notification.permission === "default") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notificaciones permitidas por el visitante.");
                    registrarServiceWorker();
                }
            });
        } else if (Notification.permission === "granted") {
            registrarServiceWorker();
        }
    }
}

// Ejecutar automáticamente al cargar la página si no hay sesión iniciada
document.addEventListener('DOMContentLoaded', () => {
    if (!firebase.auth().currentUser) {
        solicitarPermisosVisitante();
    }
});
// ==========================================
// OBSERVADOR DE ESTADO DE AUTENTICACIÓN
// ==========================================
auth.onAuthStateChanged(async user => {
    // Referencias a las IDs reales de index_3.html
    const userBar = document.getElementById('user-bar');
    const userActions = document.getElementById('user-actions');
    const userDisplayName = document.getElementById('user-display-name');

    if (user) {
        const esGoogle = user.providerData.some(p => p.providerId === 'google.com');

        // Validar correo si no entra por Google
        if (!esGoogle && !user.emailVerified) {
            auth.signOut();
            alert("⚠️ Debes verificar tu correo electrónico para acceder. Revisa tu bandeja de entrada o spam.");
            usuarioActualID = null;
            if (userBar) userBar.style.display = 'flex';
            if (userActions) userActions.style.display = 'none';
            return;
        }

        usuarioActualID = user.uid;

        // Iniciar escucha nativa en segundo plano para Android
        if (window.AndroidNative && typeof window.AndroidNative.iniciarServicioNotificaciones === "function") {
            window.AndroidNative.iniciarServicioNotificaciones(user.uid);
        }

        // Llamadas a las funciones de notificaciones y escucha en tiempo real
       solicitarPermisoNotificaciones();
               escucharCambiosEstadoCliente(user.uid);
               escucharNotificacionesCliente(user.uid);
        // Ocultar la barra de inicio de sesión y mostrar el contenedor de bienvenida
        if (userBar) userBar.style.display = 'none';
        if (userActions) userActions.style.display = 'flex';

        // Obtenemos el nombre desde la Realtime Database o desde el perfil de Google/Firebase Auth
        let nombreUsuario = user.displayName || "";

        try {
            const snapshot = await db.ref('usuarios/' + user.uid).once('value');
            const userData = snapshot.val();
            if (userData && userData.nombre) {
                nombreUsuario = userData.nombre;
            }
        } catch (e) {
            console.error("Error obteniendo el nombre del usuario:", e);
        }

        // Mostrar el mensaje con el nombre del cliente
        if (userDisplayName) {
            userDisplayName.innerText = nombreUsuario ? `¡Bienvenid@, ${nombreUsuario}! 👋` : '¡Bienvenido! 👋';
        }

        procesarUsuarioGoogle(user);
        toggleAuthModal(false);
    } else {
        usuarioActualID = null;
        // Restaurar estado deslogueado
        if (userBar) userBar.style.display = 'flex';
        if (userActions) userActions.style.display = 'none';
        if (userDisplayName) userDisplayName.innerText = '';
    }
});
// Escuchar notificaciones personales del Cliente Autenticado (Aprobados, Rechazados, Mensajes)
function escucharNotificacionesCliente(uid) {
    db.ref(`notificaciones_cliente/${uid}`).on('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            actualizarBadgeNotificaciones(0);
            return;
        }

        const lista = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        const noLeidas = lista.filter(n => !n.leido).length;

        actualizarBadgeNotificaciones(noLeidas);

        // Si la última notificación no leída es reciente (últimos 15 segundos)
        const ultima = lista[lista.length - 1];
        if (ultima && !ultima.leido) {
            const fechaNotif = new Date(ultima.fecha).getTime();
            if (new Date().getTime() - fechaNotif < 15000) {

                // Si la app está ABIERTA en primer plano usa la barra nativa
                if (document.visibilityState === 'visible' && window.AndroidNative && window.AndroidNative.enviarNotificacionBarra) {
                    window.AndroidNative.enviarNotificacionBarra(ultima.titulo, ultima.mensaje);
                } else {
                    // Si la app está en SEGUNDO PLANO o CERRADA, se envía a través del Service Worker
                    mostrarNotificacionPush(ultima.titulo, ultima.mensaje);
                }
            }
        }
    });
}

function actualizarBadgeNotificaciones(cant) {
    const badge = document.getElementById('notif-badge-client');
    if (badge) {
        if (cant > 0) {
            badge.innerText = cant;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
}
// Crear Notificación Extra desde el Panel Admin
function enviarNotificacionDesdeAdmin() {
    const titulo = document.getElementById('adm-notif-titulo').value.trim();
    const mensaje = document.getElementById('adm-notif-mensaje').value.trim();

    if (!titulo || !mensaje) return alert("Por favor escribe el título y mensaje de la notificación.");

    db.ref('usuarios').once('value').then(snapshot => {
        const usuarios = snapshot.val();
        if (usuarios) {
            Object.keys(usuarios).forEach(uid => {
                db.ref(`notificaciones_cliente/${uid}`).push({
                    titulo: titulo,
                    mensaje: mensaje,
                    fecha: new Date().toISOString(),
                    leido: false
                });
            });

            // NOTA: Se eliminó la llamada manual enviarNotificacionTelefono()
            // para evitar la notificación duplicada, ya que la base de datos
            // en tiempo real dispara la notificación automáticamente.

            alert("📢 Notificación enviada con éxito a todos los clientes.");
            document.getElementById('adm-notif-titulo').value = "";
            document.getElementById('adm-notif-mensaje').value = "";
        }
    });
}
function notificarUsuario(titulo, mensaje) {
    // Si la app está dentro de Android (WebView)
    if (window.AndroidNative && window.AndroidNative.enviarNotificacionBarra) {
        window.AndroidNative.enviarNotificacionBarra(titulo, mensaje);
    } else {
        console.log("Notificación web local:", titulo, mensaje);
    }
}


function marcarUnaNotificacionLeida(notifId) {
    if (!auth.currentUser) return;
    db.ref(`notificaciones_cliente/${auth.currentUser.uid}/${notifId}`).update({ leido: true }).then(() => {
        abrirModalNotificacionesCliente();
    });
}

function marcarTodasNotificacionesLeidas() {
    if (!auth.currentUser) return;
    db.ref(`notificaciones_cliente/${auth.currentUser.uid}`).once('value').then(snapshot => {
        const data = snapshot.val();
        if (data) {
            const updates = {};
            Object.keys(data).forEach(k => {
                updates[`${k}/leido`] = true;
            });
            db.ref(`notificaciones_cliente/${auth.currentUser.uid}`).update(updates).then(() => {
                abrirModalNotificacionesCliente();
            });
        }
    });
}

// Variable para controlar que no notifique pedidos antiguos al iniciar
let primeraCargaAdminPedidos = true;

// Escuchar nuevos pedidos en tiempo real para el Administrador
function escucharPedidosAdmin() {
    // Verificar si el usuario actual es Administrador antes de escuchar
    if (!firebase.auth().currentUser) return;

    db.ref('pedidos').limitToLast(1).on('child_added', snapshot => {
        const pedido = snapshot.val();

        // Evitar que dispare notificación con el historial viejo al cargar la app
        if (primeraCargaAdminPedidos) {
            primeraCargaAdminPedidos = false;
            return;
        }

        if (pedido) {
            const titulo = "🛒 ¡Nuevo Pedido Recibido!";
            const mensaje = `Pedido #${pedido.idPedido || snapshot.key} de ${pedido.nombreCliente || 'un cliente'} por ${pedido.totalBs || ''} Bs.`;

            // 1. Si la app está abierta en pantalla (Primer Plano)
            if (document.visibilityState === 'visible' && window.AndroidNative && window.AndroidNative.enviarNotificacionBarra) {
                window.AndroidNative.enviarNotificacionBarra(titulo, mensaje);
            } else {
                // 2. Si la app está en SEGUNDO PLANO o CERRADA
                mostrarNotificacionPushAdmin(titulo, mensaje);
            }
        }
    });
}

// Función encargada de lanzar la notificación push en el Service Worker para el Admin
function mostrarNotificacionPushAdmin(titulo, mensaje) {
    const iconoLogo = (typeof currentConfig !== "undefined" && currentConfig.logo)
        ? currentConfig.logo
        : "img/logo.png";

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(titulo, {
                body: mensaje,
                icon: iconoLogo,
                badge: iconoLogo,
                vibrate: [300, 100, 300, 100, 300], // Patrón de vibración más largo para pedidos
                tag: 'nuevo-pedido-admin-' + Date.now(),
                renotify: true,
                requireInteraction: true // Mantiene la notificación fija en la barra hasta que el admin la toque
            });
        }).catch(err => {
            console.warn("Error enviando notificación push de admin:", err);
            if (window.AndroidNative && window.AndroidNative.enviarNotificacionBarra) {
                window.AndroidNative.enviarNotificacionBarra(titulo, mensaje);
            }
        });
    }
}
// Obtener y guardar el token FCM para notificaciones en segundo plano / app cerrada
function registrarTokenFCMAdmin(uid) {
    if (!('serviceWorker' in navigator)) return;

    const messaging = firebase.messaging();

    // Solicitar permiso de notificaciones
    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            // Obtener el token único del dispositivo
            return messaging.getToken({
                vapidKey: "BFqOZQOQYQB5ScedgOvgc1uNFaDdqAMRl6KHMjyZDy7YMLwW54vJqAcER-w0Wsxo__ZGXOqKSfyXwdybBYvH2p8" // Obtén esta clave en la consola de Firebase
            });
        }
    }).then(token => {
        if (token) {
            // Guardar el token en el nodo del administrador
            db.ref(`administradores/${uid}/fcmToken`).set(token);
            console.log("Token FCM registrado correctamente.");
        }
    }).catch(err => {
        console.warn("Error obteniendo el token FCM:", err);
    });
}
function registrarTokenFCMCliente(uid) {
    if (!('serviceWorker' in navigator)) return;

    const messaging = firebase.messaging();

    Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
            return messaging.getToken({
                vapidKey: "BFqOZQOQYQB5ScedgOvgc1uNFaDdqAMRl6KHMjyZDy7YMLwW54vJqAcER-w0Wsxo__ZGXOqKSfyXwdybBYvH2p8" // La misma clave VAPID de la consola
            });
        }
    }).then(token => {
        if (token) {
            // Guardar el token directamente en el perfil del usuario
            db.ref(`usuarios/${uid}/fcmToken`).set(token);
        }
    }).catch(err => {
        console.warn("Error guardando token FCM del cliente:", err);
    });
}