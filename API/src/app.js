const express = require("express");
const usuariosRoutes = require("./routes/usuarios.routes");
const tarefasRoutes = require("./routes/tarefas.routes");

const app = express();
app.use(express.json());

// Health/Readiness (para balanceadores)
app.get("/healthz", (req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
app.get("/readyz", async (req, res) => {
  // No modo memória, sempre true. No Postgres, você pode checar conexão aqui.
  res.json({ ready: true });
});

// Rotas
app.use("/usuarios", usuariosRoutes);
app.use("/tarefas", tarefasRoutes);

// Rota raiz
app.get("/", (req, res) => res.json({ status: "API MVP ok" }));

// Tratamento simples de rota não encontrada
app.use((req, res) => res.status(404).json({ erro: "rota não encontrada" }));

module.exports = app;
