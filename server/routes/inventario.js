const express = require('express');
const { auth, checkBranch } = require('../middleware/auth');
const { getConn, getConnBySucursal } = require('../config/db');
const inventarioSchema = require('../models/Inventario');
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

// GET /api/inventario/sucursal/:sucursalId
router.get('/sucursal/:sucursalId', auth, checkBranch, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId, 10);
  const {
    q,
    bajoStock,
    categoria,
    page: pageParam = 1,
    limite: limiteParam = 20,
  } = req.query;

  if (!Number.isInteger(sucursalId) || sucursalId < 1 || sucursalId > 10) {
    return res.status(400).json({ error: 'sucursalId debe estar entre 1 y 10' });
  }

  const page = parsePositiveInt(pageParam, 1, 100000);
  const limite = parsePositiveInt(limiteParam, 20, 100);
  const skip = (page - 1) * limite;

  try {
    const connSucursal = getConnBySucursal(sucursalId);
    const connHQ = getConn('hq');
    const Inventario = getModel(connSucursal, 'Inventario', inventarioSchema);
    const Producto = getModel(connHQ, 'Producto', productoSchema);

    const filtro = { sucursalId };

    if (q) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filtro.$or = [{ sku: regex }, { nombreProducto: regex }];
    }

    if (bajoStock === 'true') {
      filtro.$expr = { $lte: ['$stock', '$nivelReorden'] };
    }

    if (categoria) {
      const productosCategoria = await Producto.find({
        categoria,
        activo: true,
      })
        .select('sku')
        .lean();
      filtro.sku = { $in: productosCategoria.map((p) => p.sku) };
    }

    const [inventario, total] = await Promise.all([
      Inventario.find(filtro)
        .select('sucursalId productoId sku nombreProducto stock nivelReorden ultimoSurtido')
        .sort({ nombreProducto: 1, sku: 1 })
        .skip(skip)
        .limit(limite)
        .lean(),
      Inventario.countDocuments(filtro),
    ]);

    const skus = inventario.map((item) => item.sku);
    const productos = await Producto.find({ sku: { $in: skus } })
      .select('sku nombre categoria precio codigoBarras activo')
      .lean();
    const productosPorSku = new Map(productos.map((p) => [p.sku, p]));

    const enriquecido = inventario.map((item) => ({
      ...item,
      producto: productosPorSku.get(item.sku) || null,
    }));

    res.json({
      inventario: enriquecido,
      total,
      page,
      limite,
      totalPages: Math.ceil(total / limite),
      sucursalId,
    });
  } catch (err) {
    console.error('[INVENTARIO] Error:', err.message);
    res.status(500).json({ error: 'Error al consultar inventario' });
  }
});

module.exports = router;
