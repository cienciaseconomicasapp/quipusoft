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

    // Verificar dominio institucional o email en whitelist
    if (domain !== ALLOWED_DOMAIN && !ALLOWED_EMAILS.includes(email)) {
      return done(null, false, {
        message: `Acceso restringido. Solo cuentas @${ALLOWED_DOMAIN} o correos autorizados.`
      });
    }

    // Buscar o crear usuario en la BD
    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE google_id = $1', [profile.id]
    );

    if (existing.rows.length > 0) {
      // Actualizar último acceso
      await pool.query(
        'UPDATE usuarios SET ultimo_acceso = NOW(), nombre = $1, foto = $2 WHERE google_id = $3',
        [profile.displayName, profile.photos[0]?.value, profile.id]
      );
      return done(null, existing.rows[0]);
    }

    // Crear nuevo usuario
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

    // Crear schema propio para el estudiante con datos de Inversiones Uniatlantico
    const userId = nuevo.rows[0].id;
    await crearSchemaEstudiante(userId);

    return done(null, nuevo.rows[0]);
  } catch (err) {
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
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    // Copiar datos base desde el schema 'plantilla'
    await client.query(`
      INSERT INTO ${schema}.empresa SELECT * FROM plantilla.empresa;
      INSERT INTO ${schema}.clientes SELECT * FROM plantilla.clientes;
      INSERT INTO ${schema}.proveedores SELECT * FROM plantilla.proveedores;
      INSERT INTO ${schema}.empleados SELECT * FROM plantilla.empleados;
      INSERT INTO ${schema}.transacciones SELECT * FROM plantilla.transacciones;
      INSERT INTO ${schema}.nomina SELECT * FROM plantilla.nomina;
      INSERT INTO ${schema}.activos_fijos SELECT * FROM plantilla.activos_fijos;
    `);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creando schema para usuario', userId, err.message);
  } finally {
    client.release();
  }
}

module.exports = passport;
