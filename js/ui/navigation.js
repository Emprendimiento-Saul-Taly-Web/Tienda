  function quickSearch(termino) {
    document.getElementById('busqueda').value = termino;
    // Forzamos el render con scroll porque el usuario hizo un clic explícito
    render(true);
}

function render(debeMoverPantalla = false) {
    const inputBusqueda = document.getElementById('busqueda');
    if (!inputBusqueda) return;

    const busqueda = inputBusqueda.value.toLowerCase().trim();
    const grid = document.getElementById('main-grid');
    grid.innerHTML = "";

    let encontrados = 0;

    currentItems.forEach(p => {

        if (p.n.toLowerCase().includes(busqueda)) {
            const itemInCart = cart[p.id];
            const qtyDisplay = itemInCart ? `<div class="qty-badge">${itemInCart.c} ${itemInCart.u}</div>` : "";
            const btnTrash = itemInCart ? `<button onclick="deleteCartItem('${p.id}')" style="background:#dc3545; color:white; border:none; padding:10px 12px; border-radius:15px; margin-top:10px; cursor:pointer; font-size:0.9rem;" title="Quitar producto">🗑️</button>` : "";

            // Lógica de stock
            const stockRaw = obtenerStockPorNombre(p.n);
            const stockNum = Number(stockRaw) || 0;
            const stockFormateado = stockNum.toFixed(2);
            const sinStock = stockNum <= 0;

            const badgeStock = `<span style="background:${sinStock ? '#dc3545' : '#28a745'}; color:white; padding:3px 8px; border-radius:10px; font-size:0.75rem; font-weight:bold; display:inline-block; margin-top:4px;">
                ${sinStock ? 'Agotado' : `Stock: ${stockFormateado} ${p.tipo === 'peso' ? 'Kg' : 'Und'}`}
            </span>`;

            const btnAdd = sinStock
                ? `<button disabled style="flex:1; background:#888; color:white; border:none; padding:10px; border-radius:12px; cursor:not-allowed;">Agotado</button>`
                : `<button class="btn-add-grid" onclick="openProductDetail('${p.id}')" style="flex:1;">Añadir al Carrito</button>`;

            grid.innerHTML += `
                <div class="card" id="prod-${p.id}">
                    ${qtyDisplay}
                    <div class="img-wrap" onclick="openProductDetail('${p.id}')">
                        <img src="${p.i || 'https://via.placeholder.com/150'}">

                    </div>
                    <div>
                        <h4 style="margin:5px 0">${p.n}</h4>
                        ${badgeStock}
                        <span class="price-bs">${(p.p * (currentConfig.tasa || 1)).toFixed(2)} Bs</span>
                        <small style="color:grey;">$${p.p} / ${p.tipo === 'peso' ? 'Kg' : 'Und'}</small>
                    </div>
                    <div style="display:flex; gap:5px;">
                        ${btnAdd}
                        ${btnTrash}
                    </div>
                </div>`;
            encontrados++;
        }
    });

    if (debeMoverPantalla && encontrados > 0) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateCartUI();

    const admBody = document.getElementById('adm-body');
    if (admBody) {
        admBody.innerHTML = "";
        currentItems.forEach(p => {
            const stock = Number(obtenerStockPorNombre(p.n) || 0).toFixed(2);
            admBody.innerHTML += `<tr><td>${p.n} (Stock: ${stock})</td><td><button onclick="editProd('${p.id}')" style="color:cyan;background:none;border:none;">Edit</button> <button onclick="deleteProd('${p.id}')" style="color:red;background:none;border:none;">X</button></td></tr>`;
        });
    }
}

