// Quipusoft — main.js
// Formatear moneda colombiana
function formatCOP(value) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
}

// Auto-calcular total en formulario de transacciones
function calcularTotal() {
  const subtotal = parseInt(document.getElementById('subtotal')?.value || 0);
  const iva = parseInt(document.getElementById('iva')?.value || 0);
  const retencion = parseInt(document.getElementById('retencion')?.value || 0);
  const total = subtotal + iva + retencion;
  const totalEl = document.getElementById('total_calculado');
  if (totalEl) totalEl.textContent = formatCOP(total);
}

document.addEventListener('DOMContentLoaded', () => {
  // Calcular total automáticamente
  ['subtotal','iva','retencion'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calcularTotal);
  });

  // Cerrar alertas
  document.querySelectorAll('.alert').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => el.remove());
  });

  // Confirmar acciones peligrosas
  document.querySelectorAll('[data-confirm]').forEach(el => {
    el.addEventListener('click', e => {
      if (!confirm(el.dataset.confirm)) e.preventDefault();
    });
  });
});
