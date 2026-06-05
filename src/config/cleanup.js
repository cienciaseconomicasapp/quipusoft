require('dotenv').config();
const pool = require('./database');

async function cleanup() {
  const client = await pool.connect();
  try {
    console.log('Iniciando limpieza de datos duplicados...');
    await client.query('BEGIN');

    // 1. Limpiar schemas duplicados de usuarios de prueba (u1, u2, u3 si existen)
    const schemas = await client.query(`
      SELECT schema_name FROM information_schema.schemata
      WHERE schema_name LIKE 'u%' AND schema_name != 'public'
      ORDER BY schema_name
    `);
    console.log('Schemas de usuarios encontrados:', schemas.rows.map(r => r.schema_name));

    // 2. Limpiar datos duplicados en plantilla.anticipos
    const antCount = await client.query(`SELECT COUNT(*) FROM plantilla.anticipos`);
    console.log('Anticipos en plantilla antes de limpieza:', antCount.rows[0].count);

    // Dejar solo 1 registro por documento (eliminar duplicados)
    await client.query(`
      DELETE FROM plantilla.anticipos
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.anticipos GROUP BY documento
      )
    `);
    const antAfter = await client.query(`SELECT COUNT(*) FROM plantilla.anticipos`);
    console.log('Anticipos después de limpieza:', antAfter.rows[0].count);

    // 3. Limpiar transacciones duplicadas en plantilla
    const txCount = await client.query(`SELECT COUNT(*) FROM plantilla.transacciones`);
    console.log('Transacciones en plantilla antes:', txCount.rows[0].count);

    await client.query(`
      DELETE FROM plantilla.transacciones
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.transacciones GROUP BY documento, fecha, mes
      )
    `);
    const txAfter = await client.query(`SELECT COUNT(*) FROM plantilla.transacciones`);
    console.log('Transacciones después de limpieza:', txAfter.rows[0].count);

    // 4. Limpiar clientes duplicados
    await client.query(`
      DELETE FROM plantilla.clientes
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.clientes GROUP BY codigo
      )
    `);

    // 5. Limpiar proveedores duplicados
    await client.query(`
      DELETE FROM plantilla.proveedores
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.proveedores GROUP BY codigo
      )
    `);

    // 6. Limpiar empleados duplicados
    await client.query(`
      DELETE FROM plantilla.empleados
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.empleados GROUP BY numero
      )
    `);

    // 7. Limpiar activos fijos duplicados
    await client.query(`
      DELETE FROM plantilla.activos_fijos
      WHERE id NOT IN (
        SELECT MIN(id) FROM plantilla.activos_fijos GROUP BY codigo
      )
    `);

    // 8. Para cada schema de usuario existente, limpiar también los datos duplicados
    for (const row of schemas.rows) {
      const schema = row.schema_name;
      console.log(`Limpiando schema: ${schema}`);

      try {
        // Limpiar anticipos del usuario
        await client.query(`
          DELETE FROM "${schema}".anticipos
          WHERE id NOT IN (
            SELECT MIN(id) FROM "${schema}".anticipos GROUP BY documento
          )
        `);

        // Limpiar transacciones del usuario
        await client.query(`
          DELETE FROM "${schema}".transacciones
          WHERE id NOT IN (
            SELECT MIN(id) FROM "${schema}".transacciones GROUP BY documento, fecha, mes
          )
        `);

        // Sincronizar datos del usuario con la plantilla limpia
        // (solo si tiene más registros que la plantilla, señal de duplicados)
        const userAnt = await client.query(`SELECT COUNT(*) FROM "${schema}".anticipos`);
        const plantAnt = await client.query(`SELECT COUNT(*) FROM plantilla.anticipos`);

        if (parseInt(userAnt.rows[0].count) > parseInt(plantAnt.rows[0].count)) {
          console.log(`  Reseteando anticipos de ${schema}`);
          await client.query(`DELETE FROM "${schema}".anticipos`);
          await client.query(`INSERT INTO "${schema}".anticipos SELECT * FROM plantilla.anticipos`);
        }

        console.log(`  Schema ${schema} limpiado`);
      } catch(e) {
        console.log(`  Error en ${schema}:`, e.message);
      }
    }

    await client.query('COMMIT');
    console.log('\nLimpieza completada exitosamente.');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en limpieza:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function crearDocente() {
  const client = await pool.connect();
  try {
    console.log('\nCreando usuario docente...');

    const email = process.env.DOCENTE_EMAIL || 'alfredoanguila@mail.uniatlantico.edu.co';

    // Verificar si ya existe
    const existe = await client.query(
      'SELECT * FROM usuarios WHERE email = $1', [email]
    );

    if (existe.rows.length > 0) {
      // Actualizar rol a docente
      await client.query(
        'UPDATE usuarios SET rol = $1 WHERE email = $2',
        ['docente', email]
      );
      console.log(`Usuario docente actualizado: ${email} → rol: docente`);
    } else {
      // Crear usuario docente manualmente (sin Google OAuth por ahora)
      await client.query(`
        INSERT INTO usuarios (google_id, email, nombre, rol, fecha_registro, ultimo_acceso)
        VALUES ($1, $2, $3, 'docente', NOW(), NOW())
        ON CONFLICT (email) DO UPDATE SET rol = 'docente'
      `, [
        'docente_' + Date.now(),
        email,
        'Alfredo Anguila (Docente)'
      ]);
      console.log(`Usuario docente creado: ${email}`);
    }

    // Verificar estado final
    const docente = await client.query('SELECT id, email, nombre, rol FROM usuarios WHERE email = $1', [email]);
    console.log('Estado final del docente:', docente.rows[0]);

    // Crear schema del docente si no existe
    const userId = docente.rows[0].id;
    const schema = `u${userId}`;
    const schemaExists = await client.query(`
      SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
    `, [schema]);

    if (!schemaExists.rows.length) {
      console.log(`Creando schema ${schema} para el docente...`);
      await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
      const tablas = ['empresa','clientes','proveedores','empleados','transacciones','nomina','activos_fijos','anticipos'];
      for (const tabla of tablas) {
        await client.query(`CREATE TABLE IF NOT EXISTS "${schema}"."${tabla}" (LIKE plantilla."${tabla}" INCLUDING ALL)`);
        await client.query(`INSERT INTO "${schema}"."${tabla}" SELECT * FROM plantilla."${tabla}"`);
      }
      console.log(`Schema ${schema} creado para el docente.`);
    } else {
      console.log(`Schema ${schema} ya existe.`);
    }

    console.log('\nUsuario docente listo.');
  } catch (err) {
    console.error('Error creando docente:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function resumen() {
  const client = await pool.connect();
  try {
    console.log('\n═══ RESUMEN FINAL ═══');
    const usuarios = await client.query('SELECT id, email, nombre, rol FROM usuarios ORDER BY id');
    console.log('Usuarios registrados:');
    usuarios.rows.forEach(u => console.log(`  [${u.id}] ${u.email} | ${u.nombre} | ${u.rol}`));

    const trans = await client.query('SELECT COUNT(*) FROM plantilla.transacciones');
    const anticipos = await client.query('SELECT COUNT(*) FROM plantilla.anticipos');
    const empleados = await client.query('SELECT COUNT(*) FROM plantilla.empleados');
    console.log(`\nDatos plantilla: ${trans.rows[0].count} transacciones | ${anticipos.rows[0].count} anticipos | ${empleados.rows[0].count} empleados`);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup()
  .then(() => crearDocente())
  .then(() => resumen())
  .catch(console.error);
