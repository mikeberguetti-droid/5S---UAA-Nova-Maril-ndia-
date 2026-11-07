import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Sector, 
  Auditor, 
  ChecklistQuestion, 
  Audit, 
  ActionPlan, 
  ScheduledAudit, 
  SectorPhoto 
} from '../types';

const SUPABASE_STORAGE_KEY = 'uaa_5s_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string; // Publishable Key (sb_publishable_...) ou Anon Key
}

export function getSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const raw = localStorage.getItem(SUPABASE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }

  return { url: '', anonKey: '' };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  supabaseInstance = null; // Reset cached instance
  localStorage.setItem(SUPABASE_STORAGE_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.url || !config.anonKey) return null;

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey);
    } catch (e) {
      console.error('Falha ao instanciar cliente Supabase:', e);
      return null;
    }
  }
  return supabaseInstance;
}

export async function testSupabaseConnection(config?: SupabaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const activeConfig = config || getSupabaseConfig();
    if (!activeConfig.url || !activeConfig.anonKey) {
      return { success: false, message: 'Informe a URL do Projeto e a Publishable Key (sb_publishable_...).' };
    }
    const client = createClient(activeConfig.url, activeConfig.anonKey);
    const { error } = await client.from('sectors').select('count', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      return { 
        success: false, 
        message: `Conectou ao Supabase, mas a tabela pode não existir ou faltar permissão: ${error.message}. Execute o script SQL no Supabase.` 
      };
    }
    return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
  } catch (err: any) {
    return { success: false, message: `Erro ao conectar: ${err?.message || String(err)}` };
  }
}

/**
 * Auto-sync single items to Supabase
 */
export async function syncItemToSupabase(table: string, payload: any): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from(table).upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn(`Supabase sync warning on table ${table}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase sync error on table ${table}:`, err);
    return false;
  }
}

export async function deleteItemFromSupabase(table: string, id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) {
      console.warn(`Supabase delete warning on table ${table}:`, error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn(`Supabase delete error on table ${table}:`, err);
    return false;
  }
}

/**
 * Batch upload all data to Supabase (O botão "Sincronizar Agora")
 */
