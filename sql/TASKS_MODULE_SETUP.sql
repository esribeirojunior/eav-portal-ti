-- Tabela de Tarefas TI
CREATE TABLE IF NOT EXISTS it_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, blocked
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  due_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL, -- Email do criador
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Comentários das Tarefas
CREATE TABLE IF NOT EXISTS it_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES it_tasks(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE it_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE it_task_comments ENABLE ROW LEVEL SECURITY;

-- Policies (Simplificadas: TI vê tudo)
CREATE POLICY "TI Full Access Tasks" ON it_tasks
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "TI Full Access Comments" ON it_task_comments
  FOR ALL USING (true) WITH CHECK (true);
