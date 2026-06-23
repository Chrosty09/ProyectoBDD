import { useEffect, useMemo, useRef, useState } from "react";
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

const METODOS_PAGO = ["efectivo", "tarjeta", "transferencia", "vales"];

const card = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #ede7e0",
  padding: "22px",
};

const labelStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "1.1px",
  textTransform: "uppercase",
  color: "#456882",
  marginBottom: "8px",
};

const inputStyle = {
  width: "100%",
  borderRadius: "10px",
  padding: "11px 14px",
  fontSize: "14px",
  outline: "none",
  border: "1.5px solid #D2C1B6",
  color: "#1B3C53",
  background: "#faf7f5",
  fontFamily: "DM Sans, sans-serif",
};

function formatPeso(value) {
  return `$${Number(value || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getProducto(item) {
  return (
    item.producto || {
      sku: item.sku,
      nombre: item.nombreProducto,
      precio: 0,
      categoria: "Sin categoria",
    }
  );
}

export default function PuntoDeVenta() {
  const inventarioRequestId = useRef(0);
  const { usuario } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [inventario, setInventario] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [items, setItems] = useState([]);
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);
  const [loadingVenta, setLoadingVenta] = useState(false);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const sucursalId = usuario?.sucursalId;
  const puedeVender = Number.isInteger(sucursalId) && sucursalId >= 1;

  useEffect(() => {
    if (!puedeVender) return;
    cargarInventario();
    cargarHistorial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puedeVender, sucursalId]);

  useEffect(() => {
    if (!puedeVender) return;
    const timer = setTimeout(() => cargarInventario(busqueda), 280);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busqueda, puedeVender, sucursalId]);

  async function cargarInventario(q = "") {
    const requestId = ++inventarioRequestId.current;
    setLoadingCatalogo(true);
    setError("");

    try {
      const params = new URLSearchParams({ limite: "20" });
      if (q.trim()) params.set("q", q.trim());

      const res = await api.get(
        `/inventario/sucursal/${sucursalId}?${params.toString()}`,
      );

      if (requestId !== inventarioRequestId.current) return;
      setInventario(res.data.inventario || []);
    } catch (err) {
      if (requestId !== inventarioRequestId.current) return;
      setInventario([]);
      setError(err.response?.data?.error || "Error al consultar inventario");
    } finally {
      if (requestId === inventarioRequestId.current) {
        setLoadingCatalogo(false);
      }
    }
  }

  async function cargarHistorial() {
  setLoadingHistorial(true);
  setError("");

  try {
    const res = await api.get(`/ventas/sucursal/${sucursalId}?limite=8`);
    setHistorial(res.data.ventas || []);
  } catch (err) {
    setError(err.response?.data?.error || "Error al consultar historial");
  } finally {
    setLoadingHistorial(false);
  }
}

  function agregarProducto(inventarioItem) {
    const producto = getProducto(inventarioItem);
    if (!producto?.sku || inventarioItem.stock <= 0) return;
    setTicket(null);
    setError("");
    setItems((prev) => {
      const existente = prev.find((item) => item.sku === producto.sku);
      if (existente) {
        if (existente.cantidad >= inventarioItem.stock) return prev;
        return prev.map((item) =>
          item.sku === producto.sku
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          sku: producto.sku,
          nombre: producto.nombre || inventarioItem.nombreProducto,
          categoria: producto.categoria,
          precio: Number(producto.precio || 0),
          stock: inventarioItem.stock,
          cantidad: 1,
        },
      ];
    });
  }

  function cambiarCantidad(sku, delta) {
    setItems((prev) =>
      prev
        .map((item) => {
          if (item.sku !== sku) return item;
          const next = item.cantidad + delta;
          return {
            ...item,
            cantidad: Math.max(0, Math.min(next, item.stock)),
          };
        })
        .filter((item) => item.cantidad > 0),
    );
  }

  function quitarItem(sku) {
    setItems((prev) => prev.filter((item) => item.sku !== sku));
  }

  const total = useMemo(
    () =>
      items.reduce(
        (acc, item) => acc + Number(item.precio || 0) * item.cantidad,
        0,
      ),
    [items],
  );

  const piezas = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad, 0),
    [items],
  );

  async function registrarVenta() {
    if (!items.length) return;
    setLoadingVenta(true);
    setError("");
    setTicket(null);
    try {
      const payload = {
        metodoPago,
        items: items.map((item) => ({
          sku: item.sku,
          cantidad: item.cantidad,
        })),
      };
      const res = await api.post("/ventas", payload);
      setTicket(res.data.ticket || res.data.venta);
      setItems([]);
      await Promise.all([cargarInventario(busqueda), cargarHistorial()]);
    } catch (err) {
      const data = err.response?.data;
      if (data?.productos?.length) {
        setError(
          `Stock insuficiente: ${data.productos
            .map((p) => `${p.sku} (${p.disponible} disp.)`)
            .join(", ")}`,
        );
      } else {
        setError(data?.error || "Error al registrar la venta");
      }
    } finally {
      setLoadingVenta(false);
    }
  }

  if (!puedeVender) {
    return (
      <div style={{ ...card, maxWidth: "720px" }}>
        <h1
          style={{
            fontFamily: "Sora, sans-serif",
            color: "#1B3C53",
            marginBottom: "8px",
          }}
        >
          Punto de Venta
        </h1>
        <p style={{ color: "#456882", lineHeight: 1.6 }}>
          El usuario corporativo consulta reportes y nodos. Para registrar una
          venta inicia sesion como cajero o gerente de una sucursal operativa.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: "26px" }}>
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
          {SUCURSALES_NOMBRES[sucursalId]} - Cluster s
          {String(sucursalId).padStart(2, "0")} - {usuario?.username}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(360px, 1.25fr) minmax(320px, 0.75fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <section style={card}>
          <div style={{ marginBottom: "18px" }}>
            <label style={labelStyle}>Buscar producto en inventario</label>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre, SKU o codigo de barras"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              display: "grid",
              gap: "10px",
              maxHeight: "calc(100vh - 300px)",
              overflowY: "auto",
              paddingRight: "6px",
              alignContent: "start",
            }}
          >
            {loadingCatalogo && (
              <p style={{ color: "#8a9eb0", fontSize: "14px" }}>
                Consultando inventario...
              </p>
            )}
            {!loadingCatalogo && inventario.length === 0 && (
              <p style={{ color: "#8a9eb0", fontSize: "14px" }}>
                No hay productos para esta busqueda.
              </p>
            )}
            {inventario.map((item) => {
              const producto = getProducto(item);
              const low = item.stock <= item.nivelReorden;
              return (
                <button
                  key={item.sku}
                  onClick={() => agregarProducto(item)}
                  disabled={item.stock <= 0}
                  style={{
                    textAlign: "left",
                    border: "1px solid #ede7e0",
                    borderRadius: "12px",
                    padding: "14px",
                    background: item.stock <= 0 ? "#f7f2ee" : "#fff",
                    cursor: item.stock <= 0 ? "not-allowed" : "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: "10px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontFamily: "Sora, sans-serif",
                        fontWeight: 650,
                        color: "#1B3C53",
                        marginBottom: "4px",
                      }}
                    >
                      {producto.nombre || item.nombreProducto}
                    </p>
                    <p style={{ fontSize: "12px", color: "#8a9eb0" }}>
                      {item.sku} - {producto.categoria || "Sin categoria"}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontFamily: "Sora, sans-serif",
                        fontWeight: 700,
                        color: "#1B3C53",
                      }}
                    >
                      {formatPeso(producto.precio)}
                    </p>
                    <p
                      style={{
                        fontSize: "12px",
                        color: low ? "#b47a2c" : "#2d6b42",
                        fontWeight: 700,
                      }}
                    >
                      Stock {item.stock}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <aside style={card}>
          <p style={labelStyle}>Ticket actual</p>
          {items.length === 0 ? (
            <div
              style={{
                border: "1px dashed #D2C1B6",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                color: "#8a9eb0",
                marginBottom: "18px",
              }}
            >
              Agrega productos desde el inventario.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
              {items.map((item) => (
                <div
                  key={item.sku}
                  style={{
                    borderBottom: "1px solid #f0ebe5",
                    paddingBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <p style={{ fontWeight: 700, color: "#1B3C53" }}>
                        {item.nombre}
                      </p>
                      <p style={{ fontSize: "12px", color: "#8a9eb0" }}>
                        {item.sku} - {formatPeso(item.precio)}
                      </p>
                    </div>
                    <button
                      onClick={() => quitarItem(item.sku)}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#b94040",
                        cursor: "pointer",
                      }}
                    >
                      Quitar
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginTop: "10px",
                    }}
                  >
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => cambiarCantidad(item.sku, -1)}
                        style={qtyButton}
                      >
                        -
                      </button>
                      <span
                        style={{
                          minWidth: "32px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#1B3C53",
                        }}
                      >
                        {item.cantidad}
                      </span>
                      <button
                        onClick={() => cambiarCantidad(item.sku, 1)}
                        disabled={item.cantidad >= item.stock}
                        style={{
                          ...qtyButton,
                          opacity: item.cantidad >= item.stock ? 0.4 : 1,
                        }}
                      >
                        +
                      </button>
                    </div>
                    <strong style={{ color: "#1B3C53" }}>
                      {formatPeso(item.precio * item.cantidad)}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginBottom: "18px",
            }}
          >
            <div>
              <p style={{ fontSize: "11px", color: "#8a9eb0" }}>Piezas</p>
              <p style={{ fontWeight: 800, color: "#1B3C53" }}>{piezas}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontSize: "11px", color: "#8a9eb0" }}>Total</p>
              <p
                style={{
                  fontFamily: "Sora, sans-serif",
                  fontWeight: 800,
                  fontSize: "22px",
                  color: "#1B3C53",
                }}
              >
                {formatPeso(total)}
              </p>
            </div>
          </div>

          <p style={labelStyle}>Metodo de pago</p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px",
            }}
          >
            {METODOS_PAGO.map((metodo) => (
              <button
                key={metodo}
                onClick={() => setMetodoPago(metodo)}
                style={{
                  padding: "10px",
                  borderRadius: "10px",
                  border:
                    metodoPago === metodo
                      ? "1.5px solid #1B3C53"
                      : "1.5px solid #D2C1B6",
                  background: metodoPago === metodo ? "#1B3C53" : "white",
                  color: metodoPago === metodo ? "#F9F3EF" : "#456882",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {metodo}
              </button>
            ))}
          </div>

          {error && <Alert type="error">{error}</Alert>}
          {ticket && (
            <Alert type="success">
              Venta registrada - Ticket {ticket.id || ticket._id} - Total{" "}
              {formatPeso(ticket.total)}
            </Alert>
          )}

          <button
            onClick={registrarVenta}
            disabled={!items.length || loadingVenta}
            style={{
              width: "100%",
              marginTop: "16px",
              padding: "14px",
              borderRadius: "12px",
              border: "none",
              background: !items.length || loadingVenta ? "#D2C1B6" : "#1B3C53",
              color: "#F9F3EF",
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              cursor: !items.length || loadingVenta ? "not-allowed" : "pointer",
            }}
          >
            {loadingVenta ? "Registrando..." : "Confirmar venta"}
          </button>
        </aside>
      </div>

      <section style={{ ...card, marginTop: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
          }}
        >
          <div>
            <p style={labelStyle}>Historial reciente</p>
            <p style={{ fontSize: "13px", color: "#8a9eb0" }}>
              Ultimas ventas registradas en la sucursal actual.
            </p>
          </div>
          <button onClick={cargarHistorial} style={secondaryButton}>
            Actualizar
          </button>
        </div>
        {loadingHistorial ? (
          <p style={{ color: "#8a9eb0" }}>Cargando historial...</p>
        ) : historial.length === 0 ? (
          <p style={{ color: "#8a9eb0" }}>No hay ventas recientes.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ color: "#456882", fontSize: "12px" }}>
                  <th style={th}>Fecha</th>
                  <th style={th}>Cajero</th>
                  <th style={th}>Items</th>
                  <th style={th}>Metodo</th>
                  <th style={{ ...th, textAlign: "right" }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((venta) => (
                  <tr
                    key={venta._id}
                    style={{ borderTop: "1px solid #f0ebe5" }}
                  >
                    <td style={td}>
                      {new Date(
                        venta.timestamp || venta.createdAt,
                      ).toLocaleString("es-MX")}
                    </td>
                    <td style={td}>{venta.cajeroNombre}</td>
                    <td style={td}>{venta.items?.length || 0}</td>
                    <td style={{ ...td, textTransform: "capitalize" }}>
                      {venta.metodoPago}
                    </td>
                    <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>
                      {formatPeso(venta.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Alert({ type, children }) {
  const success = type === "success";
  return (
    <div
      style={{
        borderRadius: "10px",
        padding: "12px 14px",
        fontSize: "13px",
        background: success ? "#eef7f0" : "#fff0ee",
        border: success ? "1px solid #b2d9be" : "1px solid #f5c6c0",
        color: success ? "#2d6b42" : "#b94040",
        marginTop: "14px",
      }}
    >
      {children}
    </div>
  );
}

const qtyButton = {
  width: "28px",
  height: "28px",
  borderRadius: "8px",
  border: "1px solid #D2C1B6",
  background: "white",
  color: "#1B3C53",
  cursor: "pointer",
  fontWeight: 800,
};

const secondaryButton = {
  border: "1px solid #D2C1B6",
  background: "white",
  color: "#456882",
  borderRadius: "10px",
  padding: "9px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

const th = {
  textAlign: "left",
  padding: "10px 8px",
  fontWeight: 800,
};

const td = {
  padding: "12px 8px",
  color: "#1B3C53",
  fontSize: "13px",
};
