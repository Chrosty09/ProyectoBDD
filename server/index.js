require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectAll } = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// Ruta de salud para verificar que el servidor responde
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Aqui se montaran las rutas cuando las generemos
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ventas", require("./routes/ventas"));
app.use("/api/reportes", require("./routes/reportes"));

const PORT = process.env.PORT || 4000;

// Primero conecta a todos los clusters, luego arranca el servidor
connectAll().then(() => {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
});
