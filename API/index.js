import express from "express";
import cors from "cors";
import { DB } from "./src/db/index.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ===== identificação da instância (p/ LB)
const INSTANCE = process.env.INSTANCE || "local";
const STARTED_AT = new Date().toISOString();

app.use(cors({ origin: "*" }));
app.use(express.json());

// ===== ENDPOINTS =====

app.get("/healthz", (_, res) => res.json({ ok: true, mode: DB.isDbEnabled ? "postgres" : "memory", instance: INSTANCE }));

app.get("/", (_, res) => {
  res.json({
    ok: true,
    msg: "API funcionando!",
    instance: INSTANCE,
    mode: DB.isDbEnabled ? "postgres" : "memory",
    endpoints: ["/healthz", "/whoami", "/usuarios", "/tarefas"]
  });
});

app.get("/whoami", (_, res) => {
  res.json({ instance: INSTANCE, pid: process.pid, started_at: STARTED_AT, db: DB.isDbEnabled ? "connected" : "none" });
});

// USUÁRIOS
app.get("/usuarios", async (_, res) => {
  try {
    const usuarios = await DB.getUsuarios();
    res.json({ usuarios });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao listar usuários" });
  }
});

app.post("/usuarios", async (req, res) => {
  const { id, nome, email } = req.body || {};
  if (!id || !email) return res.status(400).json({ error: "id e email são obrigatórios" });

  try {
    const existe = await DB.findUsuario(id) || await DB.findUsuario(email);
    if (existe) return res.status(409).json({ error: "id ou email já existe" });

    await DB.createUsuario({ id, nome: nome || "", email });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar usuário" });
  }
});

app.delete("/usuarios/:id", async (req, res) => {
  try {
    const deleted = await DB.deleteUsuario(req.params.id);
    if (!deleted) return res.status(404).json({ error: "usuário não encontrado" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao deletar usuário" });
  }
});

// TAREFAS
app.get("/tarefas/usuario/:usuario_id", async (req, res) => {
  try {
    const tarefas = await DB.getTarefas(req.params.usuario_id);
    res.json({ tarefas });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar tarefas" });
  }
});

app.post("/tarefas", async (req, res) => {
  const { id, usuario_id, titulo, descricao, status } = req.body || {};
  if (!id || !usuario_id || !titulo) return res.status(400).json({ error: "id, usuario_id e titulo são obrigatórios" });

  try {
    const user = await DB.findUsuario(usuario_id);
    if (!user) return res.status(404).json({ error: "usuario_id não encontrado" });

    const taskExists = await DB.findTarefa(id);
    if (taskExists) return res.status(409).json({ error: "id da tarefa já existe" });

    await DB.createTarefa({
      id, usuario_id, titulo,
      descricao: descricao || "",
      status: status || "aberta",
      criado_em: new Date().toISOString()
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao criar tarefa" });
  }
});

app.put("/tarefas/:id/status", async (req, res) => {
  const { status } = req.body || {};
  if (!["aberta", "em_andamento", "concluida"].includes(status)) return res.status(400).json({ error: "status inválido" });

  try {
    const t = await DB.findTarefa(req.params.id);
    if (!t) return res.status(404).json({ error: "tarefa não encontrada" });

    await DB.updateTarefaStatus(req.params.id, status);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar status" });
  }
});

app.delete("/tarefas/:id", async (req, res) => {
  try {
    const deleted = await DB.deleteTarefa(req.params.id);
    if (!deleted) return res.status(404).json({ error: "tarefa não encontrada" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao deletar tarefa" });
  }
});

app.use((_, res) => res.status(404).json({ error: "Not Found" }));

app.listen(PORT, () => console.log(`API ouvindo em http://localhost:${PORT} (instância ${INSTANCE}) [DB: ${DB.isDbEnabled ? 'POSTGRES' : 'MEMORY'}]`));