function verReciboDigital(orderId) {
    db.ref(`pedidos/${orderId}`).once('value').then(snapshot => {
        const pedido = snapshot.val();

        if (!pedido || !pedido.facturaHtml) {
            alert("La factura aún no se encuentra disponible.");
            return;
        }

        // 1. Verificar o crear el contenedor del recibo en el DOM
        let contenedorModal = document.getElementById('modal-recibo-digital');
        if (!contenedorModal) {
            contenedorModal = document.createElement('div');
            contenedorModal.id = 'modal-recibo-digital';
            document.body.appendChild(contenedorModal);
        }

        // 2. Estilos para que cubra la pantalla completa sobre la app
        contenedorModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #f8f9fa;
            z-index: 999999;
            overflow-y: auto;
            padding: 15px;
            padding-bottom: 90px;
            box-sizing: border-box;
            display: block;
        `;

        // 3. Estilos de la barra de botones fija en la parte inferior
        const estilosBarra = `
            <style>
                .footer-nav-recibo {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    background: #1d3557;
                    padding: 12px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
                    z-index: 1000000;
                    box-sizing: border-box;
                }
                .btn-volver-recibo {
                    background: #e63946;
                    color: #ffffff;
                    border: none;
                    padding: 10px 18px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 0.95rem;
                }
                .btn-imprimir-recibo {
                    background: #ffffff;
                    color: #1d3557;
                    border: none;
                    padding: 10px 16px;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    font-size: 0.9rem;
                }
                @media print {
                    .footer-nav-recibo { display: none !important; }
                    #modal-recibo-digital { padding-bottom: 0 !important; }
                }
            </style>
        `;

        // 4. Inyectar el HTML del recibo y los botones
        contenedorModal.innerHTML = `
            ${estilosBarra}
            <div class="contenido-factura">
                ${pedido.facturaHtml}
            </div>

            <div class="footer-nav-recibo">
                <button class="btn-volver-recibo" onclick="cerrarReciboDigital()">
                    ⬅️ Regresar a la App
                </button>
                <button class="btn-imprimir-recibo" onclick="window.print()">
                    🖨️ Imprimir
                </button>
            </div>
        `;
    });
    // Agrega esta línea al final de verFacturaAdmin y verReciboDigital cuando se muestre el modal:
    history.pushState({ verReciboAbierto: true }, '');
}

// Función para cerrar el recibo y volver inmediatamente a la App
function cerrarReciboDigital() {
    const contenedorModal = document.getElementById('modal-recibo-digital');
    if (contenedorModal) {
        contenedorModal.style.display = 'none';
        contenedorModal.innerHTML = ''; // Limpia el contenido

    }
}function generarHtmlFactura(pedido) {
     let tablaFilas = "";
     let subtotalUSD = 0;

     for (let key in pedido.items) {
         const item = pedido.items[key];
         const totalLinea = item.p * item.c;
         subtotalUSD += totalLinea;

         tablaFilas += `
             <tr>
                 <td style="padding:6px; border:1px solid #ddd;">${item.n}</td>
                 <td style="padding:6px; border:1px solid #ddd; text-align:center;">${item.c} ${item.u}</td>
                 <td style="padding:6px; border:1px solid #ddd; text-align:right;">$${parseFloat(item.p).toFixed(2)}</td>
                 <td style="padding:6px; border:1px solid #ddd; text-align:right;">$${totalLinea.toFixed(2)}</td>
             </tr>
         `;
     }

     const tasa = currentConfig.tasa || 1;
     const totalBs = subtotalUSD * tasa;

     return `
         <div id="factura-print" style="font-family: Arial, sans-serif; padding:20px; color:#333; max-width:600px; margin:auto; background:#fff; border:1px solid #ccc;">
             <div style="text-align:center; border-bottom:2px solid #e63946; padding-bottom:10px; margin-bottom:15px;">
                 <h2 style="margin:0; color:#1d3557;">Emprendimiento Saul Taly</h2>
                 <p style="margin:2px 0; font-size:0.85rem;">RIF: ${currentConfig.rif || 'J-504752800'}</p>
                 <small>¡¡Productos naturales para tu salud!!</small>
             </div>

             <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-size:0.85rem;">
                 <div>
                     <strong>CLIENTE:</strong> ${pedido.cliente.nombre}<br>
                     <strong>C.I / RIF:</strong> ${pedido.cliente.cedula}<br>
                     <strong>TELÉFONO:</strong> ${pedido.cliente.telefono}
                 </div>
                 <div style="text-align:right;">
                     <strong>PEDIDO NRO:</strong> ${pedido.idPedido}<br>
                     <strong>FECHA:</strong> ${new Date(pedido.fechaRegistro).toLocaleDateString()}<br>
                     <strong>ESTADO:</strong> <span style="color:green; font-weight:bold;">APROBADO</span>
                 </div>
             </div>

             <table style="width:100%; border-collapse:collapse; margin-bottom:15px; font-size:0.85rem; color:#000;">
                 <thead>
                     <tr style="background:#f8f9fa;">
                         <th style="padding:6px; border:1px solid #ddd; text-align:left;">Producto</th>
                         <th style="padding:6px; border:1px solid #ddd; text-align:center;">Cant.</th>
                         <th style="padding:6px; border:1px solid #ddd; text-align:right;">P.Unit ($)</th>
                         <th style="padding:6px; border:1px solid #ddd; text-align:right;">Total ($)</th>
                     </tr>
                 </thead>
                 <tbody>
                     ${tablaFilas}
                 </tbody>
             </table>

             <div style="text-align:right; font-size:0.9rem; border-top:1px solid #ddd; padding-top:10px;">
                 <p style="margin:3px 0;"><strong>TOTAL USD:</strong> $${subtotalUSD.toFixed(2)}</p>
                 <p style="margin:3px 0;"><strong>TASA BCV:</strong> ${tasa.toFixed(2)} Bs/$</p>
                 <h3 style="margin:5px 0; color:#e63946;">TOTAL BS: ${totalBs.toFixed(2)} Bs</h3>
             </div>

             <div style="margin-top:20px; font-size:0.75rem; text-align:center; color:#777;">
                 <p>Forma de Pago: ${pedido.pago.metodo} (Ref: ${pedido.pago.referencia})</p>
                 <p>¡Gracias por su compra!</p>
             </div>
         </div>
     `;
 }





 window.fetchTasaBCV = async function() {
     const urlPrincipal = 'https://ve.dolarapi.com/v1/dolares/oficial';
     const urlRespaldo = 'https://pydolarve.org/api/v1/dollar?page=bcv';

     // 1. Intentar con DolarApi (API Principal)
     try {
         const response = await fetch(urlPrincipal, { cache: 'no-store' });
         if (!response.ok) throw new Error(`Error HTTP Principal: ${response.status}`);

         const data = await response.json();
         // DolarApi entrega el precio en la propiedad "promedio"
         const tasaOficial = parseFloat(data.promedio);

         if (tasaOficial && tasaOficial > 0) {
             if (typeof db !== 'undefined') {
                 await db.ref('config/tasa').set(tasaOficial);
             }
             if (typeof currentConfig !== 'undefined') {
                 currentConfig.tasa = tasaOficial;
             }
             console.log("Tasa BCV actualizada (DolarApi):", tasaOficial);
             return; // Éxito, termina la ejecución
         }
         throw new Error("Respuesta inválida de la API Principal");
     } catch (errorPrincipal) {
         console.warn("Falla en API principal, intentando con API de respaldo...", errorPrincipal.message);
     }

     // 2. Intentar con API de Respaldo
     try {
         const responseRespaldo = await fetch(urlRespaldo, { cache: 'no-store' });
         if (!responseRespaldo.ok) throw new Error(`Error HTTP Respaldo: ${responseRespaldo.status}`);

         const dataRespaldo = await responseRespaldo.json();
         // Obtiene el valor si la API de respaldo usa estructura de pydolarve o similar
         const tasaRespaldo = parseFloat(dataRespaldo.monedas?.usd?.promedio || dataRespaldo.price || 0);

         if (tasaRespaldo && tasaRespaldo > 0) {
             if (typeof db !== 'undefined') {
                 await db.ref('config/tasa').set(tasaRespaldo);
             }
             if (typeof currentConfig !== 'undefined') {
                 currentConfig.tasa = tasaRespaldo;
             }
             console.log("Tasa BCV actualizada (API Respaldo):", tasaRespaldo);
         } else {
             console.error("No se pudo obtener un valor válido de la API de respaldo.");
         }
     } catch (errorRespaldo) {
         console.error("Error crítico: Fallaron ambas APIs para obtener la tasa del BCV.", errorRespaldo);
     }
 };
 async function procesarPedido(event) {
     if (event) event.preventDefault();

     // 1. Validar que el carrito no esté vacío
     if (typeof cart === 'undefined' || Object.keys(cart).length === 0) {
         alert("⚠️ Tu carrito de compras está vacío.");
         return;
     }

     // 2. Comprobar si hay un usuario autenticado de forma segura
     let user = null;
     if (typeof auth !== 'undefined' && auth.currentUser) {
         user = auth.currentUser;
     } else if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
         user = firebase.auth().currentUser;
     }

     let nombreCliente = "Cliente No Autenticado";
     let cedulaCliente = "Sin iniciar sesión";
     let telefonoCliente = "Sin iniciar sesión";

     // SOLO leer de la BD si el usuario está autenticado
     if (user && user.uid && typeof db !== 'undefined') {
         try {
             const snap = await db.ref('usuarios/' + user.uid).once('value');
             const userDb = snap.val();
             if (userDb) {
                 nombreCliente = userDb.nombre || user.displayName || "Cliente";
                 cedulaCliente = userDb.cedula || "No registrada";
                 telefonoCliente = userDb.celular || "No registrado";
             }
         } catch (e) {
             console.warn("Aviso al consultar usuario:", e.message);
         }
     }

     // 3. Capturar datos del formulario de pago
     const elMetodo = document.getElementById('pagoMetodo');
     const elBanco = document.getElementById('pagoBancoOrigen');
     const elRef = document.getElementById('pagoReferencia');
     const elMontoBs = document.getElementById('pagoMontoBs');

     const metodo = elMetodo ? elMetodo.value : '';
     const bancoOrigen = elBanco ? elBanco.value.trim() : '';
     const referencia = elRef ? elRef.value.trim() : '';
     const montoBs = elMontoBs ? elMontoBs.value : '0.00';

     // Totales calculados
     const elUsd = document.getElementById('modal-total-usd');
     const elBs = document.getElementById('modal-total-bs');
     const totalUSD = elUsd ? elUsd.innerText : '$0.00';
     const totalBs = elBs ? elBs.innerText : '0.00 Bs';

     // 4. Construir objeto respetando STRICTAMENTE la regla .validate(['idPedido', 'cliente', 'items', 'pago', 'uidCliente'])
     const idPedido = "PED-" + Date.now();
     const uidCliente = user ? user.uid : 'invitado';

     const pedidoFirebase = {
         idPedido: idPedido,
         cliente: nombreCliente, // String para cumplir la validación simple
         items: cart,
         pago: {
             metodo: metodo,
             banco: bancoOrigen,
             referencia: referencia,
             montoBs: montoBs,
             totalUSD: totalUSD,
             totalBs: totalBs,
             fecha: new Date().toISOString()
         },
         uidCliente: uidCliente
     };

     // 5. Intentar guardar en Firebase Realtime Database
     if (typeof db !== 'undefined') {
         try {
             await db.ref('pedidos/' + idPedido).set(pedidoFirebase);
         } catch (errorFirebase) {
             console.error("Error al guardar en Firebase:", errorFirebase);
             // El proceso continúa para enviar a WhatsApp incluso si hay detalle de red/BD
         }
     }

     // 6. Construir el mensaje formateado para WhatsApp
     let m = "*🧾 NUEVO PEDIDO Y REPORTE DE PAGO*%0A";
     m += "*Emprendimiento Saul Taly*%0A";
     m += `🆔 *ID Pedido:* ${idPedido}%0A`;
     m += "----------------------------------------------------%0A";
     m += `👤 *Cliente:* ${nombreCliente}%0A`;
     m += `🆔 *Cédula:* ${cedulaCliente}%0A`;
     m += `📞 *Teléfono:* ${telefonoCliente}%0A`;
     if (!user) {
         m += "⚠️ *ESTADO AUTH:* Pendiente por iniciar sesión/registro para aprobación.%0A";
     }
     m += "----------------------------------------------------%0A";
     m += "*📦 DETALLE DEL PEDIDO:*%0A";

     for (let id in cart) {
         m += `• ${cart[id].n} (x${cart[id].c} ${cart[id].u}) -> $${(cart[id].p * cart[id].c).toFixed(2)}%0A`;
     }

     m += "%0A";
     m += `💵 *Total a Pagar (USD):* ${totalUSD}%0A`;
     m += `🇻🇪 *Total a Pagar (Bs):* ${totalBs}%0A`;
     m += "----------------------------------------------------%0A";
     m += "*💳 DATOS DEL PAGO REALIZADO:*%0A";
     m += `🔹 *Método:* ${metodo === 'pago_movil' ? 'Pago Móvil' : 'Transferencia'}%0A`;
     m += `🏦 *Banco Origen:* ${bancoOrigen}%0A`;
     m += `🔢 *Nº Referencia:* ${referencia}%0A`;
     m += `💰 *Monto Reportado:* Bs. ${montoBs}%0A%0A`;
     m += `_Por favor, confirme la recepción del pago para despachar el pedido._`;

     // 7. Redirigir a WhatsApp y restablecer interfaz
     const urlWS = "https://wa.me/584126950652?text=" + m;

     cart = {};
     if (typeof updateCartUI === 'function') updateCartUI();
     if (typeof cerrarModalCheckout === 'function') cerrarModalCheckout();

     window.open(urlWS, '_blank');

     // 8. Abrir modal de autenticación si no estaba logueado
     if (!user) {
         alert("⚠️ Tu pedido fue registrado. Recuerda que para validar y aprobar tu pago debes iniciar sesión o registrarte.");
         if (typeof toggleAuthModal === 'function') {
             toggleAuthModal(true);
         }
     }
 }
 function registrarPedidoEnFirebase() {
     const nombre = document.getElementById('cliNombre').value.trim();
     const cedula = document.getElementById('cliCedula').value.trim();
     const telefono = document.getElementById('cliTelefono').value.trim();
     const banco = document.getElementById('pagoBancoOrigen').value.trim();
     const referencia = document.getElementById('pagoReferencia').value.trim();
     const fecha = document.getElementById('pagoFecha').value;
     const metodoPagoSel = document.getElementById('pagoMetodoSelect').value;

     const metodoEnvio = document.getElementById('opcionEnvioSel').value;
     const direccionDelivery = document.getElementById('envioDireccionExacta').value.trim();
     const agenciaMRW = document.getElementById('envioAgenciaMRW').value.trim();

     if (!nombre || !cedula || !telefono || !referencia || !fecha) {
         alert("⚠️ Por favor completa todos los campos obligatorios (*).");
         return;
     }

     if (metodoEnvio === 'delivery' && !direccionDelivery) {
         alert("⚠️ Por favor ingresa la dirección o punto de referencia para el Delivery.");
         return;
     }
     if (metodoEnvio === 'mrw' && !agenciaMRW) {
         alert("⚠️ Por favor indica la agencia MRW de destino.");
         return;
     }

     // Cálculos de Totales
     let totalUSD = 0;
     for (let id in cart) {
         totalUSD += cart[id].p * cart[id].c;
     }
     const tasa = currentConfig.tasa || 1;
     const totalBs = totalUSD * tasa;
     const idPedido = "PED-" + Date.now().toString().slice(-6);

     // Obtener UID del usuario autenticado (Se asigna 'invitado' si no hay sesión para cumplir las Reglas de Firebase)
     const currentUser = (typeof auth !== 'undefined' && auth.currentUser)
         ? auth.currentUser
         : (typeof firebase !== 'undefined' && firebase.auth ? firebase.auth().currentUser : null);
     const userUid = currentUser ? currentUser.uid : "invitado";

     const nuevoPedido = {
         idPedido: idPedido,
         uid: userUid, // Identificador con user.uid
         uidCliente: userUid, // Necesario para que Cloud Functions identifique al destinatario de las notificaciones FCM
         nombreCliente: nombre, // Para que la notificación push muestre el nombre del cliente
         totalBs: totalBs, // Para que la notificación push del admin muestre el total en Bs
         fechaRegistro: new Date().toISOString(),
         estado: 'PENDIENTE',
         cliente: {
             uid: userUid, // Identificador con user.uid dentro de cliente
             nombre: nombre,
             cedula: cedula,
             telefono: telefono
         },
         pago: {
             metodo: metodoPagoSel,
             bancoOrigen: banco,
             banco: banco,
             referencia: referencia,
             fecha: fecha,
             montoUSD: totalUSD,
             montoBs: totalBs,
             estado: 'PENDIENTE',
             captura: typeof capturaBase64 !== 'undefined' ? capturaBase64 : ""
         },
         envio: {
             modalidad: metodoEnvio,
             metodo: metodoEnvio,
             direccion: direccionDelivery,
             agencia: agenciaMRW,
             detalle: metodoEnvio === 'delivery' ? direccionDelivery : (metodoEnvio === 'mrw' ? agenciaMRW : 'Retiro en tienda')
         },
         items: cart
     };

     // Generar la estructura de la factura si la función existe
     if (typeof generarHtmlFactura === 'function') {
         nuevoPedido.facturaHtml = generarHtmlFactura(nuevoPedido);
     }

     // Función auxiliar interna para limpiar carrito y actualizar la app
     const finalizarCompra = () => {
         cart = {};
         if (typeof updateCartUI === 'function') updateCartUI();
         if (typeof cerrarModalCheckout === 'function') cerrarModalCheckout();
         if (typeof render === 'function') render();

         // Si el usuario no está logueado, se abre el modal de login/registro
         if (!currentUser) {
             alert("🚀 ¡Pedido registrado con éxito! Para que validemos tu pago, por favor inicia sesión o regístrate.");
             if (typeof toggleAuthModal === 'function') {
                 toggleAuthModal(true);
             } else if (typeof abrirModalLogin === 'function') {
                 abrirModalLogin();
             }
         }
     };

     // Guardar en Firebase Realtime Database
     db.ref('pedidos/' + idPedido).set(nuevoPedido).then(() => {
         if (currentUser) {
             alert("🚀 ¡Pedido registrado con éxito! El administrador validará el pago.");
         }
         finalizarCompra();
     }).catch(err => {
         console.warn("Aviso Firebase (Sin interrupción del flujo):", err.message);
         finalizarCompra();
     });
 }

 db.ref('pedidos').on('child_added', snapshot => {
     const nuevoPedido = snapshot.val();
     if (!nuevoPedido) return;

     const fechaPedido = new Date(nuevoPedido.fechaRegistro || Date.now()).getTime();
     const ahora = new Date().getTime();

     // Solo notifica pedidos creados dentro de los últimos 15 segundos
     if (ahora - fechaPedido < 15000) {
         const usuarioActual = firebase.auth().currentUser;

         if (usuarioActual) {
             db.ref('usuarios/' + usuarioActual.uid).once('value').then(s => {
                 const u = s.val();
                 if ((u && u.rol === 'admin') || usuarioActual.email === 'saul.taly14@gmail.com') {
                     const montoUSD = nuevoPedido.pago && nuevoPedido.pago.montoUSD
                         ? parseFloat(nuevoPedido.pago.montoUSD).toFixed(2)
                         : "0.00";

                     enviarNotificacionTelefono(
                         "🚨 ¡NUEVO PEDIDO RECIBIDO!",
                         `Pedido: ${nuevoPedido.idPedido || 'Nuevo'} por $${montoUSD}`
                     );
                 }
             });
         }
     }
 });
 function cargarPedidosFirebase() {
     const contenedor = document.getElementById('contenedorMisPedidos');
     if (contenedor) {
         contenedor.innerHTML = '<p style="text-align: center; color: #666;">Buscando tus compras...</p>';
     }

     const currentUser = (typeof auth !== 'undefined' && auth.currentUser) ? auth.currentUser : firebase.auth().currentUser;
     if (!currentUser) {
         if (contenedor) contenedor.innerHTML = '<p style="text-align: center; color: #888;">Inicia sesión para ver tus pedidos.</p>';
         return;
     }

     const userUid = currentUser.uid;

     db.ref('pedidos').on('value', snapshot => {
         pedidosDelUsuario = [];
         const data = snapshot.val();

         if (data) {
             Object.keys(data).forEach(key => {
                 const p = data[key];
                 // Verifica si coincide por uid, uidCliente o cliente.uid
                 if (p.uid === userUid || p.uidCliente === userUid || (p.cliente && p.cliente.uid === userUid)) {
                     pedidosDelUsuario.push(p);
                 }
             });
             // Ordenar del más reciente al más antiguo
             pedidosDelUsuario.sort((a, b) => new Date(b.fechaRegistro) - new Date(a.fechaRegistro));
         }

         renderizarListaPedidos();
     });
 }


 function filtrarMisPedidos(estado) {
     estadoFiltroActual = estado;

     // Estilos de los botones
     const btnPen = document.getElementById('tab-pendientes');
     const btnApr = document.getElementById('tab-aprobados');
     const btnRec = document.getElementById('tab-rechazados');

     if (btnPen) {
         btnPen.style.background = (estado === 'PENDIENTE') ? 'var(--rojo)' : '#e9ecef';
         btnPen.style.color = (estado === 'PENDIENTE') ? 'white' : '#333';
     }

     if (btnApr) {
         btnApr.style.background = (estado === 'APROBADO') ? '#28a745' : '#e9ecef';
         btnApr.style.color = (estado === 'APROBADO') ? 'white' : '#333';
     }

     if (btnRec) {
         btnRec.style.background = (estado === 'RECHAZADO') ? '#dc3545' : '#e9ecef';
         btnRec.style.color = (estado === 'RECHAZADO') ? 'white' : '#333';
     }

     renderizarListaPedidos();
 }

 // Renderizar tarjetas de los pedidos según la pestaña seleccionada
 function renderizarListaPedidos() {
     const contenedor = document.getElementById('contenedorMisPedidos');
     contenedor.innerHTML = "";

     const filtrados = pedidosDelUsuario.filter(p => (p.pago ? p.pago.estado : 'PENDIENTE') === estadoFiltroActual);

     if (filtrados.length === 0) {
         let textoVacio = estadoFiltroActual === 'PENDIENTE' ? 'Por Confirmar' : (estadoFiltroActual === 'APROBADO' ? 'Aprobados' : 'Rechazados');
         contenedor.innerHTML = `<div style="text-align: center; color: #888; padding: 20px;">
             No tienes pedidos en estado <b>${textoVacio}</b>.
         </div>`;
         return;
     }

     filtrados.forEach(p => {
         let itemsHtml = "";
         for (let key in p.items) {
             const item = p.items[key];
             const precioItem = Number(item.p) || 0;
             const cantItem = Number(item.c) || 1;
             itemsHtml += `<li style="font-size:0.8rem; color:#555;">${item.n} (x${cantItem} ${item.u || 'Und'}) - $${(precioItem * cantItem).toFixed(2)}</li>`;
         }

         const estadoPago = p.pago ? p.pago.estado : (p.estado || 'PENDIENTE');
         let badgeColor = '#ffc107';
         let badgeTexto = '⏳ Pendiente por Confirmar';
         let textColor = '#212529';

         if (estadoPago === 'APROBADO') {
             badgeColor = '#28a745';
             badgeTexto = '✅ Pago Aprobado';
             textColor = '#ffffff';
         } else if (estadoPago === 'RECHAZADO') {
             badgeColor = '#dc3545';
             badgeTexto = '❌ Pago Rechazado';
             textColor = '#ffffff';
         }

         // Formato seguro para números
         const bancoOrigen = p.pago ? (p.pago.banco || p.pago.bancoOrigen || 'N/A') : 'N/A';
         const refPago = p.pago ? p.pago.referencia : 'N/A';
         const montoBs = p.pago ? Number(p.pago.montoBs).toFixed(2) : '0.00';

         contenedor.innerHTML += `
             <div style="border: 1px solid #ddd; border-radius: 10px; padding: 12px; margin-bottom: 12px; background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                 <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 8px;">
                     <strong style="color: var(--negro); font-size: 0.9rem;">${p.idPedido}</strong>
                     <span style="background: ${badgeColor}; color: ${textColor}; padding: 3px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: bold;">
                         ${badgeTexto}
                     </span>
                 </div>

                 <ul style="margin: 5px 0; padding-left: 18px;">
                     ${itemsHtml}
                 </ul>

                 <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.85rem; background: #f8f9fa; padding: 6px 10px; border-radius: 6px;">
                     <span>Ref: <b>${refPago}</b> (${bancoOrigen})</span>
                     <span style="color: var(--rojo); font-weight: bold;">Bs. ${montoBs}</span>
                 </div>

                 ${estadoPago === 'RECHAZADO' ? `
                     <p style="margin: 8px 0 0 0; color: #dc3545; font-size: 0.78rem; text-align: center; font-weight: bold;">
                         ⚠️ Tu pago no pudo ser verificado. Por favor contacta al soporte o intenta realizar el pedido nuevamente.
                     </p>
                 ` : ''}

                 ${estadoPago === 'APROBADO' ? `
                     <button onclick="verReciboDigital('${p.idPedido}')" style="width: 100%; margin-top: 8px; padding: 6px; background: var(--negro); color: white; border: none; border-radius: 6px; font-size: 0.8rem; cursor: pointer; font-weight: bold;">
                         📄 Ver Recibo / Factura
                     </button>
                 ` : ''}
             </div>
         `;
     });
 }

  let estadoFiltroAdmin = 'PENDIENTE';
let listaPedidosAdminCache = [];

function cargarPedidosAdmin(estado) {
    estadoFiltroAdmin = estado || 'PENDIENTE';

    const btnPen = document.getElementById('btn-adm-pen');
    const btnApr = document.getElementById('btn-adm-apr');
    const btnRec = document.getElementById('btn-adm-rec');

    if (btnPen && btnApr && btnRec) {
        btnPen.style.background = (estadoFiltroAdmin === 'PENDIENTE') ? 'var(--rojo)' : '#333';
        btnApr.style.background = (estadoFiltroAdmin === 'APROBADO') ? '#28a745' : '#333';
        btnRec.style.background = (estadoFiltroAdmin === 'RECHAZADO') ? '#dc3545' : '#333';
    }

    db.ref('pedidos').on('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            listaPedidosAdminCache = [];
            renderizarPedidosAdmin([]);
            return;
        }

        let pedidos = Object.values(data);
        listaPedidosAdminCache = pedidos.filter(p => (p.pago && p.pago.estado ? p.pago.estado : 'PENDIENTE') === estadoFiltroAdmin);
        listaPedidosAdminCache.sort((a, b) => new Date(b.fechaRegistro || 0) - new Date(a.fechaRegistro || 0));

        filtrarPedidosAdmin();
    });
}

function filtrarPedidosAdmin() {
    const busqueda = (document.getElementById('buscar-pedido-adm')?.value || "").toLowerCase().trim();

    if (!busqueda) {
        renderizarPedidosAdmin(listaPedidosAdminCache);
        return;
    }

    const filtrados = listaPedidosAdminCache.filter(p => {
        const idPedido = (p.idPedido || "").toLowerCase();
        const clienteNombre = (p.cliente && p.cliente.nombre ? p.cliente.nombre : "").toLowerCase();
        const clienteCedula = (p.cliente && p.cliente.cedula ? p.cliente.cedula : "").toLowerCase();
        const referencia = (p.pago && p.pago.referencia ? p.pago.referencia : "").toLowerCase();

        return idPedido.includes(busqueda) ||
               clienteNombre.includes(busqueda) ||
               clienteCedula.includes(busqueda) ||
               referencia.includes(busqueda);
    });

    renderizarPedidosAdmin(filtrados);
}

function renderizarPedidosAdmin(pedidos) {
    const contenedor = document.getElementById('admin-pedidos-lista');
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (pedidos.length === 0) {
        contenedor.innerHTML = `<p style="color:#aaa; font-size:0.8rem; text-align:center;">No se encontraron pedidos.</p>`;
        return;
    }

    pedidos.forEach(p => {
        let itemsTxt = "";
        if (p.items) {
            for (let k in p.items) {
                itemsTxt += `• ${p.items[k].n || 'Producto'} (x${p.items[k].c || 1} ${p.items[k].u || 'Und'})<br>`;
            }
        }

        const clienteNombre = p.cliente ? p.cliente.nombre : 'Cliente Desconocido';
        const clienteCedula = p.cliente ? p.cliente.cedula : 'N/A';
        const clienteTelefono = p.cliente ? p.cliente.telefono : 'N/A';

        // Determinar el estado real leyendo tanto p.pago.estado como p.estado
        const estadoActual = (p.pago && p.pago.estado) ? p.pago.estado : (p.estado || 'PENDIENTE');

        // Datos de Envío Detallados
        const modalidadEnvio = p.envio && p.envio.modalidad ? p.envio.modalidad.toUpperCase() : 'NO ESPECIFICADO';
        const detalleEnvio = p.envio && p.envio.detalle ? p.envio.detalle : 'Sin detalle';

        const montoUsd = p.pago && p.pago.montoUSD ? Number(p.pago.montoUSD).toFixed(2) : '0.00';
        const montoBs = p.pago && p.pago.montoBs ? Number(p.pago.montoBs).toFixed(2) : '0.00';

        // Comprobar si existe la captura de pago
        const tieneCaptura = p.pago && p.pago.captura && p.pago.captura.length > 20;
        const btnCaptura = tieneCaptura
            ? `<button onclick="verComprobanteAdmin('${p.idPedido}')" style="background:#17a2b8; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:bold;">🖼️ Ver Captura</button>`
            : `<span style="color:#777; font-size:0.75rem;">Sin captura</span>`;

        contenedor.innerHTML += `
            <div style="background:#1a1a1a; border:1px solid #333; padding:12px; margin-bottom:12px; border-radius:8px; color:#fff;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                    <strong style="color:var(--rojo);">${p.idPedido}</strong>
                    <small style="color:#aaa;">${p.fechaRegistro ? new Date(p.fechaRegistro).toLocaleString() : ''}</small>
                </div>

                <p style="margin:4px 0; font-size:0.85rem;"><b>Cliente:</b> ${clienteNombre} | <b>C.I:</b> ${clienteCedula} | <b>Tel:</b> ${clienteTelefono}</p>
                <p style="margin:4px 0; font-size:0.85rem; color:#28a745;"><b>🚚 Modalidad Envío:</b> ${modalidadEnvio}</p>
                <p style="margin:4px 0; font-size:0.85rem; color:#ccc;"><b>📍 Detalle Envío:</b> ${detalleEnvio}</p>

                <div style="background:#222; padding:8px; border-radius:6px; margin:8px 0; font-size:0.8rem;">
                    <b>Productos:</b><br>${itemsTxt}
                </div>

                <div style="font-size:0.85rem; margin-bottom:8px;">
                    <b>Total:</b> $${montoUsd} (${montoBs} Bs) | <b>Ref:</b> ${p.pago?.referencia || 'N/A'} (${p.pago?.bancoOrigen || 'N/A'})
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; border-top:1px solid #2a2a2a; padding-top:8px; flex-wrap:wrap; gap:6px;">
                    <div style="display:flex; gap:6px; align-items:center;">
                        ${btnCaptura}
                        <button onclick="verFacturaAdmin('${p.idPedido}')" style="background:#6f42c1; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.75rem; font-weight:bold;">🧾 Ver Factura</button>
                    </div>

                    ${(estadoActual === 'PENDIENTE') ? `
                        <div style="display:flex; gap:8px;">
                            <button onclick="aprobarPedidoAdmin('${p.idPedido}')" style="background:#28a745; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">
                                ✅ Aprobar
                            </button>
                            <button onclick="rechazarPedidoAdmin('${p.idPedido}')" style="background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:0.8rem;">
                                ❌ Rechazar
                            </button>
                        </div>
                    ` : `<span style="font-size:0.8rem; color:#aaa;">Estado actual: <b>${estadoActual}</b></span>`}
                </div>
            </div>
        `;
    });
}

// Funciones puente para vincular los botones de Aprobar y Rechazar con cambiarEstadoPedido
function aprobarPedidoAdmin(orderId) {
    cambiarEstadoPedido(orderId, 'APROBADO');
}

function rechazarPedidoAdmin(keyPedido, uidCliente, idPedidoLegible) {
    const motivo = prompt("Indique el motivo del rechazo (Opcional):", "Comprobante de pago no verificado / incompleto");
    if (motivo === null) return; // Cancelado por el admin

    // 1. Actualizar el estado del pedido a RECHAZADO
    db.ref(`pedidos/${keyPedido}`).update({
        estado: 'RECHAZADO',
        motivoRechazo: motivo
    }).then(() => {

        // 2. Si el pedido tiene un cliente asignado, registrar la notificación
        if (uidCliente) {
            const nuevaNotifRef = db.ref(`notificaciones_cliente/${uidCliente}`).push();
            nuevaNotifRef.set({
                titulo: "❌ Pedido Rechazado",
                mensaje: `Tu pedido ${idPedidoLegible || keyPedido} ha sido rechazado. Motivo: ${motivo}`,
                fecha: new Date().toISOString(),
                leido: false
            });
        }

        alert("Pedido marcado como RECHAZADO y notificación enviada al cliente.");

        // Recargar la lista en el panel admin
        if (typeof cargarPedidosAdmin === 'function') {
            cargarPedidosAdmin('PENDIENTE');
        }
    }).catch(err => {
        alert("Error al actualizar el pedido: " + err.message);
    });
}

function cambiarEstadoPedido(orderId, nuevoEstado) {
    let mensajeConfirmacion = nuevoEstado === 'RECHAZADO'
        ? `⚠️ ¿Seguro que deseas RECHAZAR el pedido ${orderId}?`
        : `¿Seguro que deseas APROBAR el pedido ${orderId} y emitir la factura?`;

    if (confirm(mensajeConfirmacion)) {
        db.ref(`pedidos/${orderId}`).once('value').then(snapshot => {
            const pedido = snapshot.val();
            if (!pedido) {
                alert("No se encontró el pedido en la base de datos.");
                return;
            }

            const updates = {};
            // Guardar el estado en ambas ubicaciones para evitar fallos de compatibilidad
            updates[`pedidos/${orderId}/pago/estado`] = nuevoEstado;
            updates[`pedidos/${orderId}/estado`] = nuevoEstado;

            if (nuevoEstado === 'APROBADO') {
                updates[`pedidos/${orderId}/facturaHtml`] = typeof generarHtmlFactura === 'function' ? generarHtmlFactura(pedido) : '';
                updates[`pedidos/${orderId}/fechaAprobacion`] = new Date().toISOString();
            }

            return db.ref().update(updates);
        }).then(() => {
            alert(`Pedido ${orderId} actualizado a '${nuevoEstado}' exitosamente.`);
            cargarPedidosAdmin(estadoFiltroAdmin);
        }).catch(err => {
            alert("Error actualizando pedido: " + err.message);
        });
    }
}
// Aprobar pedido desde el panel y enviar comprobante/SMS a WhatsApp y Centro de Notificaciones
function aprobarPedidoAdmin(orderId) {
    db.ref(`pedidos/${orderId}`).once('value').then(snapshot => {
        const pedido = snapshot.val();
        if (!pedido) return;

        // 1. Generar factura visual / comprobante
        const facturaHtml = generarHtmlFactura(pedido);

        // 2. Actualizar estado e insertar la factura en el pedido
        db.ref(`pedidos/${orderId}/pago`).update({ estado: 'APROBADO' });
        db.ref(`pedidos/${orderId}`).update({ facturaHtml: facturaHtml });

        // 3. Notificación al Centro de Notificaciones del Cliente
        if (pedido.uidCliente && pedido.uidCliente !== "INVITADO") {
            db.ref(`notificaciones_cliente/${pedido.uidCliente}`).push({
                titulo: "✅ ¡Pedido Aprobado!",
                mensaje: `Tu pedido ${orderId} ha sido verificado con éxito y en breve se enviará a tu dirección.`,
                fecha: new Date().toISOString(),
                leido: false,
                idPedido: orderId
            });
        }

        // 4. Lanzar Notificación a la Barra de Notificaciones del Teléfono
        enviarNotificacionTelefono("✅ Pedido Aprobado", `El pedido ${orderId} fue aprobado y entrará a despacho.`);

        // 5. Preparar mensaje SMS / WhatsApp para el cliente con su comprobante
        let m = `*✅ ¡TU PEDIDO HA SIDO APROBADO!*%0A`;
        m += `*Emprendimiento Saul Taly*%0A----------------------------------------------------%0A`;
        m += `📦 *Pedido N°:* ${orderId}%0A`;
        m += `👤 *Cliente:* ${pedido.cliente.nombre}%0A`;
        m += `💵 *Monto Aprobado:* $${pedido.pago.montoUSD.toFixed(2)} (${pedido.pago.montoBs.toFixed(2)} Bs)%0A`;
        m += `🚚 *Envío:* ${pedido.envio.detalle}%0A%0A`;
        m += `🚀 _Su pago fue verificado exitosamente y en breve se enviará su pedido._`;

        let phoneClean = pedido.cliente.telefono.replace(/[^0-9]/g, '');
        if (phoneClean.startsWith('0')) phoneClean = '58' + phoneClean.substring(1);

        const urlWS = `https://wa.me/${phoneClean}?text=${m}`;
        window.open(urlWS, '_blank');

        alert(`Pedido ${orderId} aprobado con éxito.`);
    });
}
// Actualizar estado del pedido (Llamar al cambiar de estado en Admin, notifica al rechazar o aprobar)
function cambiarEstadoPedido(idPedido, nuevoEstado, uidCliente) {
    db.ref(`pedidos/${idPedido}/pago/estado`).set(nuevoEstado).then(() => {
        let titulo = nuevoEstado === 'APROBADO' ? "✅ ¡Pedido Aprobado!" : "❌ Pedido Rechazado";
        let mensaje = nuevoEstado === 'APROBADO'
            ? `Tu pedido ${idPedido} ha sido verificado y está en proceso de despacho.`
            : `Tu pedido ${idPedido} ha sido rechazado. Revisa el estado en 'Mis Pedidos' o contacta a soporte.`;

        if (uidCliente && uidCliente !== "INVITADO") {
            db.ref(`notificaciones_cliente/${uidCliente}`).push({
                titulo: titulo,
                mensaje: mensaje,
                fecha: new Date().toISOString(),
                leido: false
            });
        }
        alert(`Pedido ${idPedido} cambiado a ${nuevoEstado}`);
    });
}
// Escuchar cambios de estado en los pedidos del cliente logueado
function escucharCambiosEstadoCliente(uidCliente) {
    if (!uidCliente || uidCliente === 'invitado') return;

    db.ref('pedidos').orderByChild('uidCliente').equalTo(uidCliente).on('child_changed', snapshot => {
        const pedido = snapshot.val();
        if (!pedido) return;

        let titulo = "Actualización de tu pedido";
        let mensaje = `Tu pedido #${pedido.idPedido} cambió a: ${pedido.estado}`;

        if (pedido.estado === "Aprobado" || pedido.estado === "APROBADO") {
            titulo = "✅ ¡Pedido Aprobado!";
            mensaje = `¡Buenas noticias! Tu pedido #${pedido.idPedido} ha sido aprobado y está en preparación.`;
        } else if (pedido.estado === "Rechazado" || pedido.estado === "RECHAZADO") {
            titulo = "❌ Actualización de tu pedido";
            mensaje = `Tu pedido #${pedido.idPedido} no pudo ser procesado. Revisa los detalles en la app.`;
        } else if (pedido.estado === "En Camino" || pedido.estado === "EN CAMINO") {
            titulo = "🚚 ¡Pedido en Camino!";
            mensaje = `Tu pedido #${pedido.idPedido} ya va rumbo a tu dirección.`;
        }

        // Emitir notificación push en el navegador / PWA
        if (Notification.permission === "granted") {
            new Notification(titulo, {
                body: mensaje,
                icon: "img/logo.png"
            });
        }
    });
}