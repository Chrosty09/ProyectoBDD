import { useState, useEffect } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
} from "recharts";

const SUCURSALES_NOMBRES = {
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

const CHART_COLORS = [
  "#1B3C53",
  "#456882",
  "#6B9AB8",
  "#D2C1B6",
  "#8fafc4",
  "#c4b0a5",
  "#2d5f7a",
];

const DATE_PRESETS = {
  todos: { label: "Todo", days: null },
  hoy: { label: "Hoy", days: 0 },
  semana: { label: "7 dias", days: 7 },
  mes: { label: "30 dias", days: 30 },
};

const card = {
  background: "white",
  borderRadius: "16px",
  border: "1px solid #ede7e0",
  padding: "24px",
};

function KpiCard({ label, value, sub, delay = 0 }) {
  return (
    <div className={`fade-up fade-up-${delay}`} style={{ ...card }}>
      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "#8a9eb0",
          marginBottom: "10px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Sora, sans-serif",
          fontWeight: 700,
          fontSize: "26px",
          color: "#1B3C53",
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {value}
      </p>
      {sub && <p style={{ fontSize: "12px", color: "#b8c5ce" }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1B3C53",
        borderRadius: "10px",
        padding: "10px 16px",
        boxShadow: "0 8px 24px rgba(27,60,83,0.25)",
        border: "none",
      }}
    >
      <p
        style={{
          color: "#D2C1B6",
          fontSize: "11px",
          marginBottom: "4px",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: "white",
            fontSize: "15px",
            fontWeight: 700,
            fontFamily: "Sora, sans-serif",
          }}
        >
          {typeof p.value === "number" && p.value > 100
            ? `$${p.value.toLocaleString("es-MX", { minimumFractionDigits: 0 })}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

export default function Reportes() {
  const { usuario } = useAuth();
  const [ventasPorSucursal, setVentasPorSucursal] = useState([]);
  const [ventasPorDia, setVentasPorDia] = useState([]);
  const [productosTop, setProductosTop] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [sucursalSelec, setSucursalSelec] = useState(usuario?.sucursalId || 1);
  const [presetFecha, setPresetFecha] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kpis, setKpis] = useState({
    total: 0,
    numVentas: 0,
    ticket: 0,
    topSucursal: "-",
  });

  useEffect(() => {
    cargarResumenGeneral();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetFecha, desde, hasta]);
  useEffect(() => {
    cargarDetalleSucursal(sucursalSelec);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sucursalSelec, presetFecha, desde, hasta]);

  function getDateParams() {
    const params = new URLSearchParams();
    if (presetFecha !== "todos") {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      if (DATE_PRESETS[presetFecha]?.days) {
        start.setDate(start.getDate() - DATE_PRESETS[presetFecha].days);
      }
      params.set("desde", start.toISOString());
      params.set("hasta", now.toISOString());
      return params;
    }
    if (desde) params.set("desde", new Date(`${desde}T00:00:00`).toISOString());
    if (hasta) params.set("hasta", new Date(`${hasta}T23:59:59`).toISOString());
    return params;
  }

  async function cargarResumenGeneral() {
    setLoading(true);
    setError("");
    try {
      const params = getDateParams();
      const res = await api.get(
        `/reportes/ventas-por-sucursal?${params.toString()}`,
      );
      const datos = res.data.sucursales.map((s) => ({
        ...s,
        nombre: SUCURSALES_NOMBRES[s.sucursalId] || `S${s.sucursalId}`,
      }));
      setVentasPorSucursal(datos);
      const totalGlobal = datos.reduce((a, s) => a + s.totalVentas, 0);
      const numGlobal = datos.reduce((a, s) => a + s.numVentas, 0);
      const ticketGlobal = numGlobal ? totalGlobal / numGlobal : 0;
      const top = datos.reduce(
        (a, b) => (a.totalVentas > b.totalVentas ? a : b),
        datos[0] || {},
      );
      setKpis({
        total: totalGlobal,
        numVentas: numGlobal,
        ticket: ticketGlobal,
        topSucursal: top?.nombre || "-",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al cargar reportes");
    } finally {
      setLoading(false);
    }
  }

  async function cargarDetalleSucursal(id) {
    try {
      const params = getDateParams();
      const qs = params.toString();
      const [diasRes, topRes, pagosRes] = await Promise.all([
        api.get(`/reportes/ventas-por-dia/${id}${qs ? `?${qs}` : ""}`),
        api.get(`/reportes/productos-top/${id}?limite=7`),
        api.get(`/reportes/metodos-pago/${id}`),
      ]);
      // Agrupar por semana para que la grafica no quede tan saturada
      const diasRaw = diasRes.data.datos;
      const agrupado = [];
      for (let i = 0; i < diasRaw.length; i += 3) {
        const chunk = diasRaw.slice(i, i + 3);
        agrupado.push({
          fecha: chunk[0]._id.slice(5),
          total: parseFloat(
            (
              chunk.reduce((a, d) => a + d.totalVentas, 0) / chunk.length
            ).toFixed(2),
          ),
        });
      }
      setVentasPorDia(agrupado);
      setProductosTop(
        topRes.data.productos.map((p) => ({
          nombre: p.nombre.slice(0, 20),
          unidades: p.totalUnidades,
        })),
      );
      setMetodosPago(
        pagosRes.data.metodos.map((m) => ({ name: m._id, value: m.count })),
      );
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al cargar detalle");
    }
  }

  const formatPeso = (v) =>
    `$${Number(v).toLocaleString("es-MX", { minimumFractionDigits: 0 })}`;
  const sucursalActual =
    SUCURSALES_NOMBRES[sucursalSelec] || `Sucursal ${sucursalSelec}`;
  const topIdx = ventasPorSucursal.findIndex(
    (s) => s.nombre === kpis.topSucursal,
  );

  function exportarCSV() {
    const headers = [
      "sucursalId",
      "sucursal",
      "totalVentas",
      "numVentas",
      "ticketPromedio",
      "estadoNodo",
      "error",
    ];
    const rows = ventasPorSucursal.map((s) => [
      s.sucursalId,
      s.nombre,
      s.totalVentas,
      s.numVentas,
      s.ticketPromedio,
      s.error ? "error" : "ok",
      s.error || "",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quickmart-reporte-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "28px",
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 700,
              fontSize: "24px",
              color: "#1B3C53",
              marginBottom: "4px",
            }}
          >
            Reportes de Ventas
          </h1>
          <p style={{ fontSize: "13px", color: "#8a9eb0" }}>
            Vision general de las {Object.keys(SUCURSALES_NOMBRES).length}{" "}
            sucursales activas
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {usuario?.rol === "admin" && (
            <>
            <span style={{ fontSize: "12px", color: "#8a9eb0" }}>Detalle:</span>
            <select
              style={{
                borderRadius: "10px",
                padding: "9px 14px",
                fontSize: "13px",
                border: "1.5px solid #D2C1B6",
                background: "white",
                color: "#1B3C53",
                fontFamily: "DM Sans, sans-serif",
                outline: "none",
                cursor: "pointer",
              }}
              value={sucursalSelec}
              onChange={(e) => setSucursalSelec(parseInt(e.target.value))}
            >
              {Object.entries(SUCURSALES_NOMBRES).map(([id, nombre]) => (
                <option key={id} value={id}>
                  {nombre}
                </option>
              ))}
            </select>
            </>
          )}
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          ...card,
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        {Object.entries(DATE_PRESETS).map(([key, value]) => (
          <button
            key={key}
            onClick={() => {
              setPresetFecha(key);
              if (key !== "todos") {
                setDesde("");
                setHasta("");
              }
            }}
            style={{
              borderRadius: "10px",
              border:
                presetFecha === key ? "1.5px solid #1B3C53" : "1px solid #D2C1B6",
              background: presetFecha === key ? "#1B3C53" : "white",
              color: presetFecha === key ? "#F9F3EF" : "#456882",
              padding: "9px 12px",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {value.label}
          </button>
        ))}
        <input
          type="date"
          value={desde}
          onChange={(e) => {
            setPresetFecha("todos");
            setDesde(e.target.value);
          }}
          style={filterInput}
        />
        <input
          type="date"
          value={hasta}
          onChange={(e) => {
            setPresetFecha("todos");
            setHasta(e.target.value);
          }}
          style={filterInput}
        />
        <button onClick={cargarResumenGeneral} style={refreshButton}>
          Actualizar
        </button>
        <button
          onClick={exportarCSV}
          disabled={!ventasPorSucursal.length}
          style={{
            ...refreshButton,
            background: ventasPorSucursal.length ? "#1B3C53" : "#D2C1B6",
            cursor: ventasPorSucursal.length ? "pointer" : "not-allowed",
          }}
        >
          Exportar CSV
        </button>
      </div>

      {error && (
        <div
          style={{
            borderRadius: "10px",
            padding: "12px 16px",
            background: "#fff0ee",
            border: "1px solid #f5c6c0",
            color: "#b94040",
            marginBottom: "20px",
            fontSize: "13px",
          }}
        >
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <KpiCard
          delay={1}
          label="Ventas totales"
          value={loading ? "..." : formatPeso(kpis.total)}
          sub="Todas las sucursales"
        />
        <KpiCard
          delay={2}
          label="Transacciones"
          value={loading ? "..." : kpis.numVentas.toLocaleString()}
          sub="Registros en sistema"
        />
        <KpiCard
          delay={3}
          label="Ticket promedio"
          value={loading ? "..." : formatPeso(kpis.ticket)}
          sub="Por transaccion"
        />
        <KpiCard
          delay={4}
          label="Lider de ventas"
          value={loading ? "..." : kpis.topSucursal}
          sub="Sucursal con mas ingresos"
        />
      </div>

      {/* Estado por nodo consultado */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            color: "#1B3C53",
            marginBottom: "14px",
          }}
        >
          Estado de consulta por sucursal
        </p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ color: "#456882", fontSize: "12px" }}>
                <th style={th}>Sucursal</th>
                <th style={th}>Ventas</th>
                <th style={th}>Ticket prom.</th>
                <th style={th}>Nodo</th>
                <th style={{ ...th, textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {ventasPorSucursal.map((s) => (
                <tr key={s.sucursalId} style={{ borderTop: "1px solid #f0ebe5" }}>
                  <td style={td}>{s.nombre}</td>
                  <td style={td}>{s.numVentas}</td>
                  <td style={td}>{formatPeso(s.ticketPromedio)}</td>
                  <td style={td}>
                    <span
                      style={{
                        borderRadius: "999px",
                        padding: "5px 9px",
                        background: s.error ? "#fff0ee" : "#eef7f0",
                        color: s.error ? "#b94040" : "#2d6b42",
                        fontWeight: 800,
                        fontSize: "12px",
                      }}
                    >
                      {s.error ? "Error parcial" : "OK"}
                    </span>
                  </td>
                  <td style={{ ...td, textAlign: "right", fontWeight: 800 }}>
                    {formatPeso(s.totalVentas)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ingresos por sucursal — ancho completo */}
      <div style={{ ...card, marginBottom: "20px" }}>
        <p
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            color: "#1B3C53",
            marginBottom: "20px",
          }}
        >
          Ingresos por sucursal
        </p>
        {loading ? (
          <div
            style={{
              height: "260px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#D2C1B6",
              fontSize: "14px",
            }}
          >
            Cargando datos...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={ventasPorSucursal}
              margin={{ top: 5, right: 16, left: 10, bottom: 5 }}
              barCategoryGap="35%"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0ebe5"
                vertical={false}
              />
              <XAxis
                dataKey="nombre"
                tick={{ fontSize: 12, fill: "#8a9eb0", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11, fill: "#8a9eb0", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "#f9f3ef" }}
              />
              <Bar dataKey="totalVentas" name="Total" radius={[6, 6, 0, 0]}>
                {ventasPorSucursal.map((_, i) => (
                  <Cell key={i} fill={i === topIdx ? "#1B3C53" : "#D2C1B6"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fila: Tendencia + Metodos de pago */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.4fr 1fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        {/* Tendencia diaria con sombra de area */}
        <div style={card}>
          <p
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
              fontSize: "15px",
              color: "#1B3C53",
              marginBottom: "2px",
            }}
          >
            Tendencia diaria
          </p>
          <p
            style={{ fontSize: "12px", color: "#8a9eb0", marginBottom: "20px" }}
          >
            {sucursalActual}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart
              data={ventasPorDia}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#456882" stopOpacity={0.35} />
                  <stop offset="60%" stopColor="#456882" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#456882" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0ebe5"
                vertical={false}
              />
              <XAxis
                dataKey="fecha"
                tick={{ fontSize: 10, fill: "#8a9eb0", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: "#8a9eb0", fontFamily: "DM Sans" }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{
                  stroke: "#D2C1B6",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
              />
              <Area
                type="monotoneX"
                dataKey="total"
                name="Promedio diario"
                stroke="#1B3C53"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{
                  r: 5,
                  fill: "#1B3C53",
                  stroke: "white",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Metodos de pago */}
        <div style={card}>
          <p
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
              fontSize: "15px",
              color: "#1B3C53",
              marginBottom: "2px",
            }}
          >
            Metodos de pago
          </p>
          <p
            style={{ fontSize: "12px", color: "#8a9eb0", marginBottom: "12px" }}
          >
            {sucursalActual}
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={metodosPago}
                cx="50%"
                cy="45%"
                innerRadius={62}
                outerRadius={92}
                dataKey="value"
                paddingAngle={3}
              >
                {metodosPago.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  fontSize: "12px",
                  fontFamily: "DM Sans",
                  paddingTop: "8px",
                }}
              />
              <Tooltip
                formatter={(v, n) => [v, n]}
                contentStyle={{
                  borderRadius: "10px",
                  border: "none",
                  background: "#1B3C53",
                  color: "white",
                  fontSize: "13px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Productos mas vendidos — ancho completo */}
      <div style={card}>
        <p
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 600,
            fontSize: "15px",
            color: "#1B3C53",
            marginBottom: "2px",
          }}
        >
          Productos mas vendidos
        </p>
        <p style={{ fontSize: "12px", color: "#8a9eb0", marginBottom: "20px" }}>
          {sucursalActual} · top 7
        </p>
        <ResponsiveContainer width="100%" height={230}>
          <BarChart
            data={productosTop}
            layout="vertical"
            margin={{ left: 0, right: 24, top: 0, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0ebe5"
              horizontal={false}
            />
            <XAxis
              type="number"
              tick={{ fontSize: 11, fill: "#8a9eb0", fontFamily: "DM Sans" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="nombre"
              type="category"
              tick={{ fontSize: 12, fill: "#456882", fontFamily: "DM Sans" }}
              width={145}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9f3ef" }} />
            <Bar
              dataKey="unidades"
              name="Unidades"
              fill="#456882"
              radius={[0, 6, 6, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const filterInput = {
  borderRadius: "10px",
  padding: "9px 12px",
  border: "1.5px solid #D2C1B6",
  background: "white",
  color: "#1B3C53",
  fontFamily: "DM Sans, sans-serif",
};

const refreshButton = {
  borderRadius: "10px",
  padding: "9px 12px",
  border: "none",
  background: "#456882",
  color: "#F9F3EF",
  fontWeight: 800,
  cursor: "pointer",
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
