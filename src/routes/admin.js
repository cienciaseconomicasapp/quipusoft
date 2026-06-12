const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireDocente } = require('../middleware/auth');

// Panel del docente en Quipusoft
router.get('/', requireDocente, async (req, res) => {
  try {
    const [usuarios, resumen] = await Promise.all([
      pool.query(`
        SELECT u.id, u.email, u.nombre, u.rol, u.ultimo_acceso,
          (SELECT COUNT(*) FROM progreso_estudiantes p WHERE p.usuario_id = u.id AND p.completado = TRUE) AS actividades
        FROM usuarios u
        WHERE u.rol = 'estudiante'
        ORDER BY u.nombre
      `),
      pool.query(`
        SELECT
          COUNT(CASE WHEN rol='estudiante' THEN 1 END) AS total_estudiantes,
          COUNT(CASE WHEN rol='docente' THEN 1 END) AS total_docentes
        FROM usuarios
      `)
    ]);

    res.render('admin/index', {
      title: 'Panel docente — Quipusoft',
      user: req.user,
      estudiantes: usuarios.rows,
      resumen: resumen.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando panel docente.' });
  }
});

// Ver datos de un estudiante específico
router.get('/estudiante/:id', requireDocente, async (req, res) => {
  const schema = `u${req.params.id}`;
  try {
    const [usuario, transacciones, nomina, progreso] = await Promise.all([
      pool.query('SELECT * FROM usuarios WHERE id = $1', [req.params.id]),
      pool.query(`SELECT COUNT(*) AS total, COUNT(CASE WHEN es_caso_atipico THEN 1 END) AS atipicos FROM "${schema}".transacciones`),
      pool.query(`SELECT COUNT(DISTINCT mes) AS meses_generados FROM "${schema}".nomina WHERE documento_soporte_generado = TRUE AND anno = 2025`),
      pool.query(`SELECT * FROM progreso_estudiantes WHERE usuario_id = $1 ORDER BY semana, actividad`, [req.params.id]),
    ]);

    if (!usuario.rows.length) return res.redirect('/admin');

    res.render('admin/estudiante', {
      title: `Detalle — ${usuario.rows[0].nombre} — Quipusoft`,
      user: req.user,
      estudiante: usuario.rows[0],
      transacciones: transacciones.rows[0],
      nomina: nomina.rows[0],
      progreso: progreso.rows,
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error cargando datos del estudiante.' });
  }
});

// Resetear datos de un estudiante (para pruebas)
router.post('/resetear/:id', requireDocente, async (req, res) => {
  const schema = `u${req.params.id}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tablas = ['transacciones','anticipos','nomina'];
    for (const tabla of tablas) {
      await client.query(`DELETE FROM "${schema}"."${tabla}"`);
      await client.query(`INSERT INTO "${schema}"."${tabla}" SELECT * FROM plantilla."${tabla}"`);
    }
    await client.query(`DELETE FROM progreso_estudiantes WHERE usuario_id = $1`, [req.params.id]);
    await client.query('COMMIT');
    res.json({ ok: true, mensaje: 'Datos del estudiante reseteados correctamente.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Exportar progreso CSV
router.get('/exportar', requireDocente, async (req, res) => {
  try {
    const data = await pool.query(`
      SELECT u.nombre, u.email, p.semana, p.actividad,
             p.completado, TO_CHAR(p.fecha_completado,'DD/MM/YYYY HH24:MI') AS fecha
      FROM progreso_estudiantes p
      JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY u.nombre, p.semana, p.actividad
    `);

    const csv = ['Estudiante,Email,Semana,Actividad,Completado,Fecha']
      .concat(data.rows.map(r =>
        `"${r.nombre}","${r.email}",${r.semana},"${r.actividad}",${r.completado},"${r.fecha||''}"`
      )).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="progreso_quipusoft.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).send('Error exportando.');
  }
});

module.exports = router;
