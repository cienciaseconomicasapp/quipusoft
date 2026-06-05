const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

// Función para crear/reparar schema del estudiante
async function repararSchema(userId) {
  const schema = `u${userId}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    const tablas = ['empresa','clientes','proveedores','empleados','transacciones','nomina','activos_fijos','anticipos'];
    for (const tabla of tablas) {
      // Verificar si la tabla existe
      const existe = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = $1 AND table_name = $2
        )`, [schema, tabla]);

      if (!existe.rows[0].exists) {
        await client.query(`CREATE TABLE "${schema}"."${tabla}" (LIKE plantilla."${tabla}" INCLUDING ALL)`);
        await client.query(`INSERT INTO "${schema}"."${tabla}" SELECT * FROM plantilla."${tabla}"`);
        console.log(`Tabla ${schema}.${tabla} creada y poblada`);
      }
    }
    await client.query('COMMIT');
    console.log(`Schema ${schema} reparado para usuario ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error reparando schema:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

router.get('/', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    // Intentar reparar schema si es necesario
    await repararSchema(req.user.id);

    const [empresa, resumen, anticipos] = await Promise.all([
      pool.query(`SELECT * FROM "${schema}".empresa LIMIT 1`),
      pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN tipo LIKE 'Factura venta%' THEN subtotal ELSE 0 END),0) AS total_ventas,
          COALESCE(SUM(CASE WHEN tipo LIKE 'Factura compra%' THEN subtotal ELSE 0 END),0) AS total_compras,
          COALESCE(SUM(CASE WHEN tipo LIKE 'Factura venta%' THEN iva ELSE 0 END),0) AS iva_generado,
          COALESCE(SUM(CASE WHEN tipo LIKE 'Factura compra%' THEN iva ELSE 0 END),0) AS iva_descontable,
          COUNT(CASE WHEN estado = 'rechazada' THEN 1 END) AS facturas_rechazadas,
          COUNT(CASE WHEN es_caso_atipico = TRUE THEN 1 END) AS casos_atipicos
        FROM "${schema}".transacciones
        WHERE anno = 2025
      `),
      pool.query(`SELECT * FROM "${schema}".anticipos WHERE valor_pendiente > 0`),
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
    console.error('Error en dashboard:', err.message);
    res.render('error', { mensaje: 'Error cargando el dashboard: ' + err.message });
  }
});

module.exports = router;
