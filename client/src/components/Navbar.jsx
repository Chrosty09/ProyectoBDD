import { useAuth } from '../context/AuthContext';

const ROLES = {
  admin:   'Administrador',
  gerente: 'Gerente',
  cajero:  'Cajero',
};

const SUCURSALES = {
  0: 'Corporativo', 1: 'AGS Centro', 2: 'AGS Norte', 3: 'GDL Centro',
  4: 'Zapopan', 5: 'CDMX Condesa', 6: 'CDMX Polanco', 7: 'MTY Centro',
  8: 'MTY San Pedro', 9: 'Puebla', 10: 'Leon',
};

export default function Navbar({ pagina, setPagina }) {
  const { usuario, logout } = useAuth();

  return (
    <nav className="bg-blue-900 text-white px-6 py-3 flex items-center justify-between shadow-md">
      <div className="flex items-center gap-6">
        <span className="font-black text-xl tracking-tight">QuickMart</span>
        <div className="flex gap-1">
          <button
            onClick={() => setPagina('ventas')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              pagina === 'ventas' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
            }`}
          >
            Punto de Venta
          </button>
          {usuario?.rol !== 'cajero' && (
            <button
              onClick={() => setPagina('reportes')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pagina === 'reportes' ? 'bg-white text-blue-900' : 'hover:bg-blue-800'
              }`}
            >
              Reportes
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="text-right">
          <p className="font-medium">{usuario?.username}</p>
          <p className="text-blue-200 text-xs">
            {ROLES[usuario?.rol]} — {SUCURSALES[usuario?.sucursalId]}
          </p>
        </div>
        <button
          onClick={logout}
          className="bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-sm transition-colors"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}
