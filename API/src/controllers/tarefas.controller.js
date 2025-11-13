// Trocar para "../db/postgres" quando ligar ao banco real
const DB = require("../db/memory");

exports.criar = async (req, res) => {
  const { id, usuario_id, titulo, descricao, status } = req.body || {};
  if (!id || !usuario_id || !titulo)
    return res.status(400).json({ erro: "id, usuario_id e titulo são obrigatórios" });

  try {
    await DB.createTask({ id, usuario_id, titulo, descricao, status });
    return res.status(201).json({ id });
  } catch (e) {
    if (e.code === "fk" || String(e.code) === "23503")
      return res.status(400).json({ erro: "usuario_id inválido (FK)" });
    if (String(e.code) === "23505" || e.message.includes("duplicate"))
      return res.status(409).json({ erro: "id de tarefa já existe" });
    return res.status(500).json({ erro: "falha ao criar", detalhe: e.message });
  }
};

exports.obter = async (req, res) => {
  const t = await DB.getTask(req.params.id);
  if (!t) return res.status(404).json({ erro: "não encontrado" });
  return res.json(t);
};

exports.listarPorUsuario = async (req, res) => {
  const { usuario_id } = req.params;
  const tarefas = await DB.listTasksByUser(usuario_id);
  return res.json({ usuario_id, total: tarefas.length, tarefas });
};

// exports.atualizar = async (req, res) => { ... };
// exports.remover = async (req, res) => { ... };
