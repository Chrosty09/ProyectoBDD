import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import PuntoDeVenta from './pages/PuntoDeVenta';
import Reportes from './pages/Reportes';
import Navbar from './components/Navbar';

function AppContent() {
  const { usuario, logout } = useAuth();
  const [pagina, setPagina] = useState('ventas');

  if (!usuario) {
    return <Login onLogin={() => setPagina('ventas')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar pagina={pagina} setPagina={setPagina} />
      <main className="py-6">
        {pagina === 'ventas'   && <PuntoDeVenta />}
        {pagina === 'reportes' && <Reportes />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
