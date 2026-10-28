// Visualizador de Captura / Comprobante de Pago en el Modal Admin
function verComprobanteAdmin(idPedido) {
    const pedido = listaPedidosAdminCache.find(p => p.idPedido === idPedido);
    if (!pedido || !pedido.pago || !pedido.pago.captura) {
        alert("Este pedido no posee un capture de pago cargado.");
        return;
    }
    const modalImg = document.getElementById('modal-captura-admin');
    const imgElem = document.getElementById('img-captura-admin');
    if (modalImg && imgElem) {
        imgElem.src = pedido.pago.captura;
        modalImg.style.display = 'flex';
    }
}

function cerrarModalCapturaAdmin() {
    const modalImg = document.getElementById('modal-captura-admin');
    if (modalImg) modalImg.style.display = 'none';
}

// Cerrar ventana emergente de factura
function cerrarFacturaAdmin(ventanaRef) {
    if (ventanaRef && !ventanaRef.closed) {
        ventanaRef.close();
    }
}

// Abrir e Imprimir Factura Emitida desde Admin
function verFacturaAdmin(idPedido) {
    const pedido = listaPedidosAdminCache.find(p => p.idPedido === idPedido);
    if (!pedido) return alert("Pedido no encontrado.");

    const htmlFactura = pedido.facturaHtml || (typeof generarHtmlFactura === 'function' ? generarHtmlFactura(pedido) : '<p style="color:#ffffff;">No se pudo generar la factura.</p>');

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
        background: #121212;
        color: #ffffff;
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
                background: #181818;
                padding: 12px 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.5);
                border-top: 1px solid #2e2e2e;
                z-index: 1000000;
                box-sizing: border-box;
            }
            .btn-volver-recibo {
                background: #d32f2f;
                color: #ffffff;
                border: none;
                padding: 10px 18px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 0.95rem;
            }
            .btn-imprimir-recibo {
                background: #ffe066;
                color: #121212;
                border: none;
                padding: 10px 16px;
                border-radius: 8px;
                font-weight: bold;
                cursor: pointer;
                font-size: 0.9rem;
            }
            @media print {
                .footer-nav-recibo { display: none !important; }
                #modal-recibo-digital { padding-bottom: 0 !important; background: white !important; color: black !important; }
            }// Agrega esta línea al final de verFacturaAdmin y verReciboDigital cuando se muestre el modal:
             history.pushState({ verReciboAbierto: true }, '');
        </style>
    `;

    // 4. Inyectar el HTML de la factura y la barra de navegación
    contenedorModal.innerHTML = `
        ${estilosBarra}
        <div class="contenido-factura">
            ${htmlFactura}
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
    // Agrega esta línea al final de verFacturaAdmin y verReciboDigital cuando se muestre el modal:
    history.pushState({ verReciboAbierto: true }, '');
}

