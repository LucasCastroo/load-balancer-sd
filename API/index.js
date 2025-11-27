import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== identificação da instância (p/ LB)
const INSTANCE = process.env.INSTANCE || "local";
const STARTED_AT = new Date().toISOString();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== banco em memória (demo)
const db = { usuarios: [], tarefas: [] };

// ===== health
app.get("/healthz", (_, res) => res.json({ ok: true, ts: Date.now(), instance: INSTANCE }));

// ===== endpoints p/ demo de balanceamento
app.get("/", (_, res) => {
  res.json({
    ok: true,
    msg: "API funcionando!",
    instance: INSTANCE,
    endpoints: ["/healthz", "/whoami", "/slow", "/usuarios", "/tarefas"]
  });
});

app.get("/whoami", (_, res) => {
  res.json({ instance: INSTANCE, pid: process.pid, started_at: STARTED_AT, ts: Date.now() });
});

app.get("/slow", async (req, res) => {
  const ms = Number(req.query.ms || 200);
  await new Promise(r => setTimeout(r, ms));
  res.json({ ok: true, instance: INSTANCE, delay_ms: ms, ts: Date.now() });
});

// ===== USUÁRIOS
app.get("/usuarios", (_, res) => res.json({ usuarios: db.usuarios }));
app.post("/usuarios", (req, res) => {
  const { id, nome, email } = req.body || {};
  if (!id || !email) return res.status(400).json({ error: "id e email são obrigatórios" });
  if (db.usuarios.find(u => u.id === id || u.email === email)) return res.status(409).json({ error: "id ou email já existe" });
  db.usuarios.push({ id, nome: nome || "", email });
  res.status(201).json({ ok: true });
});

// ===== TAREFAS
app.get("/tarefas/usuario/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;
  res.json({ tarefas: db.tarefas.filter(t => t.usuario_id === usuario_id) });
});
app.post("/tarefas", (req, res) => {
  const { id, usuario_id, titulo, descricao, status } = req.body || {};
  if (!id || !usuario_id || !titulo) return res.status(400).json({ error: "id, usuario_id e titulo são obrigatórios" });
  if (!db.usuarios.find(u => u.id === usuario_id)) return res.status(404).json({ error: "usuario_id não encontrado" });
  if (db.tarefas.find(t => t.id === id)) return res.status(409).json({ error: "id da tarefa já existe" });
  db.tarefas.push({ id, usuario_id, titulo, descricao: descricao || "", status: status || "aberta", criado_em: new Date().toISOString() });
  res.status(201).json({ ok: true });
});

// extras usados pelo front
app.put("/tarefas/:id/status", (req, res) => {
  const t = db.tarefas.find(x => x.id === req.params.id);
  if (!t) return res.status(404).json({ error: "tarefa não encontrada" });
  const { status } = req.body || {};
  if (!["aberta", "em_andamento", "concluida"].includes(status)) return res.status(400).json({ error: "status inválido" });
  t.status = status;
  res.json({ ok: true });
});
app.delete("/tarefas/:id", (req, res) => {
  const before = db.tarefas.length;
  db.tarefas = db.tarefas.filter(t => t.id !== req.params.id);
  if (db.tarefas.length === before) return res.status(404).json({ error: "tarefa não encontrada" });
  res.json({ ok: true });
});

// 404
app.use((_, res) => res.status(404).json({ error: "Not Found" }));

app.listen(PORT, () => console.log(`API ouvindo em http://localhost:${PORT} (instância ${INSTANCE})`));