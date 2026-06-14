import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const SUCURSALES_NOMBRES = {
  1: 'AGS Centro', 2: 'AGS Norte', 3: 'GDL Centro', 4: 'Zapopan',
  5: 'CDMX Condesa', 6: 'CDMX Polanco', 7: 'MTY Centro',
  8: 'MTY San Pedro', 9: 'Puebla', 10: 'Leon',
};

const COLORES = ['#1e3a5f','#ea580c','#d97706','#65a30d','#0891b2','#2563eb','#7c3aed','#db2777','#059669','#b45309'];

export default function Reportes() {
  const { usuario } = useAuth();
  const [ventasPorSucursal, setVentasPorSucursal] = useState([]);
  const [ventasPorDia, setVentasPorDia]           = useState([]);
  const [productosTop, setProductosTop]           = useState([]);
  const [metodosPago, setMetodosPago]             = useState([]);
  const [sucursalSelec, setSucursalSelec]         = useState(usuario?.sucursalId || 1);
  const [loading, setLoading]                     = useState(false);

  useEffect(() => {
    cargarResumenGeneral();
  }, []);

  useEffect(() => {
    cargarDetalleSucursal(sucursalSelec);
  }, [sucursalSelec]);

  async function cargarResumenGeneral() {
    setLoading(true);
    try {
      const res = await api.get('/reportes/ventas-por-sucursal');
      const datos = res.data.sucursales.map(s => ({
        ...s,
        nombre: SUCURSALES_NOMBRES[s.sucursalId] || `S${s.sucursalId}`,
      }));
      setVentasPorSucursal(datos);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function cargarDetalleSucursal(id) {
    try {
      const [diasRes, topRes, pagosRes] = await Promise.all([
        api.get(`/reportes/ventas-por-dia/${id}`),
        api.get(`/reportes/productos-top/${id}?limite=8`),
        api.get(`/reportes/metodos-pago/${id}`),
      ]);
      setVentasPorDia(diasRes.data.datos.map(d => ({ fecha: d._id, total: d.totalVentas, ventas: d.numVentas })));
      setProductosTop(topRes.data.productos.map(p => ({ nombre: p.nombre, unidades: p.totalUnidades, ingresos: p.totalIngresos })));
      setMetodosPago(pagosRes.data.metodos.map(m => ({ name: m._id, value: m.count })));
    } catch (err) {
      console.error(err);
    }
  }

  const formatPeso = v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Reportes de Ventas</h1>

      {/* Resumen por sucursal */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Ventas totales por sucursal</h2>
        {loading ? (
          <p className="text-gray-400 text-sm">Cargando...</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ventasPorSucursal} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={formatPeso} tick={{ fontSize: 11 }} />
              <Tooltip formatter={v => formatPeso(v)} />
              <Bar dataKey="totalVentas" name="Total ventas" fill="#1e3a5f" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Selector de sucursal para detalle */}
      {usuario?.rol === 'admin' && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Ver detalle de:</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            value={sucursalSelec}
            onChange={e => setSucursalSelec(parseInt(e.target.value))}
          >
            {Object.entries(SUCURSALES_NOMBRES).map(([id, nombre]) => (
              <option key={id} value={id}>{nombre}</option>
            ))}
          </select>
        </div>
      )}

      {/* Ventas por dia */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">
          Ventas diarias — {SUCURSALES_NOMBRES[sucursalSelec]}
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={ventasPorDia} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="fecha" tick={{ fontSize: 10 }} />
            <YAxis tickFormatter={formatPeso} tick={{ fontSize: 11 }} />
            <Tooltip formatter={v => formatPeso(v)} />
            <Line type="monotone" dataKey="total" name="Total" stroke="#dc2626" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productos top */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Productos mas vendidos</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={productosTop} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="nombre" type="category" tick={{ fontSize: 10 }} width={110} />
              <Tooltip />
              <Bar dataKey="unidades" name="Unidades" fill="#dc2626" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Metodos de pago */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Metodos de pago</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={metodosPago}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {metodosPago.map((_, i) => (
                  <Cell key={i} fill={COLORES[i % COLORES.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