export async function syncAllToSupabase(data: {
  sectors: Sector[];
  auditors: Auditor[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  scheduledAudits: ScheduledAudit[];
  photos: SectorPhoto[];
  questions: ChecklistQuestion[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Supabase não configurado. Forneça a URL e a Publishable Key primeiro.' };
  }

  let totalSynced = 0;
  const errors: string[] = [];

  try {
    // 1. Sectors
    if (data.sectors.length > 0) {
      const { error } = await client.from('sectors').upsert(data.sectors, { onConflict: 'id' });
      if (error) errors.push(`Setores: ${error.message}`);
      else totalSynced += data.sectors.length;
    }

    // 2. Auditors
    if (data.auditors.length > 0) {
      const { error } = await client.from('auditors').upsert(data.auditors, { onConflict: 'id' });
      if (error) errors.push(`Auditores: ${error.message}`);
      else totalSynced += data.auditors.length;
    }

    // 3. Checklist Questions
    if (data.questions.length > 0) {
      const { error } = await client.from('checklist_questions').upsert(data.questions, { onConflict: 'id' });
      if (error) errors.push(`Critérios: ${error.message}`);
      else totalSynced += data.questions.length;
    }

    // 4. Audits
    if (data.audits.length > 0) {
      const { error } = await client.from('audits').upsert(data.audits, { onConflict: 'id' });
      if (error) errors.push(`Auditorias: ${error.message}`);
      else totalSynced += data.audits.length;
    }

    // 5. Action Plans
    if (data.actionPlans.length > 0) {
      const { error } = await client.from('action_plans').upsert(data.actionPlans, { onConflict: 'id' });
      if (error) errors.push(`Planos de Ação: ${error.message}`);
      else totalSynced += data.actionPlans.length;
    }

    // 6. Schedules
    if (data.scheduledAudits.length > 0) {
      const { error } = await client.from('scheduled_audits').upsert(data.scheduledAudits, { onConflict: 'id' });
      if (error) errors.push(`Agendamentos: ${error.message}`);
      else totalSynced += data.scheduledAudits.length;
    }

    // 7. Photos
    if (data.photos.length > 0) {
      const { error } = await client.from('sector_photos').upsert(data.photos, { onConflict: 'id' });
      if (error) errors.push(`Fotos: ${error.message}`);
      else totalSynced += data.photos.length;
    }

    if (errors.length > 0 && totalSynced === 0) {
      return { success: false, count: 0, error: errors.join('; ') };
    }

    return { success: true, count: totalSynced };
  } catch (err: any) {
    return { success: false, count: totalSynced, error: err?.message || String(err) };
  }
}

/**
 * SQL Schema definition for Supabase tables
 */
export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- PROGRAMA 5S UAA - UNIÃO AVÍCOLA AGROINDUSTRIAL (NOVA MARILÂNDIA / MT)
-- ESTRUTURA COMPLETA DE TABELAS PARA O SUPABASE (POSTGRESQL)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Setores Industriais
CREATE TABLE IF NOT EXISTS public.sectors (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT 'Industrial',
    responsavel_nome TEXT,
    responsavel_cargo TEXT DEFAULT 'Supervisor',
    responsavel_email TEXT,
    responsaveis JSONB DEFAULT '[]'::jsonb,
    meta_5s NUMERIC NOT NULL DEFAULT 80,
    turno_ativo TEXT DEFAULT 'Turnos 1 e 2',
    ultima_auditoria TEXT,
    ultima_nota NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sectors_area ON public.sectors(area);
CREATE INDEX IF NOT EXISTS idx_sectors_nome ON public.sectors(nome);

-- 2. Tabela de Auditores Internos
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

-- 3. Tabela de Critérios / Perguntas dos 5 Sensos
CREATE TABLE IF NOT EXISTS public.checklist_questions (
    id TEXT PRIMARY KEY,
    senso TEXT NOT NULL,
    numero INT NOT NULL,
    titulo TEXT NOT NULL,
    descricao_criterio TEXT NOT NULL,
    padrao_esperado TEXT NOT NULL,
    peso NUMERIC DEFAULT 2,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_senso ON public.checklist_questions(senso);

-- 4. Tabela de Auditorias Realizadas
CREATE TABLE IF NOT EXISTS public.audits (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    auditor_id TEXT NOT NULL REFERENCES public.auditors(id) ON DELETE RESTRICT,
    auditor_nome TEXT NOT NULL,
    auditor_matricula TEXT,
    supervisor_acompanhante TEXT,
    data TEXT NOT NULL,
    hora TEXT,
    turno TEXT,
    ciclo TEXT NOT NULL,
    respostas JSONB NOT NULL,
    nota_final NUMERIC NOT NULL,
    percentual_atingido NUMERIC NOT NULL,
    status_conformidade TEXT,
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

-- 5. Tabela de Planos de Ação 5W2H
CREATE TABLE IF NOT EXISTS public.action_plans (
    id TEXT PRIMARY KEY,
    codigo TEXT NOT NULL UNIQUE,
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE CASCADE,
    auditoria_codigo TEXT,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    supervisor_responsavel TEXT,
    senso TEXT NOT NULL,
    criterio_id TEXT,
    criterio_numero INT,
    descricao_problema TEXT,
    o_que_fazer TEXT,
    por_que_fazer TEXT,
    onde_fazer TEXT,
    quem_fara TEXT,
    como_fazer TEXT,
    prazo_limite TEXT,
    data_criacao TEXT,
    data_conclusao TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
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

-- 6. Tabela de Agendamentos / Calendário
CREATE TABLE IF NOT EXISTS public.scheduled_audits (
    id TEXT PRIMARY KEY,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    auditor_id TEXT NOT NULL REFERENCES public.auditors(id) ON DELETE RESTRICT,
    auditor_nome TEXT NOT NULL,
    data_sugerida TEXT NOT NULL,
    ciclo TEXT NOT NULL,
    turno TEXT,
    status TEXT NOT NULL DEFAULT 'pendente',
    data_execucao TEXT,
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE SET NULL,
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_setor ON public.scheduled_audits(setor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_auditor ON public.scheduled_audits(auditor_id);
CREATE INDEX IF NOT EXISTS idx_schedules_data ON public.scheduled_audits(data_sugerida);

-- 7. Tabela de Fotos e Evidências por Setor
CREATE TABLE IF NOT EXISTS public.sector_photos (
    id TEXT PRIMARY KEY,
    setor_id TEXT NOT NULL REFERENCES public.sectors(id) ON DELETE RESTRICT,
    setor_nome TEXT NOT NULL,
    mes TEXT,
    ciclo TEXT,
    data TEXT,
    foto_url TEXT NOT NULL,
    titulo TEXT,
    descricao TEXT,
    senso TEXT,
    tipo TEXT DEFAULT 'evidencia',
    auditoria_id TEXT REFERENCES public.audits(id) ON DELETE SET NULL,
    auditoria_codigo TEXT,
    auditor_nome TEXT,
    supervisor_nome TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_setor ON public.sector_photos(setor_id);
CREATE INDEX IF NOT EXISTS idx_photos_mes ON public.sector_photos(mes);
CREATE INDEX IF NOT EXISTS idx_photos_ciclo ON public.sector_photos(ciclo);

-- 8. Políticas Row Level Security (RLS)
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector_photos ENABLE ROW LEVEL SECURITY;

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
`;
