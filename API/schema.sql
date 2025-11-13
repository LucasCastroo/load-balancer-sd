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