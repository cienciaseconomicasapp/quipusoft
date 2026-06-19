const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

const ANNO = 2026;
const schema = (id) => `u${id}`;

// ── Mapeo cuenta → concepto DIAN ────────────────────────────────────────────
// El estudiante asigna el concepto manualmente via la interfaz,
// pero el sistema calcula los valores automáticamente desde asientos_detalle.
// Estos prefijos se usan solo para sugerir el concepto en el formato 1001.
const CONCEPTO_POR_CUENTA = {
  '5110': { codigo: '5002', descripcion: 'Honorarios' },
  '5120': { codigo: '5004', descripcion: 'Arrendamientos' },
  '5135': { codigo: '5003', descripcion: 'Servicios' },
  '1430': { codigo: '5001', descripcion: 'Compras de bienes' },
};

// ── GET /exogena ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, setSchema, async (req, res) => {
  res.render('exogena/index', {
    title: 'Información Exógena — Quipusoft',
    user: req.user,
    anno: ANNO,
  });
});

// ── GET /exogena/1001 — Formato 1001: Pagos y retenciones practicadas ────────
router.get('/1001', requireAuth, setSchema, async (req, res) => {
  const s = schema(req.user.id);
  const { concepto_filter } = req.query;

  try {
    // Obtener todos los terceros (proveedores + otros pagados)
    const { rows: terceros } = await pool.query(
      `SELECT * FROM ${s}.terceros WHERE (es_proveedor = TRUE OR es_empleado = TRUE) AND activo = TRUE ORDER BY codigo`
    );

    // Para cada tercero, calcular pagos y retenciones desde asientos
    // Usamos la contraparte del asiento para vincular con el tercero
    const nombreExpr = `CASE WHEN razon_social <> '' THEN razon_social
      ELSE TRIM(CONCAT(COALESCE(primer_nombre,''),' ',COALESCE(segundo_nombre,''),' ',COALESCE(primer_apellido,''),' ',COALESCE(segundo_apellido,''))) END`;

    const { rows: pagos } = await pool.query(`
      SELECT
        t.codigo,
        t.tipo_documento,
        t.identificacion,
        ${nombreExpr} AS nombre,
        t.direccion,
        t.cod_departamento,
        t.cod_municipio,
        t.pais,
        -- Valores pagados (débitos en cuentas de gasto/costo/inventario)
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '51%' OR ad.cuenta_codigo LIKE '52%'
          OR ad.cuenta_codigo LIKE '14%' THEN ad.debito ELSE 0 END), 0) AS valor_pagado,
        -- Retenciones practicadas (créditos en cuentas 236xxx)
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '236%' THEN ad.credito ELSE 0 END), 0) AS retencion_practicada,
        -- Desglose por tipo de gasto para sugerir concepto
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '5110%' THEN ad.debito ELSE 0 END), 0) AS pago_honorarios,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '5120%' THEN ad.debito ELSE 0 END), 0) AS pago_arrendamiento,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '5135%' THEN ad.debito ELSE 0 END), 0) AS pago_servicios,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '143%' THEN ad.debito ELSE 0 END), 0) AS pago_compras
      FROM ${s}.terceros t
      LEFT JOIN ${s}.asientos a ON a.contraparte = ${nombreExpr}
        AND EXTRACT(YEAR FROM a.fecha) = ${ANNO}
      LEFT JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
      WHERE t.es_proveedor = TRUE OR t.es_empleado = TRUE
      GROUP BY t.codigo, t.tipo_documento, t.identificacion, t.razon_social,
        t.primer_nombre, t.segundo_nombre, t.primer_apellido, t.segundo_apellido,
        t.direccion, t.cod_departamento, t.cod_municipio, t.pais
      HAVING COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '51%' OR ad.cuenta_codigo LIKE '52%'
        OR ad.cuenta_codigo LIKE '14%' THEN ad.debito ELSE 0 END), 0) > 0
        OR COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '236%' THEN ad.credito ELSE 0 END), 0) > 0
      ORDER BY t.codigo
    `);

    // Sugerir concepto DIAN según el mayor valor de gasto
    const pagosConConcepto = pagos.map(p => {
      let concepto_sugerido = '5001';
      let desc_concepto = 'Compras de bienes';
      const max = Math.max(
        Number(p.pago_honorarios), Number(p.pago_arrendamiento),
        Number(p.pago_servicios), Number(p.pago_compras)
      );
      if (max === Number(p.pago_honorarios) && max > 0) { concepto_sugerido = '5002'; desc_concepto = 'Honorarios'; }
      else if (max === Number(p.pago_arrendamiento) && max > 0) { concepto_sugerido = '5004'; desc_concepto = 'Arrendamientos'; }
      else if (max === Number(p.pago_servicios) && max > 0) { concepto_sugerido = '5003'; desc_concepto = 'Servicios'; }
      return { ...p, concepto_sugerido, desc_concepto };
    });

    const totalPagado = pagosConConcepto.reduce((s, p) => s + Number(p.valor_pagado), 0);
    const totalRetencion = pagosConConcepto.reduce((s, p) => s + Number(p.retencion_practicada), 0);

    res.render('exogena/formato1001', {
      title: `Formato 1001 — Pagos y retenciones AG ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      pagos: pagosConConcepto,
      totalPagado,
      totalRetencion,
      error: req.flash('error'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error generando Formato 1001: ' + e.message);
    res.redirect('/exogena');
  }
});

// ── GET /exogena/1007 — Formato 1007: Ingresos recibidos ────────────────────
router.get('/1007', requireAuth, setSchema, async (req, res) => {
  const s = schema(req.user.id);
  const nombreExpr = `CASE WHEN razon_social <> '' THEN razon_social
    ELSE TRIM(CONCAT(COALESCE(primer_nombre,''),' ',COALESCE(segundo_nombre,''),' ',COALESCE(primer_apellido,''),' ',COALESCE(segundo_apellido,''))) END`;

  try {
    const { rows: ingresos } = await pool.query(`
      SELECT
        t.codigo,
        t.tipo_documento,
        t.identificacion,
        ${nombreExpr} AS nombre,
        t.direccion,
        t.cod_departamento,
        t.cod_municipio,
        t.pais,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '4%' THEN ad.credito - ad.debito ELSE 0 END), 0) AS valor_ingreso,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = '13551505' THEN ad.debito ELSE 0 END), 0) AS retencion_sufrida
      FROM ${s}.terceros t
      LEFT JOIN ${s}.asientos a ON a.contraparte = ${nombreExpr}
        AND EXTRACT(YEAR FROM a.fecha) = ${ANNO}
      LEFT JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
      WHERE t.es_cliente = TRUE
      GROUP BY t.codigo, t.tipo_documento, t.identificacion, t.razon_social,
        t.primer_nombre, t.segundo_nombre, t.primer_apellido, t.segundo_apellido,
        t.direccion, t.cod_departamento, t.cod_municipio, t.pais
      HAVING COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '4%' THEN ad.credito - ad.debito ELSE 0 END), 0) > 0
      ORDER BY t.codigo
    `);

    const totalIngresos = ingresos.reduce((s, r) => s + Number(r.valor_ingreso), 0);
    const totalRetencion = ingresos.reduce((s, r) => s + Number(r.retencion_sufrida), 0);

    res.render('exogena/formato1007', {
      title: `Formato 1007 — Ingresos recibidos AG ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      ingresos,
      totalIngresos,
      totalRetencion,
      error: req.flash('error'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error generando Formato 1007: ' + e.message);
    res.redirect('/exogena');
  }
});

