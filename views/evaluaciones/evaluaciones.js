const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { requireAuth, requireDocente } = require('../middleware/auth');
const { crearTablasEvaluaciones, calcularPuntaje, PUNTOS_POR_CORRECTA, PENALIZACION_POR_SEGUNDO } = require('../config/evaluaciones');

// Asegurar tablas en cada arranque de router (idempotente)
let tablasListas = false;
router.use(async (req, res, next) => {
  if (!tablasListas) {
    try {
      await crearTablasEvaluaciones();
      tablasListas = true;
    } catch (err) {
      console.error('Error preparando tablas de evaluaciones:', err.message);
    }
  }
  next();
});

// ─────────────────────────────────────────────────────────────────────────
// VISTA PRINCIPAL — selección de semana + resultados propios + ranking
// ─────────────────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req, res) => {
  try {
    const [intentos, semanas] = await Promise.all([
      pool.query(
        `SELECT semana, puntaje_total, correctas, total_preguntas, tiempo_total_segundos, completado_en
         FROM evaluaciones_intentos
         WHERE usuario_id = $1
         ORDER BY semana, completado_en DESC`,
        [req.user.id]
      ),
      pool.query(
        `SELECT semana, COUNT(*) AS total_preguntas
         FROM evaluaciones_preguntas WHERE activa = TRUE
         GROUP BY semana ORDER BY semana`
      ),
    ]);

    // Mejor intento por semana (mayor puntaje)
    const mejoresPorSemana = {};
    for (const row of intentos.rows) {
      if (!mejoresPorSemana[row.semana] || parseFloat(row.puntaje_total) > parseFloat(mejoresPorSemana[row.semana].puntaje_total)) {
        mejoresPorSemana[row.semana] = row;
      }
    }

    res.render('evaluaciones/index', {
      title: 'Evaluaciones — Quipusoft',
      user: req.user,
      semanas: semanas.rows,
      mejoresPorSemana,
      intentos: intentos.rows,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando evaluaciones.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// TOMAR TEST DE UNA SEMANA
// ─────────────────────────────────────────────────────────────────────────
router.get('/semana/:semana', requireAuth, async (req, res) => {
  const semana = parseInt(req.params.semana);
  if (![1, 2, 3, 4].includes(semana)) return res.redirect('/evaluaciones');

  try {
    const preguntas = await pool.query(
      `SELECT id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d
       FROM evaluaciones_preguntas
       WHERE semana = $1 AND activa = TRUE
       ORDER BY orden, id`,
      [semana]
    );

    if (preguntas.rows.length === 0) {
      req.flash('error', `No hay preguntas activas para la semana ${semana} todavía.`);
      return res.redirect('/evaluaciones');
    }

    res.render('evaluaciones/test', {
      title: `Evaluación Semana ${semana} — Quipusoft`,
      user: req.user,
      semana,
      preguntas: preguntas.rows,
      puntosPorCorrecta: PUNTOS_POR_CORRECTA,
      penalizacionPorSegundo: PENALIZACION_POR_SEGUNDO,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando el test.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// ENVIAR RESPUESTAS — calcula puntaje (correctas + tiempo) y guarda intento
// ─────────────────────────────────────────────────────────────────────────
router.post('/semana/:semana/enviar', requireAuth, async (req, res) => {
  const semana = parseInt(req.params.semana);
  if (![1, 2, 3, 4].includes(semana)) return res.redirect('/evaluaciones');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const preguntas = await client.query(
      `SELECT id, respuesta_correcta FROM evaluaciones_preguntas WHERE semana = $1 AND activa = TRUE ORDER BY orden, id`,
      [semana]
    );

    // req.body.respuestas[preguntaId] = 'A'|'B'|'C'|'D'|''
    // req.body.tiempos[preguntaId]   = segundos (entero)
    const respuestas = req.body.respuestas || {};
    const tiempos = req.body.tiempos || {};

    let puntajeTotal = 0;
    let correctas = 0;
    let tiempoTotal = 0;
    const detalleRespuestas = [];

    for (const p of preguntas.rows) {
      const key = `q_${p.id}`;
      const seleccion = (respuestas[key] || '').toUpperCase();
      const tiempoSeg = Math.max(0, parseInt(tiempos[key], 10) || 0);
      const esCorrecta = seleccion === p.respuesta_correcta;
      const puntaje = calcularPuntaje(esCorrecta, tiempoSeg);

      if (esCorrecta) correctas++;
      puntajeTotal += puntaje;
      tiempoTotal += tiempoSeg;

      detalleRespuestas.push({ pregunta_id: p.id, seleccion, esCorrecta, tiempoSeg, puntaje });
    }

    const { rows: [intento] } = await client.query(
      `INSERT INTO evaluaciones_intentos
        (usuario_id, semana, puntaje_total, correctas, total_preguntas, tiempo_total_segundos)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [req.user.id, semana, puntajeTotal.toFixed(2), correctas, preguntas.rows.length, tiempoTotal]
    );

    for (const r of detalleRespuestas) {
      await client.query(
        `INSERT INTO evaluaciones_respuestas
          (intento_id, pregunta_id, respuesta_seleccionada, es_correcta, tiempo_segundos, puntaje)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [intento.id, r.pregunta_id, r.seleccion || null, r.esCorrecta, r.tiempoSeg, r.puntaje]
      );
    }

    // Marcar progreso completado
    await client.query(
      `INSERT INTO progreso_estudiantes (usuario_id, semana, actividad, completado, fecha_completado)
       VALUES ($1,$2,$3,TRUE,NOW())
       ON CONFLICT (usuario_id, semana, actividad)
       DO UPDATE SET completado = TRUE, fecha_completado = NOW()`,
      [req.user.id, semana, `Evaluación semana ${semana}`]
    );

    await client.query('COMMIT');
    res.redirect(`/evaluaciones/resultado/${intento.id}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.render('error', { mensaje: 'Error guardando el intento de evaluación.' });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────
// RESULTADO DE UN INTENTO — incluye posición en el ranking de esa semana
// ─────────────────────────────────────────────────────────────────────────
router.get('/resultado/:intentoId', requireAuth, async (req, res) => {
  try {
    const intento = await pool.query(
      `SELECT ei.*, u.nombre FROM evaluaciones_intentos ei
       JOIN usuarios u ON u.id = ei.usuario_id
       WHERE ei.id = $1`,
      [req.params.intentoId]
    );

    if (!intento.rows.length) return res.redirect('/evaluaciones');
    const datos = intento.rows[0];

    // Solo el propio estudiante (o docente) puede ver el resultado
    if (datos.usuario_id !== req.user.id && req.user.rol === 'estudiante') {
      return res.redirect('/evaluaciones');
    }

    const respuestas = await pool.query(
      `SELECT er.*, ep.pregunta, ep.opcion_a, ep.opcion_b, ep.opcion_c, ep.opcion_d, ep.respuesta_correcta
       FROM evaluaciones_respuestas er
       JOIN evaluaciones_preguntas ep ON ep.id = er.pregunta_id
       WHERE er.intento_id = $1
       ORDER BY ep.orden, ep.id`,
      [req.params.intentoId]
    );

    // Ranking de la semana (mejor puntaje por estudiante)
    const ranking = await pool.query(
      `SELECT u.id AS usuario_id, u.nombre,
              MAX(ei.puntaje_total) AS mejor_puntaje
       FROM evaluaciones_intentos ei
       JOIN usuarios u ON u.id = ei.usuario_id
       WHERE ei.semana = $1 AND u.rol = 'estudiante'
       GROUP BY u.id, u.nombre
       ORDER BY mejor_puntaje DESC, u.nombre ASC`,
      [datos.semana]
    );

    const posicion = ranking.rows.findIndex(r => r.usuario_id === datos.usuario_id) + 1;

    res.render('evaluaciones/resultado', {
      title: `Resultado Semana ${datos.semana} — Quipusoft`,
      user: req.user,
      intento: datos,
      respuestas: respuestas.rows,
      posicion,
      totalParticipantes: ranking.rows.length,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando el resultado.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// RANKING — vista pública (estudiantes ven su posición; docente ve todo)
// ─────────────────────────────────────────────────────────────────────────
router.get('/ranking', requireAuth, async (req, res) => {
  try {
    const semanaQuery = parseInt(req.query.semana) || null;

    let rankingPorSemana = {};
    for (const semana of [1, 2, 3, 4]) {
      if (semanaQuery && semanaQuery !== semana) continue;
      const r = await pool.query(
        `SELECT u.id AS usuario_id, u.nombre,
                MAX(ei.puntaje_total) AS mejor_puntaje,
                MAX(ei.correctas) AS correctas,
                MAX(ei.total_preguntas) AS total_preguntas
         FROM evaluaciones_intentos ei
         JOIN usuarios u ON u.id = ei.usuario_id
         WHERE ei.semana = $1 AND u.rol = 'estudiante'
         GROUP BY u.id, u.nombre
         ORDER BY mejor_puntaje DESC, u.nombre ASC`,
        [semana]
      );
      rankingPorSemana[semana] = r.rows;
    }

    // Ranking global: suma de mejores puntajes de cada semana por estudiante
    const globalQuery = await pool.query(
      `SELECT u.id AS usuario_id, u.nombre, ei.semana, MAX(ei.puntaje_total) AS mejor_puntaje
       FROM evaluaciones_intentos ei
       JOIN usuarios u ON u.id = ei.usuario_id
       WHERE u.rol = 'estudiante'
       GROUP BY u.id, u.nombre, ei.semana`
    );

    const acumulado = {};
    for (const row of globalQuery.rows) {
      if (!acumulado[row.usuario_id]) {
        acumulado[row.usuario_id] = { usuario_id: row.usuario_id, nombre: row.nombre, total: 0, semanas_realizadas: 0 };
      }
      acumulado[row.usuario_id].total += parseFloat(row.mejor_puntaje);
      acumulado[row.usuario_id].semanas_realizadas += 1;
    }
    const rankingGlobal = Object.values(acumulado).sort((a, b) => b.total - a.total);

    // Posición del usuario actual (si es estudiante)
    let miPosicionGlobal = null;
    if (req.user.rol === 'estudiante') {
      miPosicionGlobal = rankingGlobal.findIndex(r => r.usuario_id === req.user.id) + 1;
      if (miPosicionGlobal === 0) miPosicionGlobal = null;
    }

    // Lista de estudiantes con su progreso de evaluaciones (solo para docente)
    let estudiantes = [];
    if (req.user.rol === 'docente' || req.user.rol === 'admin') {
      const est = await pool.query(
        `SELECT u.id, u.nombre, u.email,
                ARRAY_AGG(DISTINCT ei.semana) FILTER (WHERE ei.semana IS NOT NULL) AS semanas_con_intentos
         FROM usuarios u
         LEFT JOIN evaluaciones_intentos ei ON ei.usuario_id = u.id
         WHERE u.rol = 'estudiante'
         GROUP BY u.id, u.nombre, u.email
         ORDER BY u.nombre`
      );
      estudiantes = est.rows;
    }

    res.render('evaluaciones/ranking', {
      title: 'Ranking — Quipusoft',
      user: req.user,
      rankingPorSemana,
      rankingGlobal,
      miPosicionGlobal,
      semanaFiltro: semanaQuery,
      estudiantes,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando el ranking.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DOCENTE — administrar preguntas (listar / crear / editar / eliminar / activar)
// ─────────────────────────────────────────────────────────────────────────
router.get('/admin', requireDocente, async (req, res) => {
  try {
    const semana = parseInt(req.query.semana) || 1;
    const preguntas = await pool.query(
      `SELECT * FROM evaluaciones_preguntas WHERE semana = $1 ORDER BY orden, id`,
      [semana]
    );
    res.render('evaluaciones/admin', {
      title: 'Administrar evaluaciones — Quipusoft',
      user: req.user,
      semana,
      preguntas: preguntas.rows,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error cargando administración de evaluaciones.' });
  }
});

// Crear pregunta nueva
router.post('/admin/nueva', requireDocente, async (req, res) => {
  const { semana, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta } = req.body;
  try {
    const maxOrden = await pool.query(
      `SELECT COALESCE(MAX(orden),0) AS max FROM evaluaciones_preguntas WHERE semana = $1`,
      [semana]
    );
    await pool.query(
      `INSERT INTO evaluaciones_preguntas
        (semana, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, orden)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [semana, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta.toUpperCase(), maxOrden.rows[0].max + 1]
    );
    req.flash('success', 'Pregunta creada correctamente.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creando la pregunta.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  }
});

// Editar pregunta existente
router.post('/admin/:id/editar', requireDocente, async (req, res) => {
  const { pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta, semana } = req.body;
  try {
    await pool.query(
      `UPDATE evaluaciones_preguntas
       SET pregunta=$1, opcion_a=$2, opcion_b=$3, opcion_c=$4, opcion_d=$5,
           respuesta_correcta=$6, actualizado_en=NOW()
       WHERE id=$7`,
      [pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta.toUpperCase(), req.params.id]
    );
    req.flash('success', 'Pregunta actualizada correctamente.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error actualizando la pregunta.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  }
});

// Activar / desactivar pregunta
router.post('/admin/:id/toggle', requireDocente, async (req, res) => {
  const { semana } = req.body;
  try {
    await pool.query(
      `UPDATE evaluaciones_preguntas SET activa = NOT activa, actualizado_en = NOW() WHERE id = $1`,
      [req.params.id]
    );
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  } catch (err) {
    console.error(err);
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  }
});

// Eliminar pregunta
router.post('/admin/:id/eliminar', requireDocente, async (req, res) => {
  const { semana } = req.body;
  try {
    await pool.query(`DELETE FROM evaluaciones_preguntas WHERE id = $1`, [req.params.id]);
    req.flash('success', 'Pregunta eliminada.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error eliminando la pregunta.');
    res.redirect(`/evaluaciones/admin?semana=${semana}`);
  }
});

// ─────────────────────────────────────────────────────────────────────────
// DOCENTE — resetear intentos de evaluación de un estudiante
// (por semana específica o todas), para corregir calificaciones afectadas
// por errores técnicos previos.
// ─────────────────────────────────────────────────────────────────────────
router.post('/admin/resetear-intentos', requireDocente, async (req, res) => {
  const { usuario_id, semana } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let intentosQuery, params;
    if (semana && semana !== 'todas') {
      intentosQuery = `SELECT id FROM evaluaciones_intentos WHERE usuario_id = $1 AND semana = $2`;
      params = [usuario_id, parseInt(semana)];
    } else {
      intentosQuery = `SELECT id FROM evaluaciones_intentos WHERE usuario_id = $1`;
      params = [usuario_id];
    }

    const intentos = await client.query(intentosQuery, params);
    const ids = intentos.rows.map(r => r.id);

    if (ids.length > 0) {
      await client.query(`DELETE FROM evaluaciones_respuestas WHERE intento_id = ANY($1)`, [ids]);
      await client.query(
        semana && semana !== 'todas'
          ? `DELETE FROM evaluaciones_intentos WHERE usuario_id = $1 AND semana = $2`
          : `DELETE FROM evaluaciones_intentos WHERE usuario_id = $1`,
        params
      );
    }

    // También revertir el progreso marcado como completado para la(s) semana(s) reseteada(s)
    if (semana && semana !== 'todas') {
      await client.query(
        `DELETE FROM progreso_estudiantes WHERE usuario_id = $1 AND semana = $2 AND actividad = $3`,
        [usuario_id, parseInt(semana), `Evaluación semana ${semana}`]
      );
    } else {
      await client.query(
        `DELETE FROM progreso_estudiantes WHERE usuario_id = $1 AND actividad LIKE 'Evaluación semana%'`,
        [usuario_id]
      );
    }

    await client.query('COMMIT');
    req.flash('success', `Se reseteraron ${ids.length} intento(s) de evaluación correctamente. El estudiante puede volver a presentar la(s) evaluación(es).`);
    res.redirect(req.get('Referer') || '/evaluaciones/ranking');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    req.flash('error', 'Error reseteando los intentos del estudiante.');
    res.redirect(req.get('Referer') || '/evaluaciones/ranking');
  } finally {
    client.release();
  }
});

module.exports = router;
