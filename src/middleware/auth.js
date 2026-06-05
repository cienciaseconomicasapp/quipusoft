function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash('error', 'Debes iniciar sesión para acceder.');
  res.redirect('/auth/login');
}

function requireDocente(req, res, next) {
  if (req.isAuthenticated() && (req.user.rol === 'docente' || req.user.rol === 'admin')) return next();
  res.status(403).render('error', { mensaje: 'Acceso restringido al docente.', user: req.user });
}

function setSchema(req, res, next) {
  if (req.user) {
    req.schema = `u${req.user.id}`;
  }
  next();
}

module.exports = { requireAuth, requireDocente, setSchema };
