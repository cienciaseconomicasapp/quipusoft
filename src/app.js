require('dotenv').config();
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const flash = require('express-flash');
const methodOverride = require('method-override');
const morgan = require('morgan');
const path = require('path');
const pool = require('./config/database');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 8080;

// Confiar en el proxy de Railway (CRÍTICO para cookies seguras en producción)
app.set('trust proxy', 1);

// Motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middlewares
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, '../public')));

// Sesiones con PostgreSQL
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET || 'quipusoft_secret_2026',
  resave: false,
  saveUninitialized: false,
  proxy: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

// Variables globales para las vistas
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.appName = 'Quipusoft';
  res.locals.mokanataxUrl = process.env.MOKANATAX_URL || '#';
  next();
});

// Rutas
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/transacciones', require('./routes/transacciones'));
app.use('/nomina', require('./routes/nomina'));
app.use('/declaraciones', require('./routes/declaraciones'));

// Ruta raíz
app.get('/', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.redirect('/auth/login');
});

// Health check para Railway
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Quipusoft', timestamp: new Date() }));

// 404
app.use((req, res) => {
  res.status(404).render('error', { mensaje: 'Página no encontrada.' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { mensaje: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Quipusoft corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
