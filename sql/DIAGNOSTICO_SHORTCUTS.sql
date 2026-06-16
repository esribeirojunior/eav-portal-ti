-- Script de Diagnóstico para o Módulo de Links
-- Execute este script no SQL Editor do Supabase para verificar a configuração

-- 1. Verificar se a tabela shortcuts existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'shortcuts'
) as tabela_existe;

-- 2. Se existir, contar quantos registros tem
SELECT COUNT(*) as total_atalhos FROM public.shortcuts;

-- 3. Listar todos os atalhos cadastrados
SELECT 
    id,
    title,
    url,
    icon_name,
    color,
    created_at
FROM public.shortcuts
ORDER BY created_at ASC;

-- 4. Verificar políticas RLS (Row Level Security)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'shortcuts';

-- 5. Se a tabela não existir, criar com dados iniciais
-- (Descomente as linhas abaixo se necessário)

/*
CREATE TABLE IF NOT EXISTS public.shortcuts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL UNIQUE,
    icon_name TEXT DEFAULT 'Monitor',
    color TEXT DEFAULT 'bg-indigo-600',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserir dados iniciais
INSERT INTO public.shortcuts (title, description, url, icon_name, color)
VALUES 
('BenQ DMS', 'Gestão de Telas Interativas e Projetores', 'https://dms.benq.com/', 'Monitor', 'bg-orange-500'),
('Google Admin', 'Gestão de Contas, Chromebooks e Políticas', 'https://admin.google.com/', 'Globe', 'bg-blue-600'),
('Meraki Dashboard', 'Infraestrutura de Rede e Wi-Fi', 'https://dashboard.meraki.com/', 'Globe', 'bg-emerald-600'),
('Suporte Microsoft', 'Portal de Administração Microsoft 365', 'https://admin.microsoft.com/', 'Cloud', 'bg-indigo-600')
ON CONFLICT (url) DO NOTHING;

-- Habilitar acesso público para leitura (se necessário)
ALTER TABLE public.shortcuts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura pública de atalhos"
ON public.shortcuts FOR SELECT
USING (true);

CREATE POLICY "Apenas admins podem inserir/atualizar/deletar"
ON public.shortcuts FOR ALL
USING (auth.role() = 'authenticated');
*/
