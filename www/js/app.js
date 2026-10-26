document.addEventListener('DOMContentLoaded', () => {
  const inputBusqueda = document.getElementById('busqueda');
  if (inputBusqueda) {
    inputBusqueda.value = '';
  }
});
document.addEventListener('DOMContentLoaded', () => {
    if (typeof renderizarConfigCliente === 'function') {
        renderizarConfigCliente();
    }
});

   function filtrarProductos() {
       const input = document.getElementById('busqueda'); // ID corregido
       if (!input) return;
       const texto = input.value.toLowerCase().trim();
       const productos = document.querySelectorAll('.card');

       productos.forEach(producto => {
           const nombreElem = producto.querySelector('h4');
           if (nombreElem) {
               const nombre = nombreElem.textContent.toLowerCase();
               producto.style.display = nombre.includes(texto) ? "" : "none";
           }
       });
   }