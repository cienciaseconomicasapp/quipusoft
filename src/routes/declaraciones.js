const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

const UVT_2025 = 49799;

router.get('/', requireAuth, setSchema, async (req, res) => {
  res.render('declaraciones/index', {
    title: 'Declaraciones tributarias — Quipusoft',
    user: req.user,
  });
});

// Formulario 300 — IVA bimestral
router.get('/iva/:bimestre', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const bim = parseInt(req.params.bimestre);
  const mesInicio = (bim - 1) * 2 + 1;
  const mesFin = bim * 2;
  try {
    const result = await pool.query(`
      SELECT
        SUM(CASE WHEN (tipo LIKE 'Factura venta%' OR tipo='Nota débito') AND iva > 0 THEN iva ELSE 0 END) AS iva_generado,
        SUM(CASE WHEN tipo='Nota crédito' AND iva < 0 THEN ABS(iva) ELSE 0 END) AS iva_devoluciones,
        SUM(CASE WHEN (tipo LIKE 'Factura compra%' OR tipo='Activo fijo') AND iva > 0 THEN iva ELSE 0 END) AS iva_descontable
      FROM "${schema}".transacciones
      WHERE anno = 2025 AND mes BETWEEN $1 AND $2
        AND estado = 'vigente'
        AND tipo NOT IN ('Resumen mes','Nómina electrónica','Gasto sin soporte')
    `, [mesInicio, mesFin]);

    const d = result.rows[0];
    const ivaGeneradoNeto = (d.iva_generado || 0) - (d.iva_devoluciones || 0);
    const saldo = ivaGeneradoNeto - (d.iva_descontable || 0);

    const bimestres = [
      'Enero - Febrero', 'Marzo - Abril', 'Mayo - Junio',
      'Julio - Agosto', 'Septiembre - Octubre', 'Noviembre - Diciembre'
    ];

    res.render('declaraciones/iva', {
      title: `Form. 300 — Bimestre ${bim} — Quipusoft`,
      user: req.user,
      bimestre: bim,
      bimestreNombre: bimestres[bim - 1],
      ivaGenerado: d.iva_generado || 0,
      ivaDevoluciones: d.iva_devoluciones || 0,
      ivaGeneradoNeto,
      ivaDescontable: d.iva_descontable || 0,
      saldoPagar: saldo > 0 ? saldo : 0,
      saldoFavor: saldo < 0 ? Math.abs(saldo) : 0,
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error calculando IVA.', user: req.user });
  }
});

// Formulario 350 — Retención en la fuente mensual
router.get('/retencion/:mes', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const mes = parseInt(req.params.mes);
  try {
    const result = await pool.query(`
      SELECT
        concepto_agrupado,
        SUM(ABS(retencion)) AS total_retencion,
        SUM(subtotal) AS base_total
      FROM (
        SELECT
          CASE
            WHEN concepto ILIKE '%honorario%' THEN 'Honorarios (11%)'
            WHEN concepto ILIKE '%arrend%' THEN 'Arrendamientos (3.5%)'
            WHEN concepto ILIKE '%servicio%' OR concepto ILIKE '%aseo%' OR concepto ILIKE '%publicidad%' THEN 'Servicios (4%/2%)'
            ELSE 'Compras (3.5%)'
          END AS concepto_agrupado,
          retencion, subtotal
        FROM "${schema}".transacciones
        WHERE anno = 2025 AND mes = $1
          AND tipo LIKE 'Factura compra%'
          AND retencion < 0
      ) t
      GROUP BY concepto_agrupado
      ORDER BY concepto_agrupado
    `, [mes]);

    const totalRetencion = result.rows.reduce((a, r) => a + parseInt(r.total_retencion), 0);
    const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
                   'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    res.render('declaraciones/retencion', {
      title: `Form. 350 — ${meses[mes-1]} 2025 — Quipusoft`,
      user: req.user,
      mes, mesNombre: meses[mes - 1],
      conceptos: result.rows,
      totalRetencion,
      UVT_2025,
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error calculando retenciones.', user: req.user });
  }
});

// Formulario 110 — Renta persona jurídica
router.get('/renta', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const result = await pool.query(`
      SELECT
        SUM(CASE WHEN tipo LIKE 'Factura venta%' AND estado='vigente' THEN subtotal ELSE 0 END) AS ingresos_brutos,
        SUM(CASE WHEN tipo='Nota crédito' THEN ABS(subtotal) ELSE 0 END) AS devoluciones,
        SUM(CASE WHEN tipo LIKE 'Factura compra%' AND estado='vigente' THEN subtotal ELSE 0 END) AS compras,
        SUM(CASE WHEN tipo='Gasto sin soporte' THEN subtotal ELSE 0 END) AS gastos_no_deducibles
      FROM "${schema}".transacciones WHERE anno=2025
    `);

    const nominaAnual = await pool.query(`
      SELECT SUM(costo_total_empleador) AS total_nomina
      FROM "${schema}".nomina WHERE anno=2025
    `);

    const activos = await pool.query(`
      SELECT SUM(depreciacion_acumulada) AS depreciacion_total
      FROM "${schema}".activos_fijos
    `);

    const d = result.rows[0];
    const ingresosNetos = (d.ingresos_brutos || 0) - (d.devoluciones || 0);
    const costos = d.compras || 0;
    const gastoNomina = nominaAnual.rows[0].total_nomina || 0;
    const depreciacion = activos.rows[0].depreciacion_total || 0;
    const gastosNoDeducibles = d.gastos_no_deducibles || 0;
    const rentaLiquida = ingresosNetos - costos - gastoNomina - depreciacion;
    const rentaPresuntiva = Math.round(1250000000 * 0.035);
    const baseGravable = Math.max(rentaLiquida, rentaPresuntiva);
    const impuesto = Math.round(baseGravable * 0.35);
    const anticipo = 18000000;
    const retencionesSufridas = 4100000;
    const saldoPagar = impuesto - anticipo - retencionesSufridas;

    res.render('declaraciones/renta', {
      title: 'Form. 110 — Renta AG 2025 — Quipusoft',
      user: req.user,
      ingresosNetos, costos, gastoNomina, depreciacion,
      gastosNoDeducibles, rentaLiquida, rentaPresuntiva,
      baseGravable, impuesto, anticipo, retencionesSufridas,
      saldoPagar: saldoPagar > 0 ? saldoPagar : 0,
      saldoFavor: saldoPagar < 0 ? Math.abs(saldoPagar) : 0,
      tarifaRenta: 35,
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error calculando renta.', user: req.user });
  }
});

module.exports = router;
