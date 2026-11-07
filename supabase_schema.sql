-- ==============================================================================
-- PROGRAMA 5S UAA - UNIÃO AVÍCOLA AGROINDUSTRIAL (NOVA MARILÂNDIA / MT)
-- ESTRUTURA COMPLETA DE TABELAS PARA O SUPABASE (POSTGRESQL)
-- ==============================================================================
-- Instruções:
-- 1. Acesse o painel do Supabase: https://supabase.com/dashboard
-- 2. Selecione o seu projeto e vá em "SQL Editor" no menu lateral.
-- 3. Cole todo este script e clique no botão "Run" (Executar).
-- ==============================================================================

-- Habilita extensão para geração de UUID caso necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. TABELA DE SETORES INDUSTRIAIS E ADMINISTRATIVOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sectors (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Industrial', -- Industrial, Utilidades, Apoio, Administrativo
    responsavel_nome TEXT,
    responsavel_cargo TEXT DEFAULT 'Supervisor',
    responsavel_email TEXT,
    responsaveis JSONB DEFAULT '[]'::jsonb, -- Suporte a múltiplos supervisores com turnos
    meta_5s NUMERIC NOT NULL DEFAULT 80,
    turno_ativo TEXT DEFAULT 'Turnos 1 e 2',
    ultima_auditoria TEXT,
    ultima_nota NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_sectors_area ON public.sectors(area);
CREATE INDEX IF NOT EXISTS idx_sectors_nome ON public.sectors(nome);

-- ------------------------------------------------------------------------------
-- 2. TABELA DE AUDITORES INTERNOS E USUÁRIOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.auditors (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    matricula TEXT,
    setor_origem TEXT,
    cargo TEXT DEFAULT 'Auditor Interno 5S',
    email TEXT,
    total_auditorias INT DEFAULT 0,
    auditorias_no_prazo INT DEFAULT 0,
    auditorias_com_atraso INT DEFAULT 0,
    score_pontualidade NUMERIC DEFAULT 100,
    dias_medio_desvio NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auditors_matricula ON public.auditors(matricula);
CREATE INDEX IF NOT EXISTS idx_auditors_score ON public.auditors(score_pontualidade DESC);

-- ------------------------------------------------------------------------------
-- 3. TABELA DE PERGUNTAS / CRITÉRIOS DO CHECKLIST DOS 5 SENSOS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.checklist_questions (
    id TEXT PRIMARY KEY,
    senso TEXT NOT NULL, -- seiri, seiton, seiso, seiketsu, shitsuke
    numero INT NOT NULL,
    titulo TEXT NOT NULL,
    descricao_criterio TEXT NOT NULL,
    padrao_esperado TEXT NOT NULL,
    peso NUMERIC DEFAULT 2,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_senso ON public.checklist_questions(senso);

-- ------------------------------------------------------------------------------
-- 4. TABELA DE AUDITORIAS REALIZADAS (HISTÓRICO OFICIAL)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audits (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    auditor_id TEXT NOT NULL REFERENCES public.auditors(id) ON DELETE RESTRICT,
    auditor_nome TEXT NOT NULL,
    auditor_matricula TEXT,
    supervisor_acompanhante TEXT,
    data TEXT NOT NULL, -- YYYY-MM-DD
    hora TEXT,
    turno TEXT,
    ciclo TEXT NOT NULL, -- Ex: 2026/11
    respostas JSONB NOT NULL, -- Lista completa das avaliações dos 25 critérios
    nota_final NUMERIC NOT NULL,
    percentual_atingido NUMERIC NOT NULL,
    status_conformidade TEXT, -- Conforme, Parcialmente Conforme, Crítico
    observacoes_gerais TEXT,
    total_conformes INT DEFAULT 0,
    total_inconformes INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audits_setor ON public.audits(setor_id);
CREATE INDEX IF NOT EXISTS idx_audits_auditor ON public.audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_ciclo ON public.audits(ciclo);
CREATE INDEX IF NOT EXISTS idx_audits_data ON public.audits(data DESC);

-- ------------------------------------------------------------------------------
-- 5. TABELA DE PLANOS DE AÇÃO 5W2H (INCONFORMIDADES DETECTADAS)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.action_plans (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE CASCADE,
    auditoria_codigo TEXT,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    supervisor_responsavel TEXT,
    senso TEXT NOT NULL, -- seiri, seiton, seiso, seiketsu, shitsuke
    criterio_id TEXT,
    criterio_numero INT,
    descricao_problema TEXT,
    o_que_fazer TEXT,
    por_que_fazer TEXT,
    onde_fazer TEXT,
    quem_fara TEXT,
    como_fazer TEXT,
    prazo_limite TEXT, -- Data limite para resolução
    data_criacao TEXT,
    data_conclusao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, em_andamento, concluido, cancelado
    foto_antes TEXT,
    foto_depois TEXT,
    observacoes TEXT,
    ciclo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plans_setor ON public.action_plans(setor_id);
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.action_plans(status);
CREATE INDEX IF NOT EXISTS idx_plans_senso ON public.action_plans(senso);
CREATE INDEX IF NOT EXISTS idx_plans_auditoria ON public.action_plans(auditoria_id);

-- ------------------------------------------------------------------------------
-- 6. TABELA DE AGENDAMENTOS NO CALENDÁRIO & PONTUALIDADE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheduled_audits (
    id TEXT PRIMARY KEY,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    auditor_id TEXT NOT NULL REFERENCES public.auditors(id) ON DELETE RESTRICT,
    auditor_nome TEXT NOT NULL,
    data_sugerida TEXT NOT NULL, -- Data planejada (YYYY-MM-DD)
    ciclo TEXT NOT NULL, -- Ex: 2026/11
    turno TEXT,
    status TEXT NOT NULL DEFAULT 'pendente', -- pendente, concluida, atrasada
    data_execucao TEXT,
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_setor ON public.scheduled_audits(setor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_auditor ON public.scheduled_audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_data ON public.scheduled_audits(data_sugerida);
CREATE INDEX IF NOT EXISTS idx_schedules_ciclo ON public.scheduled_audits(ciclo);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON public.scheduled_audits(status);

-- ------------------------------------------------------------------------------
-- 7. TABELA DE MURAL DE FOTOS E EVIDÊNCIAS 5S POR SETOR
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sector_photos (
    id TEXT PRIMARY KEY,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    mes TEXT, -- Ex: Novembro/2026
    ciclo TEXT, -- Ex: 2026/11
    data TEXT,
    foto_url TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    senso TEXT, -- seiri, seiton, seiso, seiketsu, shitsuke
    tipo TEXT DEFAULT 'evidencia', -- evidencia, antes, depois, setor
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE SET NULL,
    auditoria_codigo TEXT,
    auditor_nome TEXT,
    supervisor_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_setor ON public.sector_photos(setor_id);
CREATE INDEX IF NOT EXISTS idx_photos_mes ON public.sector_photos(mes);
CREATE INDEX IF NOT EXISTS idx_photos_ciclo ON public.sector_photos(ciclo);
CREATE INDEX IF NOT EXISTS idx_photos_senso ON public.sector_photos(senso);

-- ------------------------------------------------------------------------------
-- 8. POLÍTICAS DE SEGURANÇA ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
-- Permite leitura e escrita para clientes da aplicação conectada via Supabase
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_photos ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público/anônimo ou autenticado da aplicação
DO $$
BEGIN
    DROP POLICY IF EXISTS "Permitir tudo para sectors" ON public.sectors;
    CREATE POLICY "Permitir tudo para sectors" ON public.sectors FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para auditors" ON public.auditors;
    CREATE POLICY "Permitir tudo para auditors" ON public.auditors FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para checklist_questions" ON public.checklist_questions;
    CREATE POLICY "Permitir tudo para checklist_questions" ON public.checklist_questions FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para audits" ON public.audits;
    CREATE POLICY "Permitir tudo para audits" ON public.audits FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para action_plans" ON public.action_plans;
    CREATE POLICY "Permitir tudo para action_plans" ON public.action_plans FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para scheduled_audits" ON public.scheduled_audits;
    CREATE POLICY "Permitir tudo para scheduled_audits" ON public.scheduled_audits FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Permitir tudo para sector_photos" ON public.sector_photos;
    CREATE POLICY "Permitir tudo para sector_photos" ON public.sector_photos FOR ALL USING (true) WITH CHECK (true);
END $$;