// ── GET /exogena/1005-1006 — IVA descontable y generado ─────────────────────
router.get('/iva', requireAuth, setSchema, async (req, res) => {
  const s = schema(req.user.id);

  try {
    const { rows: [r] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = '24080505' THEN ad.credito ELSE 0 END), 0) AS iva_generado,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = '24081005' THEN ad.debito  ELSE 0 END), 0) AS iva_descontable
      FROM "${s}".asientos_detalle ad
      JOIN "${s}".asientos a ON a.id = ad.asiento_id
      WHERE EXTRACT(YEAR FROM a.fecha) = ${ANNO}
    `);

    // Por bimestre
    const bimestres = [];
    for (let b = 1; b <= 6; b++) {
      const mIni = (b-1)*2+1, mFin = b*2;
      const fi = `${ANNO}-${String(mIni).padStart(2,'0')}-01`;
      const ff = `${ANNO}-${String(mFin).padStart(2,'0')}-31`;
      const { rows: [rb] } = await pool.query(`
        SELECT
          COALESCE(SUM(CASE WHEN ad.cuenta_codigo='24080505' THEN ad.credito ELSE 0 END),0) AS gen,
          COALESCE(SUM(CASE WHEN ad.cuenta_codigo='24081005' THEN ad.debito  ELSE 0 END),0) AS desc
        FROM "${s}".asientos_detalle ad
        JOIN "${s}".asientos a ON a.id=ad.asiento_id
        WHERE a.fecha BETWEEN $1 AND $2
      `, [fi, ff]);
      const gen=Number(rb.gen), des=Number(rb.desc);
      bimestres.push({
        bimestre: b, label: ['Ene-Feb','Mar-Abr','May-Jun','Jul-Ago','Sep-Oct','Nov-Dic'][b-1],
        iva_generado: gen, iva_descontable: des,
        saldo: gen - des,
      });
    }

    res.render('exogena/iva', {
      title: `Formatos 1005/1006 — IVA AG ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      ivaGenerado: Number(r.iva_generado),
      ivaDescontable: Number(r.iva_descontable),
      bimestres,
      error: req.flash('error'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error generando formatos IVA: ' + e.message);
    res.redirect('/exogena');
  }
});

