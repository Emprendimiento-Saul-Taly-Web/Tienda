function normalizarTexto(texto) {
    if (!texto) return "";
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remueve tildes (ej: Maní -> mani)
        .trim();
}

function obtenerStockPorNombre(nombreProducto) {
    if (!nombreProducto || !listaInsumos || listaInsumos.length === 0) return 0;

    const prodLimpio = normalizarTexto(nombreProducto);

    // 1. Detección de porciones en gramos (g) o mililitros (ml) Ej: "50g", "250 ml", "500ml"
    const matchPorcion = prodLimpio.match(/(\d+(?:\.\d+)?)\s*(g|ml)\b/);

    if (matchPorcion) {
        const porcion = parseFloat(matchPorcion[1]); // Extrae la cantidad (Ej: 50, 250, 500)

        // Extraer la primera palabra para identificar el insumo (Ej: "miel", "merey", "mani")
        const palabraClave = prodLimpio.split(' ')[0];

        // Buscar en la base de datos de insumos
        const insumoMateriaPrima = listaInsumos.find(insumo => {
            if (!insumo || !insumo.n) return false;
            const insumoLimpio = normalizarTexto(insumo.n);
            return insumoLimpio.includes(palabraClave);
        });

        if (insumoMateriaPrima) {
            const stockTotal = parseFloat(insumoMateriaPrima.s || 0); // Ej: 8.675 (Kg o Litros)

            // Convertir Kg/Litros a Gramos/Mililitros
            const stockEnUnidadesMenores = stockTotal * 1000;

            // Calcular cuántos frascos/empaques salen
            return Math.floor(stockEnUnidadesMenores / porcion);
        }
    }

    // 2. Búsqueda directa por coincidencia de palabras (para productos sin porciones o directos)
    const insumoDirecto = listaInsumos.find(insumo => {
        if (!insumo || !insumo.n) return false;
        const insumoLimpio = normalizarTexto(insumo.n);

        // Compara si comparten la primera palabra clave principal (Ej: "miel")
        const primeraPalabraProd = prodLimpio.split(' ')[0];
        const primeraPalabraInsumo = insumoLimpio.split(' ')[0];

        return primeraPalabraProd === primeraPalabraInsumo ||
               prodLimpio.includes(insumoLimpio) ||
               insumoLimpio.includes(prodLimpio);
    });

    return insumoDirecto ? parseFloat(insumoDirecto.s || 0) : 0;
}
// Variable global para guardar los insumos
// Variable global para guardar los insumos
let listaInsumos = [];

