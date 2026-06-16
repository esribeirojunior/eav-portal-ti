-- ==========================================
-- SCRIPT DE SEGURANÇA TOTAL (RLS)
-- Rodar no painel SQL do Supabase
-- ==========================================

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorized_users ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas (prevenção)
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.devices;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.assignments;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.shortcuts;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.department;

-- 3. Criar políticas de LEITURA (Públicas ou para Autenticados)
-- Qualquer pessoa com a chave anon pode VER os dados (necessário para o funcionamento do app)
CREATE POLICY "Leitura_Publica_Devices" ON public.devices FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Assignments" ON public.assignments FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Shortcuts" ON public.shortcuts FOR SELECT USING (true);
CREATE POLICY "Leitura_Publica_Departments" ON public.department FOR SELECT USING (true);

-- 4. Criar políticas de ESCRITA/UPDATE (RESTRITA)
-- Só permite inserir/alterar se o email for do Erisson ou estiver na lista authorized_users
-- NOTA: Como usamos Auth Providers, checamos o email do JWT logado
CREATE POLICY "Escrita_Restrita_Admin_Devices" ON public.devices 
FOR ALL USING (
  auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br' OR 
  auth.jwt() ->> 'email' IN (SELECT email FROM authorized_users)
);

CREATE POLICY "Escrita_Restrita_Admin_Assignments" ON public.assignments 
FOR ALL USING (
  auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br' OR 
  auth.jwt() ->> 'email' IN (SELECT email FROM authorized_users)
);

CREATE POLICY "Escrita_Restrita_Admin_Shortcuts" ON public.shortcuts 
FOR ALL USING (
  auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br'
);

CREATE POLICY "Escrita_Restrita_Admin_Department" ON public.department 
FOR ALL USING (
  auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br'
);

-- 5. Audit Logs (Apenas inserção é livre para logados, leitura só Admin)
CREATE POLICY "Insercao_Audit" ON public.audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Leitura_Audit_Admin" ON public.audit_logs FOR SELECT USING (auth.jwt() ->> 'email' = 'erisson.junior@escolaamericana.com.br');
