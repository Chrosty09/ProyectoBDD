const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectAll } = require("./config/db");

const app = express();

const corsOptions = process.env.CLIENT_URL
  ? { origin: process.env.CLIENT_URL }
  : {};

app.use(cors(corsOptions));
app.use(express.json());

// Ruta de salud para verificar que el servidor responde sin consultar clusters.
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "QuickMart API",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/ventas", require("./routes/ventas"));
app.use("/api/reportes", require("./routes/reportes"));
app.use("/api/productos", require("./routes/productos"));
app.use("/api/inventario", require("./routes/inventario"));
app.use("/api/nodos", require("./routes/nodos"));

const PORT = process.env.PORT || 4000;

// Primero conecta a todos los clusters, luego arranca el servidor
connectAll().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
