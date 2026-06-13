const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { crearSchemaContable } = require('../config/schema_contable');

function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/auth/login');
}

const schema = (id) => `u${id}`;

// ── GET /contabilidad/init — inicializar schema contable manualmente ────────
router.get('/init', requireAuth, async (req, res) => {
  try {
    await crearSchemaContable(req.user.id);
    res.json({ ok: true, mensaje: `Schema contable creado para usuario ${req.user.id}` });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /contabilidad — índice de libros ────────────────────────────────────
router.get('/', requireAuth, (req, res) => {
  res.render('contabilidad/index', {
    title: 'Libros contables — Quipusoft',
    user: req.user,
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// ── GET /contabilidad/plan-cuentas ─────────────────────────────────────────
router.get('/plan-cuentas', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    const { rows } = await pool.query(`
      SELECT * FROM ${s}.plan_cuentas ORDER BY codigo
    `);
    res.render('contabilidad/plan-cuentas', {
      title: 'Plan de Cuentas — Quipusoft',
      user: req.user,
      cuentas: rows,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error cargando plan de cuentas: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/libro-diario ─────────────────────────────────────────
router.get('/libro-diario', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta, cuenta } = req.query;
  const fechaDesde = desde || '2025-01-01';
  const fechaHasta = hasta || '2025-12-31';

  try {
    let whereClause = `a.fecha BETWEEN $1 AND $2`;
    let params = [fechaDesde, fechaHasta];

    if (cuenta) {
      whereClause += ` AND (ad.cuenta_codigo LIKE $3 OR ad.cuenta_codigo = $3)`;
      params.push(cuenta + '%');
    }

    const { rows: asientos } = await pool.query(`
      SELECT
        a.id, a.fecha, a.numero_comprobante, a.tipo_comprobante,
        a.concepto, a.documento_soporte, a.contraparte,
        json_agg(
          json_build_object(
            'id', ad.id,
            'cuenta_codigo', ad.cuenta_codigo,
            'cuenta_nombre', pc.nombre,
            'naturaleza', pc.naturaleza,
            'descripcion', ad.descripcion,
            'debito', ad.debito,
            'credito', ad.credito
          ) ORDER BY ad.id
        ) AS detalles,
        SUM(ad.debito) AS total_debito,
        SUM(ad.credito) AS total_credito
      FROM ${s}.asientos a
      JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
      JOIN ${s}.plan_cuentas pc ON pc.codigo = ad.cuenta_codigo
      ${cuenta ? 'WHERE a.id IN (SELECT DISTINCT asiento_id FROM ' + s + '.asientos_detalle WHERE cuenta_codigo LIKE $3)' : ''}
      WHERE a.fecha BETWEEN $1 AND $2
      GROUP BY a.id, a.fecha, a.numero_comprobante, a.tipo_comprobante, a.concepto, a.documento_soporte, a.contraparte
      ORDER BY a.fecha, a.numero_comprobante
    `, params);

    // Totales generales
    const totales = asientos.reduce((acc, a) => ({
      debito: acc.debito + Number(a.total_debito),
      credito: acc.credito + Number(a.total_credito),
    }), { debito: 0, credito: 0 });

    res.render('contabilidad/libro-diario', {
      title: 'Libro Diario — Quipusoft',
      user: req.user,
      asientos,
      totales,
      fechaDesde,
      fechaHasta,
      cuentaFiltro: cuenta || '',
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/libro-mayor ──────────────────────────────────────────
router.get('/libro-mayor', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta, cuenta } = req.query;
  const fechaDesde = desde || '2025-01-01';
  const fechaHasta = hasta || '2025-12-31';
  const cuentaFiltro = cuenta || '';

  try {
    // Todas las cuentas con movimiento en el período
    let cuentasQuery = `
      SELECT DISTINCT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo,
        pc.tipo
      FROM ${s}.plan_cuentas pc
      JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      JOIN ${s}.asientos a ON a.id = ad.asiento_id
      WHERE a.fecha BETWEEN $1 AND $2
    `;
    const params = [fechaDesde, fechaHasta];

    if (cuentaFiltro) {
      cuentasQuery += ` AND pc.codigo LIKE $3`;
      params.push(cuentaFiltro + '%');
    }
    cuentasQuery += ` ORDER BY pc.codigo`;

    const { rows: cuentas } = await pool.query(cuentasQuery, params);

    // Para cada cuenta: movimientos y saldos
    const mayor = await Promise.all(cuentas.map(async (c) => {
      const { rows: movs } = await pool.query(`
        SELECT
          a.fecha, a.numero_comprobante, a.concepto, a.contraparte,
          ad.descripcion, ad.debito, ad.credito
        FROM ${s}.asientos_detalle ad
        JOIN ${s}.asientos a ON a.id = ad.asiento_id
        WHERE ad.cuenta_codigo = $1 AND a.fecha BETWEEN $2 AND $3
        ORDER BY a.fecha, a.numero_comprobante
      `, [c.codigo, fechaDesde, fechaHasta]);

      const totDebito  = movs.reduce((s, m) => s + Number(m.debito), 0);
      const totCredito = movs.reduce((s, m) => s + Number(m.credito), 0);
      const saldo = c.naturaleza === 'D'
        ? totDebito - totCredito
        : totCredito - totDebito;

      return { ...c, movimientos: movs, totDebito, totCredito, saldo };
    }));

    res.render('contabilidad/libro-mayor', {
      title: 'Libro Mayor — Quipusoft',
      user: req.user,
      mayor,
      fechaDesde,
      fechaHasta,
      cuentaFiltro,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/libro-auxiliar ───────────────────────────────────────
router.get('/libro-auxiliar', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta, cuenta } = req.query;
  const fechaDesde = desde || '2025-01-01';
  const fechaHasta = hasta || '2025-12-31';
  const cuentaFiltro = cuenta || '1105';

  try {
    // Info de la cuenta seleccionada
    const { rows: cuentaInfo } = await pool.query(
      `SELECT * FROM ${s}.plan_cuentas WHERE codigo = $1`, [cuentaFiltro]
    );

    // Saldo inicial (movimientos ANTES del período)
    const { rows: saldoIni } = await pool.query(`
      SELECT
        COALESCE(SUM(ad.debito),0) AS debito_ant,
        COALESCE(SUM(ad.credito),0) AS credito_ant
      FROM ${s}.asientos_detalle ad
      JOIN ${s}.asientos a ON a.id = ad.asiento_id
      WHERE ad.cuenta_codigo = $1 AND a.fecha < $2
    `, [cuentaFiltro, fechaDesde]);

    const nat = cuentaInfo[0]?.naturaleza || 'D';
    const db_ant = Number(saldoIni[0]?.debito_ant || 0);
    const cr_ant = Number(saldoIni[0]?.credito_ant || 0);
    const saldoInicial = nat === 'D' ? db_ant - cr_ant : cr_ant - db_ant;

    // Movimientos del período
    const { rows: movs } = await pool.query(`
      SELECT
        a.fecha, a.numero_comprobante, a.tipo_comprobante,
        a.concepto, a.documento_soporte, a.contraparte,
        ad.descripcion, ad.debito, ad.credito
      FROM ${s}.asientos_detalle ad
      JOIN ${s}.asientos a ON a.id = ad.asiento_id
      WHERE ad.cuenta_codigo = $1 AND a.fecha BETWEEN $2 AND $3
      ORDER BY a.fecha, a.numero_comprobante
    `, [cuentaFiltro, fechaDesde, fechaHasta]);

    // Calcular saldo acumulado
    let saldoAcum = saldoInicial;
    const movsConSaldo = movs.map(m => {
      const deb = Number(m.debito);
      const cre = Number(m.credito);
      saldoAcum += nat === 'D' ? (deb - cre) : (cre - deb);
      return { ...m, saldo: saldoAcum };
    });

    // Todas las cuentas para el selector
    const { rows: todasCuentas } = await pool.query(
      `SELECT codigo, nombre FROM ${s}.plan_cuentas ORDER BY codigo`
    );

    res.render('contabilidad/libro-auxiliar', {
      title: 'Libro Auxiliar — Quipusoft',
      user: req.user,
      cuenta: cuentaInfo[0] || null,
      movimientos: movsConSaldo,
      saldoInicial,
      todasCuentas,
      fechaDesde,
      fechaHasta,
      cuentaFiltro,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/balance-comprobacion ─────────────────────────────────
router.get('/balance-comprobacion', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { hasta } = req.query;
  const fechaHasta = hasta || '2025-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo, pc.tipo,
        COALESCE(SUM(ad.debito), 0)  AS total_debito,
        COALESCE(SUM(ad.credito), 0) AS total_credito,
        CASE WHEN pc.naturaleza = 'D'
          THEN COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0)
          ELSE COALESCE(SUM(ad.credito),0) - COALESCE(SUM(ad.debito),0)
        END AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
      GROUP BY pc.codigo, pc.nombre, pc.naturaleza, pc.tipo
      HAVING COALESCE(SUM(ad.debito),0) > 0 OR COALESCE(SUM(ad.credito),0) > 0
      ORDER BY pc.codigo
    `, [fechaHasta]);

    const totales = rows.reduce((acc, r) => ({
      debito:  acc.debito  + Number(r.total_debito),
      credito: acc.credito + Number(r.total_credito),
    }), { debito: 0, credito: 0 });

    res.render('contabilidad/balance-comprobacion', {
      title: 'Balance de Comprobación — Quipusoft',
      user: req.user,
      cuentas: rows,
      totales,
      fechaHasta,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/estado-situacion — Estado de Situación Financiera ────
router.get('/estado-situacion', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { hasta } = req.query;
  const fechaHasta = hasta || '2025-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo,
        CASE WHEN pc.naturaleza = 'D'
          THEN COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0)
          ELSE COALESCE(SUM(ad.credito),0) - COALESCE(SUM(ad.debito),0)
        END AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
      WHERE pc.codigo ~ '^[123]'
      GROUP BY pc.codigo, pc.nombre, pc.naturaleza, pc.tipo
      HAVING COALESCE(SUM(ad.debito),0) > 0 OR COALESCE(SUM(ad.credito),0) > 0
      ORDER BY pc.codigo
    `, [fechaHasta]);

    // Calcular utilidad/pérdida del ejercicio (ingresos - gastos - costos), AG completo hasta fechaHasta
    const { rows: resultRows } = await pool.query(`
      SELECT pc.codigo,
        CASE WHEN pc.naturaleza = 'D'
          THEN COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0)
          ELSE COALESCE(SUM(ad.credito),0) - COALESCE(SUM(ad.debito),0)
        END AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
      WHERE pc.codigo ~ '^[456]'
      GROUP BY pc.codigo, pc.naturaleza
    `, [fechaHasta]);

    let ingresos = 0, gastosCostos = 0;
    for (const r of resultRows) {
      const saldo = Number(r.saldo);
      if (r.codigo.startsWith('4')) ingresos += saldo;
      else gastosCostos += saldo;
    }
    const utilidadEjercicio = ingresos - gastosCostos;

    // Totales por clase
    let totalActivo = 0, totalPasivo = 0, totalPatrimonio = 0;
    for (const c of rows) {
      const saldo = Number(c.saldo);
      if (c.codigo.startsWith('1')) totalActivo += saldo;
      else if (c.codigo.startsWith('2')) totalPasivo += saldo;
      else if (c.codigo.startsWith('3')) totalPatrimonio += saldo;
    }
    totalPatrimonio += utilidadEjercicio;
    const totalPasivoPatrimonio = totalPasivo + totalPatrimonio;

    res.render('contabilidad/estado-situacion', {
      title: 'Estado de Situación Financiera — Quipusoft',
      user: req.user,
      cuentas: rows,
      fechaHasta,
      totalActivo,
      totalPasivo,
      totalPatrimonio,
      totalPasivoPatrimonio,
      utilidadEjercicio,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/estado-resultados — Estado de Resultado Integral ─────
router.get('/estado-resultados', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta } = req.query;
  const fechaDesde = desde || '2025-01-01';
  const fechaHasta = hasta || '2025-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo,
        CASE WHEN pc.naturaleza = 'D'
          THEN COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0)
          ELSE COALESCE(SUM(ad.credito),0) - COALESCE(SUM(ad.debito),0)
        END AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha BETWEEN $1 AND $2
      WHERE pc.codigo ~ '^[456]'
      GROUP BY pc.codigo, pc.nombre, pc.naturaleza, pc.tipo
      HAVING COALESCE(SUM(ad.debito),0) > 0 OR COALESCE(SUM(ad.credito),0) > 0
      ORDER BY pc.codigo
    `, [fechaDesde, fechaHasta]);

    let totalIngresos = 0, totalGastos = 0, totalCostos = 0;
    for (const c of rows) {
      const saldo = Number(c.saldo);
      if (c.codigo.startsWith('4')) totalIngresos += saldo;
      else if (c.codigo.startsWith('5')) totalGastos += saldo;
      else if (c.codigo.startsWith('6')) totalCostos += saldo;
    }
    const resultadoEjercicio = totalIngresos - totalGastos - totalCostos;

    res.render('contabilidad/estado-resultados', {
      title: 'Estado de Resultado Integral — Quipusoft',
      user: req.user,
      cuentas: rows,
      fechaDesde,
      fechaHasta,
      totalIngresos,
      totalGastos,
      totalCostos,
      resultadoEjercicio,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// ── GET /contabilidad/ajuste/:asientoId — formulario de ajuste ──────────────
router.get('/ajuste/:asientoId', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { asientoId } = req.params;
  try {
    const { rows: [asiento] } = await pool.query(
      `SELECT a.*, json_agg(
         json_build_object('cuenta_codigo', ad.cuenta_codigo, 'nombre', pc.nombre,
           'naturaleza', pc.naturaleza, 'debito', ad.debito, 'credito', ad.credito)
         ORDER BY ad.id
       ) AS detalles
       FROM ${s}.asientos a
       JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
       JOIN ${s}.plan_cuentas pc ON pc.codigo = ad.cuenta_codigo
       WHERE a.id = $1
       GROUP BY a.id`, [asientoId]
    );
    if (!asiento) { req.flash('error', 'Asiento no encontrado'); return res.redirect('/contabilidad/libro-diario'); }

    const { rows: cuentas } = await pool.query(
      `SELECT codigo, nombre, naturaleza FROM ${s}.plan_cuentas ORDER BY codigo`
    );

    res.render('contabilidad/ajuste', {
      title: `Asiento de ajuste — ${asiento.numero_comprobante}`,
      user: req.user,
      asientoOriginal: asiento,
      cuentas,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad/libro-diario');
  }
});

// ── POST /contabilidad/ajuste/:asientoId — guardar asiento de ajuste ────────
router.post('/ajuste/:asientoId', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { asientoId } = req.params;
  const { concepto, justificacion, cuentas_codigo, descripciones, debitos, creditos } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener info del asiento original
    const { rows: [orig] } = await client.query(
      `SELECT numero_comprobante, codigo_caso FROM ${s}.asientos WHERE id = $1`, [asientoId]
    );

    // Número del asiento corrector
    const fecha = new Date().toISOString().split('T')[0];
    const numAjuste = `AJ-${orig.numero_comprobante}`;

    // Insertar asiento de ajuste
    const { rows: [nuevo] } = await client.query(
      `INSERT INTO ${s}.asientos
        (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte,
         contraparte, estado, es_caso_atipico, codigo_caso, nota_pedagogica)
       VALUES ($1,$2,$3,$4,$5,$6,'ajuste',true,$7,$8) RETURNING id`,
      [fecha, numAjuste, 'Asiento de ajuste',
       concepto || `Ajuste corrector de ${orig.numero_comprobante}`,
       `REF:${orig.numero_comprobante}`,
       'Ajuste estudiante',
       orig.codigo_caso,
       justificacion || null]
    );

    // Insertar líneas del asiento
    const codigos  = Array.isArray(cuentas_codigo) ? cuentas_codigo  : [cuentas_codigo];
    const descs    = Array.isArray(descripciones)  ? descripciones   : [descripciones];
    const debs     = Array.isArray(debitos)        ? debitos         : [debitos];
    const creds    = Array.isArray(creditos)       ? creditos        : [creditos];

    for (let i = 0; i < codigos.length; i++) {
      const deb = parseInt(debs[i] || 0);
      const cre = parseInt(creds[i] || 0);
      if (!codigos[i] || (deb === 0 && cre === 0)) continue;
      await client.query(
        `INSERT INTO ${s}.asientos_detalle (asiento_id, cuenta_codigo, descripcion, debito, credito)
         VALUES ($1,$2,$3,$4,$5)`,
        [nuevo.id, codigos[i], descs[i] || '', deb, cre]
      );
    }

    // Marcar asiento original como "corregido"
    await client.query(
      `UPDATE ${s}.asientos SET estado = 'corregido' WHERE id = $1`, [asientoId]
    );

    await client.query('COMMIT');
    req.flash('success', `Asiento de ajuste ${numAjuste} registrado correctamente.`);
    res.redirect('/contabilidad/libro-diario');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    req.flash('error', 'Error al registrar ajuste: ' + e.message);
    res.redirect(`/contabilidad/ajuste/${asientoId}`);
  } finally {
    client.release();
  }
});

module.exports = router;
