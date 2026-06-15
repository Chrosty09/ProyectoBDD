const express = require('express');
const { getConnBySucursal, getConn } = require('../config/db');
const { auth, soloGerentes } = require('../middleware/auth');
const ventaSchema   = require('../models/Venta');
const productoSchema = require('../models/Producto');

const router = express.Router();

// Sucursales disponibles en el sistema
const TODAS_SUCURSALES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function getModel(conn, name, schema) {
  return conn.models[name] || conn.model(name, schema);
}

// Ejecuta el pipeline de agregacion en una sucursal y retorna el resultado
async function agregadoPorSucursal(sucursalId, pipeline) {
  try {
    const conn  = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);
    const resultado = await Venta.aggregate(pipeline);
    return { sucursalId, data: resultado, error: null };
  } catch (err) {
    return { sucursalId, data: [], error: err.message };
  }
}

// GET /api/reportes/ventas-por-sucursal
// Reporte de ventas totales agrupadas por sucursal
// Query: desde, hasta, sucursales (csv: "1,2,3", default todas)
router.get('/ventas-por-sucursal', auth, soloGerentes, async (req, res) => {
  const { desde, hasta, sucursales } = req.query;

  // Determinar que sucursales consultar
  let ids = TODAS_SUCURSALES;
  if (sucursales) {
    ids = sucursales.split(',').map(Number).filter(n => n >= 1 && n <= 10);
  }
  // Un gerente solo puede ver su propia sucursal a menos que sea admin
  if (req.user.rol === 'gerente') {
    ids = [req.user.sucursalId];
  }

  const matchFecha = {};
  if (desde || hasta) {
    matchFecha.timestamp = {};
    if (desde) matchFecha.timestamp.$gte = new Date(desde);
    if (hasta) matchFecha.timestamp.$lte = new Date(hasta);
  }

  const pipeline = [
    { $match: matchFecha },
    {
      $group: {
        _id:          '$sucursalId',
        totalVentas:  { $sum: '$total' },
        numVentas:    { $count: {} },
        ticketPromedio: { $avg: '$total' },
      },
    },
    { $sort: { totalVentas: -1 } },
  ];

  try {
    // Consultar todas las sucursales en paralelo sin romper el reporte global
    // si un nodo falla.
    const settled = await Promise.allSettled(
      ids.map(id => agregadoPorSucursal(id, pipeline))
    );
    const resultados = settled.map((result, index) => {
      if (result.status === 'fulfilled') return result.value;
      return {
        sucursalId: ids[index],
        data: [],
        error: result.reason?.message || 'Error consultando nodo',
      };
    });

    // Aplanar y combinar resultados
    const resumen = resultados.map(r => {
      const dato = r.data[0] || {};
      return {
        sucursalId:     r.sucursalId,
        totalVentas:    parseFloat((dato.totalVentas || 0).toFixed(2)),
        numVentas:      dato.numVentas || 0,
        ticketPromedio: parseFloat((dato.ticketPromedio || 0).toFixed(2)),
        error:          r.error,
      };
    });

    res.json({ desde, hasta, sucursales: resumen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/ventas-por-dia/:sucursalId
// Ventas diarias de una sucursal en un rango de fechas
router.get('/ventas-por-dia/:sucursalId', auth, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId);
  const { desde, hasta } = req.query;

  // Verificar acceso
  if (req.user.rol !== 'admin' && req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
  }

  const matchFecha = { sucursalId };
  if (desde || hasta) {
    matchFecha.timestamp = {};
    if (desde) matchFecha.timestamp.$gte = new Date(desde);
    if (hasta) matchFecha.timestamp.$lte = new Date(hasta);
  }

  try {
    const conn  = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);

    const datos = await Venta.aggregate([
      { $match: matchFecha },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' },
          },
          totalVentas: { $sum: '$total' },
          numVentas:   { $count: {} },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ sucursalId, datos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/productos-top/:sucursalId
// Productos mas vendidos en una sucursal
router.get('/productos-top/:sucursalId', auth, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId);
  const limite = parseInt(req.query.limite) || 10;

  if (req.user.rol !== 'admin' && req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
  }

  try {
    const conn  = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);

    const datos = await Venta.aggregate([
      { $match: { sucursalId } },
      { $unwind: '$items' },
      {
        $group: {
          _id:            '$items.sku',
          nombre:         { $first: '$items.nombre' },
          totalUnidades:  { $sum: '$items.cantidad' },
          totalIngresos:  { $sum: '$items.subtotal' },
        },
      },
      { $sort: { totalUnidades: -1 } },
      { $limit: limite },
    ]);

    res.json({ sucursalId, productos: datos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reportes/metodos-pago/:sucursalId
// Distribucion de metodos de pago en una sucursal
router.get('/metodos-pago/:sucursalId', auth, async (req, res) => {
  const sucursalId = parseInt(req.params.sucursalId);

  if (req.user.rol !== 'admin' && req.user.sucursalId !== sucursalId) {
    return res.status(403).json({ error: 'Acceso denegado a esta sucursal' });
  }

  try {
    const conn  = getConnBySucursal(sucursalId);
    const Venta = getModel(conn, 'Venta', ventaSchema);

    const datos = await Venta.aggregate([
      { $match: { sucursalId } },
      {
        $group: {
          _id:   '$metodoPago',
          total: { $sum: '$total' },
          count: { $count: {} },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ sucursalId, metodos: datos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
