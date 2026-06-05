require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('./database');

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || 'mail.uniatlantico.edu.co';
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean);

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
      await pool.query(
        'UPDATE usuarios SET ultimo_acceso = NOW(), nombre = $1, foto = $2 WHERE google_id = $3',
        [profile.displayName, profile.photos[0]?.value, profile.id]
      );
      return done(null, existing.rows[0]);
    }

    const nuevo = await pool.query(
      `INSERT INTO usuarios (google_id, email, nombre, foto, rol, fecha_registro, ultimo_acceso)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [
        profile.id,
        email,
        profile.displayName,
        profile.photos[0]?.value || null,
        email === process.env.DOCENTE_EMAIL ? 'docente' : 'estudiante'
      ]
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

    // Crear tablas copiando estructura desde plantilla
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".empresa (LIKE plantilla.empresa INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".clientes (LIKE plantilla.clientes INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".proveedores (LIKE plantilla.proveedores INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".empleados (LIKE plantilla.empleados INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".transacciones (LIKE plantilla.transacciones INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".nomina (LIKE plantilla.nomina INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".activos_fijos (LIKE plantilla.activos_fijos INCLUDING ALL)`);
    await client.query(`CREATE TABLE IF NOT EXISTS "${schema}".anticipos (LIKE plantilla.anticipos INCLUDING ALL)`);

    // Copiar datos desde plantilla uno por uno
    await client.query(`INSERT INTO "${schema}".empresa SELECT * FROM plantilla.empresa`);
    await client.query(`INSERT INTO "${schema}".clientes SELECT * FROM plantilla.clientes`);
    await client.query(`INSERT INTO "${schema}".proveedores SELECT * FROM plantilla.proveedores`);
    await client.query(`INSERT INTO "${schema}".empleados SELECT * FROM plantilla.empleados`);
    await client.query(`INSERT INTO "${schema}".transacciones SELECT * FROM plantilla.transacciones`);
    await client.query(`INSERT INTO "${schema}".activos_fijos SELECT * FROM plantilla.activos_fijos`);
    await client.query(`INSERT INTO "${schema}".anticipos SELECT * FROM plantilla.anticipos`);

    await client.query('COMMIT');
    console.log(`Schema ${schema} creado para usuario ${userId}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando schema para usuario', userId, err.message);
  } finally {
    client.release();
  }
}

module.exports = passport;
