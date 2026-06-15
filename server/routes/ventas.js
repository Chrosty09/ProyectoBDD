const express = require('express');
const mongoose = require('mongoose');
const { getConn, getConnBySucursal } = require('../config/db');
const { auth, checkBranch } = require('../middleware/auth');
const ventaSchema = require('../models/Venta');
const inventarioSchema = require('../models/Inventario');
const productoSchema = require('../models/Producto');

const router = express.Router();

const METODOS_PAGO = new Set(['efectivo', 'tarjeta', 'transferencia', 'vales']);

function getModel(conn, name, schema) {
  return conn.models[name] || conn.model(name, schema);
}

function parsePositiveInt(value, fallback, max) {
  const parsed = parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function normalizeItems(items) {
  const acumulado = new Map();
  const errores = [];

  items.forEach((item, index) => {
    const sku = String(item?.sku || '').trim().toUpperCase();
    const cantidad = Number(item?.cantidad);

    if (!sku) errores.push(`Item ${index + 1}: sku requerido`);
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      errores.push(`Item ${index + 1}: cantidad debe ser entero mayor a 0`);
    }

    if (sku && Number.isInteger(cantidad) && cantidad > 0) {
      acumulado.set(sku, (acumulado.get(sku) || 0) + cantidad);
    }
  });

  return {
    errores,
    itemsNormalizados: Array.from(acumulado.entries()).map(([sku, cantidad]) => ({
      sku,
      cantidad,
    })),
  };
}

async function compensateStock(Inventario, sucursalId, appliedUpdates) {
  await Promise.all(
    appliedUpdates.map((item) =>
      Inventario.updateOne(
        { sucursalId, sku: item.sku },
        { $inc: { stock: item.cantidad } },
      ),
    ),
  );
}

