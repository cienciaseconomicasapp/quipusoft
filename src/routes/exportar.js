const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

// Carga lazy de exceljs — evita crash si aún no está instalado en producción
let ExcelJS;
try { ExcelJS = require('exceljs'); } catch(e) {
  console.warn('[exportar] exceljs no instalado — ejecute npm install');
}

const { sendExcel, headerRow, subtotalRow, dataRow, titleBlock, fmt } = require('../utils/excel');

const ANNO = 2026;
const s = id => `u${id}`;

// ─── helpers ─────────────────────────────────────────────────────────────────
const fmtCOP = n => {
  const v = fmt(n);
  return v === 0 ? '-' : v;   // Excel formateará con el formato de celda
};

function numFmt(cell) {
  cell.numFmt = '#,##0';
  cell.alignment = { horizontal:'right' };
}

// ─── 1. PLAN DE CUENTAS ──────────────────────────────────────────────────────
router.get('/cuentas', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { rows } = await pool.query(
    `SELECT codigo, nombre, naturaleza, tipo, padre, activa FROM "${schema}".plan_cuentas ORDER BY codigo`
  );
  await sendExcel(res, `plan_cuentas_${ANNO}`, async (wb) => {
    const ws = wb.addWorksheet('Plan de Cuentas');
    titleBlock(ws, 'Plan Único de Cuentas — PUC', `Inversiones Uniatlántico S.A.S. | NIT 900.123.456-7 | AG ${ANNO}`, 6);
    headerRow(ws, [
      { header:'Código',    key:'codigo',     width:12 },
      { header:'Nombre',    key:'nombre',     width:50 },
      { header:'Naturaleza',key:'naturaleza', width:12 },
      { header:'Tipo',      key:'tipo',       width:14 },
      { header:'Padre',     key:'padre',      width:12 },
      { header:'Activa',    key:'activa',     width:10 },
    ]);
    rows.forEach((r, i) => {
      const row = ws.addRow([r.codigo, r.nombre, r.naturaleza, r.tipo, r.padre, r.activa ? 'Sí':'No']);
      row.getCell(1).font = { bold: r.tipo !== 'auxiliar', size:9 };
      if (i % 2 === 1) row.eachCell(c => c.fill = { type:'pattern', pattern:'solid', fgColor:{ argb:'F2F7FD' } });
      row.eachCell(c => { c.border = { top:{style:'thin',color:{argb:'BFBFBF'}}, left:{style:'thin',color:{argb:'BFBFBF'}}, bottom:{style:'thin',color:{argb:'BFBFBF'}}, right:{style:'thin',color:{argb:'BFBFBF'}} }; c.font = {...(c.font||{}), size:9}; });
    });
    ws.autoFilter = { from:'A4', to:'F4' };
  });
});

// ─── 2. TERCEROS ─────────────────────────────────────────────────────────────
router.get('/terceros', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { rows } = await pool.query(
    `SELECT codigo, tipo_documento, identificacion,
      CASE WHEN razon_social <> '' THEN razon_social
        ELSE TRIM(CONCAT(COALESCE(primer_nombre,''),' ',COALESCE(segundo_nombre,''),' ',COALESCE(primer_apellido,''),' ',COALESCE(segundo_apellido,''))) END AS nombre,
      direccion, cod_departamento, cod_municipio, pais,
      es_cliente, es_proveedor, es_accionista, es_empleado, activo
     FROM "${schema}".terceros ORDER BY codigo`
  );
  await sendExcel(res, `terceros_${ANNO}`, async (wb) => {
    const ws = wb.addWorksheet('Terceros');
    titleBlock(ws, 'Catálogo de Terceros', `Inversiones Uniatlántico S.A.S. | NIT 900.123.456-7 | AG ${ANNO}`, 13);
    headerRow(ws, [
      { header:'Código',      key:'codigo',        width:8  },
      { header:'Tipo Doc.',   key:'tipo_documento',width:10 },
      { header:'Identificación',key:'id',          width:16 },
      { header:'Nombre / Razón Social', key:'nombre',width:40},
      { header:'Dirección',   key:'dir',           width:30 },
      { header:'Depto.',      key:'dpto',          width:8  },
      { header:'Municipio',   key:'mpio',          width:10 },
      { header:'País',        key:'pais',          width:6  },
      { header:'Cliente',     key:'cli',           width:9  },
      { header:'Proveedor',   key:'prov',          width:10 },
      { header:'Accionista',  key:'acc',           width:10 },
      { header:'Empleado',    key:'emp',           width:9  },
      { header:'Activo',      key:'act',           width:8  },
    ]);
    rows.forEach((r, i) => {
      const row = ws.addRow([r.codigo,r.tipo_documento,r.identificacion,r.nombre,
        r.direccion,r.cod_departamento,r.cod_municipio,r.pais,
        r.es_cliente?'Sí':'',r.es_proveedor?'Sí':'',r.es_accionista?'Sí':'',r.es_empleado?'Sí':'',r.activo?'Sí':'No']);
      if (i%2===1) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};c.font={size:9};});
    });
    ws.autoFilter = { from:'A4', to:'M4' };
  });
});

