const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

// Constantes 2025
const SMMLV_2025 = 1423500;
const AUX_TRANSPORTE_2025 = 200000;
const UVT_2025 = 49799;
const TOPE_95UVT = 95 * UVT_2025; // $4.730.905 — base retención por salarios

router.get('/', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const mes = parseInt(req.query.mes) || 1;
  try {
    const empleados = await pool.query(`SELECT * FROM "${schema}".empleados WHERE activo = TRUE ORDER BY numero`);
    const nominaMes = await pool.query(
      `SELECT n.*, e.nombre, e.cargo FROM "${schema}".nomina n
       JOIN "${schema}".empleados e ON n.empleado_id = e.id
       WHERE n.mes = $1 AND n.anno = 2025 ORDER BY e.numero`,
      [mes]
    );

    // Si no hay nómina para este mes, calcularla automáticamente
    let nomina = nominaMes.rows;
    if (!nomina.length) {
      nomina = empleados.rows.map(emp => calcularNomina(emp, mes));
    }

    const totalNomina = nomina.reduce((acc, n) => acc + (n.neto_pagar || 0), 0);
    const totalCostoEmpresa = nomina.reduce((acc, n) => acc + (n.costo_total_empleador || 0), 0);

    res.render('nomina/index', {
      title: `Nómina ${nombreMes(mes)} 2025 — Quipusoft`,
      user: req.user,
      empleados: empleados.rows,
      nomina,
      mes,
      totalNomina,
      totalCostoEmpresa,
      SMMLV_2025,
      UVT_2025,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando nómina.', user: req.user });
  }
});

// Generar documento soporte de nómina electrónica
router.post('/generar-documento/:mes', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const mes = parseInt(req.params.mes);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const empleados = await client.query(`SELECT * FROM "${schema}".empleados WHERE activo = TRUE`);

    for (const emp of empleados.rows) {
      const n = calcularNomina(emp, mes);
      await client.query(`
        INSERT INTO "${schema}".nomina
        (empleado_id, mes, anno, salario_basico, auxilio_transporte, total_devengado,
         descuento_salud, descuento_pension, retencion_fuente, total_deducciones,
         neto_pagar, aporte_salud_empleador, aporte_pension_empleador, aporte_arl,
         costo_total_empleador, documento_soporte_generado)
        VALUES ($1,$2,2025,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,TRUE)
        ON CONFLICT (empleado_id, mes, anno) DO UPDATE SET documento_soporte_generado = TRUE
      `, [emp.id, mes, n.salario_basico, n.auxilio_transporte, n.total_devengado,
          n.descuento_salud, n.descuento_pension, n.retencion_fuente, n.total_deducciones,
          n.neto_pagar, n.aporte_salud_empleador, n.aporte_pension_empleador,
          n.aporte_arl, n.costo_total_empleador]);
    }
    await client.query('COMMIT');
    req.flash && req.flash('success', `Documento soporte de nómina ${nombreMes(mes)} generado.`);
    res.redirect('/nomina?mes=' + mes);
  } catch (err) {
    await client.query('ROLLBACK');
    res.render('error', { mensaje: 'Error generando documento soporte.', user: req.user });
  } finally {
    client.release();
  }
});

function calcularNomina(emp, mes) {
  const salario = emp.salario_basico;
  const aux = salario <= (2 * SMMLV_2025) ? emp.auxilio_transporte : 0;
  const devengado = salario + aux;

  // Descuentos empleado
  const descSalud = Math.round(salario * 0.04);
  const descPension = Math.round(salario * 0.04);
  // Retención por salarios: solo si salario > 95 UVT ($4.730.905)
  const retencion = salario > TOPE_95UVT ? Math.round((salario - TOPE_95UVT) * 0.19) : 0;
  const deducciones = descSalud + descPension + retencion;
  const neto = devengado - deducciones;

  // Aportes empleador (S.A.S. — exonerada Art. 114-1 ET de salud, SENA, ICBF para < 10 SMMLV)
  const aporteSalud = salario < (10 * SMMLV_2025) ? 0 : Math.round(salario * 0.085);
  const aportePension = Math.round(salario * 0.12);
  const aporteArl = Math.round(salario * (emp.porcentaje_arl / 100));
  const costoTotal = devengado + aporteSalud + aportePension + aporteArl;

  return {
    empleado_id: emp.id, nombre: emp.nombre, cargo: emp.cargo,
    mes, salario_basico: salario, auxilio_transporte: aux,
    total_devengado: devengado, descuento_salud: descSalud,
    descuento_pension: descPension, retencion_fuente: retencion,
    total_deducciones: deducciones, neto_pagar: neto,
    aporte_salud_empleador: aporteSalud, aporte_pension_empleador: aportePension,
    aporte_arl: aporteArl, costo_total_empleador: costoTotal,
    documento_soporte_generado: false,
  };
}

function nombreMes(m) {
  return ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
          'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1];
}

module.exports = router;