function deleteCartItem(id) {
    delete cart[id];
    render(); // Al llamar render() se actualizará la cuadrícula y automáticamente el resumen del carrito.
}
function openProductDetail(id) {
    const p = currentItems.find(x => x.id === id);
    if (!p) return;

    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-detail-content');
    if (!modal || !content) return;

    const isPeso = p.tipo === 'peso';
    const currentQty = cart[id] ? cart[id].c : "";

    // Formatear el stock a un máximo de 2 decimales
    const rawStock = obtenerStockPorNombre(p.n);
    const stockDisponible = parseFloat(Number(rawStock || 0).toFixed(2));
    const sinStock = stockDisponible <= 0;
    const tasa = (currentConfig && currentConfig.tasa) ? currentConfig.tasa : 1;

    content.innerHTML = `
        <div class="modal-content" style="position:relative; max-width:500px; width:90%; background:#fff; padding:20px; border-radius:15px; box-shadow:0 5px 15px rgba(0,0,0,0.3); margin:auto;">
            <button class="close-btn" onclick="closeProductModal()" style="position:absolute; top:10px; right:15px; background:none; border:none; font-size:1.8rem; cursor:pointer;">&times;</button>
            <div style="text-align:center;">
                <img src="${p.i || 'img/logo.png'}" style="width:100%; max-height:220px; object-fit:contain; border-radius:15px; margin-bottom:10px;">
                <h2 style="margin:10px 0 5px; font-size:1.4rem;">${p.n}</h2>

                <div style="margin-bottom:12px;">
                    <span style="background:${sinStock ? '#dc3545' : '#28a745'}; color:white; padding:4px 12px; border-radius:12px; font-size:0.85rem; font-weight:bold;">
                        ${sinStock ? 'Producto Agotado' : 'Stock Disponible: ' + stockDisponible + ' ' + (isPeso ? 'Kg' : 'Und')}
                    </span>
                </div>

                <p style="color:#666; font-size:0.9rem; margin-bottom:15px;">${p.d || 'Sin descripción disponible.'}</p>

                <div style="background:var(--gris-claro, #f8f9fa); padding:12px; border-radius:15px; margin-bottom:20px;">
                    <span style="font-size:1.3rem; font-weight:bold; color:var(--rojo, #d9534f);">${(p.p * tasa).toFixed(2)} Bs</span><br>
                    <small style="color:#555;">$${p.p} por ${isPeso ? 'Kg' : 'Unidad'}</small>
                </div>

                ${sinStock ? `<p style="color:red; font-weight:bold;">No hay stock disponible de este producto por el momento.</p>` : `
                    <label style="font-weight:600; display:block; margin-bottom:10px;">¿Qué cantidad desea añadir?</label>
                    <input type="number" id="temp-qty" step="${isPeso ? '0.1' : '1'}" min="${isPeso ? '0.1' : '1'}" max="${stockDisponible}" value="${currentQty}" placeholder="Ej: ${isPeso ? '0.5' : '1'}" style="width:80%; padding:12px; border-radius:10px; border:2px solid var(--negro, #333); text-align:center; font-size:1.1rem; margin-bottom:20px;">
                    <button class="btn-ws" style="width:100%; padding:12px; border-radius:10px; font-size:1rem; background:#28a745; color:white; border:none; font-weight:bold; cursor:pointer;" onclick="confirmAdd('${p.id}')">Confirmar y Guardar</button>
                `}
            </div>
        </div>`;

    // Despliegue del modal
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '99999';

    // Ocultar Footer y Barra Inferior
    const footer = document.querySelector('.footer');
    if (footer) footer.style.display = 'none';

    const barraInferior = document.getElementById('bottom-panel') || document.querySelector('.bottom-panel-nav');
    if (barraInferior) barraInferior.style.setProperty('display', 'none', 'important');
}


function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.style.display = 'none';

    // Mostrar de nuevo Footer y Barra Inferior
    const footer = document.querySelector('.footer');
    if (footer) footer.style.display = 'flex';

    const barraInferior = document.getElementById('bottom-panel') || document.querySelector('.bottom-panel-nav');
    if (barraInferior) barraInferior.style.setProperty('display', 'flex', 'important');
}

function confirmAdd(id) {
    const p = currentItems.find(x => x.id === id);
    if (!p) return;

    const qtyInput = document.getElementById('temp-qty');
    const rawVal = qtyInput ? qtyInput.value.trim() : "";
    const isPeso = p.tipo === 'peso';

    // 1. Validar que no esté vacío o sea menor/igual a cero
    if (!rawVal || isNaN(rawVal) || parseFloat(rawVal) <= 0) {
        alert("Por favor ingresa una cantidad válida.");
        return;
    }

    // 2. Validar estricto: Si es por unidad y contiene punto o coma decimal
    if (!isPeso && (rawVal.includes('.') || rawVal.includes(','))) {
        alert("⚠️ Los productos por unidad solo se pueden vender en cantidades enteras (sin decimales).");
        return;
    }

    const val = parseFloat(rawVal);
    const stockDisponible = parseFloat(Number(obtenerStockPorNombre(p.n) || 0).toFixed(2));

    if (val > stockDisponible) {
        alert(`No hay suficiente stock. Disponible actualmente: ${stockDisponible}`);
        return;
    }

    // Guardar en el objeto carrito
    cart[id] = {
        n: p.n,
        p: p.p,
        c: val,
        u: isPeso ? 'Kg' : 'Und'
    };

    closeProductModal();
    if (typeof render === 'function') render();
}

