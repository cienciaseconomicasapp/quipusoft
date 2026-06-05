const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

// Listar todas las transacciones con filtros
router.get('/', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { mes, tipo, estado } = req.query;
  try {
    let query = `SELECT * FROM ${schema}.transacciones WHERE anno = 2025`;
    const params = [];
    let i = 1;
    if (mes) { query += ` AND mes = $${i++}`; params.push(mes); }
    if (tipo) { query += ` AND tipo ILIKE $${i++}`; params.push(`%${tipo}%`); }
    if (estado) { query += ` AND estado = $${i++}`; params.push(estado); }
    query += ' ORDER BY fecha ASC';

    const result = await pool.query(query, params);

    // Resumen IVA por bimestre
    const ivaQuery = await pool.query(`
      SELECT
        CEIL(mes/2.0) AS bimestre,
        SUM(CASE WHEN tipo LIKE 'Factura venta%' OR tipo = 'Nota débito' THEN iva ELSE 0 END) AS iva_generado,
        SUM(CASE WHEN tipo LIKE 'Factura compra%' OR tipo = 'Activo fijo' THEN ABS(iva) ELSE 0 END) AS iva_descontable
      FROM ${schema}.transacciones
      WHERE anno = 2025 AND tipo NOT IN ('Resumen mes','Nómina electrónica')
      GROUP BY CEIL(mes/2.0)
      ORDER BY bimestre
    `, []);

    res.render('facturas/index', {
      title: 'Libro de transacciones — Quipusoft',
      user: req.user,
      transacciones: result.rows,
      ivaResumen: ivaQuery.rows,
      filtros: { mes, tipo, estado },
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando transacciones.', user: req.user });
  }
});

// Detalle de una transacción
router.get('/:id', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const result = await pool.query(`SELECT * FROM ${schema}.transacciones WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.redirect('/transacciones');
    res.render('facturas/detalle', {
      title: 'Detalle transacción — Quipusoft',
      user: req.user,
      transaccion: result.rows[0],
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error.', user: req.user });
  }
});

// Nueva transacción
router.get('/nueva/form', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const [clientes, proveedores] = await Promise.all([
    pool.query(`SELECT * FROM ${schema}.clientes WHERE activo = TRUE ORDER BY razon_social`),
    pool.query(`SELECT * FROM ${schema}.proveedores WHERE activo = TRUE ORDER BY razon_social`),
  ]);
  res.render('facturas/nueva', {
    title: 'Nueva transacción — Quipusoft',
    user: req.user,
    clientes: clientes.rows,
    proveedores: proveedores.rows,
    error: req.flash('error'),
  });
});

router.post('/nueva', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, tipo_iva } = req.body;
  const total = parseInt(subtotal) + parseInt(iva) + parseInt(retencion);
  const mes = new Date(fecha).getMonth() + 1;
  try {
    await pool.query(`
      INSERT INTO ${schema}.transacciones
      (documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, total, mes, anno, tipo_iva)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,2025,$11)
    `, [documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, total, mes, tipo_iva]);
    res.redirect('/transacciones');
  } catch (err) {
    req.flash('error', 'Error al guardar la transacción: ' + err.message);
    res.redirect('/transacciones/nueva/form');
  }
});

// Editar transacción
router.get('/:id/editar', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const result = await pool.query(`SELECT * FROM ${schema}.transacciones WHERE id = $1`, [req.params.id]);
  if (!result.rows.length || !result.rows[0].editable) return res.redirect('/transacciones');
  res.render('facturas/editar', {
    title: 'Editar transacción — Quipusoft',
    user: req.user,
    transaccion: result.rows[0],
    error: req.flash('error'),
  });
});

router.post('/:id/editar', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { concepto, subtotal, iva, retencion, tipo_iva } = req.body;
  const total = parseInt(subtotal) + parseInt(iva) + parseInt(retencion);
  try {
    await pool.query(`
      UPDATE ${schema}.transacciones
      SET concepto=$1, subtotal=$2, iva=$3, retencion=$4, total=$5, tipo_iva=$6
      WHERE id=$7
    `, [concepto, subtotal, iva, retencion, total, tipo_iva, req.params.id]);
    res.redirect('/transacciones');
  } catch (err) {
    req.flash('error', 'Error al actualizar: ' + err.message);
    res.redirect(`/transacciones/${req.params.id}/editar`);
  }
});

// Exportar datos para MokanaTax (JSON)
router.get('/exportar/mokanatax', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const [transacciones, nomina, empresa, activos] = await Promise.all([
      pool.query(`SELECT * FROM ${schema}.transacciones WHERE anno = 2025 ORDER BY fecha`),
      pool.query(`SELECT * FROM ${schema}.nomina WHERE anno = 2025 ORDER BY mes`),
      pool.query(`SELECT * FROM ${schema}.empresa LIMIT 1`),
      pool.query(`SELECT * FROM ${schema}.activos_fijos`),
    ]);
    res.json({
      exportado_en: new Date().toISOString(),
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre,
      empresa: empresa.rows[0],
      transacciones: transacciones.rows,
      nomina: nomina.rows,
      activos_fijos: activos.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error exportando datos.' });
  }
});

module.exports = router;
