require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false }
});

// ====== USUÁRIOS ======
exports.createUser = async ({ id, nome, email }) => {
  await pool.query(
    "insert into usuarios (id, nome, email) values ($1,$2,$3)",
    [id, nome, email]
  );
};

exports.getUser = async (id) => {
  const { rows } = await pool.query(
    "select id, nome, email from usuarios where id = $1",
    [id]
  );
  return rows[0] ?? null;
};

exports.listUsers = async () => {
  const { rows } = await pool.query(
    "select id, nome, email from usuarios order by id asc"
  );
  return rows;
};

// ====== TAREFAS ======
exports.createTask = async ({ id, usuario_id, titulo, descricao = null, status = "aberta" }) => {
  await pool.query(
    `insert into tarefas (id, usuario_id, titulo, descricao, status)
     values ($1,$2,$3,$4,$5)`,
    [id, usuario_id, titulo, descricao, status]
  );
};

exports.getTask = async (id) => {
  const { rows } = await pool.query(
    `select id, usuario_id, titulo, descricao, status, criado_em
       from tarefas where id = $1`,
    [id]
  );
  return rows[0] ?? null;
};

exports.listTasksByUser = async (usuario_id) => {
  const { rows } = await pool.query(
    `select id, usuario_id, titulo, descricao, status, criado_em
       from tarefas where usuario_id = $1 order by criado_em desc`,
    [usuario_id]
  );
  return rows;
};

// Opcionais (se quiser evoluir depois)
// exports.updateTask = async (id, patch) => { ... }
// exports.deleteTask = async (id) => { ... }