function updateCartUI() {
    let total = 0, count = 0;
    const list = document.getElementById('cart-items-list');
    if (!list) return;

    list.innerHTML = "";

    for (let id in cart) {
        let sub = cart[id].p * cart[id].c;
        total += sub;
        count++;

        list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:8px;">
                <div>
                    <b style="font-size:0.95rem;">${cart[id].n}</b><br>
                    <small style="color:#666;">${cart[id].c} ${cart[id].u}</small>
                </div>
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="text-align:right;">
                        <b style="color:var(--negro);">$${sub.toFixed(2)}</b><br>
                        <small onclick="openProductDetail('${id}')" style="color:var(--rojo); cursor:pointer; font-weight:600;">Editar</small>
                    </div>
                    <button onclick="deleteCartItem('${id}')" style="background:#fff0f1; border:1px solid #ffccd5; color:#dc3545; padding:6px 10px; border-radius:8px; font-size:1.1rem; cursor:pointer; transition:0.2s;" title="Eliminar producto">
                        🗑️
                    </button>
                </div>
            </div>`;
    }

    if (count === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; margin:20px 0;">El carrito está vacío 🛒</p>`;
    }

    // Actualización de contadores del carrito
    const cartCountElem = document.getElementById('cart-count');
    if (cartCountElem) cartCountElem.innerText = count;

    // Actualización del Badge Rojo Flotante
    const cartBadgeElem = document.getElementById('cart-badge');
    if (cartBadgeElem) {
        cartBadgeElem.innerText = count;
        cartBadgeElem.style.display = count > 0 ? 'flex' : 'none';
    }

    // Actualización segura de los montos
    const tasa = (currentConfig && currentConfig.tasa) ? currentConfig.tasa : 1;

    const totalView = document.getElementById('total-view');
    if (totalView) totalView.innerText = `$${total.toFixed(2)}`;

    const modalTotalUsd = document.getElementById('modal-total-usd');
    if (modalTotalUsd) modalTotalUsd.innerText = `$${total.toFixed(2)}`;

    const modalTotalBs = document.getElementById('modal-total-bs');
    if (modalTotalBs) modalTotalBs.innerText = `${(total * tasa).toFixed(2)} Bs`;
}
    function toggleCart(show) { document.getElementById('cart-modal').style.display = show ? 'block' : 'none'; }


function initSlider() {
    const track = document.getElementById('slider-track');
    if (!track) return;
    track.innerHTML = "";

    // Obtenemos solo los productos que contienen imagen válida
    const productosConImagen = currentItems.filter(p => p.i && p.i.trim() !== "");

    productosConImagen.forEach((p, index) => {
        track.innerHTML += `
            <div class="slide">
                <div class="view-fs-btn" onclick="openSaulTalyFS(${index})" style="cursor:pointer; z-index:10;">🔍</div>
                <img src="${p.i}" onclick="openProductDetail('${p.id}')" style="cursor:pointer;">
                <div class="slide-info"><b>${p.n}</b></div>
            </div>`;
    });

    startAutoSlide();
}

function openSaulTalyFS(index) {
    // Filtrar la lista exactamente igual que en initSlider
    const slides = currentItems.filter(p => p.i && p.i.trim() !== "");
    if (slides.length === 0 || !slides[index]) return;

    currentFsIndex = index;
    updateFsImage(slides);

    const overlay = document.getElementById('fs-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.zIndex = '99999';
    }

    // Reiniciar temporizador automático del visor
    if (typeof fsInterval !== 'undefined') clearInterval(fsInterval);
    fsInterval = setInterval(() => {
        currentFsIndex = (currentFsIndex + 1) % slides.length;
        updateFsImage(slides);
    }, 4000);
}

function updateFsImage(slides) {
    const fullImg = document.getElementById('fs-img-src');
    if (!fullImg || !slides[currentFsIndex]) return;

    fullImg.style.opacity = 0;
    setTimeout(() => {
        fullImg.src = slides[currentFsIndex].i;
        fullImg.style.opacity = 1;
    }, 200);
}

function closeSaulTalyFS() {
    const overlay = document.getElementById('fs-overlay');
    if (overlay) overlay.style.display = 'none';
    if (typeof fsInterval !== 'undefined') clearInterval(fsInterval);
}  function moveSlide(dir) { clearInterval(autoSlide); slideIndex = (slideIndex + dir + currentItems.length) % currentItems.length; document.getElementById('slider-track').style.transform = `translateX(-${slideIndex * 100}%)`; startAutoSlide(); }
    function startAutoSlide() { clearInterval(autoSlide); autoSlide = setInterval(() => { if(currentItems.length > 1) moveSlide(1); }, 4000); }
