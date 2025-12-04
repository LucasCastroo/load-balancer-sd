-- Recriação das tabelas com ID numérico (SERIAL)
DROP TABLE IF EXISTS tarefas;
DROP TABLE IF EXISTS usuarios;

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT,
  email TEXT UNIQUE NOT NULL
);

CREATE TABLE tarefas (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT NOT NULL DEFAULT 'aberta',
  criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tarefas_usuario ON tarefas(usuario_id);

-- Inserção de dados iniciais (Seed)
INSERT INTO usuarios (nome, email) VALUES
('Alice Silva', 'alice@example.com'),
('Bob Santos', 'bob@example.com'),
('Carol Oliveira', 'carol@example.com');

INSERT INTO tarefas (usuario_id, titulo, descricao, status, criado_em) VALUES
(1, 'Comprar mantimentos', 'Leite, pão e café', 'aberta', NOW()),
(1, 'Estudar para a prova', 'Revisar matéria de Sistemas Distribuídos', 'em_andamento', NOW()),
(2, 'Configurar Nginx', 'Ajustar regras de load balancing', 'concluida', NOW()),
(3, 'Atualizar documentação', 'Incluir novos endpoints na doc', 'aberta', NOW());