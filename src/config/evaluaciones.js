const pool = require('./database');

// Preguntas semilla — Semanas 1 y 2 con contenido real del diplomado.
// Semanas 3 y 4 incluyen placeholders editables por el docente desde el panel.
const PREGUNTAS_SEED = [
  // ===================== SEMANA 1 =====================
  // Responsabilidad digital del contador / impuestos, tasas y contribuciones
  { semana: 1, pregunta: '¿Cuál de las siguientes es la diferencia esencial entre un impuesto y una tasa?',
    opcion_a: 'El impuesto tiene contraprestación directa y la tasa no',
    opcion_b: 'La tasa implica una contraprestación directa por un servicio; el impuesto no',
    opcion_c: 'No existe diferencia, son sinónimos en derecho tributario colombiano',
    opcion_d: 'El impuesto solo lo cobran los municipios y la tasa la Nación',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'Las contribuciones especiales (parafiscales) se caracterizan principalmente por:',
    opcion_a: 'Financiar gastos generales del Estado sin destinación específica',
    opcion_b: 'Tener una destinación específica vinculada al beneficio de un sector o grupo determinado',
    opcion_c: 'Ser de carácter voluntario para el contribuyente',
    opcion_d: 'Aplicarse únicamente a personas naturales',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'La responsabilidad del contador público frente a la información financiera digital implica especialmente:',
    opcion_a: 'Delegar totalmente la veracidad de los datos al software contable',
    opcion_b: 'Garantizar la fidelidad, integridad y trazabilidad de la información procesada electrónicamente',
    opcion_c: 'Evitar el uso de sistemas digitales para reducir riesgos',
    opcion_d: 'Responder solo si existe firma física en los documentos',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'De acuerdo con el Estatuto Tributario, ¿quién es responsable de declarar y pagar el impuesto de renta de la sociedad?',
    opcion_a: 'El contador externo, de manera solidaria e ilimitada',
    opcion_b: 'El representante legal y la sociedad como sujeto pasivo del impuesto',
    opcion_c: 'Únicamente el revisor fiscal',
    opcion_d: 'La Cámara de Comercio donde está registrada la sociedad',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'Un ejemplo típico de tasa en el contexto colombiano es:',
    opcion_a: 'El impuesto de renta',
    opcion_b: 'El IVA',
    opcion_c: 'El peaje por uso de una vía',
    opcion_d: 'El impuesto al patrimonio',
    respuesta_correcta: 'C' },
  { semana: 1, pregunta: '¿Cuál de las siguientes obligaciones corresponde directamente a la responsabilidad digital del contador en el manejo de software contable?',
    opcion_a: 'Compartir las contraseñas del sistema con todo el equipo administrativo',
    opcion_b: 'Resguardar la confidencialidad e integridad de la información contable almacenada digitalmente',
    opcion_c: 'Imprimir todos los documentos para evitar el uso de archivos digitales',
    opcion_d: 'Delegar la seguridad informática exclusivamente al proveedor del software',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'El principio tributario de "legalidad" implica que:',
    opcion_a: 'Los impuestos pueden ser creados por decreto del Ministerio de Hacienda sin intervención del Congreso',
    opcion_b: 'No pueden existir impuestos, tasas ni contribuciones sin que la ley, ordenanza o acuerdo los establezca previamente',
    opcion_c: 'Solo aplica a los impuestos nacionales, no a los territoriales',
    opcion_d: 'Permite a la DIAN crear nuevos tributos mediante resolución',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: 'Inversiones Uniatlántico S.A.S. tiene CIIU principal 4690 y secundario 7020. Estos códigos corresponden a:',
    opcion_a: 'Códigos del Registro Único Tributario que identifican actividades económicas',
    opcion_b: 'Códigos exclusivos para reportar nómina electrónica',
    opcion_c: 'Identificadores bancarios para transferencias internacionales',
    opcion_d: 'Códigos de clasificación arancelaria de importaciones',
    respuesta_correcta: 'A' },
  { semana: 1, pregunta: 'En el debate sobre ética y responsabilidad digital del contador, ¿cuál de las siguientes prácticas representa una falta grave?',
    opcion_a: 'Mantener copias de respaldo periódicas de la información contable',
    opcion_b: 'Alterar registros contables digitales para ocultar operaciones ante requerimientos de la autoridad tributaria',
    opcion_c: 'Capacitarse en el uso de nuevas herramientas tecnológicas contables',
    opcion_d: 'Documentar los procedimientos de control interno digital',
    respuesta_correcta: 'B' },
  { semana: 1, pregunta: '¿Cuál de los siguientes NO es un elemento esencial del tributo según la doctrina tributaria?',
    opcion_a: 'Sujeto activo',
    opcion_b: 'Sujeto pasivo',
    opcion_c: 'Hecho generador',
    opcion_d: 'Razón social del software contable utilizado',
    respuesta_correcta: 'D' },

  // ===================== SEMANA 2 =====================
  // Facturación electrónica, CUFE, nómina electrónica CUNE
  { semana: 2, pregunta: '¿Qué significa la sigla CUFE en el contexto de la facturación electrónica colombiana?',
    opcion_a: 'Código Único de Factura Electrónica',
    opcion_b: 'Comprobante Único de Facturación Empresarial',
    opcion_c: 'Certificado Único de Firma Electrónica',
    opcion_d: 'Código Universal de Facturación Exógena',
    respuesta_correcta: 'A' },
  { semana: 2, pregunta: 'El CUFE se genera mediante el algoritmo:',
    opcion_a: 'MD5',
    opcion_b: 'SHA-1',
    opcion_c: 'SHA-384',
    opcion_d: 'AES-256',
    respuesta_correcta: 'C' },
  { semana: 2, pregunta: 'El formato estándar en que se estructura el documento de factura electrónica en Colombia es:',
    opcion_a: 'JSON puro sin esquema definido',
    opcion_b: 'UBL 2.1 (Universal Business Language)',
    opcion_c: 'CSV delimitado por comas',
    opcion_d: 'PDF/A únicamente',
    respuesta_correcta: 'B' },
  { semana: 2, pregunta: 'Si una factura electrónica es RECHAZADA por la DIAN aunque el CUFE se calculó correctamente, ¿qué establece el Art. 771-2 del Estatuto Tributario respecto a sus efectos tributarios?',
    opcion_a: 'La factura produce todos sus efectos tributarios de inmediato',
    opcion_b: 'La factura no produce efectos tributarios hasta que se corrija y reexpida correctamente',
    opcion_c: 'El rechazo no tiene ninguna consecuencia fiscal',
    opcion_d: 'La factura debe destruirse físicamente sin generar nota crédito',
    respuesta_correcta: 'B' },
  { semana: 2, pregunta: '¿Qué sigla identifica el documento soporte de nómina electrónica individual en Colombia?',
    opcion_a: 'CUNE — Código Único de Nómina Electrónica',
    opcion_b: 'CUFE — Código Único de Factura Electrónica',
    opcion_c: 'NIT — Número de Identificación Tributaria',
    opcion_d: 'RUT — Registro Único Tributario',
    respuesta_correcta: 'A' },
  { semana: 2, pregunta: 'La Resolución que regula el documento soporte de pago de nómina electrónica en Colombia es:',
    opcion_a: 'Resolución 000165 de 2023',
    opcion_b: 'Resolución 000013 de 2021',
    opcion_c: 'Resolución 000042 de 2020',
    opcion_d: 'Resolución 000219 de 2022',
    respuesta_correcta: 'B' },
  { semana: 2, pregunta: 'Una vez generado y verificado el documento XML/CUNE de nómina en Quipusoft, el siguiente paso del proceso pedagógico en MokanaTax es:',
    opcion_a: 'Eliminar el documento generado',
    opcion_b: 'Transmitir la nómina a la DIAN desde el módulo correspondiente',
    opcion_c: 'Modificar manualmente el CUNE antes de enviarlo',
    opcion_d: 'Esperar a fin de año para realizar la transmisión',
    respuesta_correcta: 'B' },
  { semana: 2, pregunta: 'El código QR incluido en una factura electrónica colombiana permite:',
    opcion_a: 'Acceder al catálogo de la DIAN para verificar el documento mediante su clave (CUFE)',
    opcion_b: 'Realizar el pago directo de la factura sin pasar por el banco',
    opcion_c: 'Modificar el valor de la factura desde el celular',
    opcion_d: 'Generar automáticamente una nueva factura idéntica',
    respuesta_correcta: 'A' },
  { semana: 2, pregunta: 'En la fórmula para calcular el CUFE, ¿cuál de los siguientes elementos NO forma parte del insumo (input) del hash?',
    opcion_a: 'Número del documento',
    opcion_b: 'Fecha y hora de generación',
    opcion_c: 'NIT del emisor y del adquirente',
    opcion_d: 'El nombre del navegador web utilizado para emitir la factura',
    respuesta_correcta: 'D' },
  { semana: 2, pregunta: '¿Qué obligación adquiere una empresa al ser calificada como "Obligada a Facturación Electrónica" (Obligado FE)?',
    opcion_a: 'Emitir todas sus facturas de venta como documentos electrónicos validados por la DIAN',
    opcion_b: 'Dejar de presentar declaraciones de IVA',
    opcion_c: 'Suspender la nómina electrónica mientras dure la facturación física',
    opcion_d: 'Reportar solo de forma anual sus operaciones',
    respuesta_correcta: 'A' },
  { semana: 2, pregunta: 'El XML generado para la nómina individual electrónica en Colombia corresponde al namespace:',
    opcion_a: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
    opcion_b: 'dian:gov:co:facturaelectronica:NominaIndividual',
    opcion_c: 'http://www.w3.org/2001/XMLSchema',
    opcion_d: 'dian:gov:co:rut:PersonaNatural',
    respuesta_correcta: 'B' },

  // ===================== SEMANA 3 — PLACEHOLDER =====================
  { semana: 3, pregunta: '[Placeholder S3-P1] Pregunta pendiente de definir por el docente para la Semana 3 (REQ-001-2025 / Caso A-04).',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P2] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P3] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P4] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P5] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P6] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P7] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P8] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P9] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 3, pregunta: '[Placeholder S3-P10] Pregunta pendiente de definir por el docente para la Semana 3.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },

  // ===================== SEMANA 4 — PLACEHOLDER =====================
  { semana: 4, pregunta: '[Placeholder S4-P1] Pregunta pendiente de definir por el docente para la Semana 4 (cierre del módulo).',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P2] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P3] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P4] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P5] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P6] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P7] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P8] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P9] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
  { semana: 4, pregunta: '[Placeholder S4-P10] Pregunta pendiente de definir por el docente para la Semana 4.',
    opcion_a: 'Opción A (editar)', opcion_b: 'Opción B (editar)', opcion_c: 'Opción C (editar)', opcion_d: 'Opción D (editar)',
    respuesta_correcta: 'A' },
];