async function abrirModalCheckout() {

    if (typeof cart === 'undefined' || Object.keys(cart).length === 0) return alert("El carrito está vacío.");

    // Resetear a Paso 1 (Datos Bancarios)
    const pasoDatos = document.getElementById('paso-datos-pago');
    const pasoForm = document.getElementById('paso-formulario-pago');
    if (pasoDatos) pasoDatos.style.display = 'block';
    if (pasoForm) pasoForm.style.display = 'none';

    // 1. Calcular Totales y renderizar resumen de la compra
    let totalUSD = 0;
    let listaHtml = "";

    for (let id in cart) {
        let sub = cart[id].p * cart[id].c;
        totalUSD += sub;
        listaHtml += `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; border-bottom:1px solid #eee; padding-bottom:4px; font-size:0.85rem;">
            <div><b>${cart[id].n}</b> (x${cart[id].c} ${cart[id].u})</div>
            <div style="display:flex; align-items:center; gap:8px;">
                <b>$${sub.toFixed(2)}</b>
                <button onclick="eliminarDelCheckout('${id}')" style="background:#fff0f1; border:1px solid #ffccd5; color:#dc3545; padding:2px 6px; border-radius:6px; cursor:pointer; font-size:0.85rem;" title="Quitar producto">🗑️</button>
            </div>
        </div>`;
    }

    let tasa = (typeof currentConfig !== 'undefined' && currentConfig.tasa) ? currentConfig.tasa : 1;
    let totalBs = totalUSD * tasa;

    const elTotalUsd = document.getElementById('checkoutTotalUSD');
    const elTotalBs = document.getElementById('checkoutTotalBs');
    const elLista = document.getElementById('checkoutListaProductos');

    if (elTotalUsd) elTotalUsd.innerText = totalUSD.toFixed(2);
    if (elTotalBs) elTotalBs.innerText = totalBs.toFixed(2);
    if (elLista) elLista.innerHTML = listaHtml;

    // 2. Cargar datos bancarios según el método seleccionado
    if (typeof cambiarMetodoPagoVisual === 'function') {
        cambiarMetodoPagoVisual();
    }

    // 3. Autocompletar datos del usuario si ha iniciado sesión
    if (typeof auth !== 'undefined' && auth.currentUser) {
        try {
            const snap = await db.ref('usuarios/' + auth.currentUser.uid).once('value');
            const u = snap.val();
            if (u) {
                const elNombre = document.getElementById('cliNombre');
                const elCedula = document.getElementById('cliCedula');
                const elTelefono = document.getElementById('cliTelefono');

                if (elNombre) elNombre.value = u.nombre || "";
                if (elCedula) elCedula.value = u.cedula || "";
                if (elTelefono) elTelefono.value = u.celular || "";
            }
        } catch (e) {
            console.error("Error cargando perfil para checkout:", e);
        }
    }

    // Opción de envío
    const elEnvio = document.getElementById('opcionEnvioSel');
    if (elEnvio) {
        elEnvio.value = 'retiro';
        if (typeof cambiarOpcionEnvio === 'function') cambiarOpcionEnvio();
    }

    if (typeof toggleCart === 'function') toggleCart(false);

    // Despliegue seguro del modal checkout
    const modalCheckout = document.getElementById('modalCheckout');
    if (modalCheckout) {
        modalCheckout.style.display = 'flex';
        modalCheckout.style.zIndex = '99999';
    }

    // Ocultar Footer y Barra Inferior de Navegación
    const footer = document.querySelector('.footer');
    if (footer) footer.style.display = 'none';

    const barraInferior = document.getElementById('bottom-panel') || document.querySelector('.bottom-panel-nav');
    if (barraInferior) {
        barraInferior.style.setProperty('display', 'none', 'important');
    }
}

function cerrarModalCheckout() {
    const modalCheckout = document.getElementById('modalCheckout');
    if (modalCheckout) modalCheckout.style.display = 'none';

    // Volver a mostrar Footer y Barra Inferior
    const footer = document.querySelector('.footer');
    if (footer) footer.style.display = 'block';

    const barraInferior = document.getElementById('bottom-panel') || document.querySelector('.bottom-panel-nav');
    if (barraInferior) {
        barraInferior.style.setProperty('display', 'flex', 'important');
    }

    capturaBase64 = "";
    const imgElement = document.getElementById('imgPreview');
    if (imgElement) {
        imgElement.src = "";
        imgElement.style.display = 'none';
    }
}

// Mostrar Formulario tras hacer clic en "¡Ya pagué!" (Paso 2)
function mostrarFormularioPago() {
    document.getElementById('paso-datos-pago').style.display = 'none';
    document.getElementById('paso-formulario-pago').style.display = 'block';

    // Auto-completar fecha de hoy
    if(document.getElementById('pagoFecha')) {
        document.getElementById('pagoFecha').value = new Date().toISOString().split('T')[0];
    }
}

// Volver al Paso 1 desde el formulario
function volverADatosPago() {
    document.getElementById('paso-formulario-pago').style.display = 'none';
    document.getElementById('paso-datos-pago').style.display = 'block';
}


// Función auxiliar para eliminar un ítem directamente desde la ventana de checkout
function eliminarDelCheckout(id) {
    delete cart[id];
    render(); // Actualiza la interfaz global y las cantidades
    if (Object.keys(cart).length === 0) {
        cerrarModalCheckout();
        alert("El carrito quedó vacío.");
    } else {
        abrirModalCheckout(); // Recalcula los totales del resumen
    }
}
// Variable para almacenar la imagen del comprobante en Base64
let capturaBase64 = "";

