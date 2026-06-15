import { useEffect, useMemo, useState } from "react";
import api from "../api/axios";

const card = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #ede7e0",
  padding: "22px",
};

function stateLabel(readyState) {
  const states = {
    0: "desconectado",
    1: "conectado",
    2: "conectando",
    3: "desconectando",
  };
  return states[readyState] || "desconocido";
}

export default function Nodos() {
  const [nodos, setNodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarNodos();
  }, []);

  async function cargarNodos() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/nodos/status");
      setNodos(res.data.nodos || []);
    } catch (err) {
      setError(err.response?.data?.error || "Error al consultar nodos");
    } finally {
      setLoading(false);
    }
  }

  const resumen = useMemo(() => {
    const conectados = nodos.filter((nodo) => nodo.connected).length;
    return {
      conectados,
      total: nodos.length,
      fallidos: nodos.length - conectados,
    };
  }, [nodos]);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Sora, sans-serif",
              fontSize: "26px",
              color: "#1B3C53",
              marginBottom: "4px",
            }}
          >
            Estado de Nodos
          </h1>
          <p style={{ color: "#8a9eb0", fontSize: "14px" }}>
            Nodo central HQ y sucursales visibles segun el rol autenticado.
          </p>
        </div>
        <button onClick={cargarNodos} style={button}>
          Actualizar
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <Summary label="Nodos visibles" value={resumen.total} />
        <Summary label="Conectados" value={resumen.conectados} tone="ok" />
        <Summary label="Con error" value={resumen.fallidos} tone="warn" />
      </div>

      <div style={{ ...card, marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            color: "#1B3C53",
            marginBottom: "8px",
          }}
        >
          Mapa logico de distribucion
        </p>
        <p style={{ color: "#456882", lineHeight: 1.65, fontSize: "14px" }}>
          HQ concentra catalogo, sucursales y administradores. Cada sucursal
          guarda ventas, inventario y usuarios locales. Los reportes globales
          reconstruyen informacion consultando varios nodos desde la API.
        </p>
      </div>

      {error && <Alert>{error}</Alert>}
      {loading ? (
        <div style={card}>Consultando estado tecnico...</div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
          }}
        >
          {nodos.map((nodo) => (
            <NodeCard key={nodo.key} nodo={nodo} />
          ))}
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, tone }) {
  const color = tone === "ok" ? "#2d6b42" : tone === "warn" ? "#b47a2c" : "#1B3C53";
  return (
    <div style={card}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: "#8a9eb0",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 800,
          fontSize: "28px",
          color,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function NodeCard({ nodo }) {
  const ok = nodo.connected;
  return (
    <div
      style={{
        ...card,
        borderColor: ok ? "#b2d9be" : "#f5c6c0",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <p
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 800,
              color: "#1B3C53",
            }}
          >
            {nodo.nombre}
          </p>
          <p style={{ fontSize: "12px", color: "#8a9eb0" }}>
            {nodo.key} - {nodo.tipo}
          </p>
        </div>
        <span
          style={{
            height: "24px",
            borderRadius: "999px",
            padding: "4px 10px",
            fontSize: "12px",
            fontWeight: 800,
            background: ok ? "#eef7f0" : "#fff0ee",
            color: ok ? "#2d6b42" : "#b94040",
          }}
        >
          {ok ? "OK" : "ERROR"}
        </span>
      </div>

      <div style={{ display: "grid", gap: "8px", fontSize: "13px" }}>
        <Info label="Ready state" value={stateLabel(nodo.readyState)} />
        <Info
          label="Latencia"
          value={nodo.latenciaMs === null ? "N/D" : `${nodo.latenciaMs} ms`}
        />
        <Info label="Sucursal" value={nodo.sucursalId} />
      </div>

      <div style={{ marginTop: "14px" }}>
        <p style={miniLabel}>Colecciones</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {(nodo.colecciones || []).map((coleccion) => (
            <span key={coleccion} style={pill}>
              {coleccion}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: "14px" }}>
        <p style={miniLabel}>Conteos</p>
        <div style={{ display: "grid", gap: "5px" }}>
          {Object.entries(nodo.conteos || {}).map(([key, value]) => (
            <Info key={key} label={key} value={value ?? "N/D"} />
          ))}
        </div>
      </div>

      {nodo.error && <Alert compact>{nodo.error}</Alert>}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
      <span style={{ color: "#8a9eb0" }}>{label}</span>
      <strong style={{ color: "#1B3C53" }}>{value}</strong>
    </div>
  );
}

function Alert({ children, compact }) {
  return (
    <div
      style={{
        marginTop: compact ? "12px" : "0",
        marginBottom: compact ? "0" : "16px",
        borderRadius: "10px",
        padding: "12px 14px",
        background: "#fff0ee",
        border: "1px solid #f5c6c0",
        color: "#b94040",
        fontSize: "13px",
      }}
    >
      {children}
    </div>
  );
}

const button = {
  border: "none",
  borderRadius: "10px",
  padding: "10px 14px",
  background: "#1B3C53",
  color: "#F9F3EF",
  fontWeight: 800,
  cursor: "pointer",
};

const miniLabel = {
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "1px",
  textTransform: "uppercase",
  color: "#456882",
  marginBottom: "8px",
};

const pill = {
  borderRadius: "999px",
  padding: "5px 8px",
  background: "#F9F3EF",
  color: "#456882",
  fontSize: "12px",
  fontWeight: 700,
};
