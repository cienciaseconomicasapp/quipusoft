const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

const UVT_2026 = 52374;
const ANNO = 2026;
const TARIFA_RENTA = 35; // Art. 240 ET — Ley 2277/2022

// Cuentas clave (auxiliares de 8 dígitos) usadas para los cálculos de declaraciones
const CUENTAS = {
  IVA_GENERADO: '24080505',      // 2408 / 240805 — crédito = IVA cobrado en ventas
  IVA_DESCONTABLE: '24081005',   // 2408 / 240810 — débito = IVA pagado en compras
  RETENCION_COMPRAS: '23654005', // 2365 / 236540 — retención practicada en compras (2.5%)
  RETENCION_HON: '23651505',     // 2365 / 236515 — retención honorarios (11%)
  RETENCION_ARREND: '23652505',  // 2365 / 236525 — retención arrendamientos (3.5%)
  RETENCION_A_FAVOR: '13551505', // 1355 / 135515 — retención que nos practicaron (a favor)
};

router.get('/', requireAuth, setSchema, async (req, res) => {
  res.render('declaraciones/index', {
    title: 'Declaraciones tributarias — Quipusoft',
    user: req.user,
    anno: ANNO,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Formulario 300 — IVA bimestral
// IVA generado    = créditos en 24080505 (ventas gravadas)
// IVA descontable = débitos en 24081005 (compras gravadas)
// ─────────────────────────────────────────────────────────────────────────
router.get('/iva/:bimestre', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const bim = parseInt(req.params.bimestre);
  const mesInicio = (bim - 1) * 2 + 1;
  const mesFin = bim * 2;
  const fechaInicio = `${ANNO}-${String(mesInicio).padStart(2, '0')}-01`;
  // Último día real del mes: día 1 del mes siguiente menos 1 día
  const ultimoDia = new Date(ANNO, mesFin, 0).getDate(); // día 0 del mes+1 = último día del mes
  const fechaFin = `${ANNO}-${String(mesFin).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

  try {
    const { rows: [r] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $1 THEN ad.credito ELSE 0 END), 0) AS iva_generado,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $2 THEN ad.debito  ELSE 0 END), 0) AS iva_descontable
      FROM "${schema}".asientos_detalle ad
      JOIN "${schema}".asientos a ON a.id = ad.asiento_id
      WHERE a.fecha BETWEEN $3 AND $4
        AND ad.cuenta_codigo IN ($1, $2)
    `, [CUENTAS.IVA_GENERADO, CUENTAS.IVA_DESCONTABLE, fechaInicio, fechaFin]);

    const ivaGenerado = parseInt(r.iva_generado) || 0;
    const ivaDescontable = parseInt(r.iva_descontable) || 0;
    const saldo = ivaGenerado - ivaDescontable;

    // Base gravable estimada (a la tarifa general 19%) — informativo
    const baseGenerado = Math.round(ivaGenerado / 0.19);
    const baseDescontable = Math.round(ivaDescontable / 0.19);

    const bimestres = [
      'Enero - Febrero', 'Marzo - Abril', 'Mayo - Junio',
      'Julio - Agosto', 'Septiembre - Octubre', 'Noviembre - Diciembre'
    ];

    res.render('declaraciones/iva', {
      title: `Form. 300 — Bimestre ${bim} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      bimestre: bim,
      bimestreNombre: bimestres[bim - 1],
      baseGenerado,
      baseDescontable,
      ivaGenerado,
      ivaDescontable,
      saldoPagar: saldo > 0 ? saldo : 0,
      saldoFavor: saldo < 0 ? Math.abs(saldo) : 0,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error calculando IVA.', user: req.user });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Formulario 350 — Retención en la fuente mensual
// Retención practicada por compras = créditos en 23654005 (2.5%)
// Base sujeta a retención = retención / tarifa
// ─────────────────────────────────────────────────────────────────────────
router.get('/retencion/:mes', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const mes = parseInt(req.params.mes);
  const fechaInicio = `${ANNO}-${String(mes).padStart(2, '0')}-01`;
  const ultimoDiaMes = new Date(ANNO, mes, 0).getDate();
  const fechaFin = `${ANNO}-${String(mes).padStart(2, '0')}-${String(ultimoDiaMes).padStart(2, '0')}`;
  const TARIFA_COMPRAS = 2.5;

  try {
    const { rows: [r] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $3 THEN ad.credito ELSE 0 END), 0) AS ret_compras,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $4 THEN ad.credito ELSE 0 END), 0) AS ret_hon,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $5 THEN ad.credito ELSE 0 END), 0) AS ret_arrend
      FROM "${schema}".asientos_detalle ad
      JOIN "${schema}".asientos a ON a.id = ad.asiento_id
      WHERE a.fecha BETWEEN $1 AND $2
        AND ad.cuenta_codigo IN ($3, $4, $5)
    `, [fechaInicio, fechaFin, CUENTAS.RETENCION_COMPRAS, CUENTAS.RETENCION_HON, CUENTAS.RETENCION_ARREND]);

    const retCompras = parseInt(r.ret_compras) || 0;
    const retHon = parseInt(r.ret_hon) || 0;
    const retArrend = parseInt(r.ret_arrend) || 0;
    const totalRetencion = retCompras + retHon + retArrend;

    const TARIFA_HON = 11;
    const TARIFA_ARREND = 3.5;

    const conceptos = [];
    if (retCompras > 0) conceptos.push({
      concepto: `Compras generales (declarantes) — tarifa ${TARIFA_COMPRAS}%`,
      base: Math.round(retCompras / (TARIFA_COMPRAS / 100)),
      retencion: retCompras,
    });
    if (retHon > 0) conceptos.push({
      concepto: `Honorarios y comisiones (personas jurídicas) — tarifa ${TARIFA_HON}%`,
      base: Math.round(retHon / (TARIFA_HON / 100)),
      retencion: retHon,
    });
    if (retArrend > 0) conceptos.push({
      concepto: `Arrendamiento de bienes inmuebles (declarantes) — tarifa ${TARIFA_ARREND}%`,
      base: Math.round(retArrend / (TARIFA_ARREND / 100)),
      retencion: retArrend,
    });

    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    res.render('declaraciones/retencion', {
      title: `Form. 350 — ${meses[mes-1]} ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      mes, mesNombre: meses[mes - 1],
      conceptos,
      totalRetencion,
      UVT: UVT_2026,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error calculando retenciones.', user: req.user });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// Formulario 110 — Renta personas jurídicas
// Ingresos = créditos netos en cuentas clase 4 (Ingresos)
// Costos   = débitos netos en cuentas clase 6 (Costo de ventas)
// Gastos   = débitos netos en cuentas clase 5 (Gastos)
// Renta líquida = Ingresos - Costos - Gastos deducibles
// (Sin renta presuntiva — eliminada por la Ley 2155/2021)
// ─────────────────────────────────────────────────────────────────────────
router.get('/renta', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const fechaInicio = `${ANNO}-01-01`;
  const fechaFin = `${ANNO}-12-31`;

  try {
    const { rows: [r] } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '4%' THEN ad.credito - ad.debito ELSE 0 END), 0) AS ingresos,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '6%' THEN ad.debito - ad.credito ELSE 0 END), 0) AS costos,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '5%' THEN ad.debito - ad.credito ELSE 0 END), 0) AS gastos,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = '519595' THEN ad.debito - ad.credito ELSE 0 END), 0) AS gastos_no_deducibles,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo LIKE '516%' THEN ad.debito - ad.credito ELSE 0 END), 0) AS depreciaciones,
        COALESCE(SUM(CASE WHEN ad.cuenta_codigo = $3 THEN ad.debito ELSE 0 END), 0) AS retencion_a_favor
      FROM "${schema}".asientos_detalle ad
      JOIN "${schema}".asientos a ON a.id = ad.asiento_id
      WHERE a.fecha BETWEEN $1 AND $2
    `, [fechaInicio, fechaFin, CUENTAS.RETENCION_A_FAVOR]);

    const ingresos = parseInt(r.ingresos) || 0;
    const costos = parseInt(r.costos) || 0;
    const gastos = parseInt(r.gastos) || 0;
    const gastosNoDeducibles = parseInt(r.gastos_no_deducibles) || 0;
    const depreciaciones = parseInt(r.depreciaciones) || 0;
    const retencionesSufridas = parseInt(r.retencion_a_favor) || 0;

    const gastosDeducibles = gastos - gastosNoDeducibles;
    const rentaLiquida = ingresos - costos - gastosDeducibles;
    const baseGravable = rentaLiquida > 0 ? rentaLiquida : 0;
    const impuesto = Math.round(baseGravable * (TARIFA_RENTA / 100));
    const saldoPagar = impuesto - retencionesSufridas;

    res.render('declaraciones/renta', {
      title: `Form. 110 — Renta AG ${ANNO} — Quipusoft`,
      user: req.user,
      anno: ANNO,
      ingresos, costos, gastos: gastosDeducibles, depreciaciones,
      gastosNoDeducibles, rentaLiquida, baseGravable, impuesto,
      retencionesSufridas,
      saldoPagar: saldoPagar > 0 ? saldoPagar : 0,
      saldoFavor: saldoPagar < 0 ? Math.abs(saldoPagar) : 0,
      tarifaRenta: TARIFA_RENTA,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error calculando renta.', user: req.user });
  }
});

module.exports = router;