// Previsualización de la captura del comprobante
function previsualizarCaptura(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            capturaBase64 = e.target.result;
            const imgElement = document.getElementById('imgPreview');
            imgElement.src = capturaBase64;
            imgElement.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}// Función auxiliar para copiar texto al portapapeles
 function copiarTexto(texto) {
     navigator.clipboard.writeText(texto).then(() => {
         alert("Copiado: " + texto);
     }).catch(() => {
         alert("Error al copiar");
     });
 }
 // Función para alternar la visibilidad del menú
 function toggleUserMenu() {
     const container = document.getElementById('user-actions');
     if (container) {
         container.classList.toggle('open');
     }
 }

 // Función auxiliar para ejecutar la acción elegida y cerrar el menú inmediatamente
 function ejecutarOpcionMenu(funcionOpcion) {
     const container = document.getElementById('user-actions');
     if (container) {
         container.classList.remove('open'); // Cierra el menú desplegable
     }
     if (typeof funcionOpcion === 'function') {
         funcionOpcion(); // Ejecuta la función solicitada
     }
 }
  // --- LÓGICA DE MANEJO DE VISTAS/MODALES PARA EL BOTÓN ATRÁS EN KOTLIN ---
  function manejarRetrocesoJS() {
      // 1. Cerrar Menú Desplegable de Usuario
      const userMenu = document.getElementById('user-actions');
      if (userMenu && userMenu.classList.contains('open')) {
          userMenu.classList.remove('open');
          return true;
      }

      // 2. Cerrar Modal de Ver Factura (Admin / Detalle de Venta)
      const facturaAdminModal = document.getElementById('modalFacturaAdmin') || document.getElementById('modalVerFactura');
      if (facturaAdminModal && (facturaAdminModal.style.display === 'flex' || facturaAdminModal.style.display === 'block')) {
          if (typeof cerrarModalFacturaAdmin === 'function') {
              cerrarModalFacturaAdmin();
          } else if (typeof cerrarModalFactura === 'function') {
              cerrarModalFactura();
          } else {
              facturaAdminModal.style.display = 'none';
          }
          return true;
      }

     // 3. Cerrar Modal de Notificaciones
     const notifModal = document.getElementById('modalNotificacionesCliente');

     if (notifModal && (notifModal.style.display === 'flex' || notifModal.style.display === 'block')) {
         cerrarModalNotificacionesCliente();
         return true;
     }

      // 4. Cerrar Visor de Fotos Full Screen
      const fs = document.getElementById('fs-overlay');
      if (fs && fs.style.display === 'flex') {
          closeSaulTalyFS();
          return true;
      }

      // 5. Cerrar Detalle de Producto
      const pModal = document.getElementById('product-modal');
      if (pModal && (pModal.style.display === 'flex' || pModal.style.display === 'block')) {
          closeProductModal();
          return true;
      }

      // 6. Cerrar Modal de Checkout
      const checkoutModal = document.getElementById('modalCheckout');
      if (checkoutModal && (checkoutModal.style.display === 'flex' || checkoutModal.style.display === 'block')) {
          cerrarModalCheckout();
          return true;
      }

      // 7. Cerrar Carrito
      const cModal = document.getElementById('cart-modal');
      if (cModal && (cModal.style.display === 'flex' || cModal.style.display === 'block')) {
          toggleCart(false);
          return true;
      }

      // 8. Cerrar Modal de Perfil / Registro
      const perfilModal = document.getElementById('modalPerfil');
      if (perfilModal && (perfilModal.style.display === 'flex' || perfilModal.style.display === 'block')) {
          cerrarModalPerfil();
          return true;
      }

      // 9. Cerrar Modal Mis Pedidos
      const pedidosModal = document.getElementById('modalMisPedidos');
      if (pedidosModal && (pedidosModal.style.display === 'flex' || pedidosModal.style.display === 'block')) {
          cerrarModalMisPedidos();
          return true;
      }

      // 10. Cerrar Modal Términos Legales
      const terminosModal = document.getElementById('modalTerminosLegales');
      if (terminosModal && terminosModal.style.display === 'block') {
          cerrarModalTerminos();
          return true;
      }

      // 11. Cerrar Panel de Administración
      const admin = document.getElementById('admin-panel');
      if (admin && admin.style.display === 'block') {
          admin.style.display = 'none';
          return true;
      }

      // 12. Limpiar búsqueda
      const busquedaInput = document.getElementById('busqueda');
      if (busquedaInput && busquedaInput.value.trim() !== "") {
          busquedaInput.value = "";
          render(true);
          return true;
      }

      // 13. Regreso al inicio (Scroll a arriba si está desplazado)
      if (window.pageYOffset > 100 || document.documentElement.scrollTop > 100) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return true;
      }

      // Si no había ningún modal ni scroll activo, retorna false para que Android ejecute la salida de la app
      return false;
  }
     function abrirModalPerfil(esObligatorio = false, esGoogle = false) {
         const modal = document.getElementById('modalPerfil');
         const btnCerrar = document.getElementById('btnCerrarModalPerfil');
         const titulo = document.getElementById('modalPerfilTitulo');
         const btnSubmit = document.getElementById('btnGuardarPerfil');
         const contenedorTerminos = document.getElementById('contenedorTerminos');
         const chkTerminos = document.getElementById('perfilAceptoTerminos');
         const passGroup = document.getElementById('perfilPasswordGroup');
         const footerContent = document.querySelector('.footer-content');
         if (footerContent) {
             footerContent.style.display = 'none';
         }
         // Determinar de forma segura si es un nuevo registro
         const registroNuevo = typeof esNuevoRegistro !== 'undefined' ? esNuevoRegistro : window.esNuevoRegistro;

         // 1. Manejo del campo Contraseña
         if (passGroup) {
           if (esGoogle || !registroNuevo) {
             passGroup.style.display = 'none';
           } else {
             passGroup.style.display = 'block';
           }
         }

         // 2. Control estricto de Términos y Condiciones
         // Solo se muestran si es un REGISTRO NUEVO. Al editar perfil se ocultan siempre.
         if (contenedorTerminos) {
           if (registroNuevo) {
             contenedorTerminos.style.display = 'block';
             if (chkTerminos) chkTerminos.checked = false;
           } else {
             contenedorTerminos.style.display = 'none';
             if (chkTerminos) chkTerminos.checked = true; // Permite guardar edición sin requerir el check
           }
         }

         // 3. Textos y botones según la acción
         if (esObligatorio) {
             if (btnCerrar) btnCerrar.style.display = 'none';
             if (titulo) titulo.innerText = '📋 Completa tus Datos Obligatorios';
             if (btnSubmit) btnSubmit.innerText = '🚀 Finalizar Registro';
         } else {
             if (btnCerrar) btnCerrar.style.display = 'inline-block';
             if (titulo) titulo.innerText = registroNuevo ? '📋 Registrar Cuenta' : '✏️ Mi Perfil';
             if (btnSubmit) btnSubmit.innerText = registroNuevo ? '🚀 Registrarme' : '💾 Guardar Cambios';
         }

         if (modal) modal.style.display = 'flex';

         // 4. Cargar datos de la base de datos si es EDICIÓN
         if (usuarioActualID && !registroNuevo) {
             firebase.database().ref('usuarios/' + usuarioActualID).once('value').then((snapshot) => {
                 const datos = snapshot.val() || {};

                 if (document.getElementById('perfilNombre')) document.getElementById('perfilNombre').value = datos.nombre || '';
                 if (document.getElementById('perfilCorreo')) document.getElementById('perfilCorreo').value = datos.correo || '';
                 if (document.getElementById('perfilCelular')) document.getElementById('perfilCelular').value = datos.celular || '';

                 if (datos.cedula && datos.cedula.includes('-')) {
                     const partes = datos.cedula.split('-');
                     if (document.getElementById('perfilTipoCedula')) document.getElementById('perfilTipoCedula').value = partes[0] + '-';
                     if (document.getElementById('perfilCedulaNum')) document.getElementById('perfilCedulaNum').value = partes[1];
                 }
             });
         }
     }
    function abrirPerfilUsuario() {
        // 1. Verificar si hay un usuario con sesión activa en Firebase
        const user = (typeof firebase !== 'undefined' && firebase.auth()) ? firebase.auth().currentUser : null;

        // Obtener el botón de eliminar cuenta
        const btnEliminar = document.getElementById('btnEliminarCuenta');

        // Si NO ha iniciado sesión, detiene el flujo y redirige al modal de login/registro
        if (!user) {
            if (btnEliminar) btnEliminar.style.display = 'none'; // Ocultar si no hay usuario

            alert("⚠️ Debes registrarte o iniciar sesión primero para acceder a tu perfil.");
            if (typeof toggleAuthModal === 'function') {
                toggleAuthModal(true);
            } else {
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.style.display = 'block';
            }
            return; // Retorna para no ejecutar el resto del código
        }

        // --- TU CÓDIGO ORIGINAL (Solo se ejecuta si SI hay usuario activo) ---
        if (btnEliminar) btnEliminar.style.display = 'block'; // Mostrar si hay usuario registrado

        const footerContent = document.querySelector('.footer-content');
        if (footerContent) {
            footerContent.style.display = 'none';
        }

        // Si hay un usuario con sesión activa, no es un nuevo registro
        const esNuevoRegistro = false;
        const esGoogle = false; // Permite ver la interfaz en modo consulta/edición

        // Asignamos la variable global si la usas en tu código
        window.esNuevoRegistro = false;

        // Abrimos el modal pasando parámetros de edición (no obligatorio, no Google)
        abrirModalPerfil(false, false);
    }

     function cerrarModalPerfil() {
         const modal = document.getElementById('modalPerfil');
         if (modal) {
             modal.style.display = 'none';
             document.body.classList.remove('modal-open');
         }

         // Restaurar visibilidad del contenedor footer/carrito
         const footerContent = document.querySelector('.footer-content');
         if (footerContent) {
             footerContent.style.display = 'block';
         }
     }
     async function eliminarCuentaUsuario() {
         const user = (typeof firebase !== 'undefined' && firebase.auth()) ? firebase.auth().currentUser : null;

         if (!user) {
             alert("No hay ningún usuario con sesión activa.");
             return;
         }

         const confirmacion = confirm("⚠️ ¿Estás seguro de que deseas eliminar tu cuenta?\nEsta acción es irreversible y borrará tus datos del sistema.");

         if (!confirmacion) return;

         try {
             const uid = user.uid;

             // 1. Eliminar datos del usuario de Firebase Realtime Database
             if (typeof db !== 'undefined') {
                 await db.ref('usuarios/' + uid).remove();
             }

             // 2. Cerrar el modal de perfil y restaurar la interfaz
             cerrarModalPerfil();

             // 3. Eliminar la cuenta del usuario de Firebase Authentication
             await user.delete();

             alert("Tu cuenta y tus datos han sido eliminados correctamente.");

             // 4. Recargar la página o redirigir al inicio
             window.location.reload();

         } catch (error) {
             console.error("Error al eliminar la cuenta:", error);

             // Si Firebase solicita reautenticación por llevar mucho tiempo logueado
             if (error.code === 'auth/requires-recent-login') {
                 alert("Por razones de seguridad, debes volver a iniciar sesión para poder eliminar tu cuenta.");
                 if (typeof firebase !== 'undefined' && firebase.auth()) {
                     await firebase.auth().signOut();
                 }
                 window.location.reload();
             } else {
                 alert("Ocurrió un error al intentar eliminar tu cuenta: " + error.message);
             }
         }
     }
     // Abrir y Cerrar Modal de Términos
     function abrirModalTerminos(e) {
         if(e) e.preventDefault();
         document.getElementById('modalTerminosLegales').style.display = 'block';
     }

     function cerrarModalTerminos() {
         document.getElementById('modalTerminosLegales').style.display = 'none';
     }


         let pedidosDelUsuario = [];
     let estadoFiltroActual = 'PENDIENTE';

     // Abrir el modal y cargar los pedidos desde Firebase Realtime Database
     function abrirModalMisPedidos() {
         const footerContent = document.querySelector('.footer-content');
         if (footerContent) {
             footerContent.style.display = 'none';
         }
         if (!auth.currentUser) {
             alert("Debes iniciar sesión para consultar tus pedidos.");
             toggleAuthModal(true);
             return;
         }

         document.getElementById('modalMisPedidos').style.display = 'flex';
         cargarPedidosFirebase();
     }

     function cerrarModalMisPedidos() {
         document.getElementById('modalMisPedidos').style.display = 'none';
         const footerContent = document.querySelector('.footer-content');
         if (footerContent) {
             footerContent.style.display = 'flex'; // O 'flex', según el diseño del CSS
         }
     }

     function cambiarMetodoPagoVisual() {
         const metodo = document.getElementById('pagoMetodoSelect').value;
         const box = document.getElementById('box-datos-pago');

         if (metodo === 'pago_movil') {
             box.innerHTML = `<strong>📲 Datos Pago Móvil:</strong><br>` +
                 (currentConfig.pagoMovil ? currentConfig.pagoMovil.replace(/\n/g, '<br>') : 'Sin datos configurados.');
         } else if (metodo === 'transferencia' || metodo === 'transferencia_bs') {
             box.innerHTML = `<strong>🏦 Datos Transferencia Bs:</strong><br>` +
                 (currentConfig.transferencia ? currentConfig.transferencia.replace(/\n/g, '<br>') : 'Sin datos configurados.');
         } else if (metodo === 'bnc_divisas') {
             box.innerHTML = `<strong>💵 Transferencia Divisas BNC ($):</strong><br>` +
                 (currentConfig.bnc ? currentConfig.bnc.replace(/\n/g, '<br>') : 'Sin datos configurados.');
         } else if (metodo === 'binance') {
             box.innerHTML = `<strong>🟡 Datos Binance Pay / USDT:</strong><br>` +
                 (currentConfig.binance ? currentConfig.binance.replace(/\n/g, '<br>') : 'Sin datos configurados.');
         }
     }

     function copiarTodosLosDatos() {
         const metodo = document.getElementById('pagoMetodoSelect').value;
         const totalUSD = document.getElementById('checkoutTotalUSD') ? document.getElementById('checkoutTotalUSD').innerText : "0.00";
         const totalBs = document.getElementById('checkoutTotalBs') ? document.getElementById('checkoutTotalBs').innerText : "0.00";

         let detallePago = "";

         if (metodo === 'pago_movil') {
             detallePago = currentConfig.pagoMovil || "";
         } else if (metodo === 'transferencia' || metodo === 'transferencia_bs') {
             detallePago = currentConfig.transferencia || "";
         } else if (metodo === 'bnc_divisas') {
             detallePago = currentConfig.bnc || "";
         } else if (metodo === 'binance') {
             detallePago = currentConfig.binance || "";
         }

         let textoACopiar = `📌 DATOS DE PAGO\n${detallePago}\n\n💰 Monto Total a Pagar: ${totalBs} Bs. ($${totalUSD} USD)`;

         navigator.clipboard.writeText(textoACopiar).then(() => {
             alert("✅ Datos de pago copiados con éxito.");
         }).catch(() => {
             alert("❌ Error al copiar los datos.");
         });
     }
         // --- LÓGICA DE NAVEGACIÓN Y CLIENTES EN PANEL ADMIN ---
     let clientesListaAdmin = [];


     function cambiarOpcionEnvio() {
         const selector = document.getElementById('opcionEnvioSel');
         if (!selector) return;

         const opcion = selector.value;
         const campoDelivery = document.getElementById('campo-delivery-info');
         const campoMRW = document.getElementById('campo-mrw-info');

         // Ocultar todos por defecto
         if (campoDelivery) campoDelivery.style.display = 'none';
         if (campoMRW) campoMRW.style.display = 'none';

         // Mostrar según la selección
         if (opcion === 'delivery' && campoDelivery) {
             campoDelivery.style.display = 'block';
         } else if (opcion === 'mrw' && campoMRW) {
             campoMRW.style.display = 'block';
         }
     }
     function abrirModalNotificacionesCliente() {
         if (!auth.currentUser) return alert("Debes iniciar sesión para ver tus notificaciones.");

         const uid = auth.currentUser.uid;
         const cont = document.getElementById('contenedorHistorialNotificaciones');

         db.ref(`notificaciones_cliente/${uid}`).once('value').then(snapshot => {
             const data = snapshot.val();
             if (!data) {
                 cont.innerHTML = `<p style="text-align:center; color:#888;">No tienes notificaciones recibidas.</p>`;
                 return;
             }

             let html = "";
             const keys = Object.keys(data).reverse(); // Mostrar más recientes primero

             keys.forEach(k => {
                 const item = data[k];
                 const bg = item.leido ? '#f8f9fa' : '#eaf4ff';
                 const border = item.leido ? '#ccc' : '#007bff';

                 html += `
                     <div style="background:${bg}; border-left:4px solid ${border}; padding:10px; margin-bottom:8px; border-radius:6px; position:relative;">
                         <strong style="font-size:0.9rem; color:#333;">${item.titulo}</strong>
                         <p style="margin:4px 0; font-size:0.82rem; color:#555;">${item.mensaje}</p>
                         <small style="color:#888; font-size:0.75rem;">${new Date(item.fecha).toLocaleString()}</small>
                         ${!item.leido ? `<button onclick="marcarUnaNotificacionLeida('${k}')" style="position:absolute; right:8px; top:8px; background:none; border:none; color:#007bff; font-weight:bold; cursor:pointer; font-size:0.75rem;">Marcar leída</button>` : ''}
                     </div>
                 `;
             });

             cont.innerHTML = html;
             document.getElementById('modalNotificacionesCliente').style.display = 'flex';
         });
     }

     function cerrarModalNotificacionesCliente() {
         document.getElementById('modalNotificacionesCliente').style.display = 'none';
     }