// ── GET /exogena/saldos — Formatos 1008 (CxC) y 1009 (CxP) ─────────────────
router.get('/saldos', requireAuth, setSchema, async (req, res) => {
  const s = schema(req.user.id);
  const nombreExpr = `CASE WHEN razon_social <> '' THEN razon_social
    ELSE TRIM(CONCAT(COALESCE(primer_nombre,''),' ',COALESCE(segundo_nombre,''),' ',COALESCE(primer_apellido,''),' ',COALESCE(segundo_apellido,''))) END`;

  try {
    // 1008 — Saldos cartera (cuentas por cobrar al 31-dic)
    const { rows: cartera } = await pool.query(`
      SELECT
        t.codigo, t.tipo_documento, t.identificacion,
        ${nombreExpr} AS nombre,
        t.cod_departamento, t.cod_municipio, t.pais,
        COALESCE(SUM(ad.debito - ad.credito), 0) AS saldo
      FROM ${s}.terceros t
      JOIN ${s}.asientos a ON a.contraparte = ${nombreExpr}
        AND a.fecha <= '${ANNO}-12-31'
      JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
        AND ad.cuenta_codigo = '13050505'
      WHERE t.es_cliente = TRUE
      GROUP BY t.codigo, t.tipo_documento, t.identificacion, t.razon_social,
        t.primer_nombre, t.segundo_nombre, t.primer_apellido, t.segundo_apellido,
        t.cod_departamento, t.cod_municipio, t.pais
      HAVING COALESCE(SUM(ad.debito - ad.credito), 0) > 0
      ORDER BY t.codigo
    `);

    // 1009 — Saldos proveedores (cuentas por pagar al 31-dic)
    const { rows: proveedores } = await pool.query(`
      SELECT
        t.codigo, t.tipo_documento, t.identificacion,
        ${nombreExpr} AS nombre,
        t.cod_departamento, t.cod_municipio, t.pais,
        COALESCE(SUM(ad.credito - ad.debito), 0) AS saldo
      FROM ${s}.terceros t
      JOIN ${s}.asientos a ON a.contraparte = ${nombreExpr}
        AND a.fecha <= '${ANNO}-12-31'
      JOIN ${s}.asientos_detalle ad ON ad.asiento_id = a.id
        AND ad.cuenta_codigo = '22050505'
      WHERE t.es_proveedor = TRUE
      GROUP BY t.codigo, t.tipo_documento, t.identificacion, t.razon_social,
        t.primer_nombre, t.segundo_nombre, t.primer_apellido, t.segundo_apellido,
        t.cod_departamento, t.cod_municipio, t.pais
      HAVING COALESCE(SUM(ad.credito - ad.debito), 0) > 0
      ORDER BY t.codigo
    `);

    res.render('exogena/saldos', {
      title: `Formatos 1008/1009 — Saldos AG ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      cartera,
      proveedores,
      totalCartera: cartera.reduce((s, r) => s + Number(r.saldo), 0),
      totalProveedores: proveedores.reduce((s, r) => s + Number(r.saldo), 0),
      error: req.flash('error'),
    });
  } catch (e) {
    console.error(e);
    req.flash('error', 'Error generando formatos 1008/1009: ' + e.message);
    res.redirect('/exogena');
  }
});

module.exports = router;
