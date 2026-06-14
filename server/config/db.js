const mongoose = require('mongoose');

// Mapa de conexiones activas: { hq, s01, s02, ... }
const connections = {};

// URIs de cada cluster desde las variables de entorno
const clusterUris = {
  hq:  process.env.MONGO_HQ,
  s01: process.env.MONGO_S01,
  s02: process.env.MONGO_S02,
  s03: process.env.MONGO_S03,
  s04: process.env.MONGO_S04,
  s05: process.env.MONGO_S05,
  s06: process.env.MONGO_S06,
  s07: process.env.MONGO_S07,
  s08: process.env.MONGO_S08,
  s09: process.env.MONGO_S09,
  s10: process.env.MONGO_S10,
};

// Conecta a todos los clusters que tengan URI definida en el .env
async function connectAll() {
  const entries = Object.entries(clusterUris).filter(([, uri]) => uri);

  await Promise.all(
    entries.map(async ([key, uri]) => {
      try {
        const conn = await mongoose.createConnection(uri).asPromise();
        connections[key] = conn;
        console.log(`[DB] Conectado: ${key}`);
      } catch (err) {
        console.error(`[DB] Error conectando ${key}:`, err.message);
      }
    })
  );
}

// Devuelve la conexion de un cluster por clave ('hq', 's01', etc.)
function getConn(key) {
  const conn = connections[key];
  if (!conn) throw new Error(`Conexion '${key}' no disponible`);
  return conn;
}

// Devuelve la conexion correspondiente a un sucursalId (1-10)
// sucursalId puede venir como numero o string ('1', '01', 1)
function getConnBySucursal(sucursalId) {
  const key = 's' + String(sucursalId).padStart(2, '0');
  return getConn(key);
}

module.exports = { connectAll, getConn, getConnBySucursal };