// Listener global para el gesto de ir hacia atrás en Android / Navegador
window.addEventListener('popstate', function (event) {
    const contenedorModal = document.getElementById('modal-recibo-digital');

    // Si el modal está visible en pantalla al hacer el gesto de atrás, lo cerramos
    if (contenedorModal && contenedorModal.style.display === 'block') {
        contenedorModal.style.display = 'none';
        contenedorModal.innerHTML = '';
    }
});
/// Función para actualizar la interfaz del cliente con los datos de configuración (App y Redes Sociales)
 function renderizarConfigCliente() {
     db.ref('config').on('value', snapshot => {
         const config = snapshot.val();
         if (!config) return;

         // 1. Botón de Descarga de App
         const containerApp = document.getElementById('view-app-container');
         const btnDescargarApp = document.getElementById('view-app-btn');
         if (btnDescargarApp && config.appUrl && config.appUrl.trim() !== '') {
             btnDescargarApp.href = config.appUrl;
             if (containerApp) containerApp.style.display = 'block';
         } else if (containerApp) {
             containerApp.style.display = 'none';
         }

         // 2. Renderizar Redes Sociales (WhatsApp e Instagram)
         const socialContainer = document.getElementById('view-social-links');
         if (socialContainer) {
             let htmlSocial = '';

             // Enlace de WhatsApp
             if (config.wsUrl && config.wsUrl.trim() !== '') {
                 // Formatear el número/link por si el usuario introdujo solo el número o un link completo
                 let wsNum = config.wsUrl.trim();
                 let wsHref = wsNum.startsWith('http') ? wsNum : `https://wa.me/${wsNum.replace(/[^0-9]/g, '')}`;

                 htmlSocial += `
                     <a href="${wsHref}" target="_blank" rel="noopener noreferrer" class="btn-social btn-ws" style="display:inline-flex; align-items:center; gap:8px; background:#25D366; color:white; padding:10px 18px; border-radius:25px; text-decoration:none; font-weight:bold; margin:5px; font-size:0.9rem;">
                         💬 WhatsApp
                     </a>`;
             }

             // Enlace de Instagram
             if (config.igUrl && config.igUrl.trim() !== '') {
                 let igUser = config.igUrl.trim();
                 let igHref = igUser.startsWith('http') ? igUser : `https://instagram.com/${igUser.replace('@', '')}`;

                 htmlSocial += `
                     <a href="${igHref}" target="_blank" rel="noopener noreferrer" class="btn-social btn-ig" style="display:inline-flex; align-items:center; gap:8px; background:linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%); color:white; padding:10px 18px; border-radius:25px; text-decoration:none; font-weight:bold; margin:5px; font-size:0.9rem;">
                         📸 Instagram
                     </a>`;
             }

             socialContainer.innerHTML = htmlSocial;
         }
     });
 }