// ─── 3. FUENTES (asientos — encabezados) ─────────────────────────────────────
router.get('/fuentes', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { desde, hasta } = req.query;
  const fi = desde || `${ANNO}-01-01`, ff = hasta || `${ANNO}-12-31`;
  const { rows } = await pool.query(
    `SELECT a.id, a.fecha, a.numero_comprobante, a.tipo_comprobante, a.concepto,
       a.documento_soporte, a.contraparte, a.estado,
       t.tipo_documento, t.identificacion,
       SUM(ad.debito) AS total_debito, SUM(ad.credito) AS total_credito
     FROM "${schema}".asientos a
     JOIN "${schema}".asientos_detalle ad ON ad.asiento_id = a.id
     LEFT JOIN "${schema}".terceros t ON
       CASE WHEN COALESCE(t.razon_social,'') <> '' THEN t.razon_social
         ELSE TRIM(CONCAT(COALESCE(t.primer_nombre,''),' ',COALESCE(t.segundo_nombre,''),' ',
           COALESCE(t.primer_apellido,''),' ',COALESCE(t.segundo_apellido,''))) END = a.contraparte
     WHERE a.fecha BETWEEN $1 AND $2
     GROUP BY a.id, a.fecha, a.numero_comprobante, a.tipo_comprobante,
       a.concepto, a.documento_soporte, a.contraparte, a.estado,
       t.tipo_documento, t.identificacion
     ORDER BY a.fecha, a.numero_comprobante`, [fi, ff]
  );
  await sendExcel(res, `fuentes_${fi}_${ff}`, async (wb) => {
    const ws = wb.addWorksheet('Fuentes (Asientos)');
    titleBlock(ws, 'Fuentes — Comprobantes Contables', `Período ${fi} al ${ff} | AG ${ANNO}`, 12);
    headerRow(ws, [
      { header:'ID',           key:'id',       width:8  },
      { header:'Fecha',        key:'fecha',     width:12 },
      { header:'Comprobante',  key:'num',       width:14 },
      { header:'Tipo',         key:'tipo',      width:22 },
      { header:'Concepto',     key:'concepto',  width:45 },
      { header:'Doc. Soporte', key:'doc',       width:14 },
      { header:'Tipo Doc.',    key:'tdoc',      width:10 },
      { header:'Identificación',key:'nit',      width:16 },
      { header:'Tercero',      key:'cp',        width:35 },
      { header:'Estado',       key:'estado',    width:10 },
      { header:'Total Débito', key:'deb',       width:16 },
      { header:'Total Crédito',key:'cred',      width:16 },
    ]);
    rows.forEach((r, i) => {
      const row = ws.addRow([r.id, r.fecha?.toISOString?.().slice(0,10)||r.fecha,
        r.numero_comprobante, r.tipo_comprobante, r.concepto,
        r.documento_soporte||'', r.tipo_documento||'—', r.identificacion||'—',
        r.contraparte||'', r.estado||'',
        fmt(r.total_debito), fmt(r.total_credito)]);
      if (i%2===1) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      numFmt(row.getCell(11)); numFmt(row.getCell(12));
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};c.font={size:9};});
    });
    // Totales
    const totD = rows.reduce((s,r)=>s+fmt(r.total_debito),0);
    const totC = rows.reduce((s,r)=>s+fmt(r.total_credito),0);
    const tr = ws.addRow(['','','','','','','','','','TOTALES', totD, totC]);
    tr.eachCell(c=>{c.font={bold:true,size:10};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'D9E1F2'}};});
    numFmt(tr.getCell(11)); numFmt(tr.getCell(12));
    ws.autoFilter = { from:'A4', to:'L4' };
  });
});

