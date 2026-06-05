const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

router.get('/', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const [empresa, resumen, anticipos] = await Promise.all([
      pool.query(`SELECT * FROM ${schema}.empresa LIMIT 1`),
      pool.query(`
        SELECT
          SUM(CASE WHEN tipo LIKE 'Factura venta%' THEN subtotal ELSE 0 END) AS total_ventas,
          SUM(CASE WHEN tipo LIKE 'Factura compra%' THEN subtotal ELSE 0 END) AS total_compras,
          SUM(CASE WHEN tipo LIKE 'Factura venta%' THEN iva ELSE 0 END) AS iva_generado,
          SUM(CASE WHEN tipo LIKE 'Factura compra%' THEN iva ELSE 0 END) AS iva_descontable,
          COUNT(CASE WHEN estado = 'rechazada' THEN 1 END) AS facturas_rechazadas,
          COUNT(CASE WHEN es_caso_atipico = TRUE THEN 1 END) AS casos_atipicos
        FROM ${schema}.transacciones
        WHERE anno = 2025
      `),
      pool.query(`SELECT * FROM ${schema}.anticipos WHERE valor_pendiente > 0`),
    ]);

    res.render('dashboard/index', {
      title: 'Dashboard — Quipusoft',
      user: req.user,
      empresa: empresa.rows[0],
      resumen: resumen.rows[0],
      anticipos: anticipos.rows,
      mokanataxUrl: process.env.MOKANATAX_URL,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando el dashboard.', user: req.user });
  }
});

module.exports = router;
