const express = require('express');
const { auth } = require('../middleware/auth');
const { getConn } = require('../config/db');
const productoSchema = require('../models/Producto');

const router = express.Router();

function getModel(conn, name, schema) {
  return conn.models[name] || conn.model(name, schema);
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePositiveInt(value, fallback, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

// GET /api/productos
// Catalogo maestro consultado desde el nodo central HQ.
router.get('/', auth, async (req, res) => {
  const {
    q,
    sku,
    categoria,
    activo = 'true',
    page: pageParam = 1,
    limite: limiteParam = 20,
  } = req.query;

  const page = parsePositiveInt(pageParam, 1, 100000);
  const limite = parsePositiveInt(limiteParam, 20, 100);
  const skip = (page - 1) * limite;

  try {
    const connHQ = getConn('hq');
    const Producto = getModel(connHQ, 'Producto', productoSchema);
    const filtro = {};

    if (activo !== 'all') {
      filtro.activo = activo === 'false' ? false : true;
    }

    if (categoria) {
      filtro.categoria = categoria;
    }

    if (sku) {
      filtro.sku = new RegExp(`^${escapeRegex(sku.trim())}$`, 'i');
    }

    if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filtro.$or = [
        { nombre: regex },
        { sku: regex },
        { categoria: regex },
        { codigoBarras: regex },
      ];
    }

    const [productos, total] = await Promise.all([
      Producto.find(filtro)
        .select('sku nombre categoria precio costo codigoBarras activo')
        .sort({ nombre: 1, sku: 1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Producto.countDocuments(filtro),
    ]);

    res.json({
      productos,
      total,
      page,
      limite,
      totalPages: Math.ceil(total / limite),
    });
  } catch (err) {
    console.error('[PRODUCTOS] Error:', err.message);
    res.status(500).json({ error: 'Error al consultar catalogo de productos' });
  }
});

// GET /api/productos/:sku
router.get('/:sku', auth, async (req, res) => {
  try {
    const connHQ = getConn('hq');
    const Producto = getModel(connHQ, 'Producto', productoSchema);
    const producto = await Producto.findOne({
      sku: new RegExp(`^${escapeRegex(req.params.sku.trim())}$`, 'i'),
      activo: true,
    })
      .select('sku nombre categoria precio costo codigoBarras activo')
      .lean();

    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ producto });
  } catch (err) {
    console.error('[PRODUCTOS] Error:', err.message);
    res.status(500).json({ error: 'Error al consultar producto' });
  }
});

module.exports = router;
