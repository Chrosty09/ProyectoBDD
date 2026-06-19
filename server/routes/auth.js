const express  = require('express');
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const { getConn, getConnBySucursal } = require('../config/db');
const usuarioSchema = require('../models/Usuario');

const router = express.Router();

function getModel(conn, name, schema) {
  return conn.models[name] || conn.model(name, schema);
}

// POST /api/auth/login
// Body: { username, password, sucursalId }
// sucursalId 0 = admin HQ, 1-10 = sucursal especifica
router.post('/login', async (req, res) => {
  const { username, password, sucursalId } = req.body;

  if (!username || !password || sucursalId === undefined) {
    return res.status(400).json({ error: 'username, password y sucursalId son requeridos' });
  }

  try {
    // Determinar en que cluster buscar al usuario
    let conn;
    if (parseInt(sucursalId) === 0) {
      conn = getConn('hq');
    } else {
      conn = getConnBySucursal(parseInt(sucursalId));
    }

    const Usuario = getModel(conn, 'Usuario', usuarioSchema);
    const usuario = await Usuario.findOne({ username, activo: true });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      {
        userId:     usuario._id,
        username:   usuario.username,
        rol:        usuario.rol,
        sucursalId: usuario.sucursalId,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: {
        id:         usuario._id,
        username:   usuario.username,
        rol:        usuario.rol,
        sucursalId: usuario.sucursalId,
      },
    });
  } catch (err) {
    console.error('[AUTH] Error en login:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
