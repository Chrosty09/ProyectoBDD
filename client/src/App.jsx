import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import PuntoDeVenta from "./pages/PuntoDeVenta";
import Reportes from "./pages/Reportes";

const SUCURSALES_NOMBRES = {
  0: "Corporativo",
  1: "AGS Centro",
  2: "AGS Norte",
  3: "GDL Centro",
  4: "Zapopan",
  5: "CDMX Condesa",
  6: "CDMX Polanco",
  7: "MTY Centro",
  8: "MTY San Pedro",
  9: "Puebla",
  10: "Leon",
};

const ROLES = { admin: "Administrador", gerente: "Gerente", cajero: "Cajero" };

function IconVentas({ active }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#D2C1B6" : "#8a9eb0"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

function IconReportes({ active }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? "#D2C1B6" : "#8a9eb0"}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8a9eb0"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function Sidebar({ pagina, setPagina }) {
  const { usuario, logout } = useAuth();

  const navItem = (key, label, Icon) => {
    const active = pagina === key;
    return (
      <button
        key={key}
        onClick={() => setPagina(key)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "11px 16px",
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontSize: "14px",
          fontWeight: active ? 600 : 400,
          fontFamily: "DM Sans, sans-serif",
          background: active ? "rgba(255,255,255,0.08)" : "transparent",
          color: active ? "#F9F3EF" : "#8a9eb0",
          transition: "all 0.15s",
          borderLeft: active ? "3px solid #D2C1B6" : "3px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (!active)
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        <Icon active={active} />
        {label}
      </button>
    );
  };

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "#1B3C53",
        display: "flex",
        flexDirection: "column",
        padding: "28px 16px",
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "40px", paddingLeft: "4px" }}>
        <span
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 800,
            fontSize: "20px",
            color: "#F9F3EF",
            letterSpacing: "-0.5px",
          }}
        >
          QuickMart
        </span>
        <p
          style={{
            fontSize: "11px",
            color: "#456882",
            marginTop: "2px",
            letterSpacing: "0.5px",
          }}
        >
          Sistema Distribuido
        </p>
      </div>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          flex: 1,
        }}
      >
        {navItem("ventas", "Punto de Venta", IconVentas)}
        {usuario?.rol !== "cajero" &&
          navItem("reportes", "Reportes", IconReportes)}
      </nav>

      {/* Usuario */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: "20px",
        }}
      >
        <div style={{ marginBottom: "12px", paddingLeft: "4px" }}>
          <p
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#F9F3EF",
              marginBottom: "2px",
            }}
          >
            {usuario?.username}
          </p>
          <p style={{ fontSize: "11px", color: "#8a9eb0" }}>
            {ROLES[usuario?.rol]} · {SUCURSALES_NOMBRES[usuario?.sucursalId]}
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            width: "100%",
            padding: "9px 16px",
            borderRadius: "10px",
            border: "none",
            cursor: "pointer",
            background: "transparent",
            color: "#8a9eb0",
            fontSize: "13px",
            fontFamily: "DM Sans, sans-serif",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.05)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          <IconLogout />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}

function AppContent() {
  const { usuario } = useAuth();
  const [pagina, setPagina] = useState("ventas");

  if (!usuario) {
    return <Login onLogin={() => setPagina("ventas")} />;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F9F3EF" }}>
      <Sidebar pagina={pagina} setPagina={setPagina} />
      <main
        style={{
          marginLeft: "220px",
          flex: 1,
          padding: "36px",
          minHeight: "100vh",
        }}
      >
        {pagina === "ventas" && <PuntoDeVenta />}
        {pagina === "reportes" && <Reportes />}
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
