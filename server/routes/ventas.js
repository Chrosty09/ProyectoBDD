const express  = require('express');
const { getConn, getConnBySucursal } = require('../config/db');
const { auth, checkBranch } = require('../middleware/auth');
const ventaSchema      = require('../models/Venta');
const inventarioSchema = require('../models/Inventario');
const productoSchema   = require('../models/Producto');

const router = express.Router();

// POST /api/ventas
// Registra una nueva venta en el cluster de la sucursal autenticada
// Body: { items: [{ sku, cantidad }], metodoPago }
router.post('/', auth, async (req, res) => {
  const { items, metodoPago } = req.body;
  const sucursalId = req.user.sucursalId;

  if (!items || !items.length || !metodoPago) {
    return res.status(400).json({ error: 'items y metodoPago son requeridos' });
  }

  try {
    const connHQ      = getConn('hq');
    const connSucursal = getConnBySucursal(sucursalId);

    const Producto   = connHQ.model('Producto', productoSchema);
    const Venta      = connSucursal.model('Venta', ventaSchema);
    const Inventario = connSucursal.model('Inventario', inventarioSchema);

    // Construir los items de la venta con datos reales del catalogo
    let total = 0;
    const itemsVenta = [];

    for (const item of items) {
      const producto = await Producto.findOne({ sku: item.sku, activo: true });
      if (!producto) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.sku}` });
      }

      // Verificar stock en la sucursal
      const inv = await Inventario.findOne({ sucursalId, sku: item.sku });
      if (!inv || inv.stock < item.cantidad) {
        return res.status(400).json({ error: `Stock insuficiente para: ${producto.nombre}` });
      }

      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      total += subtotal;

      itemsVenta.push({
        productoId: producto._id,
        sku:        producto.sku,
        nombre:     producto.nombre,
        cantidad:   item.cantidad,
        precioUnit: producto.precio,
        subtotal,
      });

      // Descontar del inventario
      await Inventario.updateOne(
        { sucursalId, sku: item.sku },
        { $inc: { stock: -item.cantidad } }
      );
    }

    const venta = await Venta.create({
      sucursalId,
      cajeroId:     req.user.userId,
      cajeroNombre: req.user.username,
      items:        itemsVenta,
      total:        parseFloat(total.toFixed(2)),
      metodoPago,
      timestamp:    new Date(),
    });

    res.status(201).json({ mensaje: 'Venta registrada', venta });
  } catch (err) {
    console.error('[VENTAS] Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ventas/sucursal/:sucursalId
// Historial de ventas de una sucursal (solo su propio personal o admin)
// Query params: desde, hasta (fechas ISO), limite (default 50)
router.get('/sucursal/:sucursalId', auth, checkBranch, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId);
  const { desde, hasta, limite = 50 } = req.query;

  try {
    const conn  = getConnBySucursal(sucursalId);
    const Venta = conn.model('Venta', ventaSchema);

    const filtro = { sucursalId };
    if (desde || hasta) {
      filtro.timestamp = {};
      if (desde) filtro.timestamp.$gte = new Date(desde);
      if (hasta) filtro.timestamp.$lte = new Date(hasta);
    }

    const ventas = await Venta.find(filtro)
      .sort({ timestamp: -1 })
      .limit(parseInt(limite));

    res.json({ sucursalId, total: ventas.length, ventas });
  } catch (err) {
    console.error('[VENTAS] Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