// Función para cerrar el recibo/factura y regresar a la App
function cerrarReciboDigital() {
    const contenedorModal = document.getElementById('modal-recibo-digital');
    if (contenedorModal && contenedorModal.style.display !== 'none') {
        contenedorModal.style.display = 'none';
        contenedorModal.innerHTML = '';

        // Si se cerró con el botón en pantalla, retrocedemos el historial para mantener la coherencia
        if (history.state && history.state.verReciboAbierto) {
            history.back();
        }
    }
}
function switchAdminTab(secId, btnElem) {
    // Ocultar todas las secciones y quitar clase activa de pestañas
    document.querySelectorAll('.admin-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));

    // Activar sección y pestaña seleccionada
    document.getElementById(secId).classList.add('active');
    btnElem.classList.add('active');

    // Cargas rápidas al cambiar de pestaña
    if (secId === 'sec-pedidos') cargarPedidosAdmin(estadoFiltroAdmin);
    if (secId === 'sec-clientes') cargarClientesAdmin();
}

function cerrarAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

// Cargar Clientes desde Firebase Realtime Database
function cargarClientesAdmin() {
    const cont = document.getElementById('admin-clientes-lista');
    if (!cont) return;

    cont.innerHTML = '<p style="color:#b0b0b0; font-size:0.85rem; text-align:center; padding:15px;">Cargando clientes...</p>';

    db.ref('usuarios').on('value', snapshot => {
        const data = snapshot.val();
        cont.innerHTML = "";

        if (!data) {
            cont.innerHTML = '<p style="color:#b0b0b0; font-size:0.85rem; text-align:center; padding:15px;">No hay clientes registrados.</p>';
            return;
        }

        clientesListaAdmin = Object.values(data);
        renderizarTablaClientes(clientesListaAdmin);
    });
}

function renderizarTablaClientes(lista) {
    const cont = document.getElementById('admin-clientes-lista');
    if (lista.length === 0) {
        cont.innerHTML = '<p style="color:#b0b0b0; font-size:0.85rem; text-align:center; padding:15px;">No se encontraron clientes.</p>';
        return;
    }

    let html = `<div style="display:grid; gap:12px;">`;
    lista.forEach(c => {
        html += `
            <div style="background:#1e1e1e; border:1px solid #2e2e2e; border-radius:10px; padding:14px; font-size:0.88rem; color:#f5f5f5; display:flex; justify-content:space-between; align-items:center; box-shadow:0 4px 10px rgba(0,0,0,0.2);">
                <div>
                    <strong style="font-size:0.95rem; color:#ffffff;">${c.nombre || 'Sin Nombre'}</strong><br>
                    <span style="color:#b0b0b0;">C.I: ${c.cedula || 'N/A'}</span> |
                    <span style="color:#b0b0b0;">Tel: ${c.celular || 'N/A'}</span><br>
                    <small style="color:#777777;">${c.correo || 'Sin correo'}</small>
                </div>
                <div>
                    ${c.celular ? `
                        <a href="https://wa.me/58${c.celular.replace(/[^0-9]/g, '').slice(-10)}" target="_blank" style="background:#25D366; color:#ffffff; text-decoration:none; padding:7px 12px; border-radius:6px; font-size:0.78rem; font-weight:bold; display:inline-flex; align-items:center; gap:5px; box-shadow:0 2px 6px rgba(37,211,102,0.3);">
                            💬 WhatsApp
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    cont.innerHTML = html;
}

function filtrarClientesAdmin() {
    const busqueda = document.getElementById('buscar-cliente-adm').value.toLowerCase().trim();
    const filtrados = clientesListaAdmin.filter(c =>
        (c.nombre && c.nombre.toLowerCase().includes(busqueda)) ||
        (c.cedula && c.cedula.toLowerCase().includes(busqueda))
    );
    renderizarTablaClientes(filtrados);
}

function reportarFallaWhatsApp() {
    let nombreCliente = "Cliente";

    if (auth.currentUser) {
        const userDb = auth.currentUser;
        nombreCliente = userDb.displayName || userDb.email || "Cliente";
    }

    let m = "*🛠️ REPORTE DE FALLA O INCIDENCIA*%0A";
    m += "*Emprendimiento Saul Taly*%0A";
    m += "----------------------------------------------------%0A";
    m += `👤 *Usuario:* ${nombreCliente}%0A`;
    m += `📱 *Dispositivo:* Android / Web%0A`;
    m += "----------------------------------------------------%0A";
    m += "Hola, necesito asistencia técnica o reportar el siguiente inconveniente en la aplicación:%0A%0A- ";

    const urlWS = "https://wa.me/584126950652?text=" + m;
    window.location.href = urlWS;
}

function seleccionarOpcionEnvio(metodo, elemento) {
    document.querySelectorAll('.envio-card').forEach(card => card.classList.remove('active'));
    elemento.classList.add('active');
    document.getElementById('opcionEnvioSel').value = metodo;

    const campoDelivery = document.getElementById('campo-delivery');
    const campoMRW = document.getElementById('campo-mrw');

    if (campoDelivery) campoDelivery.style.display = (metodo === 'delivery') ? 'block' : 'none';
    if (campoMRW) campoMRW.style.display = (metodo === 'mrw') ? 'block' : 'none';
}

function rechazarPedidoAdmin(orderId) {
    if (confirm(`¿Seguro que deseas rechazar el pedido ${orderId}?`)) {
        db.ref(`pedidos/${orderId}/pago`).update({ estado: 'RECHAZADO' });
        alert(`Pedido ${orderId} rechazado.`);
    }
}
