const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, setSchema } = require('../middleware/auth');

// Listar todas las transacciones con filtros
router.get('/', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { mes, tipo, estado } = req.query;
  try {
    let query = `SELECT * FROM "${schema}".transacciones WHERE anno = 2025`;
    const params = [];
    let i = 1;
    if (mes) { query += ` AND mes = $${i++}`; params.push(mes); }
    if (tipo) { query += ` AND tipo ILIKE $${i++}`; params.push(`%${tipo}%`); }
    if (estado) { query += ` AND estado = $${i++}`; params.push(estado); }
    query += ' ORDER BY fecha ASC';

    const result = await pool.query(query, params);

    // Resumen IVA por bimestre
    const ivaQuery = await pool.query(`
      SELECT
        CEIL(mes/2.0) AS bimestre,
        SUM(CASE WHEN tipo LIKE 'Factura venta%' OR tipo = 'Nota débito' THEN iva ELSE 0 END) AS iva_generado,
        SUM(CASE WHEN tipo LIKE 'Factura compra%' OR tipo = 'Activo fijo' THEN ABS(iva) ELSE 0 END) AS iva_descontable
      FROM "${schema}".transacciones
      WHERE anno = 2025 AND tipo NOT IN ('Resumen mes','Nómina electrónica')
      GROUP BY CEIL(mes/2.0)
      ORDER BY bimestre
    `, []);

    res.render('transacciones/index', {
      title: 'Libro de transacciones — Quipusoft',
      user: req.user,
      transacciones: result.rows,
      ivaResumen: ivaQuery.rows,
      filtros: { mes, tipo, estado },
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando transacciones.', user: req.user });
  }
});

// Detalle de una transacción
router.get('/:id', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const result = await pool.query(`SELECT * FROM "${schema}".transacciones WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) return res.redirect('/transacciones');
    res.render('facturas/detalle', {
      title: 'Detalle transacción — Quipusoft',
      user: req.user,
      transaccion: result.rows[0],
    });
  } catch (err) {
    res.render('error', { mensaje: 'Error.', user: req.user });
  }
});

// Nueva transacción
// Fuentes disponibles para el asiento manual y su prefijo de numeración
const FUENTES_ASIENTO = {
  CE: { nombre: 'CE - Comprobante de egreso', tipo_comprobante: 'Comprobante de egreso' },
  CR: { nombre: 'CR - Comprobante de recibo', tipo_comprobante: 'Comprobante de recibo' },
  NC: { nombre: 'NC - Nota de contabilidad', tipo_comprobante: 'Nota de contabilidad' },
  CA: { nombre: 'CA - Causación', tipo_comprobante: 'Causación' },
  RC: { nombre: 'RC - Recibo de caja', tipo_comprobante: 'Recibo de caja' },
};

router.get('/nueva/form', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const nombreExpr = `CASE WHEN razon_social <> '' THEN razon_social
    ELSE TRIM(CONCAT(primer_nombre, ' ', segundo_nombre, ' ', primer_apellido, ' ', segundo_apellido)) END`;

  const [clientesQ, proveedoresQ, cuentas, productos] = await Promise.all([
    pool.query(`SELECT *, ${nombreExpr} AS nombre FROM "${schema}".terceros WHERE activo = TRUE AND es_cliente = TRUE ORDER BY nombre`),
    pool.query(`SELECT *, ${nombreExpr} AS nombre FROM "${schema}".terceros WHERE activo = TRUE AND es_proveedor = TRUE ORDER BY nombre`),
    pool.query(`SELECT codigo, nombre, naturaleza FROM "${schema}".plan_cuentas WHERE activa = TRUE ORDER BY codigo`),
    pool.query(`SELECT * FROM "${schema}".productos_servicios WHERE activo = TRUE ORDER BY codigo`),
  ]);
  const clientes = { rows: clientesQ.rows.map(c => ({ ...c, razon_social: c.nombre })) };
  const proveedores = { rows: proveedoresQ.rows.map(p => ({ ...p, razon_social: p.nombre })) };

  // Listado combinado de terceros (clientes + proveedores) para el campo "Tercero"
  const terceros = [
    ...clientes.rows.map(c => ({ codigo: c.codigo, nombre: c.razon_social, tipo: 'Cliente' })),
    ...proveedores.rows.map(p => ({ codigo: p.codigo, nombre: p.razon_social, tipo: 'Proveedor' })),
  ];

  res.render('facturas/nueva', {
    title: 'Nueva transacción — Quipusoft',
    user: req.user,
    clientes: clientes.rows,
    proveedores: proveedores.rows,
    cuentas: cuentas.rows,
    productos: productos.rows,
    terceros,
    fuentesAsiento: FUENTES_ASIENTO,
    error: req.flash('error'),
  });
});

router.post('/nueva', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, tipo_iva, fuente } = req.body;
  const total = parseInt(subtotal) + parseInt(iva) - parseInt(retencion || 0);
  const mes = new Date(fecha).getMonth() + 1;

  // Líneas de ítems (catálogo de productos/servicios)
  const productosCodigo = [].concat(req.body['lineas_producto[]'] || []);
  const cantidades      = [].concat(req.body['lineas_cantidad[]'] || []);
  const valores         = [].concat(req.body['lineas_valor[]'] || []);
  const descuentosPct   = [].concat(req.body['lineas_descuento_pct[]'] || []);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      INSERT INTO "${schema}".transacciones
      (documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, total, mes, anno, tipo_iva)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,2025,$11)
    `, [documento, fecha, tipo, contraparte_nombre, concepto, subtotal, iva, retencion, total, mes, tipo_iva]);

    // ── Generación automática del asiento contable para Facturación electrónica de VENTA ──
    if (fuente === 'FE-FV') {
      // Construir líneas de ingreso/IVA/retención/costo a partir del catálogo
      const lineasIngreso = []; // { cuenta, descripcion, valor }
      const lineasIva = [];
      const lineasCosto = []; // { cuentaCosto, cuentaInventario, descripcion, valor }
      let totalRetencionCalc = 0;

      for (let i = 0; i < productosCodigo.length; i++) {
        const codigo = (productosCodigo[i] || '').trim();
        if (!codigo) continue;
        const cantidad = parseFloat(cantidades[i]) || 0;
        const valorUnit = parseFloat(valores[i]) || 0;
        const descPct = parseFloat(descuentosPct[i]) || 0;
        if (cantidad <= 0 || valorUnit <= 0) continue;

        const { rows: [prod] } = await client.query(
          `SELECT * FROM "${schema}".productos_servicios WHERE codigo = $1`, [codigo]
        );
        if (!prod) {
          throw new Error(`El producto/servicio "${codigo}" no existe en el catálogo.`);
        }

        const bruto = cantidad * valorUnit;
        const descuento = bruto * (descPct / 100);
        const subtotalLinea = Math.round(bruto - descuento);
        const ivaLinea = Math.round(subtotalLinea * (Number(prod.tarifa_iva) / 100));
        const retLinea = Math.round(subtotalLinea * (Number(prod.tarifa_retencion) / 100));
        totalRetencionCalc += retLinea;

        lineasIngreso.push({
          cuenta: prod.cuenta_ingreso,
          descripcion: `${documento} — ${prod.nombre} x${cantidad}`,
          valor: subtotalLinea,
        });
        if (ivaLinea > 0) {
          lineasIva.push({
            cuenta: '24080505',
            descripcion: `IVA generado ${prod.tarifa_iva}% — ${prod.nombre}`,
            valor: ivaLinea,
          });
        }
        if (prod.tipo === 'producto' && prod.cuenta_costo && prod.cuenta_inventario) {
          const costoLinea = Math.round(Number(prod.costo_unitario) * cantidad);
          if (costoLinea > 0) {
            lineasCosto.push({
              cuentaCosto: prod.cuenta_costo,
              cuentaInventario: prod.cuenta_inventario,
              descripcion: `Costo de venta — ${prod.nombre} x${cantidad}`,
              valor: costoLinea,
            });
          }
        }
      }

      if (lineasIngreso.length === 0) {
        throw new Error('Debes seleccionar al menos un producto o servicio del catálogo en la factura.');
      }

      const totalIngreso = lineasIngreso.reduce((a, l) => a + l.valor, 0);
      const totalIvaCalc = lineasIva.reduce((a, l) => a + l.valor, 0);
      const totalCartera = totalIngreso + totalIvaCalc - totalRetencionCalc;

      // Construir detalle del asiento
      const detalle = [];
      detalle.push({ cuenta: '13050505', descripcion: `Cartera ${documento} — ${contraparte_nombre}`, debito: totalCartera, credito: 0 });
      if (totalRetencionCalc > 0) {
        detalle.push({ cuenta: '13551505', descripcion: `Retención en la fuente a favor — ${documento}`, debito: totalRetencionCalc, credito: 0 });
      }
      for (const l of lineasIngreso) {
        detalle.push({ cuenta: l.cuenta, descripcion: l.descripcion, debito: 0, credito: l.valor });
      }
      for (const l of lineasIva) {
        detalle.push({ cuenta: l.cuenta, descripcion: l.descripcion, debito: 0, credito: l.valor });
      }
      for (const l of lineasCosto) {
        detalle.push({ cuenta: l.cuentaCosto, descripcion: l.descripcion, debito: l.valor, credito: 0 });
        detalle.push({ cuenta: l.cuentaInventario, descripcion: l.descripcion, debito: 0, credito: l.valor });
      }

      // Verificar partida doble
      const totD = detalle.reduce((a, d) => a + d.debito, 0);
      const totC = detalle.reduce((a, d) => a + d.credito, 0);
      if (Math.abs(totD - totC) > 1) {
        throw new Error(`El asiento generado no cuadra (Débitos: ${totD.toLocaleString('es-CO')}, Créditos: ${totC.toLocaleString('es-CO')}).`);
      }

      // Verificar que todas las cuentas existan
      const codigosUnicos = [...new Set(detalle.map(d => d.cuenta))];
      const { rows: cuentasValidas } = await client.query(
        `SELECT codigo FROM "${schema}".plan_cuentas WHERE codigo = ANY($1)`, [codigosUnicos]
      );
      const codigosValidos = new Set(cuentasValidas.map(c => c.codigo));
      const faltantes = codigosUnicos.filter(c => !codigosValidos.has(c));
      if (faltantes.length > 0) {
        throw new Error(`Las siguientes cuentas no existen en el plan de cuentas: ${faltantes.join(', ')}.`);
      }

      const { rows: [asiento] } = await client.query(
        `INSERT INTO "${schema}".asientos
          (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte, contraparte, estado)
         VALUES ($1,$2,'Factura de venta',$3,$4,$5,'aprobado')
         RETURNING id`,
        [fecha, documento, concepto || `Factura de venta ${documento}`, documento, contraparte_nombre]
      );

      for (const d of detalle) {
        await client.query(
          `INSERT INTO "${schema}".asientos_detalle (asiento_id, cuenta_codigo, descripcion, debito, credito)
           VALUES ($1,$2,$3,$4,$5)`,
          [asiento.id, d.cuenta, d.descripcion, d.debito, d.credito]
        );
      }
    }

    // ── Generación automática del asiento contable para Facturación electrónica de COMPRA ──
    if (fuente === 'FE-FC') {
      // Las compras solo aplican a PRODUCTOS del catálogo (reponen inventario al costo_unitario)
      const lineasInventario = []; // { cuenta, descripcion, valor }
      let totalSubtotal = 0;
      let totalIvaCalc = 0;
      let totalRetencionCalc = 0;

      for (let i = 0; i < productosCodigo.length; i++) {
        const codigo = (productosCodigo[i] || '').trim();
        if (!codigo) continue;
        const cantidad = parseFloat(cantidades[i]) || 0;
        if (cantidad <= 0) continue;

        const { rows: [prod] } = await client.query(
          `SELECT * FROM "${schema}".productos_servicios WHERE codigo = $1`, [codigo]
        );
        if (!prod) {
          throw new Error(`El producto "${codigo}" no existe en el catálogo.`);
        }
        if (prod.tipo !== 'producto' || !prod.cuenta_inventario) {
          throw new Error(`"${prod.nombre}" no es un producto con inventario; las facturas de compra solo admiten productos del catálogo.`);
        }

        const subtotalLinea = Math.round(Number(prod.costo_unitario) * cantidad);
        const ivaLinea = Math.round(subtotalLinea * (Number(prod.tarifa_iva) / 100));
        const retLinea = Math.round(subtotalLinea * (Number(prod.tarifa_retencion) / 100));

        lineasInventario.push({
          cuenta: prod.cuenta_inventario,
          descripcion: `${documento} — Compra ${prod.nombre} x${cantidad}`,
          valor: subtotalLinea,
        });
        totalSubtotal += subtotalLinea;
        totalIvaCalc += ivaLinea;
        totalRetencionCalc += retLinea;
      }

      if (lineasInventario.length === 0) {
        throw new Error('Debes seleccionar al menos un producto del catálogo en la factura de compra.');
      }

      const totalProveedor = totalSubtotal + totalIvaCalc - totalRetencionCalc;

      const detalleFC = [];
      for (const l of lineasInventario) {
        detalleFC.push({ cuenta: l.cuenta, descripcion: l.descripcion, debito: l.valor, credito: 0 });
      }
      if (totalIvaCalc > 0) {
        detalleFC.push({ cuenta: '24081005', descripcion: `IVA descontable 19% — ${documento}`, debito: totalIvaCalc, credito: 0 });
      }
      if (totalRetencionCalc > 0) {
        detalleFC.push({ cuenta: '23654005', descripcion: `Retención en la fuente por compras — ${documento}`, debito: 0, credito: totalRetencionCalc });
      }
      detalleFC.push({ cuenta: '22050505', descripcion: `Proveedores — ${documento} — ${contraparte_nombre}`, debito: 0, credito: totalProveedor });

      // Verificar partida doble
      const totD = detalleFC.reduce((a, d) => a + d.debito, 0);
      const totC = detalleFC.reduce((a, d) => a + d.credito, 0);
      if (Math.abs(totD - totC) > 1) {
        throw new Error(`El asiento generado no cuadra (Débitos: ${totD.toLocaleString('es-CO')}, Créditos: ${totC.toLocaleString('es-CO')}).`);
      }

      // Verificar que todas las cuentas existan
      const codigosUnicosFC = [...new Set(detalleFC.map(d => d.cuenta))];
      const { rows: cuentasValidasFC } = await client.query(
        `SELECT codigo FROM "${schema}".plan_cuentas WHERE codigo = ANY($1)`, [codigosUnicosFC]
      );
      const codigosValidosFC = new Set(cuentasValidasFC.map(c => c.codigo));
      const faltantesFC = codigosUnicosFC.filter(c => !codigosValidosFC.has(c));
      if (faltantesFC.length > 0) {
        throw new Error(`Las siguientes cuentas no existen en el plan de cuentas: ${faltantesFC.join(', ')}.`);
      }

      const { rows: [asientoFC] } = await client.query(
        `INSERT INTO "${schema}".asientos
          (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte, contraparte, estado)
         VALUES ($1,$2,'Factura de compra',$3,$4,$5,'aprobado')
         RETURNING id`,
        [fecha, documento, concepto || `Factura de compra ${documento}`, documento, contraparte_nombre]
      );

      for (const d of detalleFC) {
        await client.query(
          `INSERT INTO "${schema}".asientos_detalle (asiento_id, cuenta_codigo, descripcion, debito, credito)
           VALUES ($1,$2,$3,$4,$5)`,
          [asientoFC.id, d.cuenta, d.descripcion, d.debito, d.credito]
        );
      }
    }

    await client.query('COMMIT');
    if (fuente === 'FE-FV') {
      req.flash('success', `Factura ${documento} guardada y contabilizada automáticamente.`);
      return res.redirect('/contabilidad/libro-diario');
    }
    if (fuente === 'FE-FC') {
      req.flash('success', `Factura de compra ${documento} guardada y contabilizada automáticamente.`);
      return res.redirect('/contabilidad/libro-diario');
    }
    res.redirect('/transacciones');
  } catch (err) {
    await client.query('ROLLBACK');
    req.flash('error', 'Error al guardar la transacción: ' + err.message);
    res.redirect('/transacciones/nueva/form');
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// ASIENTO MANUAL (Comprobante de egreso / recibo / Nota de contabilidad)
// Usa las tablas de doble partida: asientos / asientos_detalle
// ─────────────────────────────────────────────────────────────────────────

// Devuelve el siguiente número de comprobante para una fuente dada, ej. NC-014-25
async function siguienteNumeroComprobante(schema, fuente) {
  const { rows } = await pool.query(
    `SELECT numero_comprobante FROM "${schema}".asientos
     WHERE numero_comprobante LIKE $1
     ORDER BY id DESC LIMIT 1`,
    [`${fuente}-%-25`]
  );
  let siguiente = 1;
  if (rows.length) {
    const m = rows[0].numero_comprobante.match(/-(\d+)-25$/);
    if (m) siguiente = parseInt(m[1], 10) + 1;
  }
  return `${fuente}-${String(siguiente).padStart(3, '0')}-25`;
}

// API: obtener el siguiente número de comprobante para una fuente (usado por el frontend)
router.get('/nuevo-asiento/siguiente-numero', requireAuth, setSchema, async (req, res) => {
  const fuente = (req.query.fuente || '').toUpperCase();
  if (!FUENTES_ASIENTO[fuente]) return res.status(400).json({ error: 'Fuente inválida' });
  try {
    const numero = await siguienteNumeroComprobante(req.schema, fuente);
    res.json({ numero });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/nuevo-asiento', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { fecha, fuente, concepto_general, observaciones } = req.body;

  // Las líneas llegan como arrays paralelos: lineas_cuenta[], lineas_centro[], lineas_tercero[],
  // lineas_detalle[], lineas_debito[], lineas_credito[], lineas_ref1[]
  const cuentas   = [].concat(req.body['lineas_cuenta[]']   || []);
  const detalles  = [].concat(req.body['lineas_detalle[]']  || []);
  const debitos   = [].concat(req.body['lineas_debito[]']   || []);
  const creditos  = [].concat(req.body['lineas_credito[]']  || []);
  const terceros  = [].concat(req.body['lineas_tercero[]']  || []);
  const centros   = [].concat(req.body['lineas_centro[]']   || []);
  const refs1     = [].concat(req.body['lineas_ref1[]']     || []);

  const fuenteUp = (fuente || '').toUpperCase();

  if (!FUENTES_ASIENTO[fuenteUp]) {
    req.flash('error', 'Debes seleccionar una fuente válida (CE, CR o NC).');
    return res.redirect('/transacciones/nueva/form');
  }
  if (!fecha) {
    req.flash('error', 'La fecha es obligatoria.');
    return res.redirect('/transacciones/nueva/form');
  }

  // Construir líneas válidas (con cuenta y al menos un valor en débito/crédito)
  const lineas = [];
  let totalDebito = 0, totalCredito = 0;
  for (let i = 0; i < cuentas.length; i++) {
    const cuentaCodigo = (cuentas[i] || '').split(' ')[0].trim(); // permite "130505 - CLIENTES..."
    const debito = Math.round(parseFloat(debitos[i]) || 0);
    const credito = Math.round(parseFloat(creditos[i]) || 0);
    if (!cuentaCodigo && debito === 0 && credito === 0) continue; // fila vacía, ignorar

    if (!cuentaCodigo) {
      req.flash('error', `La línea ${i + 1} tiene un valor pero no tiene cuenta asignada.`);
      return res.redirect('/transacciones/nueva/form');
    }

    lineas.push({
      cuenta_codigo: cuentaCodigo,
      descripcion: detalles[i] || '',
      tercero: terceros[i] || '',
      centro: centros[i] || '',
      ref1: refs1[i] || '',
      debito,
      credito,
    });
    totalDebito += debito;
    totalCredito += credito;
  }

  if (lineas.length === 0) {
    req.flash('error', 'Debes agregar al menos una línea con cuenta y valor.');
    return res.redirect('/transacciones/nueva/form');
  }

  // ── Validación de partida doble: Débitos = Créditos ──
  if (Math.abs(totalDebito - totalCredito) > 0.01) {
    req.flash('error',
      `El asiento no cuadra: Débitos = $${totalDebito.toLocaleString('es-CO')} y Créditos = $${totalCredito.toLocaleString('es-CO')}. ` +
      `Ajusta las líneas para que la suma de débitos sea igual a la suma de créditos antes de guardar.`
    );
    return res.redirect('/transacciones/nueva/form');
  }

  // Verificar que todas las cuentas existan en el plan de cuentas
  const codigosUnicos = [...new Set(lineas.map(l => l.cuenta_codigo))];
  const { rows: cuentasValidas } = await pool.query(
    `SELECT codigo FROM "${schema}".plan_cuentas WHERE codigo = ANY($1)`,
    [codigosUnicos]
  );
  const codigosValidos = new Set(cuentasValidas.map(c => c.codigo));
  const codigosInvalidos = codigosUnicos.filter(c => !codigosValidos.has(c));
  if (codigosInvalidos.length > 0) {
    req.flash('error', `Las siguientes cuentas no existen en el plan de cuentas: ${codigosInvalidos.join(', ')}.`);
    return res.redirect('/transacciones/nueva/form');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const numeroComprobante = await siguienteNumeroComprobante(schema, fuenteUp);
    const contraparteNombre = lineas.find(l => l.tercero)?.tercero || null;

    const { rows: [asiento] } = await client.query(
      `INSERT INTO "${schema}".asientos
        (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte, contraparte, estado)
       VALUES ($1,$2,$3,$4,$5,$6,'aprobado')
       RETURNING id`,
      [fecha, numeroComprobante, FUENTES_ASIENTO[fuenteUp].tipo_comprobante,
       concepto_general || observaciones || `Asiento ${numeroComprobante}`,
       numeroComprobante, contraparteNombre]
    );

    for (const l of lineas) {
      await client.query(
        `INSERT INTO "${schema}".asientos_detalle (asiento_id, cuenta_codigo, descripcion, debito, credito)
         VALUES ($1,$2,$3,$4,$5)`,
        [asiento.id, l.cuenta_codigo, l.descripcion, l.debito, l.credito]
      );
    }

    await client.query('COMMIT');
    req.flash('success', `Asiento ${numeroComprobante} registrado correctamente (Débitos = Créditos = $${totalDebito.toLocaleString('es-CO')}).`);
    res.redirect('/contabilidad/libro-diario');
  } catch (err) {
    await client.query('ROLLBACK');
    req.flash('error', 'Error al guardar el asiento: ' + err.message);
    res.redirect('/transacciones/nueva/form');
  } finally {
    client.release();
  }
});


// Editar transacción
router.get('/:id/editar', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const result = await pool.query(`SELECT * FROM "${schema}".transacciones WHERE id = $1`, [req.params.id]);
  if (!result.rows.length || !result.rows[0].editable) return res.redirect('/transacciones');
  res.render('facturas/editar', {
    title: 'Editar transacción — Quipusoft',
    user: req.user,
    transaccion: result.rows[0],
    error: req.flash('error'),
  });
});

router.post('/:id/editar', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { concepto, subtotal, iva, retencion, tipo_iva } = req.body;
  const total = parseInt(subtotal) + parseInt(iva) + parseInt(retencion);
  try {
    await pool.query(`
      UPDATE "${schema}".transacciones
      SET concepto=$1, subtotal=$2, iva=$3, retencion=$4, total=$5, tipo_iva=$6
      WHERE id=$7
    `, [concepto, subtotal, iva, retencion, total, tipo_iva, req.params.id]);
    res.redirect('/transacciones');
  } catch (err) {
    req.flash('error', 'Error al actualizar: ' + err.message);
    res.redirect(`/transacciones/${req.params.id}/editar`);
  }
});

// Exportar datos para MokanaTax (JSON)
router.get('/exportar/mokanatax', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  try {
    const [transacciones, nomina, empresa, activos] = await Promise.all([
      pool.query(`SELECT * FROM "${schema}".transacciones WHERE anno = 2025 ORDER BY fecha`),
      pool.query(`SELECT * FROM "${schema}".nomina WHERE anno = 2025 ORDER BY mes`),
      pool.query(`SELECT * FROM "${schema}".empresa LIMIT 1`),
      pool.query(`SELECT * FROM "${schema}".activos_fijos`),
    ]);
    res.json({
      exportado_en: new Date().toISOString(),
      usuario_id: req.user.id,
      usuario_nombre: req.user.nombre,
      empresa: empresa.rows[0],
      transacciones: transacciones.rows,
      nomina: nomina.rows,
      activos_fijos: activos.rows,
    });
  } catch (err) {
    res.status(500).json({ error: 'Error exportando datos.' });
  }
});

