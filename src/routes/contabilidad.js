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
// El libro diario totaliza por TIPO DE DOCUMENTO (fuente) en el rango de fechas.
// No muestra asiento por asiento, sino el resumen agrupado por tipo_comprobante,
// con los totales de débito/crédito y desglose por nivel de cuentas (clase/grupo/cuenta/subcuenta/auxiliar).
router.get('/libro-diario', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta, nivel } = req.query;
  const fechaDesde = desde || '2026-01-01';
  const fechaHasta = hasta || '2026-12-31';
  const nivelFiltro = nivel || 'auxiliar'; // clase|grupo|cuenta|subcuenta|auxiliar

  // Longitud de código según nivel
  const nivelLen = { clase: 1, grupo: 2, cuenta: 4, subcuenta: 6, auxiliar: 8 };
  const codLen = nivelLen[nivelFiltro] || 8;

  try {
    // Totalizar por tipo_comprobante × cuenta (truncada al nivel seleccionado)
    const { rows } = await pool.query(`
      SELECT
        a.tipo_comprobante,
        COUNT(DISTINCT a.id)                              AS num_documentos,
        MIN(a.fecha)                                      AS fecha_desde,
        MAX(a.fecha)                                      AS fecha_hasta,
        LEFT(ad.cuenta_codigo, $3)                        AS cuenta_nivel,
        MAX(pc.nombre)                                    AS cuenta_nombre,
        COALESCE(SUM(ad.debito), 0)                       AS total_debito,
        COALESCE(SUM(ad.credito), 0)                      AS total_credito
      FROM ${s}.asientos a
      JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
      LEFT JOIN ${s}.plan_cuentas pc ON pc.codigo = LEFT(ad.cuenta_codigo, $3)
      WHERE a.fecha BETWEEN $1 AND $2
        AND LENGTH(ad.cuenta_codigo) >= $3
      GROUP BY a.tipo_comprobante, LEFT(ad.cuenta_codigo, $3)
      ORDER BY a.tipo_comprobante, LEFT(ad.cuenta_codigo, $3)
    `, [fechaDesde, fechaHasta, codLen]);

    // Agrupar por tipo_comprobante
    const porTipo = {};
    for (const r of rows) {
      if (!porTipo[r.tipo_comprobante]) {
        porTipo[r.tipo_comprobante] = {
          tipo: r.tipo_comprobante,
          num_documentos: Number(r.num_documentos),
          fecha_desde: r.fecha_desde,
          fecha_hasta: r.fecha_hasta,
          cuentas: [],
          total_debito: 0,
          total_credito: 0,
        };
      }
      const deb = Number(r.total_debito);
      const cred = Number(r.total_credito);
      porTipo[r.tipo_comprobante].cuentas.push({
        codigo: r.cuenta_nivel,
        nombre: r.cuenta_nombre || r.cuenta_nivel,
        debito: deb,
        credito: cred,
        saldo: deb - cred,
      });
      porTipo[r.tipo_comprobante].total_debito += deb;
      porTipo[r.tipo_comprobante].total_credito += cred;
    }

    const resumen = Object.values(porTipo);

    // Totales generales
    const totales = resumen.reduce((acc, t) => ({
      debito: acc.debito + t.total_debito,
      credito: acc.credito + t.total_credito,
      documentos: acc.documentos + t.num_documentos,
    }), { debito: 0, credito: 0, documentos: 0 });

    res.render('contabilidad/libro-diario', {
      title: 'Libro Diario — Quipusoft',
      user: req.user,
      resumen,
      totales,
      fechaDesde,
      fechaHasta,
      nivelFiltro,
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
  const fechaDesde = desde || '2026-01-01';
  const fechaHasta = hasta || '2026-12-31';
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
      const saldo = totDebito - totCredito;

      // Saldo inicial: movimientos ANTES del período
      const { rows: siRows } = await pool.query(
        `SELECT COALESCE(SUM(ad.debito),0) AS deb, COALESCE(SUM(ad.credito),0) AS cre
         FROM ${s}.asientos_detalle ad
         JOIN ${s}.asientos a ON a.id = ad.asiento_id
         WHERE ad.cuenta_codigo = $1 AND a.fecha < $2`,
        [c.codigo, fechaDesde]
      );
      const saldoInicial = Number(siRows[0].deb) - Number(siRows[0].cre);

      return { ...c, movimientos: movs, totDebito, totCredito, saldo, saldoInicial };
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
  const fechaDesde = desde || '2026-01-01';
  const fechaHasta = hasta || '2026-12-31';
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

    const db_ant = Number(saldoIni[0]?.debito_ant || 0);
    const cr_ant = Number(saldoIni[0]?.credito_ant || 0);
    const saldoInicial = db_ant - cr_ant;

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
      saldoAcum += deb - cre;
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
  const fechaHasta = hasta || '2026-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo, pc.tipo,
        COALESCE(SUM(ad.debito), 0)  AS total_debito,
        COALESCE(SUM(ad.credito), 0) AS total_credito,
        COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0) AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
      GROUP BY pc.codigo, pc.nombre, pc.naturaleza, pc.tipo
      HAVING COALESCE(SUM(ad.debito),0) > 0 OR COALESCE(SUM(ad.credito),0) > 0
      ORDER BY pc.codigo
    `, [fechaHasta]);

    const totales = rows.reduce((acc, r) => ({
      debito:   acc.debito  + Number(r.total_debito),
      credito:  acc.credito + Number(r.total_credito),
      saldoNet: acc.saldoNet + Number(r.saldo),
    }), { debito: 0, credito: 0, saldoNet: 0 });

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
  const fechaHasta = hasta || '2026-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo,
        COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0) AS saldo
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
        COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0) AS saldo
      FROM ${s}.plan_cuentas pc
      LEFT JOIN ${s}.asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
      LEFT JOIN ${s}.asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
      WHERE pc.codigo ~ '^[456]'
      GROUP BY pc.codigo, pc.naturaleza
    `, [fechaHasta]);

    let ingresos = 0, gastosCostos = 0;
    for (const r of resultRows) {
      const saldo = Number(r.saldo);
      // Ingresos (clase 4) tienen saldo negativo (crédito), gastos/costos (5/6) positivo (débito)
      if (r.codigo.startsWith('4')) ingresos += -saldo; // negamos para obtener valor positivo
      else gastosCostos += saldo;
    }
    const utilidadEjercicio = ingresos - gastosCostos;

    // Totales por clase
    let totalActivo = 0, totalPasivo = 0, totalPatrimonio = 0;
    for (const c of rows) {
      const saldo = Number(c.saldo);
      // Activo (1) saldo positivo; Pasivo (2) y Patrimonio (3) saldo negativo → negamos para presentar positivo
      if (c.codigo.startsWith('1')) totalActivo += saldo;
      else if (c.codigo.startsWith('2')) totalPasivo += -saldo;
      else if (c.codigo.startsWith('3')) totalPatrimonio += -saldo;
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
  const fechaDesde = desde || '2026-01-01';
  const fechaHasta = hasta || '2026-12-31';

  try {
    const { rows } = await pool.query(`
      SELECT
        pc.codigo, pc.nombre, pc.naturaleza, pc.tipo,
        COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0) AS saldo
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
      // Ingresos (4) saldo negativo (crédito) → negamos para presentar positivo
      // Gastos (5) y Costos (6) saldo positivo (débito)
      if (c.codigo.startsWith('4')) totalIngresos += -saldo;
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

// ═════════════════════════════════════════════════════════════════════════
// CUENTAS — gestión del plan de cuentas (incluye creación de auxiliares 8 díg.)
// ═════════════════════════════════════════════════════════════════════════
router.get('/cuentas', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    const { rows } = await pool.query(`SELECT * FROM ${s}.plan_cuentas ORDER BY codigo`);
    res.render('contabilidad/cuentas', {
      title: 'Cuentas — Quipusoft',
      user: req.user,
      cuentas: rows,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

// Crear / actualizar una cuenta (típicamente un auxiliar de 8 dígitos)
router.post('/cuentas', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { codigo, nombre, naturaleza, tipo, padre } = req.body;

  if (!codigo || !nombre || !naturaleza || !tipo) {
    req.flash('error', 'Código, nombre, naturaleza y tipo son obligatorios.');
    return res.redirect('/contabilidad/cuentas');
  }
  if (!/^\d{1,10}$/.test(codigo)) {
    req.flash('error', 'El código debe contener solo dígitos (hasta 10).');
    return res.redirect('/contabilidad/cuentas');
  }
  if (!['D', 'C'].includes(naturaleza)) {
    req.flash('error', 'La naturaleza debe ser D (débito) o C (crédito).');
    return res.redirect('/contabilidad/cuentas');
  }

  try {
    // Si se especifica padre, validar que exista
    if (padre) {
      const { rows } = await pool.query(`SELECT codigo FROM ${s}.plan_cuentas WHERE codigo = $1`, [padre]);
      if (rows.length === 0) {
        req.flash('error', `La cuenta padre ${padre} no existe en el plan de cuentas.`);
        return res.redirect('/contabilidad/cuentas');
      }
    }

    await pool.query(
      `INSERT INTO ${s}.plan_cuentas (codigo, nombre, naturaleza, tipo, padre)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, naturaleza = EXCLUDED.naturaleza, tipo = EXCLUDED.tipo, padre = EXCLUDED.padre`,
      [codigo, nombre, naturaleza, tipo, padre || null]
    );
    req.flash('success', `Cuenta ${codigo} — ${nombre} guardada correctamente.`);
    res.redirect('/contabilidad/cuentas');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar la cuenta: ' + e.message);
    res.redirect('/contabilidad/cuentas');
  }
});

// Activar / inactivar una cuenta
router.post('/cuentas/:codigo/toggle', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    await pool.query(`UPDATE ${s}.plan_cuentas SET activa = NOT activa WHERE codigo = $1`, [req.params.codigo]);
    req.flash('success', `Estado de la cuenta ${req.params.codigo} actualizado.`);
  } catch (e) {
    req.flash('error', 'Error: ' + e.message);
  }
  res.redirect('/contabilidad/cuentas');
});

// ═════════════════════════════════════════════════════════════════════════
// TERCEROS — gestión de clientes, proveedores y accionistas (para exógena)
// ═════════════════════════════════════════════════════════════════════════
const dane = require('../data/dane');

router.get('/terceros', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    const { rows } = await pool.query(`SELECT * FROM ${s}.terceros ORDER BY codigo`);
    res.render('contabilidad/terceros', {
      title: 'Terceros — Quipusoft',
      user: req.user,
      terceros: rows,
      dane,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

router.post('/terceros', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const {
    codigo, tipo_documento, identificacion,
    primer_apellido, segundo_apellido, primer_nombre, segundo_nombre, razon_social,
    direccion, cod_departamento, cod_municipio, pais,
    es_cliente, es_proveedor, es_accionista, es_empleado,
  } = req.body;

  if (!codigo || !tipo_documento || !identificacion) {
    req.flash('error', 'Código, tipo de documento e identificación son obligatorios.');
    return res.redirect('/contabilidad/terceros');
  }
  if (tipo_documento !== 'NIT' && !(primer_apellido && primer_nombre)) {
    req.flash('error', 'Para personas naturales, primer apellido y primer nombre son obligatorios.');
    return res.redirect('/contabilidad/terceros');
  }
  if (tipo_documento === 'NIT' && !razon_social) {
    req.flash('error', 'Para personas jurídicas (NIT), la razón social es obligatoria.');
    return res.redirect('/contabilidad/terceros');
  }

  try {
    await pool.query(
      `INSERT INTO ${s}.terceros
        (codigo, tipo_documento, identificacion, primer_apellido, segundo_apellido,
         primer_nombre, segundo_nombre, razon_social, direccion, cod_departamento,
         cod_municipio, pais, es_cliente, es_proveedor, es_accionista, es_empleado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       ON CONFLICT (codigo) DO UPDATE SET
         tipo_documento = EXCLUDED.tipo_documento, identificacion = EXCLUDED.identificacion,
         primer_apellido = EXCLUDED.primer_apellido, segundo_apellido = EXCLUDED.segundo_apellido,
         primer_nombre = EXCLUDED.primer_nombre, segundo_nombre = EXCLUDED.segundo_nombre,
         razon_social = EXCLUDED.razon_social, direccion = EXCLUDED.direccion,
         cod_departamento = EXCLUDED.cod_departamento, cod_municipio = EXCLUDED.cod_municipio,
         pais = EXCLUDED.pais, es_cliente = EXCLUDED.es_cliente, es_proveedor = EXCLUDED.es_proveedor,
         es_accionista = EXCLUDED.es_accionista, es_empleado = EXCLUDED.es_empleado`,
      [codigo, tipo_documento, identificacion,
       primer_apellido || '', segundo_apellido || '', primer_nombre || '', segundo_nombre || '',
       razon_social || '', direccion || null, cod_departamento || null, cod_municipio || null,
       pais || '169', !!es_cliente, !!es_proveedor, !!es_accionista, !!es_empleado]
    );
    req.flash('success', `Tercero ${codigo} guardado correctamente.`);
    res.redirect('/contabilidad/terceros');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar el tercero: ' + e.message);
    res.redirect('/contabilidad/terceros');
  }
});

// Activar / inactivar un tercero
router.post('/terceros/:codigo/toggle', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    await pool.query(`UPDATE ${s}.terceros SET activo = NOT activo WHERE codigo = $1`, [req.params.codigo]);
    req.flash('success', `Estado del tercero ${req.params.codigo} actualizado.`);
  } catch (e) {
    req.flash('error', 'Error: ' + e.message);
  }
  res.redirect('/contabilidad/terceros');
});

// ═════════════════════════════════════════════════════════════════════════
// PRODUCTOS Y SERVICIOS — catálogo vinculado a cuentas contables
// ═════════════════════════════════════════════════════════════════════════
router.get('/productos', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    const [productos, cuentas] = await Promise.all([
      pool.query(`SELECT * FROM ${s}.productos_servicios ORDER BY codigo`),
      pool.query(`SELECT codigo, nombre FROM ${s}.plan_cuentas WHERE activa = TRUE ORDER BY codigo`),
    ]);
    res.render('contabilidad/productos', {
      title: 'Productos y Servicios — Quipusoft',
      user: req.user,
      productos: productos.rows,
      cuentas: cuentas.rows,
      error: req.flash('error'),
      success: req.flash('success'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

router.post('/productos', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const {
    codigo, nombre, tipo, cuenta_ingreso, cuenta_costo, cuenta_inventario,
    costo_unitario, precio_venta, tarifa_iva, tarifa_retencion, concepto_retencion,
  } = req.body;

  if (!codigo || !nombre || !tipo || !cuenta_ingreso) {
    req.flash('error', 'Código, nombre, tipo y cuenta de ingreso son obligatorios.');
    return res.redirect('/contabilidad/productos');
  }
  if (tipo === 'producto' && (!cuenta_costo || !cuenta_inventario)) {
    req.flash('error', 'Los productos requieren cuenta de costo y cuenta de inventario.');
    return res.redirect('/contabilidad/productos');
  }

  try {
    const codigosCuenta = [cuenta_ingreso, cuenta_costo, cuenta_inventario].filter(Boolean);
    const { rows: validas } = await pool.query(
      `SELECT codigo FROM ${s}.plan_cuentas WHERE codigo = ANY($1)`, [codigosCuenta]
    );
    const validasSet = new Set(validas.map(c => c.codigo));
    const faltantes = codigosCuenta.filter(c => !validasSet.has(c));
    if (faltantes.length > 0) {
      req.flash('error', `Las siguientes cuentas no existen: ${faltantes.join(', ')}.`);
      return res.redirect('/contabilidad/productos');
    }

    await pool.query(
      `INSERT INTO ${s}.productos_servicios
        (codigo, nombre, tipo, cuenta_ingreso, cuenta_costo, cuenta_inventario,
         costo_unitario, precio_venta, tarifa_iva, tarifa_retencion, concepto_retencion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (codigo) DO UPDATE SET
         nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo, cuenta_ingreso = EXCLUDED.cuenta_ingreso,
         cuenta_costo = EXCLUDED.cuenta_costo, cuenta_inventario = EXCLUDED.cuenta_inventario,
         costo_unitario = EXCLUDED.costo_unitario, precio_venta = EXCLUDED.precio_venta,
         tarifa_iva = EXCLUDED.tarifa_iva, tarifa_retencion = EXCLUDED.tarifa_retencion,
         concepto_retencion = EXCLUDED.concepto_retencion`,
      [codigo, nombre, tipo, cuenta_ingreso, cuenta_costo || null, cuenta_inventario || null,
       parseInt(costo_unitario) || 0, parseInt(precio_venta) || 0,
       parseFloat(tarifa_iva) || 0, parseFloat(tarifa_retencion) || 0, concepto_retencion || null]
    );
    req.flash('success', `Producto/servicio ${codigo} guardado correctamente.`);
    res.redirect('/contabilidad/productos');
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error al guardar: ' + e.message);
    res.redirect('/contabilidad/productos');
  }
});

router.post('/productos/:codigo/toggle', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  try {
    await pool.query(`UPDATE ${s}.productos_servicios SET activo = NOT activo WHERE codigo = $1`, [req.params.codigo]);
    req.flash('success', `Estado de ${req.params.codigo} actualizado.`);
  } catch (e) {
    req.flash('error', 'Error: ' + e.message);
  }
  res.redirect('/contabilidad/productos');
});

// ── GET /contabilidad/balance-terceros ────────────────────────────────────────
// Balance de prueba por tercero: por cada cuenta → por cada tercero →
// saldo anterior + movimiento débito + movimiento crédito + saldo final
router.get('/balance-terceros', requireAuth, async (req, res) => {
  const s = schema(req.user.id);
  const { desde, hasta } = req.query;
  const fechaDesde = desde || '2026-01-01';
  const fechaHasta = hasta || '2026-12-31';

  try {
    // Saldo anterior por cuenta × tercero (movimientos ANTES del período)
    const { rows: saldosAnt } = await pool.query(`
      SELECT
        ad.cuenta_codigo,
        pc.nombre AS cuenta_nombre,
        a.contraparte AS tercero,
        COALESCE(SUM(ad.debito), 0)  AS deb_ant,
        COALESCE(SUM(ad.credito), 0) AS cre_ant
      FROM "${s}".asientos_detalle ad
      JOIN "${s}".asientos a ON a.id = ad.asiento_id
      JOIN "${s}".plan_cuentas pc ON pc.codigo = ad.cuenta_codigo
      WHERE a.fecha < $1
        AND a.contraparte IS NOT NULL AND a.contraparte <> ''
      GROUP BY ad.cuenta_codigo, pc.nombre, a.contraparte
      ORDER BY ad.cuenta_codigo, a.contraparte
    `, [fechaDesde]);

    // Movimientos del período por cuenta × tercero
    const { rows: movs } = await pool.query(`
      SELECT
        ad.cuenta_codigo,
        pc.nombre AS cuenta_nombre,
        a.contraparte AS tercero,
        COALESCE(SUM(ad.debito), 0)  AS deb_per,
        COALESCE(SUM(ad.credito), 0) AS cre_per
      FROM "${s}".asientos_detalle ad
      JOIN "${s}".asientos a ON a.id = ad.asiento_id
      JOIN "${s}".plan_cuentas pc ON pc.codigo = ad.cuenta_codigo
      WHERE a.fecha BETWEEN $1 AND $2
        AND a.contraparte IS NOT NULL AND a.contraparte <> ''
      GROUP BY ad.cuenta_codigo, pc.nombre, a.contraparte
      ORDER BY ad.cuenta_codigo, a.contraparte
    `, [fechaDesde, fechaHasta]);

    // Combinar: unir por cuenta+tercero
    const mapa = {}; // clave = cuenta_codigo|tercero

    const key = (cuenta, tercero) => `${cuenta}||${tercero}`;

    for (const r of saldosAnt) {
      const k = key(r.cuenta_codigo, r.tercero);
      if (!mapa[k]) mapa[k] = {
        cuenta_codigo: r.cuenta_codigo, cuenta_nombre: r.cuenta_nombre,
        tercero: r.tercero, deb_ant: 0, cre_ant: 0, deb_per: 0, cre_per: 0
      };
      mapa[k].deb_ant += Number(r.deb_ant);
      mapa[k].cre_ant += Number(r.cre_ant);
    }
    for (const r of movs) {
      const k = key(r.cuenta_codigo, r.tercero);
      if (!mapa[k]) mapa[k] = {
        cuenta_codigo: r.cuenta_codigo, cuenta_nombre: r.cuenta_nombre,
        tercero: r.tercero, deb_ant: 0, cre_ant: 0, deb_per: 0, cre_per: 0
      };
      mapa[k].deb_per += Number(r.deb_per);
      mapa[k].cre_per += Number(r.cre_per);
    }

    // Agrupar por cuenta
    const cuentas = {};
    for (const [k, v] of Object.entries(mapa)) {
      const { cuenta_codigo: cc, cuenta_nombre: cn } = v;
      if (!cuentas[cc]) cuentas[cc] = {
        codigo: cc, nombre: cn, terceros: [],
        tot_deb_ant: 0, tot_cre_ant: 0, tot_deb_per: 0, tot_cre_per: 0
      };
      const saldo_ant = v.deb_ant - v.cre_ant;
      const saldo_fin = saldo_ant + v.deb_per - v.cre_per;
      cuentas[cc].terceros.push({ ...v, saldo_ant, saldo_fin });
      cuentas[cc].tot_deb_ant += v.deb_ant;
      cuentas[cc].tot_cre_ant += v.cre_ant;
      cuentas[cc].tot_deb_per += v.deb_per;
      cuentas[cc].tot_cre_per += v.cre_per;
    }

    // Calcular subtotales por cuenta
    const cuentasArr = Object.values(cuentas)
      .sort((a, b) => a.codigo.localeCompare(b.codigo))
      .map(c => ({
        ...c,
        saldo_ant_tot: c.tot_deb_ant - c.tot_cre_ant,
        saldo_fin_tot: (c.tot_deb_ant - c.tot_cre_ant) + c.tot_deb_per - c.tot_cre_per,
        terceros: c.terceros.sort((a, b) => a.tercero.localeCompare(b.tercero)),
      }));

    // Gran total
    const gran = cuentasArr.reduce((acc, c) => ({
      deb_ant: acc.deb_ant + c.tot_deb_ant,
      cre_ant: acc.cre_ant + c.tot_cre_ant,
      deb_per: acc.deb_per + c.tot_deb_per,
      cre_per: acc.cre_per + c.tot_cre_per,
      saldo_ant: acc.saldo_ant + c.saldo_ant_tot,
      saldo_fin: acc.saldo_fin + c.saldo_fin_tot,
    }), { deb_ant:0, cre_ant:0, deb_per:0, cre_per:0, saldo_ant:0, saldo_fin:0 });

    res.render('contabilidad/balance-terceros', {
      title: 'Balance de Prueba por Tercero — Quipusoft',
      user: req.user,
      cuentas: cuentasArr,
      gran,
      fechaDesde,
      fechaHasta,
      error: req.flash('error'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error: ' + e.message);
    res.redirect('/contabilidad');
  }
});

module.exports = router;