// ─── 4. MOVIMIENTOS (asientos_detalle) ───────────────────────────────────────
router.get('/movimientos', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { desde, hasta } = req.query;
  const fi = desde || `${ANNO}-01-01`, ff = hasta || `${ANNO}-12-31`;
  const { rows } = await pool.query(
    `SELECT a.fecha, a.numero_comprobante, a.tipo_comprobante, a.contraparte,
       t.tipo_documento, t.identificacion,
       ad.cuenta_codigo, pc.nombre AS cuenta_nombre,
       ad.descripcion, ad.debito, ad.credito
     FROM "${schema}".asientos_detalle ad
     JOIN "${schema}".asientos a ON a.id = ad.asiento_id
     LEFT JOIN "${schema}".plan_cuentas pc ON pc.codigo = ad.cuenta_codigo
     LEFT JOIN "${schema}".terceros t ON
       CASE WHEN COALESCE(t.razon_social,'') <> '' THEN t.razon_social
         ELSE TRIM(CONCAT(COALESCE(t.primer_nombre,''),' ',COALESCE(t.segundo_nombre,''),' ',
           COALESCE(t.primer_apellido,''),' ',COALESCE(t.segundo_apellido,''))) END = a.contraparte
     WHERE a.fecha BETWEEN $1 AND $2
     ORDER BY a.fecha, a.numero_comprobante, ad.id`, [fi, ff]
  );
  await sendExcel(res, `movimientos_${fi}_${ff}`, async (wb) => {
    const ws = wb.addWorksheet('Movimientos');
    titleBlock(ws, 'Movimientos Contables (Libro Diario Detallado)', `Período ${fi} al ${ff} | AG ${ANNO}`, 11);
    headerRow(ws, [
      { header:'Fecha',        key:'fecha',  width:12 },
      { header:'Comprobante',  key:'num',    width:14 },
      { header:'Tipo',         key:'tipo',   width:22 },
      { header:'Tipo Doc.',    key:'tdoc',   width:10 },
      { header:'Identificación',key:'nit',   width:16 },
      { header:'Tercero',      key:'cp',     width:35 },
      { header:'Cuenta',       key:'cta',    width:12 },
      { header:'Nombre Cuenta',key:'nom',    width:40 },
      { header:'Descripción',  key:'desc',   width:45 },
      { header:'Débito',       key:'deb',    width:16 },
      { header:'Crédito',      key:'cred',   width:16 },
    ]);
    let prevNum = null, shade = false;
    rows.forEach(r => {
      if (r.numero_comprobante !== prevNum) { shade = !shade; prevNum = r.numero_comprobante; }
      const row = ws.addRow([
        r.fecha?.toISOString?.().slice(0,10)||r.fecha,
        r.numero_comprobante, r.tipo_comprobante,
        r.tipo_documento||'—', r.identificacion||'—',
        r.contraparte||'',
        r.cuenta_codigo, r.cuenta_nombre||'', r.descripcion||'',
        fmt(r.debito), fmt(r.credito)
      ]);
      if (shade) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      numFmt(row.getCell(10)); numFmt(row.getCell(11));
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};c.font={size:9};});
    });
    const totD=rows.reduce((s,r)=>s+fmt(r.debito),0);
    const totC=rows.reduce((s,r)=>s+fmt(r.credito),0);
    const tr = ws.addRow(['','','','','','','','','TOTALES', totD, totC]);
    tr.eachCell(c=>{c.font={bold:true,size:10};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'D9E1F2'}};});
    numFmt(tr.getCell(10)); numFmt(tr.getCell(11));
    ws.autoFilter = { from:'A4', to:'K4' };
  });
});

