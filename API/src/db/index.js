import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const INSTANCE = process.env.INSTANCE || "local";

// ===== Configuração do Banco de Dados =====
const isDbEnabled = !!process.env.DATABASE_URL;
let pool = null;

if (isDbEnabled) {
    console.log(`[${INSTANCE}] Conectando ao PostgreSQL...`);
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    // Auto-Migration: Cria tabelas se não existirem
    // NOTA: Para aplicar a mudança de ID (text -> serial), idealmente deve-se rodar o init.sql manualmente ou dropar as tabelas antigas.
    // Aqui mantemos o IF NOT EXISTS para segurança, mas o usuário deve resetar o banco se já existirem tabelas antigas.
    (async () => {
        try {
            const client = await pool.connect();
            try {
                await client.query(`
          CREATE TABLE IF NOT EXISTS usuarios (
            id SERIAL PRIMARY KEY,
            nome TEXT,
            email TEXT UNIQUE NOT NULL
          );
          CREATE TABLE IF NOT EXISTS tarefas (
            id SERIAL PRIMARY KEY,
            usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
            titulo TEXT NOT NULL,
            descricao TEXT,
            status TEXT NOT NULL DEFAULT 'aberta',
            criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_tarefas_usuario ON tarefas(usuario_id);
        `);
                console.log(`[${INSTANCE}] Banco de dados inicializado (tabelas verificadas).`);
            } finally {
                client.release();
            }
        } catch (err) {
            console.error(`[${INSTANCE}] Erro ao inicializar banco:`, err);
        }
    })();
} else {
    console.log(`[${INSTANCE}] Rodando em modo MEMÓRIA (dados voláteis). Defina DATABASE_URL para persistência.`);
}

// ===== Banco em Memória (Fallback) =====
// Simulando auto-incremento
let nextUserId = 3;
let nextTaskId = 2;

const memoryDb = {
    usuarios: [
        { id: 1, nome: 'Alice Silva (Mem)', email: 'alice@example.com' },
        { id: 2, nome: 'Bob Santos (Mem)', email: 'bob@example.com' }
    ],
    tarefas: [
        { id: 1, usuario_id: 1, titulo: 'Exemplo Memória', descricao: 'Dados não persistentes', status: 'aberta', criado_em: new Date().toISOString() }
    ]
};

// ===== Interface Unificada =====
export const DB = {
    isDbEnabled,

    async getUsuarios() {
        if (pool) {
            const { rows } = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
            return rows;
        }
        return memoryDb.usuarios;
    },
    async createUsuario(u) {
        if (pool) {
            // Postgres gera o ID (SERIAL)
            await pool.query("INSERT INTO usuarios (nome, email) VALUES ($1, $2)", [u.nome, u.email]);
        } else {
            const newId = ++nextUserId;
            memoryDb.usuarios.push({ ...u, id: newId });
        }
    },
    async findUsuario(idOrEmail) {
        if (pool) {
            // Tenta achar por ID (numérico) ou Email (string)
            // Se idOrEmail for número (ou string numérica), busca por ID. Se não, por email.
            const isNum = !isNaN(idOrEmail);
            if (isNum) {
                const { rows } = await pool.query("SELECT * FROM usuarios WHERE id = $1", [idOrEmail]);
                if (rows[0]) return rows[0];
            }
            const { rows } = await pool.query("SELECT * FROM usuarios WHERE email = $1", [idOrEmail]);
            return rows[0];
        }

        return memoryDb.usuarios.find(u => u.id == idOrEmail || u.email === idOrEmail);
    },
    async getTarefas(usuario_id) {
        if (pool) {
            const { rows } = await pool.query("SELECT * FROM tarefas WHERE usuario_id = $1 ORDER BY criado_em DESC", [usuario_id]);
            return rows;
        }
        return memoryDb.tarefas.filter(t => t.usuario_id == usuario_id);
    },
    async createTarefa(t) {
        if (pool) {
            await pool.query(
                "INSERT INTO tarefas (usuario_id, titulo, descricao, status, criado_em) VALUES ($1, $2, $3, $4, $5)",
                [t.usuario_id, t.titulo, t.descricao, t.status, t.criado_em]
            );
        } else {
            const newId = ++nextTaskId;
            memoryDb.tarefas.push({ ...t, id: newId });
        }
    },
    async findTarefa(id) {
        if (pool) {
            const { rows } = await pool.query("SELECT * FROM tarefas WHERE id = $1", [id]);
            return rows[0];
        }
        return memoryDb.tarefas.find(t => t.id == id);
    },
    async updateTarefaStatus(id, status) {
        if (pool) {
            await pool.query("UPDATE tarefas SET status = $1 WHERE id = $2", [status, id]);
        } else {
            const t = memoryDb.tarefas.find(x => x.id == id);
            if (t) t.status = status;
        }
    },
    async deleteTarefa(id) {
        console.log(`[DB] Tentando deletar tarefa ID: ${id} (Tipo: ${typeof id})`);
        if (pool) {
            const { rowCount } = await pool.query("DELETE FROM tarefas WHERE id = $1", [id]);
            console.log(`[DB] Postgres delete rowCount: ${rowCount}`);
            return rowCount > 0;
        } else {
            const len = memoryDb.tarefas.length;
            memoryDb.tarefas = memoryDb.tarefas.filter(t => t.id != id);
            const deleted = memoryDb.tarefas.length < len;
            console.log(`[DB] Memória delete sucesso: ${deleted}`);
            return deleted;
        }
    },
    async deleteUsuario(id) {
        console.log(`[DB] Tentando deletar usuário ID: ${id} (Tipo: ${typeof id})`);
        if (pool) {
            const { rowCount } = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
            console.log(`[DB] Postgres delete rowCount: ${rowCount}`);
            return rowCount > 0;
        } else {
            const len = memoryDb.usuarios.length;
            memoryDb.usuarios = memoryDb.usuarios.filter(u => u.id != id);
            // Simula ON DELETE CASCADE da memória
            if (memoryDb.usuarios.length < len) {
                memoryDb.tarefas = memoryDb.tarefas.filter(t => t.usuario_id != id);
            }
            const deleted = memoryDb.usuarios.length < len;
            console.log(`[DB] Memória delete sucesso: ${deleted}`);
            return deleted;
        }
    }
};
