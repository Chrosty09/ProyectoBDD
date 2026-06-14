import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SUCURSALES = [
  { id: 0,  nombre: 'Corporativo (Admin)' },
  { id: 1,  nombre: 'Aguascalientes Centro' },
  { id: 2,  nombre: 'Aguascalientes Norte' },
  { id: 3,  nombre: 'Guadalajara Centro' },
  { id: 4,  nombre: 'Guadalajara Zapopan' },
  { id: 5,  nombre: 'CDMX Condesa' },
  { id: 6,  nombre: 'CDMX Polanco' },
  { id: 7,  nombre: 'Monterrey Centro' },
  { id: 8,  nombre: 'Monterrey San Pedro' },
  { id: 9,  nombre: 'Puebla Centro' },
  { id: 10, nombre: 'Leon Guanajuato' },
];

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '', sucursalId: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const usuario = await login(form.username, form.password, parseInt(form.sucursalId));
      onLogin(usuario);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesion');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        <div className="text-center mb-8">
          <div className="text-5xl font-black text-blue-900 tracking-tight">QuickMart</div>
          <p className="text-gray-500 mt-1 text-sm">Sistema de Ventas Distribuido</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.sucursalId}
              onChange={e => setForm({ ...form, sucursalId: e.target.value })}
            >
              {SUCURSALES.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="username"
              value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          UAA — Base de Datos Distribuidas 2026
        </p>
      </div>
    </div>
  );
}
