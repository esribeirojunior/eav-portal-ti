-- 1. Habilitar extensão para busca de texto (opcional, mas bom para autocomplete)
create extension if not exists pg_trgm;

-- 2. Tabela de Departamentos
create table if not exists public.department (
  id uuid default gen_random_uuid() primary key,
  name text not null unique
);

-- Inserir departamentos padrão
insert into public.department (name) values 
('TI'), 
('Diretoria'), 
('Secretaria'), 
('Coordenação'), 
('Docentes'), 
('Discentes'),
('Manutenção')
on conflict (name) do nothing;

-- 3. Tabela de Dispositivos (Devices)
create table if not exists public.devices (
  id uuid default gen_random_uuid() primary key,
  tag text not null unique,         -- Ex: EAV-001
  serial_number text,               -- Ex: SN123456
  model text not null,              -- Ex: Dell Latitude
  type text not null,               -- Ex: Notebook, MacBook (Enum no front)
  status text not null default 'Disponível', -- Disponível, Em Uso, Manutenção
  condition text default 'Bom',     -- Estado físico: Bom, Regular, Ruim
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Histórico de Atribuições (Assignments)
create table if not exists public.assignments (
  id uuid default gen_random_uuid() primary key,
  device_id uuid not null references public.devices(id),
  user_name text not null,          -- Nome do responsável (autocomplete busca aqui)
  department_id uuid references public.department(id), 
  user_role text,                   -- Aluno, Professor (opcional)
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  returned_at timestamp with time zone, -- Se nulo, está "Em Uso"
  return_photo_url text,
  grade text                        -- Turma/Série (Ex: 9th Grade, 3º Ano A)
  -- Outros campos podem ser adicionados conforme necessidade
);

-- 5. Tabela de Usuários Autorizados (Para login)
create table if not exists public.authorized_users (
  email text primary key
);

-- 6. Indices para Performance
create index if not exists idx_assignments_user_name_trgm on public.assignments using gin (user_name gin_trgm_ops);
create index if not exists idx_assignments_device_id on public.assignments(device_id);
create index if not exists idx_devices_tag on public.devices(tag);

-- 7. Tabela para o Centro de Atalhos TI
CREATE TABLE IF NOT EXISTS public.shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'Monitor',
    color TEXT DEFAULT 'bg-indigo-600',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais para o Centro de Atalhos
INSERT INTO public.shortcuts (title, description, url, icon_name, color)
VALUES 
('BenQ DMS', 'Gestão de Telas Interativas e Projetores', 'https://dms.benq.com/', 'Monitor', 'bg-orange-500'),
('Google Admin', 'Gestão de Contas, Chromebooks e Políticas', 'https://admin.google.com/', 'Globe', 'bg-blue-600'),
('Meraki Dashboard', 'Infraestrutura de Rede e Wi-Fi', 'https://dashboard.meraki.com/', 'Globe', 'bg-emerald-600'),
('Suporte Microsoft', 'Portal de Administração Microsoft 365', 'https://admin.microsoft.com/', 'Cloud', 'bg-indigo-600')
ON CONFLICT DO NOTHING;