// Escuchar la ruta exacta en Firebase: app_data -> insumos
dbInsumos.ref('app_data/insumos').on('value', snapshot => {
    const data = snapshot.val();
    // Como en tu captura es un array (índices 0, 1, 2...), Object.values nos sirve perfecto
    listaInsumos = data ? Object.values(data) : [];

    // Si la función render ya existe al cargar los datos, refrescamos la vista
    if (typeof render === 'function') {
        render();
    }
});
function uploadProd() {
    const idInput = document.getElementById('edit-id').value;
    const id = idInput || db.ref().child('productos').push().key;
    db.ref('productos/' + id).set({
        id: id,
        n: document.getElementById('add-n').value,
        d: document.getElementById('add-d').value,
        p: parseFloat(document.getElementById('add-p').value),
        tipo: document.getElementById('add-tipo').value,
        i: document.getElementById('add-img-url').value
    }).then(() => {
        alert("Producto guardado correctamente");
        if (typeof clearForm === 'function') clearForm();
    }).catch(error => alert("Error al guardar: " + error.message));
}

    function editProd(id) {
        const p = currentItems.find(x => x.id === id);
        document.getElementById('edit-id').value = p.id; document.getElementById('add-n').value = p.n; document.getElementById('add-d').value = p.d || ""; document.getElementById('add-p').value = p.p; document.getElementById('add-tipo').value = p.tipo; document.getElementById('add-img-url').value = p.i || "";
        document.getElementById('form-title').innerText = "Editando Producto"; document.getElementById('btn-cancel').style.display = "block"; window.scrollTo(0,0);
    }

    function deleteProd(id) { if(confirm("¿Eliminar?")) db.ref('productos/' + id).remove(); }
    function clearForm() { document.getElementById('edit-id').value = ""; document.getElementById('add-n').value = ""; document.getElementById('add-d').value = ""; document.getElementById('add-p').value = ""; document.getElementById('add-img-url').value = ""; document.getElementById('form-title').innerText = "Gestionar Producto"; document.getElementById('btn-cancel').style.display = "none"; }

 function exportarData() {
        db.ref().once('value', s => {
            const data = s.val();
            const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Respaldo_SaulTaly_${new Date().toLocaleDateString()}.json`;
            a.click();
        });
    }

    function importarData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const json = JSON.parse(e.target.result);
                if (confirm("¿Seguro de cargar esta copia? Reemplazará los datos actuales.")) {
                    db.ref().set(json).then(() => {
                        alert("Base de Datos Restaurada con Éxito");
                        location.reload();
                    });
                }
            } catch (err) { alert("Error: Archivo no válido."); }
        };
        reader.readAsText(file);
    }

    function borrarTodo() {
        if(confirm("⚠️ ATENCIÓN: ¿Seguro que quieres borrar TODOS los productos?")) {
            db.ref('productos').remove().then(() => alert("Base de datos vaciada."));
        }
    }
    db.ref('config').on('value', s => {
        currentConfig = s.val() || { tasa: 1, rif: '', logo: '', desc: '' };

        // Vistas públicas
        if(document.getElementById('tasa-view')) document.getElementById('tasa-view').innerText = parseFloat(currentConfig.tasa || 0).toFixed(2);
        if(document.getElementById('rif-view')) document.getElementById('rif-view').innerText = "RIF: " + (currentConfig.rif || "");
        if(document.getElementById('view-desc')) document.getElementById('view-desc').innerText = currentConfig.desc || "";
        // Campos del Panel Admin
        if(document.getElementById('adm-tasa')) document.getElementById('adm-tasa').value = currentConfig.tasa || "";
        if(document.getElementById('adm-rif')) document.getElementById('adm-rif').value = currentConfig.rif || "";
        if(document.getElementById('adm-desc')) document.getElementById('adm-desc').value = currentConfig.desc || "";
        if(document.getElementById('adm-logo-url')) document.getElementById('adm-logo-url').value = currentConfig.logo || "";

        // Métodos de Pago Admin
        if(document.getElementById('adm-pago-movil')) document.getElementById('adm-pago-movil').value = currentConfig.pagoMovil || "";
        if(document.getElementById('adm-transferencia')) document.getElementById('adm-transferencia').value = currentConfig.transferencia || "";
        if(document.getElementById('adm-bnc')) document.getElementById('adm-bnc').value = currentConfig.bnc || "";
        if(document.getElementById('adm-binance')) document.getElementById('adm-binance').value = currentConfig.binance || "";

        // Carga exclusiva de Logo desde URL de Configuración
        const logoImg = document.getElementById('logo-img');
        const logoTxt = document.getElementById('logo-txt');

        if (logoImg) {
            if (currentConfig.logo && currentConfig.logo.trim() !== "") {
                // Si hay una URL guardada en la configuración, la usa directamente
                logoImg.src = currentConfig.logo;
                logoImg.style.display = 'block';
                if (logoTxt) logoTxt.style.display = 'none';
            } else {
                // Si no hay URL en la configuración, oculta la etiqueta <img>
                logoImg.src = "";
                logoImg.style.display = 'none';
                if (logoTxt) logoTxt.style.display = 'block';
            }
        }

        render();
    });

        db.ref('productos').on('value', s => {
            const data = s.val();
            currentItems = data ? Object.values(data) : [];
            render();
            initSlider();
        });
        function saveGlobalConfig() {
            const nuevaTasaInput = document.getElementById('adm-tasa').value;
            const nuevaTasa = nuevaTasaInput !== "" ? parseFloat(nuevaTasaInput) : (currentConfig.tasa || 0);

            const configActualizada = {
                tasa: nuevaTasa,
                rif: document.getElementById('adm-rif').value || "",
                desc: document.getElementById('adm-desc').value || "",
                logo: document.getElementById('adm-logo-url').value || "",
                pagoMovil: document.getElementById('adm-pago-movil').value || "",
                transferencia: document.getElementById('adm-transferencia').value || "",
                bnc: document.getElementById('adm-bnc').value || "",
                binance: document.getElementById('adm-binance').value || "",
                whatsapp: document.getElementById('adm-ws-url').value|| "",
                        instagram: document.getElementById('adm-ig-url').value|| "",
            };

            db.ref('config').update(configActualizada).then(() => {
                alert("✅ Configuración actualizada y resguardada con éxito");
            }).catch(err => {
                alert("❌ Error al actualizar la configuración: " + err.message);
            });
        }