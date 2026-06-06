const express = require('express');
const router = express.Router();
const { passport } = require('../config/passport');

router.get('/login', (req, res) => {
  if (req.isAuthenticated()) return res.redirect('/dashboard');
  res.render('auth/login', { error: req.flash('error'), title: 'Iniciar sesión — Quipusoft' });
});

router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', failureFlash: true }),
  (req, res) => res.redirect('/dashboard')
);

router.get('/logout', (req, res) => req.logout(() => res.redirect('/auth/login')));

module.exports = router;