// POST /api/ventas
// Registra una nueva venta en el cluster de la sucursal autenticada.
router.post('/', auth, async (req, res) => {
  const { items, metodoPago } = req.body;
  const sucursalId = Number(req.user?.sucursalId);

  if (!Number.isInteger(sucursalId) || sucursalId < 1 || sucursalId > 10) {
    return res.status(403).json({
      error: 'El usuario actual no pertenece a una sucursal operativa para vender',
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items debe ser un arreglo no vacio' });
  }

  if (!METODOS_PAGO.has(metodoPago)) {
    return res.status(400).json({
      error: 'metodoPago invalido',
      permitidos: Array.from(METODOS_PAGO),
    });
  }

  const { errores, itemsNormalizados } = normalizeItems(items);
  if (errores.length) {
    return res.status(400).json({ error: 'Items invalidos', detalles: errores });
  }

  try {
    const connHQ = getConn('hq');
    const connSucursal = getConnBySucursal(sucursalId);

    const Producto = getModel(connHQ, 'Producto', productoSchema);
    const Venta = getModel(connSucursal, 'Venta', ventaSchema);
    const Inventario = getModel(connSucursal, 'Inventario', inventarioSchema);

    const skus = itemsNormalizados.map((item) => item.sku);
    const [productos, inventarios] = await Promise.all([
      Producto.find({ sku: { $in: skus }, activo: true }).lean(),
      Inventario.find({ sucursalId, sku: { $in: skus } }).lean(),
    ]);

    const productosPorSku = new Map(productos.map((producto) => [producto.sku, producto]));
    const inventarioPorSku = new Map(inventarios.map((inventario) => [inventario.sku, inventario]));

    const faltantes = skus.filter((sku) => !productosPorSku.has(sku));
    if (faltantes.length) {
      return res.status(404).json({
        error: 'Uno o mas productos no existen o estan inactivos',
        skus: faltantes,
      });
    }

    const sinStock = [];
    for (const item of itemsNormalizados) {
      const producto = productosPorSku.get(item.sku);
      const inv = inventarioPorSku.get(item.sku);
      if (!inv || inv.stock < item.cantidad) {
        sinStock.push({
          sku: item.sku,
          nombre: producto.nombre,
          solicitado: item.cantidad,
          disponible: inv?.stock || 0,
        });
      }
    }

    if (sinStock.length) {
      return res.status(409).json({
        error: 'Stock insuficiente',
        productos: sinStock,
      });
    }

    let total = 0;
    let cantidadTotal = 0;
    const itemsVenta = itemsNormalizados.map((item) => {
      const producto = productosPorSku.get(item.sku);
      const subtotal = parseFloat((producto.precio * item.cantidad).toFixed(2));
      total += subtotal;
      cantidadTotal += item.cantidad;
      return {
        productoId: producto._id,
        sku: producto.sku,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnit: producto.precio,
        subtotal,
      };
    });

    const appliedUpdates = [];
    for (const item of itemsNormalizados) {
      const result = await Inventario.updateOne(
        { sucursalId, sku: item.sku, stock: { $gte: item.cantidad } },
        { $inc: { stock: -item.cantidad } },
      );

      if (result.modifiedCount !== 1) {
        await compensateStock(Inventario, sucursalId, appliedUpdates);
        return res.status(409).json({
          error: 'Stock insuficiente al confirmar la venta',
          sku: item.sku,
        });
      }

      appliedUpdates.push(item);
    }

    try {
      const venta = await Venta.create({
        sucursalId,
        cajeroId: req.user.userId,
        cajeroNombre: req.user.username,
        items: itemsVenta,
        total: parseFloat(total.toFixed(2)),
        metodoPago,
        timestamp: new Date(),
      });

      res.status(201).json({
        message: 'Venta registrada correctamente',
        mensaje: 'Venta registrada correctamente',
        venta,
        ticket: {
          id: venta._id,
          sucursalId,
          cajero: req.user.username,
          cantidadTotal,
          total: venta.total,
          metodoPago,
          createdAt: venta.timestamp,
          items: itemsVenta,
        },
      });
    } catch (err) {
      await compensateStock(Inventario, sucursalId, appliedUpdates);
      console.error('[VENTAS] Error creando venta; stock compensado:', err.message);
      res.status(500).json({
        error: 'Error creando venta; se intento compensar el inventario',
      });
    }
  } catch (err) {
    console.error('[VENTAS] Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /api/ventas/sucursal/:sucursalId
router.get('/sucursal/:sucursalId', auth, checkBranch, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId, 10);
  const {
    desde,
    hasta,
    metodoPago,
    cajero,
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
    const conn = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);

    const filtro = { sucursalId };
    if (desde || hasta) {
      filtro.timestamp = {};
      if (desde) filtro.timestamp.$gte = new Date(desde);
      if (hasta) filtro.timestamp.$lte = new Date(hasta);
    }
    if (metodoPago) filtro.metodoPago = metodoPago;
    if (cajero) filtro.cajeroNombre = cajero;

    const [ventas, total] = await Promise.all([
      Venta.find(filtro).sort({ timestamp: -1 }).skip(skip).limit(limite).lean(),
      Venta.countDocuments(filtro),
    ]);

    res.json({
      sucursalId,
      ventas,
      total,
      page,
      limite,
      totalPages: Math.ceil(total / limite),
    });
  } catch (err) {
    console.error('[VENTAS] Error:', err.message);
    res.status(500).json({ error: 'Error consultando historial de ventas' });
  }
});

// GET /api/ventas/:id?sucursalId=1
router.get('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const querySucursal = req.query.sucursalId
    ? parseInt(req.query.sucursalId, 10)
    : null;
  const sucursalId =
    req.user.rol === 'admin' ? querySucursal : Number(req.user.sucursalId);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'id de venta invalido' });
  }

  if (!Number.isInteger(sucursalId) || sucursalId < 1 || sucursalId > 10) {
    return res.status(400).json({
      error: 'sucursalId valido es requerido para consultar la venta',
    });
  }

  if (req.user.rol !== 'admin' && req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
  }

  try {
    const conn = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);
    const venta = await Venta.findOne({ _id: id, sucursalId }).lean();

    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    res.json({ venta });
  } catch (err) {
    console.error('[VENTAS] Error:', err.message);
    res.status(500).json({ error: 'Error consultando venta' });
  }
});

module.exports = router;
