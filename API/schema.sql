create table if not exists usuarios (
  id text primary key,
  nome text,
  email text unique not null
);

create table if not exists tarefas (
  id text primary key,
  usuario_id text not null references usuarios(id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'aberta',
  criado_em timestamp with time zone not null default now()
);

create index if not exists idx_tarefas_usuario on tarefas(usuario_id);

-- Inserção de dados iniciais (Seed)
INSERT INTO usuarios (id, nome, email) VALUES
('user-1', 'Alice Silva', 'alice@example.com'),
('user-2', 'Bob Santos', 'bob@example.com'),
('user-3', 'Carol Oliveira', 'carol@example.com');

INSERT INTO tarefas (id, usuario_id, titulo, descricao, status, criado_em) VALUES
('task-1', 'user-1', 'Comprar mantimentos', 'Leite, pão e café', 'aberta', NOW()),
('task-2', 'user-1', 'Estudar para a prova', 'Revisar matéria de Sistemas Distribuídos', 'em_andamento', NOW()),
('task-3', 'user-2', 'Configurar Nginx', 'Ajustar regras de load balancing', 'concluida', NOW()),
('task-4', 'user-3', 'Atualizar documentação', 'Incluir novos endpoints na doc', 'aberta', NOW());