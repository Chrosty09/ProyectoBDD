import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];

export default function PuntoDeVenta() {
  const { usuario } = useAuth();
  const [sku, setSku]           = useState('');
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems]       = useState([]);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [mensaje, setMensaje]   = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function agregarItem() {
    if (!sku.trim()) return;
    const existente = items.find(i => i.sku === sku.trim());
    if (existente) {
      setItems(items.map(i =>
        i.sku === sku.trim() ? { ...i, cantidad: i.cantidad + parseInt(cantidad) } : i
      ));
    } else {
      setItems([...items, { sku: sku.trim(), cantidad: parseInt(cantidad) }]);
    }
    setSku('');
    setCantidad(1);
  }

  function quitarItem(skuItem) {
    setItems(items.filter(i => i.sku !== skuItem));
  }

  async function registrarVenta() {
    if (!items.length) return;
    setLoading(true);
    setError('');
    setMensaje(null);
    try {
      const res = await api.post('/ventas', { items, metodoPago });
      setMensaje(`Venta registrada — Total: $${res.data.venta.total.toFixed(2)}`);
      setItems([]);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Punto de Venta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Sucursal {usuario?.sucursalId} — {usuario?.username}
      </p>

      {/* Agregar producto */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h2 className="font-semibold text-gray-700 mb-3">Agregar producto</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="SKU del producto (ej: SKU-1000)"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={sku}
            onChange={e => setSku(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && agregarItem()}
          />
          <input
            type="number"
            min={1}
            className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
          />
          <button
            onClick={agregarItem}
            className="bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de items */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-3">Productos en la venta</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.sku} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="font-mono text-sm font-medium">{item.sku}</span>
                  <span className="text-gray-500 text-sm ml-2">x{item.cantidad}</span>
                </div>
                <button
                  onClick={() => quitarItem(item.sku)}
                  className="text-blue-900 hover:text-blue-800 text-sm"
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metodo de pago y confirmar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-700 mb-3">Metodo de pago</h2>
        <div className="flex gap-2 mb-4">
          {METODOS_PAGO.map(m => (
            <button
              key={m}
              onClick={() => setMetodoPago(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize ${
                metodoPago === m
                  ? 'bg-blue-900 text-white border-blue-900'
                  : 'border-gray-300 text-gray-600 hover:border-blue-400'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}
        {mensaje && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2 mb-3">
            {mensaje}
          </div>
        )}

        <button
          onClick={registrarVenta}
          disabled={loading || !items.length}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          {loading ? 'Registrando...' : `Registrar venta (${items.length} producto${items.length !== 1 ? 's' : ''})`}
        </button>
      </div>
    </div>
  );
}
