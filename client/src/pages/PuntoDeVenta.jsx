import { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const SUCURSALES_NOMBRES = {
  1: "Aguascalientes Centro",
  2: "Aguascalientes Norte",
  3: "Guadalajara Centro",
  4: "Guadalajara Zapopan",
  5: "CDMX Condesa",
  6: "CDMX Polanco",
  7: "Monterrey Centro",
  8: "Monterrey San Pedro",
  9: "Puebla Centro",
  10: "Leon Guanajuato",
};

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia"];

const card = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #ede7e0",
  padding: "24px",
};

export default function PuntoDeVenta() {
  const { usuario } = useAuth();
  const [sku, setSku] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function agregarItem() {
    if (!sku.trim()) return;
    const existente = items.find((i) => i.sku === sku.trim());
    if (existente) {
      setItems(
        items.map((i) =>
          i.sku === sku.trim()
            ? { ...i, cantidad: i.cantidad + parseInt(cantidad) }
            : i,
        ),
      );
    } else {
      setItems([...items, { sku: sku.trim(), cantidad: parseInt(cantidad) }]);
    }
    setSku("");
    setCantidad(1);
  }

  function quitarItem(skuItem) {
    setItems(items.filter((i) => i.sku !== skuItem));
  }

  async function registrarVenta() {
    if (!items.length) return;
    setLoading(true);
    setError("");
    setMensaje(null);
    try {
      const res = await api.post("/ventas", { items, metodoPago });
      setMensaje(
        `Venta registrada correctamente — Total: $${res.data.venta.total.toFixed(2)}`,
      );
      setItems([]);
    } catch (err) {
      setError(err.response?.data?.error || "Error al registrar la venta");
    } finally {
      setLoading(false);
    }
  }

  const labelStyle = {
    display: "block",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "1.2px",
    textTransform: "uppercase",
    color: "#456882",
    marginBottom: "8px",
  };

  const inputStyle = {
    borderRadius: "10px",
    padding: "11px 14px",
    fontSize: "14px",
    outline: "none",
    border: "1.5px solid #D2C1B6",
    color: "#1B3C53",
    background: "#faf7f5",
    fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.15s",
  };

  return (
    <div style={{ maxWidth: "640px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "26px",
            color: "#1B3C53",
            marginBottom: "4px",
          }}
        >
          Punto de Venta
        </h1>
        <p style={{ fontSize: "14px", color: "#8a9eb0" }}>
          {SUCURSALES_NOMBRES[usuario?.sucursalId] || "Corporativo"} ·{" "}
          {usuario?.username}
        </p>
      </div>

      {/* Agregar producto */}
      <div style={{ ...card, marginBottom: "16px" }}>
        <p style={labelStyle}>Agregar producto por SKU</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="ej: SKU-1042"
            style={{ ...inputStyle, flex: 1 }}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            onFocus={(e) => (e.target.style.borderColor = "#456882")}
            onBlur={(e) => (e.target.style.borderColor = "#D2C1B6")}
            onKeyDown={(e) => e.key === "Enter" && agregarItem()}
          />
          <input
            type="number"
            min={1}
            style={{ ...inputStyle, width: "72px", textAlign: "center" }}
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
          />
          <button
            onClick={agregarItem}
            style={{
              padding: "11px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#1B3C53",
              color: "#F9F3EF",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#456882")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1B3C53")}
          >
            + Agregar
          </button>
        </div>
      </div>

      {/* Lista de items */}
      {items.length > 0 && (
        <div style={{ ...card, marginBottom: "16px" }}>
          <p style={labelStyle}>Productos en la venta</p>
          <div>
            {items.map((item, idx) => (
              <div
                key={item.sku}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 0",
                  borderBottom:
                    idx < items.length - 1 ? "1px solid #f0ebe5" : "none",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: "#F9F3EF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#456882",
                    }}
                  >
                    {item.cantidad}
                  </div>
                  <span
                    style={{
                      fontFamily: "DM Sans, sans-serif",
                      fontWeight: 500,
                      fontSize: "14px",
                      color: "#1B3C53",
                    }}
                  >
                    {item.sku}
                  </span>
                </div>
                <button
                  onClick={() => quitarItem(item.sku)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#c0756a",
                    fontFamily: "DM Sans, sans-serif",
                  }}
                >
                  Quitar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metodo de pago y confirmar */}
      <div style={card}>
        <p style={labelStyle}>Metodo de pago</p>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {METODOS_PAGO.map((m) => (
            <button
              key={m}
              onClick={() => setMetodoPago(m)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "10px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 500,
                textTransform: "capitalize",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.15s",
                background: metodoPago === m ? "#1B3C53" : "white",
                color: metodoPago === m ? "#F9F3EF" : "#456882",
                border:
                  metodoPago === m
                    ? "1.5px solid #1B3C53"
                    : "1.5px solid #D2C1B6",
              }}
            >
              {m}
            </button>
          ))}
        </div>

        {error && (
          <div
            style={{
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "13px",
              background: "#fff0ee",
              border: "1px solid #f5c6c0",
              color: "#b94040",
              marginBottom: "12px",
            }}
          >
            {error}
          </div>
        )}
        {mensaje && (
          <div
            style={{
              borderRadius: "10px",
              padding: "12px 16px",
              fontSize: "13px",
              background: "#eef7f0",
              border: "1px solid #b2d9be",
              color: "#2d6b42",
              marginBottom: "12px",
            }}
          >
            {mensaje}
          </div>
        )}

        <button
          onClick={registrarVenta}
          disabled={loading || !items.length}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: !items.length || loading ? "#D2C1B6" : "#1B3C53",
            color: "#F9F3EF",
            fontFamily: "Sora, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            cursor: !items.length || loading ? "not-allowed" : "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (items.length && !loading)
              e.currentTarget.style.background = "#456882";
          }}
          onMouseLeave={(e) => {
            if (items.length && !loading)
              e.currentTarget.style.background = "#1B3C53";
          }}
        >
          {loading
            ? "Registrando..."
            : items.length
              ? `Confirmar venta · ${items.length} producto${items.length !== 1 ? "s" : ""}`
              : "Agrega productos para continuar"}
        </button>
      </div>
    </div>
  );
}
