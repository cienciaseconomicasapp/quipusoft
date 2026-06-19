let ExcelJS;
try { ExcelJS = require('exceljs'); } catch(e) {
  console.warn('[excel.js] exceljs no disponible');
}

// ── Estilos compartidos ───────────────────────────────────────────────────────
const AZUL  = '2E75B6';
const GRIS  = 'D9E1F2';
const BLANCO = 'FFFFFF';
const ROJO  = 'C00000';
const VERDE = '375623';

function headerRow(ws, cols) {
  const row = ws.addRow(cols.map(c => c.header));
  row.eachCell(cell => {
    cell.fill   = { type:'pattern', pattern:'solid', fgColor:{ argb: AZUL } };
    cell.font   = { bold:true, color:{ argb: BLANCO }, size:10 };
    cell.border = borde();
    cell.alignment = { vertical:'middle', horizontal:'center', wrapText:true };
  });
  row.height = 28;
  ws.columns = cols.map(c => ({ key: c.key, width: c.width || 18 }));
  return row;
}

function subtotalRow(ws, vals, color = GRIS) {
  const row = ws.addRow(vals);
  row.eachCell(cell => {
    cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: color } };
    cell.font = { bold:true, size:10 };
    cell.border = borde();
    cell.alignment = { horizontal:'right' };
  });
  return row;
}

function dataRow(ws, vals, shade = false) {
  const row = ws.addRow(vals);
  row.eachCell((cell, colN) => {
    if (shade) cell.fill = { type:'pattern', pattern:'solid', fgColor:{ argb: 'F2F7FD' } };
    cell.border = borde();
    cell.font   = { size:9 };
  });
  return row;
}

function borde() {
  const s = { style:'thin', color:{ argb:'BFBFBF' } };
  return { top:s, left:s, bottom:s, right:s };
}

function titleBlock(ws, titulo, subtitulo, cols) {
  ws.mergeCells(1, 1, 1, cols);
  const t = ws.getRow(1).getCell(1);
  t.value = titulo;
  t.font  = { bold:true, size:14, color:{ argb: AZUL } };
  t.alignment = { horizontal:'center' };

  ws.mergeCells(2, 1, 2, cols);
  const s = ws.getRow(2).getCell(1);
  s.value = subtitulo;
  s.font  = { size:10, color:{ argb:'595959' } };
  s.alignment = { horizontal:'center' };

  ws.addRow([]);  // fila vacía
}

function fmt(n) { return typeof n === 'number' ? n : (Number(n) || 0); }

// ── Función principal de respuesta HTTP ──────────────────────────────────────
async function sendExcel(res, filename, buildFn) {
  if (!ExcelJS) {
    res.status(503).send('ExcelJS no disponible — ejecute npm install en el servidor.');
    return;
  }
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Quipusoft'; wb.created = new Date();
  await buildFn(wb);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
}

module.exports = { sendExcel, headerRow, subtotalRow, dataRow, titleBlock, fmt, AZUL, GRIS, BLANCO, ROJO, VERDE };