// Parámetros de puntuación: puntos fijos por correcta, penalización por segundo de demora.
const PUNTOS_POR_CORRECTA = 10;
const PENALIZACION_POR_SEGUNDO = 0.1; // 0.1 puntos por segundo transcurrido
const PUNTAJE_MINIMO_POR_PREGUNTA = 2; // piso: nunca menos de 2 pts si es correcta, sin importar el tiempo
const TIEMPO_MAXIMO_SEGUNDOS = 120; // tope de tiempo considerado por pregunta

function calcularPuntaje(esCorrecta, tiempoSegundos) {
  if (!esCorrecta) return 0;
  const tiempo = Math.min(Math.max(tiempoSegundos, 0), TIEMPO_MAXIMO_SEGUNDOS);
  const puntaje = PUNTOS_POR_CORRECTA - (tiempo * PENALIZACION_POR_SEGUNDO);
  return Math.max(Math.round(puntaje * 100) / 100, PUNTAJE_MINIMO_POR_PREGUNTA);
}

async function crearTablasEvaluaciones() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones_preguntas (
        id SERIAL PRIMARY KEY,
        semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 4),
        pregunta TEXT NOT NULL,
        opcion_a TEXT NOT NULL,
        opcion_b TEXT NOT NULL,
        opcion_c TEXT NOT NULL,
        opcion_d TEXT NOT NULL,
        respuesta_correcta CHAR(1) NOT NULL CHECK (respuesta_correcta IN ('A','B','C','D')),
        activa BOOLEAN DEFAULT TRUE,
        orden INTEGER,
        creado_en TIMESTAMP DEFAULT NOW(),
        actualizado_en TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones_intentos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        semana INTEGER NOT NULL CHECK (semana BETWEEN 1 AND 4),
        puntaje_total NUMERIC(6,2) NOT NULL DEFAULT 0,
        correctas INTEGER NOT NULL DEFAULT 0,
        total_preguntas INTEGER NOT NULL DEFAULT 0,
        tiempo_total_segundos INTEGER NOT NULL DEFAULT 0,
        completado_en TIMESTAMP DEFAULT NOW()
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluaciones_respuestas (
        id SERIAL PRIMARY KEY,
        intento_id INTEGER NOT NULL REFERENCES evaluaciones_intentos(id) ON DELETE CASCADE,
        pregunta_id INTEGER NOT NULL REFERENCES evaluaciones_preguntas(id),
        respuesta_seleccionada CHAR(1),
        es_correcta BOOLEAN NOT NULL DEFAULT FALSE,
        tiempo_segundos INTEGER NOT NULL DEFAULT 0,
        puntaje NUMERIC(5,2) NOT NULL DEFAULT 0
      )
    `);

    const existentes = await client.query('SELECT COUNT(*) FROM evaluaciones_preguntas');
    if (parseInt(existentes.rows[0].count) === 0) {
      let orden = 1;
      for (const p of PREGUNTAS_SEED) {
        await client.query(
          `INSERT INTO evaluaciones_preguntas
            (semana, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [p.semana, p.pregunta, p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d, p.respuesta_correcta, orden++]
        );
      }
      console.log(`Evaluaciones: ${PREGUNTAS_SEED.length} preguntas semilla insertadas (semanas 1-4).`);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando tablas de evaluaciones:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  crearTablasEvaluaciones,
  calcularPuntaje,
  PUNTOS_POR_CORRECTA,
  PENALIZACION_POR_SEGUNDO,
  PUNTAJE_MINIMO_POR_PREGUNTA,
  TIEMPO_MAXIMO_SEGUNDOS,
};
