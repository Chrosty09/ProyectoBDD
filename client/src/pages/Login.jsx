import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const SUCURSALES = [
  { id: 0, nombre: "Corporativo (Admin)" },
  { id: 1, nombre: "Aguascalientes Centro" },
  { id: 2, nombre: "Aguascalientes Norte" },
  { id: 3, nombre: "Guadalajara Centro" },
  { id: 4, nombre: "Guadalajara Zapopan" },
  { id: 5, nombre: "CDMX Condesa" },
  { id: 6, nombre: "CDMX Polanco" },
  { id: 7, nombre: "Monterrey Centro" },
  { id: 8, nombre: "Monterrey San Pedro" },
  { id: 9, nombre: "Puebla Centro" },
  { id: 10, nombre: "Leon Guanajuato" },
];

export default function Login({ onLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({
    username: "",
    password: "",
    sucursalId: 0,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const usuario = await login(
        form.username,
        form.password,
        parseInt(form.sucursalId),
      );
      onLogin(usuario);
    } catch (err) {
      setError(err.response?.data?.error || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    borderRadius: "12px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s",
    background: "white",
    border: "1.5px solid #D2C1B6",
    color: "#1B3C53",
    fontFamily: "DM Sans, sans-serif",
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#F9F3EF" }}>
      {/* Panel izquierdo */}
      <div
        style={{
          background: "#1B3C53",
          width: "50%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
        }}
      >
        <span
          style={{
            fontFamily: "Sora, sans-serif",
            fontWeight: 700,
            fontSize: "22px",
            color: "#D2C1B6",
            letterSpacing: "-0.5px",
          }}
        >
          QuickMart
        </span>
        <div>
          <p
            style={{
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
              fontSize: "36px",
              lineHeight: 1.2,
              color: "white",
              marginBottom: "16px",
            }}
          >
            Sistema de Ventas
            <br />
            Distribuido
          </p>
          <p
            style={{
              color: "#8a9eb0",
              fontSize: "14px",
              lineHeight: 1.7,
              maxWidth: "280px",
            }}
          >
            10 sucursales. Una plataforma. Control total desde cualquier nodo de
            la red.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                height: "3px",
                flex: 1,
                borderRadius: "99px",
                background: i === 1 ? "#D2C1B6" : "#2d5a7a",
              }}
            />
          ))}
        </div>
      </div>

      {/* Panel derecho */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "360px" }}>
          <div style={{ marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "Sora, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                color: "#1B3C53",
                marginBottom: "6px",
              }}
            >
              Iniciar sesion
            </p>
            <p style={{ color: "#8a9eb0", fontSize: "14px" }}>
              Selecciona tu sucursal e ingresa tus credenciales
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#456882",
                  marginBottom: "8px",
                }}
              >
                Sucursal
              </label>
              <select
                style={{ ...inputStyle }}
                value={form.sucursalId}
                onChange={(e) =>
                  setForm({ ...form, sucursalId: e.target.value })
                }
              >
                {SUCURSALES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#456882",
                  marginBottom: "8px",
                }}
              >
                Usuario
              </label>
              <input
                type="text"
                placeholder="nombre de usuario"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#456882")}
                onBlur={(e) => (e.target.style.borderColor = "#D2C1B6")}
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: "#456882",
                  marginBottom: "8px",
                }}
              >
                Contrasena
              </label>
              <input
                type="password"
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#456882")}
                onBlur={(e) => (e.target.style.borderColor = "#D2C1B6")}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  borderRadius: "12px",
                  padding: "12px 16px",
                  fontSize: "13px",
                  background: "#fff0ee",
                  border: "1px solid #f5c6c0",
                  color: "#b94040",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                borderRadius: "12px",
                padding: "14px",
                fontFamily: "Sora, sans-serif",
                fontWeight: 600,
                fontSize: "14px",
                color: "#F9F3EF",
                background: loading ? "#456882" : "#1B3C53",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
                marginTop: "4px",
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = "#456882";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = "#1B3C53";
              }}
            >
              {loading ? "Verificando..." : "Entrar al sistema"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              fontSize: "12px",
              color: "#D2C1B6",
              marginTop: "40px",
            }}
          >
            UAA · Base de Datos Distribuidas · 2026
          </p>
        </div>
      </div>
    </div>
  );
}
