// Trocar para "../db/postgres" quando ligar ao banco real
const DB = require("../db/memory");

exports.criar = async (req, res) => {
  const { id, nome, email } = req.body || {};
  if (!id || !email) return res.status(400).json({ erro: "id e email são obrigatórios" });

  try {
    await DB.createUser({ id, nome: nome ?? null, email });
    return res.status(201).json({ id });
  } catch (e) {
    if (String(e.code) === "23505" || e.message.includes("duplicate"))
      return res.status(409).json({ erro: "id ou email já existe" });
    return res.status(500).json({ erro: "falha ao criar", detalhe: e.message });
  }
};

exports.obter = async (req, res) => {
  const u = await DB.getUser(req.params.id);
  if (!u) return res.status(404).json({ erro: "não encontrado" });
  return res.json(u);
};

exports.listar = async (_req, res) => {
  const lista = await DB.listUsers();
  return res.json({ total: lista.length, usuarios: lista });
};

// “Atalho” para listar tarefas do usuário via /usuarios/:id/tarefas
exports.listarTarefasDoUsuario = async (req, res) => {
  const usuario_id = req.params.id;
  const u = await DB.getUser(usuario_id);
  if (!u) return res.status(404).json({ erro: "usuario não existe" });
  const tarefas = await DB.listTasksByUser(usuario_id); // memory/postgres implementam
  return res.json({ usuario_id, total: tarefas.length, tarefas });
};