module.exports = router;

// ── GET /transacciones/:id/ajuste — formulario de ajuste desde transacción ──
router.get('/:id/ajuste', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { rows: [tx] } = await pool.query(
    `SELECT * FROM "${schema}".transacciones WHERE id = $1`, [req.params.id]
  );
  if (!tx || !tx.es_caso_atipico) return res.redirect('/transacciones');

  // Ver si ya tiene ajuste registrado
  const { rows: ajusteExistente } = await pool.query(
    `SELECT * FROM "${schema}".transacciones
     WHERE documento = $1 AND estado = 'ajuste'`,
    ['AJ-' + tx.documento]
  );

  res.render('transacciones/ajuste', {
    title: `Ajuste corrector — ${tx.documento}`,
    user: req.user,
    tx,
    ajusteExistente: ajusteExistente[0] || null,
    error: req.flash('error'),
    success: req.flash('success'),
  });
});

// ── POST /transacciones/:id/ajuste — guardar ajuste ─────────────────────────
router.post('/:id/ajuste', requireAuth, setSchema, async (req, res) => {
  const schema = req.schema;
  const { concepto, justificacion, subtotal, iva, retencion, tipo_iva } = req.body;
  const client = await pool.connect();
  try {
    const { rows: [tx] } = await client.query(
      `SELECT * FROM "${schema}".transacciones WHERE id = $1`, [req.params.id]
    );
    if (!tx) throw new Error('Transacción no encontrada');

    await client.query('BEGIN');

    const sub = parseInt(subtotal) || 0;
    const ivaV = parseInt(iva) || 0;
    const ret = parseInt(retencion) || 0;
    const total = sub + ivaV + ret;
    const fecha = new Date().toISOString().split('T')[0];
    const docAjuste = 'AJ-' + tx.documento;

    await client.query(`
      INSERT INTO "${schema}".transacciones
        (documento, fecha, tipo, contraparte_codigo, contraparte_nombre,
         concepto, subtotal, iva, retencion, total, mes, anno,
         tipo_iva, estado, es_caso_atipico, codigo_caso, notas_pedagogicas, editable)
      VALUES ($1,$2,'Asiento de ajuste',$3,$4,$5,$6,$7,$8,$9,$10,2025,$11,'ajuste',TRUE,$12,$13,FALSE)
      ON CONFLICT DO NOTHING
    `, [docAjuste, fecha, tx.contraparte_codigo, tx.contraparte_nombre,
        concepto, sub, ivaV, ret, total, tx.mes,
        tipo_iva || tx.tipo_iva, tx.codigo_caso,
        `Ajuste corrector de ${tx.documento}: ${justificacion || ''}`]);

    // Marcar la transacción original como corregida
    await client.query(
      `UPDATE "${schema}".transacciones SET estado = 'corregido' WHERE id = $1`,
      [tx.id]
    );

    await client.query('COMMIT');
    req.flash('success', `Ajuste ${docAjuste} registrado correctamente.`);
    res.redirect('/transacciones');
  } catch (e) {
    await client.query('ROLLBACK');
    req.flash('error', 'Error: ' + e.message);
    res.redirect(`/transacciones/${req.params.id}/ajuste`);
  } finally {
    client.release();
  }
});
