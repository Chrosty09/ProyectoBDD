const express = require('express');
const {
  connections,
  clusterUris,
  getConnectionStatus,
} = require('../config/db');
const productoSchema = require('../models/Producto');
const sucursalSchema = require('../models/Sucursal');
const usuarioSchema = require('../models/Usuario');
const ventaSchema = require('../models/Venta');
const inventarioSchema = require('../models/Inventario');
const { auth } = require('../middleware/auth');

const router = express.Router();

const NODOS = [
  { key: 'hq', nombre: 'Nodo Central HQ', sucursalId: 0, tipo: 'central' },
  { key: 's01', nombre: 'Sucursal 01', sucursalId: 1, tipo: 'sucursal' },
  { key: 's02', nombre: 'Sucursal 02', sucursalId: 2, tipo: 'sucursal' },
  { key: 's03', nombre: 'Sucursal 03', sucursalId: 3, tipo: 'sucursal' },
  { key: 's04', nombre: 'Sucursal 04', sucursalId: 4, tipo: 'sucursal' },
  { key: 's05', nombre: 'Sucursal 05', sucursalId: 5, tipo: 'sucursal' },
  { key: 's06', nombre: 'Sucursal 06', sucursalId: 6, tipo: 'sucursal' },
  { key: 's07', nombre: 'Sucursal 07', sucursalId: 7, tipo: 'sucursal' },
  { key: 's08', nombre: 'Sucursal 08', sucursalId: 8, tipo: 'sucursal' },
  { key: 's09', nombre: 'Sucursal 09', sucursalId: 9, tipo: 'sucursal' },
  { key: 's10', nombre: 'Sucursal 10', sucursalId: 10, tipo: 'sucursal' },
];

function getModel(conn, name, schema) {
  return conn.models[name] || conn.model(name, schema);
}

function visibleNodesFor(user) {
  if (user.rol === 'admin') return NODOS;
  if (user.rol === 'gerente') {
    return NODOS.filter((n) => n.key === 'hq' || n.sucursalId === user.sucursalId);
  }
  return NODOS.filter((n) => n.sucursalId === user.sucursalId);
}

async function countSafe(Model) {
  try {
    return await Model.countDocuments();
  } catch {
    return null;
  }
}

async function inspectNode(node) {
  const baseStatus = getConnectionStatus(node.key);
  const conn = connections[node.key];
  const response = {
    ...node,
    configured: Boolean(clusterUris[node.key]),
    connected: baseStatus.connected,
    readyState: baseStatus.readyState,
    latenciaMs: null,
    colecciones:
      node.tipo === 'central'
        ? ['productos', 'sucursales', 'usuarios']
        : ['ventas', 'inventarios', 'usuarios'],
    conteos: {},
    error: null,
  };

  if (!conn || conn.readyState !== 1) {
    response.error = response.configured
      ? 'Conexion no disponible'
      : 'URI no configurada';
    return response;
  }

  try {
    const start = Date.now();
    await conn.db.command({ ping: 1 });
    response.latenciaMs = Date.now() - start;

    if (node.tipo === 'central') {
      const Producto = getModel(conn, 'Producto', productoSchema);
      const Sucursal = getModel(conn, 'Sucursal', sucursalSchema);
      const Usuario = getModel(conn, 'Usuario', usuarioSchema);
      response.conteos = {
        productos: await countSafe(Producto),
        sucursales: await countSafe(Sucursal),
        usuarios: await countSafe(Usuario),
      };
    } else {
      const Venta = getModel(conn, 'Venta', ventaSchema);
      const Inventario = getModel(conn, 'Inventario', inventarioSchema);
      const Usuario = getModel(conn, 'Usuario', usuarioSchema);
      response.conteos = {
        ventas: await countSafe(Venta),
        inventario: await countSafe(Inventario),
        usuarios: await countSafe(Usuario),
      };
    }
  } catch (err) {
    response.connected = false;
    response.error = err.message;
  }

  return response;
}

// GET /api/nodos/status
router.get('/status', auth, async (req, res) => {
  const visibleNodes = visibleNodesFor(req.user);
  const results = await Promise.allSettled(visibleNodes.map(inspectNode));

  const nodos = results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    const node = visibleNodes[index];
    return {
      ...node,
      configured: Boolean(clusterUris[node.key]),
      connected: false,
      readyState: 0,
      latenciaMs: null,
      colecciones: [],
      conteos: {},
      error: result.reason?.message || 'Error consultando nodo',
    };
  });

  res.json({
    nodos,
    total: nodos.length,
    visiblesPara: req.user.rol,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
