-- Recriação das tabelas com ID numérico (SERIAL)
DROP TABLE IF EXISTS tarefas;
DROP TABLE IF EXISTS tarefa;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS usuario;

create table usuario (
  id serial primary key,
  nome text,
  email text unique not null
);

create table tarefa (
  id serial primary key,
  usuario_id integer not null references usuario(id) on delete cascade,
  titulo text not null,
  descricao text,
  status text not null default 'aberta',
  criado_em timestamp with time zone not null default now()
);

create index idx_tarefas_usuario on tarefas(usuario_id);

-- Inserção de dados iniciais (Seed)
INSERT INTO usuario (nome, email) VALUES
('Alice Silva', 'alice@example.com'),
('Bob Santos', 'bob@example.com'),
('Carol Oliveira', 'carol@example.com');

INSERT INTO tarefa (usuario_id, titulo, descricao, status, criado_em) VALUES
(1, 'Comprar mantimentos', 'Leite, pão e café', 'aberta', NOW()),
(1, 'Estudar para a prova', 'Revisar matéria de Sistemas Distribuídos', 'em_andamento', NOW()),
(2, 'Configurar Nginx', 'Ajustar regras de load balancing', 'concluida', NOW()),
(3, 'Atualizar documentação', 'Incluir novos endpoints na doc', 'aberta', NOW());