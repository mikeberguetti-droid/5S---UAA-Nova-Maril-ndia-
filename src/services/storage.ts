import { 
  Sector, 
  Auditor, 
  ChecklistQuestion, 
  Audit, 
  ActionPlan, 
  ScheduledAudit,
  AuditCriterionAnswer,
  SensoType,
  SectorPhoto
} from '../types';
import {
  INITIAL_SECTORS,
  INITIAL_AUDITORS,
  INITIAL_QUESTIONS,
  INITIAL_AUDITS,
  INITIAL_ACTION_PLANS,
  INITIAL_SCHEDULED_AUDITS
} from '../data/initialData';
import { saveDocToFirestore, deleteDocFromFirestore, COLLECTIONS } from './firestoreSync';
import { syncItemToSupabase, deleteItemFromSupabase } from './supabaseSync';

const STORAGE_KEYS = {
  SECTORS: 'uaa_5s_sectors_v3',
  AUDITORS: 'uaa_5s_auditors_v3',
  QUESTIONS: 'uaa_5s_questions_v3',
  AUDITS: 'uaa_5s_audits_v3',
  ACTION_PLANS: 'uaa_5s_action_plans_v3',
  SCHEDULED_AUDITS: 'uaa_5s_scheduled_audits_v3',
  ACTIVE_USER: 'uaa_5s_active_user_v3',
  PHOTOS: 'uaa_5s_photos_v3'
};

export const getStoredSectors = (): Sector[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECTORS);
    return raw ? JSON.parse(raw) : INITIAL_SECTORS;
  } catch {
    return INITIAL_SECTORS;
  }
};

export const saveStoredSectors = (sectors: Sector[]): void => {
  localStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
  // Background cloud persistence (Firestore & Supabase)
  sectors.forEach(s => {
    saveDocToFirestore(COLLECTIONS.SECTORS, s).catch(e => console.warn('Cloud sync error (sectors):', e));
    syncItemToSupabase('sectors', s).catch(e => console.warn('Supabase auto-sync error (sectors):', e));
  });
};

export const getStoredAuditors = (): Auditor[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITORS);
    return raw ? JSON.parse(raw) : INITIAL_AUDITORS;
  } catch {
    return INITIAL_AUDITORS;
  }
};

export const saveStoredAuditors = (auditors: Auditor[]): void => {
  localStorage.setItem(STORAGE_KEYS.AUDITORS, JSON.stringify(auditors));
  // Background cloud persistence (Firestore & Supabase)
  auditors.forEach(a => {
    saveDocToFirestore(COLLECTIONS.AUDITORS, a).catch(e => console.warn('Cloud sync error (auditors):', e));
    syncItemToSupabase('auditors', a).catch(e => console.warn('Supabase auto-sync error (auditors):', e));
  });
};

export const getStoredQuestions = (): ChecklistQuestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return raw ? JSON.parse(raw) : INITIAL_QUESTIONS;
  } catch {
    return INITIAL_QUESTIONS;
  }
};

export const saveStoredQuestions = (questions: ChecklistQuestion[]): void => {
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  // Background cloud persistence (Firestore & Supabase)
  questions.forEach(q => {
    saveDocToFirestore(COLLECTIONS.QUESTIONS, q).catch(e => console.warn('Cloud sync error (questions):', e));
    syncItemToSupabase('checklist_questions', q).catch(e => console.warn('Supabase auto-sync error (questions):', e));
  });
};

export const getStoredAudits = (): Audit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDITS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredAudits = (audits: Audit[]): void => {
  localStorage.setItem(STORAGE_KEYS.AUDITS, JSON.stringify(audits));
  // Background cloud persistence (Firestore & Supabase)
  audits.forEach(aud => {
    saveDocToFirestore(COLLECTIONS.AUDITS, aud).catch(e => console.warn('Cloud sync error (audits):', e));
    syncItemToSupabase('audits', aud).catch(e => console.warn('Supabase auto-sync error (audits):', e));
  });
};