// ─── 5. BALANCE DE COMPROBACIÓN ──────────────────────────────────────────────
router.get('/balance-comprobacion', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { hasta } = req.query;
  const ff = hasta || `${ANNO}-12-31`;
  const { rows } = await pool.query(`
    SELECT pc.codigo, pc.nombre, pc.tipo,
      COALESCE(SUM(ad.debito),0)  AS total_debito,
      COALESCE(SUM(ad.credito),0) AS total_credito,
      COALESCE(SUM(ad.debito),0) - COALESCE(SUM(ad.credito),0) AS saldo
    FROM "${schema}".plan_cuentas pc
    LEFT JOIN "${schema}".asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
    LEFT JOIN "${schema}".asientos a ON a.id = ad.asiento_id AND a.fecha <= $1
    GROUP BY pc.codigo, pc.nombre, pc.tipo
    HAVING COALESCE(SUM(ad.debito),0)>0 OR COALESCE(SUM(ad.credito),0)>0
    ORDER BY pc.codigo`, [ff]
  );
  await sendExcel(res, `balance_comprobacion_al_${ff}`, async (wb) => {
    const ws = wb.addWorksheet('Balance de Comprobación');
    titleBlock(ws, 'Balance de Comprobación', `Al ${ff} | Inversiones Uniatlántico S.A.S. | NIT 900.123.456-7`, 5);
    headerRow(ws, [
      { header:'Código',      key:'codigo', width:12 },
      { header:'Nombre',      key:'nombre', width:50 },
      { header:'Total Débito',key:'deb',    width:18 },
      { header:'Total Crédito',key:'cred',  width:18 },
      { header:'Saldo (+D / −C)', key:'saldo', width:18 },
    ]);
    rows.forEach((r, i) => {
      const row = ws.addRow([r.codigo, r.nombre, fmt(r.total_debito), fmt(r.total_credito), fmt(r.saldo)]);
      if (i%2===1) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      numFmt(row.getCell(3)); numFmt(row.getCell(4));
      const sc = row.getCell(5); numFmt(sc);
      sc.font = { size:9, bold:true, color:{ argb: fmt(r.saldo)>=0?'1F5C2E':'C00000' } };
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};});
    });
    const totD=rows.reduce((s,r)=>s+fmt(r.total_debito),0);
    const totC=rows.reduce((s,r)=>s+fmt(r.total_credito),0);
    const totS=rows.reduce((s,r)=>s+fmt(r.saldo),0);
    const tr=ws.addRow(['','TOTALES',totD,totC,totS]);
    tr.eachCell(c=>{c.font={bold:true,size:10};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'D9E1F2'}};});
    numFmt(tr.getCell(3)); numFmt(tr.getCell(4)); numFmt(tr.getCell(5));
    ws.autoFilter = { from:'A4', to:'E4' };
  });
});

// ─── 6. LIBRO MAYOR ──────────────────────────────────────────────────────────
router.get('/libro-mayor', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { desde, hasta } = req.query;
  const fi = desde||`${ANNO}-01-01`, ff = hasta||`${ANNO}-12-31`;

  const { rows } = await pool.query(`
    SELECT pc.codigo, pc.nombre,
      COALESCE(SUM(CASE WHEN a.fecha < $1 THEN ad.debito  ELSE 0 END),0) AS deb_ant,
      COALESCE(SUM(CASE WHEN a.fecha < $1 THEN ad.credito ELSE 0 END),0) AS cre_ant,
      COALESCE(SUM(CASE WHEN a.fecha BETWEEN $1 AND $2 THEN ad.debito  ELSE 0 END),0) AS deb_per,
      COALESCE(SUM(CASE WHEN a.fecha BETWEEN $1 AND $2 THEN ad.credito ELSE 0 END),0) AS cre_per
    FROM "${schema}".plan_cuentas pc
    JOIN "${schema}".asientos_detalle ad ON ad.cuenta_codigo = pc.codigo
    JOIN "${schema}".asientos a ON a.id = ad.asiento_id
    WHERE a.fecha <= $2
    GROUP BY pc.codigo, pc.nombre
    ORDER BY pc.codigo`, [fi, ff]
  );

  await sendExcel(res, `libro_mayor_${fi}_${ff}`, async (wb) => {
    const ws = wb.addWorksheet('Libro Mayor');
    titleBlock(ws, 'Libro Mayor', `Período ${fi} al ${ff} | Inversiones Uniatlántico S.A.S.`, 6);
    headerRow(ws, [
      { header:'Código',       key:'codigo',   width:12 },
      { header:'Nombre',       key:'nombre',   width:45 },
      { header:'Saldo Anterior',key:'sant',    width:18 },
      { header:'Mov. Débito',  key:'deb',      width:16 },
      { header:'Mov. Crédito', key:'cred',     width:16 },
      { header:'Saldo Final',  key:'sfin',     width:18 },
    ]);
    rows.forEach((r, i) => {
      const sant = fmt(r.deb_ant)-fmt(r.cre_ant);
      const sfin = sant + fmt(r.deb_per) - fmt(r.cre_per);
      const row = ws.addRow([r.codigo, r.nombre, sant, fmt(r.deb_per), fmt(r.cre_per), sfin]);
      if (i%2===1) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      [3,4,5,6].forEach(n=>numFmt(row.getCell(n)));
      row.getCell(3).font={size:9,color:{argb:sant>=0?'1F5C2E':'C00000'}};
      row.getCell(6).font={bold:true,size:9,color:{argb:sfin>=0?'1F5C2E':'C00000'}};
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};});
    });
    const tots = rows.reduce((a,r)=>{
      const sa=fmt(r.deb_ant)-fmt(r.cre_ant);
      const sf=sa+fmt(r.deb_per)-fmt(r.cre_per);
      return {sant:a.sant+sa, deb:a.deb+fmt(r.deb_per), cred:a.cred+fmt(r.cre_per), sfin:a.sfin+sf};
    },{sant:0,deb:0,cred:0,sfin:0});
    const tr=ws.addRow(['','TOTALES',tots.sant,tots.deb,tots.cred,tots.sfin]);
    tr.eachCell(c=>{c.font={bold:true,size:10};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'D9E1F2'}};});
    [3,4,5,6].forEach(n=>numFmt(tr.getCell(n)));
    ws.autoFilter = { from:'A4', to:'F4' };
  });
});

