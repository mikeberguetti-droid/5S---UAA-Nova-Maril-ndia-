export type SensoType = 'seiri' | 'seiton' | 'seiso' | 'seiketsu' | 'shitsuke';

export interface SensoInfo {
  id: SensoType;
  nomeJapones: string;
  nomePortugues: string;
  significado: string;
  corPrimaria: string;
  corClara: string;
  corBorda: string;
  icone: string;
}

export interface SectorResponsavel {
  id?: string;
  nome: string;
  cargo: string;
  email?: string;
  turno?: string;
}

export interface Sector {
  id: string;
  nome: string;
  area: 'Industrial' | 'Utilidades' | 'Apoio' | 'Administrativo';
  responsavel_nome: string;
  responsavel_cargo: string;
  responsavel_email: string;
  responsaveis?: SectorResponsavel[];
  meta_5s: number; // e.g. 90%
  turno_ativo: string;
  ultima_auditoria?: string;
  ultima_nota?: number;
}

export interface Auditor {
  id: string;
  nome: string;
  matricula: string;
  setor_origem: string;
  cargo: string;
  email: string;
  avatar?: string;
  total_auditorias: number;
  auditorias_no_prazo: number;
  auditorias_com_atraso: number;
  score_pontualidade: number; // 0 to 100%
  dias_medio_desvio: number; // negative = early, 0 = on time, positive = days late
}

export interface ChecklistQuestion {
  id: string;
  senso: SensoType;
  numero: number;
  titulo: string;
  descricao_criterio: string;
  padrao_esperado?: string;
  peso?: number;
  ativo: boolean;
}

export interface AuditCriterionAnswer {
  pergunta_id: string;
  senso: SensoType;
  qtd_evidencias: number; // 0, 1, 2, 3, 4, 5, 6+
  pontos: number; // calculated according to official table: 0->100, 1->80, 2->70, 3->50, 4->30, 5->10, 6+->0
  descricao: string; // text or voice transcription
  foto_url?: string;
  audio_url?: string;
  // Action plan fields if qtd_evidencias > 0
  fato?: string;
  causa?: string;
  acao?: string;
  supervisor_responsavel?: string;
  data_limite?: string;
}

export interface Audit {
  id: string;
  codigo: string; // Ex: AUD-2026-088
  ciclo?: string; // Ex: '2026/11' (Ciclo de Auditorias YYYY/MM)
  setor_id: string;
  setor_nome: string;
  auditor_id: string;
  auditor_nome: string;
  data: string; // YYYY-MM-DD - exact date the auditor executed
  data_sugerida?: string; // YYYY-MM-DD - scheduled date if planned
  hora: string; // HH:MM
  turno: 'Turno 1' | 'Turno 2' | 'Turno 3' | 'Administrativo';
  status: 'concluida' | 'em_andamento' | 'cancelada';
  notas_sensos: Record<SensoType, number>; // average points (0-100) per senso
  nota_final: number; // overall percentage (0-100)
  total_problemas: number;
  criterios_sem_problemas: number;
  observacoes_gerais: string;
  respostas: AuditCriterionAnswer[];
  assinatura_auditor?: string;
  assinatura_responsavel?: string;
}

export type ActionPlanStatus = 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';

export interface ActionPlan {
  id: string;
  auditoria_id: string;
  auditoria_codigo: string;
  mes: string; // Ex: Novembro/2026
  ciclo?: string; // Ex: 2026/11
  setor_id: string;
  setor_nome: string;
  pergunta_id: string;
  criterio_resumo: string;
  senso: SensoType;
  qtd_problemas: number;
  data_criacao: string;
  data_prazo: string;
  data_conclusao?: string;
  // Official UAA Table columns
  fato: string;        // Inconformidade
  causa: string;       // Causa raiz
  acao: string;        // Ação de bloqueio/corretiva
  responsavel: string; // Supervisor responsável
  prazo: string;       // Data limite
  // Additional rich tracking
  foto_antes?: string;
  foto_depois?: string;
  justificativa_conclusao?: string;
  status: ActionPlanStatus;
  gravidade: 'baixa' | 'media' | 'alta' | 'critica';
}

export interface ScheduledAudit {
  id: string;
  ciclo?: string; // Ex: '2026/11' (Ciclo de Auditorias YYYY/MM)
  setor_id: string;
  setor_nome: string;
  auditor_id: string;
  auditor_nome: string;
  data_sugerida: string; // YYYY-MM-DD
  data_realizada?: string; // YYYY-MM-DD
  prazo_limite?: string;
  turno?: string;
  status: 'pendente' | 'realizada_no_prazo' | 'realizada_com_atraso' | 'atrasada';
  dias_diferenca?: number; // 0 = exactly on date, < 0 = early, > 0 = late
  auditoria_id?: string;
  observacoes?: string;
}

export interface SectorPhoto {
  id: string;
  setor_id: string;
  setor_nome: string;
  mes: string; // Ex: 'Novembro/2026'
  ciclo: string; // Ex: '2026/11'
  data: string; // YYYY-MM-DD
  foto_url: string;
  titulo?: string;
  descricao: string;
  senso?: SensoType;
  tipo: 'evidencia_auditoria' | 'plano_antes' | 'plano_depois' | 'registro_setor';
  auditoria_id?: string;
  auditoria_codigo?: string;
  auditor_nome?: string;
  supervisor_nome?: string;
}

export interface HistoryPoint {
  mes: string;
  data: string;
  media_geral: number;
  setores_pontos: Record<string, number>;
}