export const getStoredActionPlans = (): ActionPlan[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTION_PLANS);
    return raw ? JSON.parse(raw) : INITIAL_ACTION_PLANS;
  } catch {
    return INITIAL_ACTION_PLANS;
  }
};

export const saveStoredActionPlans = (plans: ActionPlan[]): void => {
  localStorage.setItem(STORAGE_KEYS.ACTION_PLANS, JSON.stringify(plans));
  // Background cloud persistence (Firestore & Supabase)
  plans.forEach(p => {
    saveDocToFirestore(COLLECTIONS.ACTION_PLANS, p).catch(e => console.warn('Cloud sync error (actionPlans):', e));
    syncItemToSupabase('action_plans', p).catch(e => console.warn('Supabase auto-sync error (action_plans):', e));
  });
};

export const getStoredScheduledAudits = (): ScheduledAudit[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SCHEDULED_AUDITS);
    return raw ? JSON.parse(raw) : INITIAL_SCHEDULED_AUDITS;
  } catch {
    return INITIAL_SCHEDULED_AUDITS;
  }
};

export const saveStoredScheduledAudits = (schedules: ScheduledAudit[]): void => {
  localStorage.setItem(STORAGE_KEYS.SCHEDULED_AUDITS, JSON.stringify(schedules));
  // Background cloud persistence (Firestore & Supabase)
  schedules.forEach(sch => {
    saveDocToFirestore(COLLECTIONS.SCHEDULED_AUDITS, sch).catch(e => console.warn('Cloud sync error (schedules):', e));
    syncItemToSupabase('scheduled_audits', sch).catch(e => console.warn('Supabase auto-sync error (schedules):', e));
  });
};

export const getStoredActiveUser = (): Auditor | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
};

export const saveStoredActiveUser = (user: Auditor): void => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_USER, JSON.stringify(user));
};

/**
 * Calculates day difference between two dates (YYYY-MM-DD):
 * date1 - date2 in whole days. Positive = after date2 (late).
 */
export const calculateDayDifference = (realDateStr: string, suggestedDateStr: string): number => {
  const d1 = new Date(realDateStr + 'T00:00:00').getTime();
  const d2 = new Date(suggestedDateStr + 'T00:00:00').getTime();
  return Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
};

/**
 * Registers a new completed audit:
 * 1. Saves the audit.
 * 2. Generates official PLANO DE AÇÃO UAA for all lines with qtd_evidencias > 0.
 * 3. Updates the sector's last audit date and score in rankings.
 * 4. Checks against the scheduled calendar and updates punctuality metrics for the auditor.
 */
