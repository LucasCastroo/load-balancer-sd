// “Banco” em memória — ótimo para demo sem depender de infra

// Tabelas “virtuais”
const USERS = new Map();  // id -> { id, nome, email }
const TASKS = new Map();  // id -> { id, usuario_id, titulo, descricao, status, criado_em }

// ====== USUÁRIOS ======
exports.createUser = async ({ id, nome, email }) => {
  if (USERS.has(id)) {
    const e = new Error("duplicate"); e.code = "duplicate"; throw e;
  }
  for (const u of USERS.values()) {
    if (u.email === email) { const e = new Error("duplicate"); e.code = "duplicate"; throw e; }
  }
  USERS.set(id, { id, nome, email });
};

exports.getUser = async (id) => USERS.get(id) ?? null;

exports.listUsers = async () => [...USERS.values()];

// ====== TAREFAS ======
exports.createTask = async ({ id, usuario_id, titulo, descricao = null, status = "aberta" }) => {
  if (!USERS.has(usuario_id)) { const e = new Error("usuario_inexistente"); e.code = "fk"; throw e; }
  if (TASKS.has(id)) { const e = new Error("duplicate"); e.code = "duplicate"; throw e; }

  TASKS.set(id, {
    id, usuario_id, titulo, descricao, status,
    criado_em: new Date().toISOString()
  });
};

exports.getTask = async (id) => TASKS.get(id) ?? null;

exports.listTasksByUser = async (usuario_id) =>
  [...TASKS.values()].filter(t => t.usuario_id === usuario_id);

// Opcionais (se quiser evoluir depois)
// exports.updateTask = async (id, patch) => { ... }
// exports.deleteTask = async (id) => { ... }
