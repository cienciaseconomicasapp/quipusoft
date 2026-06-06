const pool = require('./database');
const { PLAN_CUENTAS_PUC } = require('./plan_cuentas_puc');
const { ASIENTOS_2025 } = require('./asientos_2025');

async function crearSchemaContable(userId) {
  const s = `u${userId}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ── Plan de cuentas ────────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.plan_cuentas (
        codigo      VARCHAR(10) PRIMARY KEY,
        nombre      VARCHAR(255) NOT NULL,
        naturaleza  CHAR(1) NOT NULL CHECK (naturaleza IN ('D','C')),
        tipo        VARCHAR(20) NOT NULL,
        padre       VARCHAR(10),
        activa      BOOLEAN DEFAULT TRUE
      );
    `);

    for (const [codigo, nombre, naturaleza, tipo, padre] of PLAN_CUENTAS_PUC) {
      await client.query(`
        INSERT INTO ${s}.plan_cuentas (codigo, nombre, naturaleza, tipo, padre)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING
      `, [codigo, nombre, naturaleza, tipo, padre]);
    }

    // ── Tabla asientos (cabecera) ──────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.asientos (
        id                  SERIAL PRIMARY KEY,
        fecha               DATE NOT NULL,
        numero_comprobante  VARCHAR(30) NOT NULL,
        tipo_comprobante    VARCHAR(50) NOT NULL,
        concepto            TEXT NOT NULL,
        documento_soporte   VARCHAR(50),
        contraparte         VARCHAR(255),
        estado              VARCHAR(20) DEFAULT 'aprobado',
        es_caso_atipico     BOOLEAN DEFAULT FALSE,
        codigo_caso         VARCHAR(10),
        nota_pedagogica     TEXT,
        creado_en           TIMESTAMP DEFAULT NOW()
      );
    `);

    // ── Tabla asientos detalle (líneas débito/crédito) ─────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${s}.asientos_detalle (
        id          SERIAL PRIMARY KEY,
        asiento_id  INTEGER NOT NULL REFERENCES ${s}.asientos(id) ON DELETE CASCADE,
        cuenta_codigo VARCHAR(10) NOT NULL REFERENCES ${s}.plan_cuentas(codigo),
        descripcion TEXT,
        debito      BIGINT NOT NULL DEFAULT 0,
        credito     BIGINT NOT NULL DEFAULT 0
      );
    `);

    // ── Insertar asientos AG 2025 ──────────────────────────────────────────
    const yaExiste = await client.query(
      `SELECT COUNT(*) FROM ${s}.asientos`
    );
    if (parseInt(yaExiste.rows[0].count) === 0) {
      // Casos atípicos identificados
      const casosAtipicos = {
        'FV-REJ-25': { caso: 'A-01', nota: 'Factura rechazada por el cliente — permanece en cartera sin cancelar. Debe generarse nota crédito.' },
        'CE-053-25': { caso: 'A-02', nota: 'Gasto sin soporte válido por $3.500.000 — no deducible fiscalmente (Art. 771-2 ET).' },
        'ANT-001':   { caso: 'A-03', nota: 'Anticipo $6.000.000 a Importech — NO amortizado al recibir la mercancía en agosto.' },
        'CE-072-25': { caso: 'A-03', nota: 'Mercancía del ANT-001 recibida — anticipo pendiente de amortizar: saldo $6.000.000.' },
        'FV-042-25': { caso: 'A-04', nota: 'Venta equipos médicos — diferencia IVA REQ-001: declarado como exento, exógena reporta $800.000 adicionales.' },
        'FC-019-25': { caso: 'A-05', nota: 'Compra FC-019 — retención en fuente NO practicada. Omisión sancionable Art. 370 ET.' },
        'FV-052-25': { caso: 'A-06', nota: 'Venta libros USB — clasificada como EXENTA (tarifa 0%) pero debe ser EXCLUIDA. Impacto en prorrata IVA.' },
      };

      for (const asiento of ASIENTOS_2025) {
        const [fecha, comprobante, tipo, concepto, docSoporte, contraparte, detalles] = asiento;
        const casoInfo = casosAtipicos[comprobante] || null;

        const { rows: [cab] } = await client.query(`
          INSERT INTO ${s}.asientos
            (fecha, numero_comprobante, tipo_comprobante, concepto, documento_soporte,
             contraparte, es_caso_atipico, codigo_caso, nota_pedagogica)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id
        `, [fecha, comprobante, tipo, concepto, docSoporte, contraparte,
            !!casoInfo, casoInfo?.caso || null, casoInfo?.nota || null]);

        for (const [cuenta, desc, debito, credito] of detalles) {
          await client.query(`
            INSERT INTO ${s}.asientos_detalle
              (asiento_id, cuenta_codigo, descripcion, debito, credito)
            VALUES ($1,$2,$3,$4,$5)
          `, [cab.id, cuenta, desc, debito, credito]);
        }
      }
      console.log(`Schema contable AG 2025 creado para usuario ${userId}: ${ASIENTOS_2025.length} asientos`);
    } else {
      console.log(`Schema contable ya existía para usuario ${userId}`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando schema contable:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { crearSchemaContable };
