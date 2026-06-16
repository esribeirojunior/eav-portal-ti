-- Tabela de Logs de Auditoria
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_email text not null,
  action text not null, -- 'ADICIONAR', 'EDITAR', 'EXCLUIR', 'EMPRÉSTIMO', 'DEVOLUÇÃO', 'MANUTENÇÃO'
  details text,        -- Descrição legível da ação
  resource_type text,   -- 'DEVICE', 'ASSIGNMENT', 'SHORTCUT'
  resource_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security)
alter table public.audit_logs enable row level security;

-- Política para permitir que qualquer usuário autenticado insira logs (já que o frontend faz o log)
create policy "Qualquer usuário logado pode inserir logs"
  on public.audit_logs for insert
  with check (auth.role() = 'authenticated');

-- Política para que apenas o Erisson veja os logs
create policy "Apenas Erisson pode ver os logs"
  on public.audit_logs for select
  using (auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br');