export const registerNewAudit = (
  newAudit: Audit,
  questions: ChecklistQuestion[],
  sectors: Sector[],
  auditors: Auditor[],
  scheduledAudits: ScheduledAudit[]
): {
  audit: Audit;
  generatedPlans: ActionPlan[];
  updatedAuditors: Auditor[];
  updatedSchedules: ScheduledAudit[];
} => {
  const audits = getStoredAudits();
  const plans = getStoredActionPlans();
  const sector = sectors.find(s => s.id === newAudit.setor_id);

  // Month name in Portuguese: Ex: "Novembro/2026"
  const dateObj = new Date(newAudit.data + 'T00:00:00');
  const monthName = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const generatedPlans: ActionPlan[] = [];

  // Ensure audit cycle is set (format: YYYY/MM)
  if (!newAudit.ciclo) {
    newAudit.ciclo = getCicloAuditoria(newAudit.data);
  }

  newAudit.respostas.forEach((resp) => {
    // If there is 1 or more evidence/problems detected, generate an unconformity action plan
    if (resp.qtd_evidencias > 0) {
      const q = questions.find(item => item.id === resp.pergunta_id);
      const isCritical = resp.qtd_evidencias >= 4;

      // Default deadline: 7 days for multiple problems, 15 days for 1-2
      const deadlineDate = new Date(newAudit.data + 'T00:00:00');
      deadlineDate.setDate(deadlineDate.getDate() + (isCritical ? 7 : 14));
      const formattedDeadline = deadlineDate.toLocaleDateString('pt-BR');

      const plan: ActionPlan = {
        id: `plano-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        auditoria_id: newAudit.id,
        auditoria_codigo: newAudit.codigo,
        mes: capitalizedMonth,
        ciclo: newAudit.ciclo,
        setor_id: newAudit.setor_id,
        setor_nome: newAudit.setor_nome,
        pergunta_id: resp.pergunta_id,
        criterio_resumo: q ? q.descricao_criterio : 'Critério com apontamento',
        senso: resp.senso,
        qtd_problemas: resp.qtd_evidencias,
        data_criacao: newAudit.data,
        data_prazo: resp.data_limite || deadlineDate.toISOString().split('T')[0],
        fato: resp.fato || resp.descricao || `Identificado(s) ${resp.qtd_evidencias} desvio(s) em: ${q?.titulo || 'item auditado'}.`,
        causa: resp.causa || 'Falta de atenção ao padrão operacional ou desgaste do item.',
        acao: resp.acao || `Realizar adequação imediata para eliminar os ${resp.qtd_evidencias} problema(s) apontados.`,
        responsavel: resp.supervisor_responsavel || (sector ? `${sector.responsavel_nome} (${sector.responsavel_cargo})` : 'Supervisor da Área'),
        prazo: resp.data_limite 
          ? new Date(resp.data_limite + 'T00:00:00').toLocaleDateString('pt-BR') 
          : formattedDeadline,
        foto_antes: resp.foto_url,
        status: 'pendente',
        gravidade: isCritical ? 'alta' : resp.qtd_evidencias >= 2 ? 'media' : 'baixa'
      };

      generatedPlans.push(plan);
    }
  });

  // Save new audit
  const updatedAudits = [newAudit, ...audits];
  saveStoredAudits(updatedAudits);

  // Save action plans
  const updatedPlans = [...generatedPlans, ...plans];
  saveStoredActionPlans(updatedPlans);

  // Update Sector last score
  const updatedSectors = sectors.map(s => {
    if (s.id === newAudit.setor_id) {
      return {
        ...s,
        ultima_auditoria: newAudit.data,
        ultima_nota: newAudit.nota_final
      };
    }
    return s;
  });
  saveStoredSectors(updatedSectors);

  // Match and update Scheduled Calendar item if exists
  let scheduleDifferenceDays = 0;
  let matchedSchedule = false;

  const updatedSchedules = scheduledAudits.map(sched => {
    // Match by auditor and sector if pending or overdue
    if (
      !matchedSchedule &&
      sched.setor_id === newAudit.setor_id &&
      sched.auditor_id === newAudit.auditor_id &&
      (sched.status === 'pendente' || sched.status === 'atrasada')
    ) {
      matchedSchedule = true;
      const diff = calculateDayDifference(newAudit.data, sched.data_sugerida);
      scheduleDifferenceDays = diff;

      return {
        ...sched,
        data_realizada: newAudit.data,
        ciclo: newAudit.ciclo,
        status: diff <= 0 ? ('realizada_no_prazo' as const) : ('realizada_com_atraso' as const),
        dias_diferenca: diff,
        auditoria_id: newAudit.id,
        observacoes: diff <= 0 
          ? `Realizada dentro do prazo programado (${diff === 0 ? 'no dia exato' : Math.abs(diff) + ' dias adiantado'}).`
          : `Realizada com ${diff} dia(s) de atraso em relação à data sugerida.`
      };
    }
    return sched;
  });

  // If no previous schedule matched, create an executed schedule entry for tracking
  if (!matchedSchedule) {
    const suggested = newAudit.data_sugerida || newAudit.data;
    const diff = calculateDayDifference(newAudit.data, suggested);
    scheduleDifferenceDays = diff;

    updatedSchedules.unshift({
      id: `sched-${Date.now()}`,
      ciclo: newAudit.ciclo,
      setor_id: newAudit.setor_id,
      setor_nome: newAudit.setor_nome,
      auditor_id: newAudit.auditor_id,
      auditor_nome: newAudit.auditor_nome,
      data_sugerida: suggested,
      data_realizada: newAudit.data,
      status: diff <= 0 ? 'realizada_no_prazo' : 'realizada_com_atraso',
      dias_diferenca: diff,
      auditoria_id: newAudit.id,
      observacoes: 'Auditoria realizada e registrada no cronograma.'
    });
  }

  saveStoredScheduledAudits(updatedSchedules);

  // Update Auditor's Participation and Punctuality Metrics
  const updatedAuditors = auditors.map(aud => {
    if (aud.id === newAudit.auditor_id) {
      const newTotal = aud.total_auditorias + 1;
      const wasOnTime = scheduleDifferenceDays <= 0;
      const newNoPrazo = aud.auditorias_no_prazo + (wasOnTime ? 1 : 0);
      const newComAtraso = aud.auditorias_com_atraso + (wasOnTime ? 0 : 1);
      const newScore = Math.round((newNoPrazo / newTotal) * 1000) / 10;
      
      // Moving average of delay days
      const currentSum = (aud.dias_medio_desvio || 0) * aud.total_auditorias;
      const newAvgDesvio = Math.round(((currentSum + scheduleDifferenceDays) / newTotal) * 10) / 10;

      return {
        ...aud,
        total_auditorias: newTotal,
        auditorias_no_prazo: newNoPrazo,
        auditorias_com_atraso: newComAtraso,
        score_pontualidade: newScore,
        dias_medio_desvio: newAvgDesvio
      };
    }
    return aud;
  });

  saveStoredAuditors(updatedAuditors);

  return {
    audit: newAudit,
    generatedPlans,
    updatedAuditors,
    updatedSchedules
  };
};

export const getCicloAuditoria = (dateOrStr?: string | Date): string => {
  if (!dateOrStr) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    return `${y}/${m}`;
  }
  if (typeof dateOrStr === 'string') {
    const parts = dateOrStr.split('T')[0].split('-');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
  }
  const d = new Date(dateOrStr);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getStoredPhotos = (): SectorPhoto[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PHOTOS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveStoredPhotos = (photos: SectorPhoto[]): void => {
  localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
};

export const addStoredPhoto = (photo: SectorPhoto): SectorPhoto[] => {
  const current = getStoredPhotos();
  const updated = [photo, ...current];
  saveStoredPhotos(updated);
  saveDocToFirestore(COLLECTIONS.SECTOR_PHOTOS, photo).catch(e => console.warn('Cloud sync error (photo):', e));
  syncItemToSupabase('sector_photos', photo).catch(e => console.warn('Supabase auto-sync error (photo):', e));
  return updated;
};

export const deleteStoredPhoto = (photoId: string): SectorPhoto[] => {
  const current = getStoredPhotos();
  const updated = current.filter(p => p.id !== photoId);
  saveStoredPhotos(updated);
  deleteDocFromFirestore(COLLECTIONS.SECTOR_PHOTOS, photoId).catch(e => console.warn('Cloud sync error (delete photo):', e));
  deleteItemFromSupabase('sector_photos', photoId).catch(e => console.warn('Supabase delete error (photo):', e));
  return updated;
};

export const deleteStoredAudit = (auditId: string): {
  updatedAudits: Audit[];
  updatedPlans: ActionPlan[];
  updatedSectors: Sector[];
} => {
  const audits = getStoredAudits();
  const deletedAudit = audits.find(a => a.id === auditId);
  const updatedAudits = audits.filter(a => a.id !== auditId);
  saveStoredAudits(updatedAudits);
  deleteDocFromFirestore(COLLECTIONS.AUDITS, auditId).catch(e => console.warn('Cloud sync error (delete audit):', e));
  deleteItemFromSupabase('audits', auditId).catch(e => console.warn('Supabase delete error (audit):', e));

  // Remove linked action plans
  const plans = getStoredActionPlans();
  const updatedPlans = plans.filter(p => p.auditoria_id !== auditId);
  saveStoredActionPlans(updatedPlans);
  plans.filter(p => p.auditoria_id === auditId).forEach(p => {
    deleteDocFromFirestore(COLLECTIONS.ACTION_PLANS, p.id).catch(e => console.warn('Cloud sync error (delete plan):', e));
    deleteItemFromSupabase('action_plans', p.id).catch(e => console.warn('Supabase delete error (plan):', e));
  });

  // Recalculate sector score if deleted audit belongs to it
  const sectors = getStoredSectors();
  let updatedSectors = sectors;
  if (deletedAudit) {
    const remainingForSector = updatedAudits
      .filter(a => a.setor_id === deletedAudit.setor_id)
      .sort((a, b) => b.data.localeCompare(a.data));
    
    updatedSectors = sectors.map(s => {
      if (s.id === deletedAudit.setor_id) {
        if (remainingForSector.length > 0) {
          return {
            ...s,
            ultima_auditoria: remainingForSector[0].data,
            ultima_nota: remainingForSector[0].nota_final
          };
        } else {
          return {
            ...s,
            ultima_auditoria: undefined,
            ultima_nota: undefined
          };
        }
      }
      return s;
    });
    saveStoredSectors(updatedSectors);
  }

  return {
    updatedAudits,
    updatedPlans,
    updatedSectors
  };
};

export const updateStoredAudit = (updatedAudit: Audit): {
  updatedAudits: Audit[];
  updatedSectors: Sector[];
} => {
  const audits = getStoredAudits();
  const updatedAudits = audits.map(a => a.id === updatedAudit.id ? updatedAudit : a);
  saveStoredAudits(updatedAudits);
  saveDocToFirestore(COLLECTIONS.AUDITS, updatedAudit).catch(e => console.warn('Cloud sync error (update audit):', e));

  // Update sector score if this is the newest audit
  const sectors = getStoredSectors();
  const remainingForSector = updatedAudits
    .filter(a => a.setor_id === updatedAudit.setor_id)
    .sort((a, b) => b.data.localeCompare(a.data));

  const updatedSectors = sectors.map(s => {
    if (s.id === updatedAudit.setor_id && remainingForSector.length > 0) {
      return {
        ...s,
        ultima_auditoria: remainingForSector[0].data,
        ultima_nota: remainingForSector[0].nota_final
      };
    }
    return s;
  });
  saveStoredSectors(updatedSectors);

  return {
    updatedAudits,
    updatedSectors
  };
};

export const deleteStoredSchedule = (scheduleId: string): ScheduledAudit[] => {
  const current = getStoredScheduledAudits();
  const updated = current.filter(s => s.id !== scheduleId);
  saveStoredScheduledAudits(updated);
  deleteDocFromFirestore(COLLECTIONS.SCHEDULED_AUDITS, scheduleId).catch(e => console.warn('Cloud sync error (delete schedule):', e));
  return updated;
};

export const updateStoredSchedule = (updatedSchedule: ScheduledAudit): ScheduledAudit[] => {
  const current = getStoredScheduledAudits();
  const updated = current.map(s => s.id === updatedSchedule.id ? updatedSchedule : s);
  saveStoredScheduledAudits(updated);
  saveDocToFirestore(COLLECTIONS.SCHEDULED_AUDITS, updatedSchedule).catch(e => console.warn('Cloud sync error (update schedule):', e));
  return updated;
};

export const resetAllData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.SECTORS);
  localStorage.removeItem(STORAGE_KEYS.AUDITORS);
  localStorage.removeItem(STORAGE_KEYS.QUESTIONS);
  localStorage.removeItem(STORAGE_KEYS.AUDITS);
  localStorage.removeItem(STORAGE_KEYS.ACTION_PLANS);
  localStorage.removeItem(STORAGE_KEYS.SCHEDULED_AUDITS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER);
  localStorage.removeItem(STORAGE_KEYS.PHOTOS);
};