// ─── 7. BALANCE DE PRUEBA POR TERCERO ────────────────────────────────────────
router.get('/balance-terceros', requireAuth, setSchema, async (req, res) => {
  const schema = s(req.user.id);
  const { desde, hasta } = req.query;
  const fi = desde||`${ANNO}-01-01`, ff = hasta||`${ANNO}-12-31`;

  const nombreExpr = `CASE WHEN COALESCE(t.razon_social,'') <> '' THEN t.razon_social
    ELSE TRIM(CONCAT(COALESCE(t.primer_nombre,''),' ',COALESCE(t.segundo_nombre,''),' ',
      COALESCE(t.primer_apellido,''),' ',COALESCE(t.segundo_apellido,''))) END`;

  const { rows: ant } = await pool.query(`
    SELECT ad.cuenta_codigo, pc.nombre AS cnom, a.contraparte AS tercero,
      t.tipo_documento, t.identificacion,
      COALESCE(SUM(ad.debito),0) AS deb, COALESCE(SUM(ad.credito),0) AS cre
    FROM "${schema}".asientos_detalle ad
    JOIN "${schema}".asientos a ON a.id=ad.asiento_id
    JOIN "${schema}".plan_cuentas pc ON pc.codigo=ad.cuenta_codigo
    LEFT JOIN "${schema}".terceros t ON ${nombreExpr} = a.contraparte
    WHERE a.fecha<$1 AND a.contraparte<>''
    GROUP BY ad.cuenta_codigo,pc.nombre,a.contraparte,t.tipo_documento,t.identificacion
    ORDER BY 1,3`, [fi]);

  const { rows: per } = await pool.query(`
    SELECT ad.cuenta_codigo, pc.nombre AS cnom, a.contraparte AS tercero,
      t.tipo_documento, t.identificacion,
      COALESCE(SUM(ad.debito),0) AS deb, COALESCE(SUM(ad.credito),0) AS cre
    FROM "${schema}".asientos_detalle ad
    JOIN "${schema}".asientos a ON a.id=ad.asiento_id
    JOIN "${schema}".plan_cuentas pc ON pc.codigo=ad.cuenta_codigo
    LEFT JOIN "${schema}".terceros t ON ${nombreExpr} = a.contraparte
    WHERE a.fecha BETWEEN $1 AND $2 AND a.contraparte<>''
    GROUP BY ad.cuenta_codigo,pc.nombre,a.contraparte,t.tipo_documento,t.identificacion
    ORDER BY 1,3`, [fi, ff]);

  const mapa = {};
  const key = (c,t) => `${c}||${t}`;
  for (const r of [...ant,...per]) {
    const k=key(r.cuenta_codigo,r.tercero);
    if(!mapa[k]) mapa[k]={cc:r.cuenta_codigo,cn:r.cnom,tc:r.tercero,
      tdoc:r.tipo_documento||'—',nit:r.identificacion||'—',da:0,ca:0,dp:0,cp:0};
    // Actualizar identificacion si viene en este registro
    if(r.identificacion){ mapa[k].tdoc=r.tipo_documento; mapa[k].nit=r.identificacion; }
  }
  for (const r of ant)  { const k=key(r.cuenta_codigo,r.tercero); mapa[k].da+=fmt(r.deb); mapa[k].ca+=fmt(r.cre); }
  for (const r of per)  { const k=key(r.cuenta_codigo,r.tercero); mapa[k].dp+=fmt(r.deb); mapa[k].cp+=fmt(r.cre); }

  const filas = Object.values(mapa).sort((a,b)=>a.cc.localeCompare(b.cc)||a.tc.localeCompare(b.tc));

  await sendExcel(res, `balance_terceros_${fi}_${ff}`, async (wb) => {
    const ws = wb.addWorksheet('Balance por Tercero');
    titleBlock(ws, 'Balance de Prueba por Tercero', `Período ${fi} al ${ff} | Inversiones Uniatlántico S.A.S.`, 10);
    headerRow(ws, [
      { header:'Cuenta',        key:'cta',  width:12 },
      { header:'Nombre Cuenta', key:'nom',  width:40 },
      { header:'Tipo Doc.',     key:'tdoc', width:10 },
      { header:'Identificación',key:'nit',  width:16 },
      { header:'Tercero',       key:'ter',  width:35 },
      { header:'Saldo Anterior',key:'sant', width:18 },
      { header:'Mov. Débito',   key:'deb',  width:16 },
      { header:'Mov. Crédito',  key:'cred', width:16 },
      { header:'Saldo Final',   key:'sfin', width:18 },
      { header:'Indica',        key:'ind',  width:8  },
    ]);

    let prevCta=null, shade=false, subD=0,subC=0,subDA=0,subCA=0;
    const writeSubtotal = (cta, nom) => {
      const sa=subDA-subCA; const sf=sa+subD-subC;
      const sr=ws.addRow([cta,`SUBTOTAL — ${nom}`,'','','',sa,subD,subC,sf,'']);
      sr.eachCell(c=>{c.font={bold:true,size:9};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'D9E1F2'}};c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};});
      [4,5,6,7].forEach(n=>numFmt(sr.getCell(n)));
      subD=0;subC=0;subDA=0;subCA=0;
    };

    let gtDA=0,gtCA=0,gtD=0,gtC=0;
    filas.forEach((f,i)=>{
      if (f.cc!==prevCta) {
        if (prevCta!==null) writeSubtotal(prevCta, filas.find(x=>x.cc===prevCta)?.cn||'');
        shade=!shade; prevCta=f.cc;
      }
      const sa=f.da-f.ca; const sf=sa+f.dp-f.cp;
      subDA+=f.da;subCA+=f.ca;subD+=f.dp;subC+=f.cp;
      gtDA+=f.da;gtCA+=f.ca;gtD+=f.dp;gtC+=f.cp;
      const row=ws.addRow([f.cc,f.cn,f.tdoc,f.nit,f.tc,sa,f.dp,f.cp,sf,sf>=0?'D':'C']);
      if(shade) row.eachCell(c=>c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'F2F7FD'}});
      [4,5,6,7].forEach(n=>numFmt(row.getCell(n)));
      row.getCell(4).font={size:9,color:{argb:sa>=0?'1F5C2E':'C00000'}};
      row.getCell(7).font={bold:true,size:9,color:{argb:sf>=0?'1F5C2E':'C00000'}};
      row.eachCell(c=>{c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};c.font={...(c.font||{}),size:9};});
    });
    if (prevCta) writeSubtotal(prevCta, filas[filas.length-1]?.cn||'');

    const gsa=gtDA-gtCA; const gsf=gsa+gtD-gtC;
    const tr=ws.addRow(['','GRAN TOTAL','','','',gsa,gtD,gtC,gsf,'']);
    tr.eachCell(c=>{c.font={bold:true,size:11};c.fill={type:'pattern',pattern:'solid',fgColor:{argb:'2E75B6'}};c.font.color={argb:'FFFFFF'};c.border={top:{style:'thin',color:{argb:'BFBFBF'}},left:{style:'thin',color:{argb:'BFBFBF'}},bottom:{style:'thin',color:{argb:'BFBFBF'}},right:{style:'thin',color:{argb:'BFBFBF'}}};});
    [4,5,6,7].forEach(n=>numFmt(tr.getCell(n)));
    ws.autoFilter = { from:'A4', to:'H4' };
  });
});

module.exports = router;
