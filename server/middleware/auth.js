const jwt = require('jsonwebtoken');

// Verifica que el token JWT sea valido
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token invalido o expirado' });
  }
}

// Verifica que el usuario pertenezca a la sucursal que esta intentando acceder
// Los admins (sucursalId 0) pueden acceder a cualquier sucursal
function checkBranch(req, res, next) {
  const sucursalId = parseInt(req.params.sucursalId || req.body.sucursalId);
  if (!sucursalId) return next();

  if (req.user.rol === 'admin') return next();

  if (req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
  }
  next();
}

// Solo admins y gerentes pueden ver reportes
function soloGerentes(req, res, next) {
  if (req.user.rol === 'cajero') {
    return res.status(403).json({ error: 'Se requiere rol de gerente o admin' });
  }
  next();
}

module.exports = { auth, checkBranch, soloGerentes };
