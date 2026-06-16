-- Script para Corrigir Acesso à Tabela shortcuts
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar se RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'shortcuts';

-- 2. Desabilitar RLS temporariamente para teste
ALTER TABLE public.shortcuts DISABLE ROW LEVEL SECURITY;

-- 3. OU criar política que permite leitura pública
-- (Recomendado para produção)
ALTER TABLE public.shortcuts ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Permitir leitura pública de atalhos" ON public.shortcuts;
DROP POLICY IF EXISTS "Apenas admins podem inserir/atualizar/deletar" ON public.shortcuts;

-- Criar política de leitura pública (qualquer um pode ler)
CREATE POLICY "Permitir leitura pública de atalhos"
ON public.shortcuts FOR SELECT
USING (true);

-- Criar política de escrita apenas para usuários autenticados
CREATE POLICY "Apenas autenticados podem modificar atalhos"
ON public.shortcuts FOR ALL
USING (auth.role() = 'authenticated');

-- 4. Verificar políticas criadas
SELECT * FROM pg_policies WHERE tablename = 'shortcuts';

-- 5. Testar query manualmente
SELECT * FROM public.shortcuts ORDER BY created_at ASC;
