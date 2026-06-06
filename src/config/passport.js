require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'mail.uniatlantico.edu.co';
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);
const DOCENTE_EMAIL = process.env.DOCENTE_EMAIL || '';

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const domain = email.split('@')[1];

    if (domain !== ALLOWED_DOMAIN && !ALLOWED_EMAILS.includes(email)) {
      return done(null, false, {
        message: `Acceso restringido. Solo cuentas @${ALLOWED_DOMAIN} o correos autorizados.`
      });
    }

    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE google_id = $1', [profile.id]
    );

    if (existing.rows.length > 0) {
      // Si es el docente, asegurarse de que tenga rol correcto
      const rol = email === DOCENTE_EMAIL ? 'docente' : existing.rows[0].rol;
      await pool.query(
        'UPDATE usuarios SET ultimo_acceso = NOW(), nombre = $1, foto = $2, rol = $3 WHERE google_id = $4',
        [profile.displayName, profile.photos[0]?.value, rol, profile.id]
      );
      const updated = await pool.query('SELECT * FROM usuarios WHERE google_id = $1', [profile.id]);
      return done(null, updated.rows[0]);
    }

    // Determinar rol
    const rol = email === DOCENTE_EMAIL ? 'docente' : 'estudiante';

    const nuevo = await pool.query(
      `INSERT INTO usuarios (google_id, email, nombre, foto, rol, fecha_registro, ultimo_acceso)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [profile.id, email, profile.displayName, profile.photos[0]?.value || null, rol]
    );

    const userId = nuevo.rows[0].id;
    await crearSchemaEstudiante(userId);

    return done(null, nuevo.rows[0]);
  } catch (err) {
    console.error('Error en estrategia Google:', err.message);
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
    done(null, result.rows[0] || null);
  } catch (err) {
    done(err);
  }
});

async function crearSchemaEstudiante(userId) {
  const schema = `u${userId}`;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);

    const tablas = ['empresa','clientes','proveedores','empleados','transacciones','nomina','activos_fijos','anticipos'];
    for (const tabla of tablas) {
      const existe = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = $1 AND table_name = $2
        )`, [schema, tabla]);

      if (!existe.rows[0].exists) {
        await client.query(`CREATE TABLE IF NOT EXISTS "${schema}"."${tabla}" (LIKE plantilla."${tabla}" INCLUDING ALL)`);
        await client.query(`INSERT INTO "${schema}"."${tabla}" SELECT * FROM plantilla."${tabla}"`);
        console.log(`Tabla ${schema}.${tabla} creada`);
      }
    }
    await client.query('COMMIT');
    console.log(`Schema ${schema} listo para usuario ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando schema para usuario', userId, err.message);
  } finally {
    client.release();
  }

  // Crear schema contable (plan de cuentas + asientos AG 2025)
  try {
    const { crearSchemaContable } = require('./schema_contable');
    await crearSchemaContable(userId);
  } catch (err) {
    console.error('Error creando schema contable:', err.message);
  }
}

module.exports = { passport };
