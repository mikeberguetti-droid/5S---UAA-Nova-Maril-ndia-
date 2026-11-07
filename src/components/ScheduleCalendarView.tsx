import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Trophy, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  User, 
  Building2, 
  ChevronRight, 
  ChevronLeft,
  Sparkles, 
  Award, 
  Filter, 
  ArrowUpRight, 
  TrendingUp, 
  X,
  Edit,
  Trash2,
  CalendarCheck2
} from 'lucide-react';
import { ScheduledAudit, Auditor, Sector } from '../types';
import { getCicloAuditoria } from '../services/storage';

interface ScheduleCalendarViewProps {
  scheduledAudits: ScheduledAudit[];
  auditors: Auditor[];
  sectors: Sector[];
  onAddSchedule: (schedule: ScheduledAudit) => void;
  onExecuteSchedule: (schedule: ScheduledAudit) => void;
  onDeleteSchedule?: (scheduleId: string) => void;
  onUpdateSchedule?: (schedule: ScheduledAudit) => void;
}

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  scheduledAudits,
  auditors,
  sectors,
  onAddSchedule,
  onExecuteSchedule,
  onDeleteSchedule,
  onUpdateSchedule
}) => {
  const [filterAuditor, setFilterAuditor] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCiclo, setFilterCiclo] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduledAudit | null>(null);

  const currentCiclo = getCicloAuditoria();

  // Schedule Form State
  const [scheduleForm, setScheduleForm] = useState<{
    id?: string;
    setor_id: string;
    auditor_id: string;
    data_sugerida: string;
    ciclo: string;
    turno: string;
    observacoes: string;
  }>({
    setor_id: sectors.length > 0 ? sectors[0].id : '',
    auditor_id: auditors.length > 0 ? auditors[0].id : '',
    data_sugerida: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    ciclo: currentCiclo,
    turno: 'Turno 1',
    observacoes: 'Auditoria mensal de rotina do programa 5S'
  });

  // Calculate dynamic status for schedules
  const todayStr = new Date().toISOString().split('T')[0];

  const processedSchedules = useMemo(() => {
    return scheduledAudits.map(s => {
      let status = s.status;
      if (status === 'pendente' && s.data_sugerida < todayStr) {
        status = 'atrasada';
      }
      return {
        ...s,
        ciclo: s.ciclo || getCicloAuditoria(s.data_sugerida),
        computedStatus: status
      };
    });
  }, [scheduledAudits, todayStr]);

  // Auditor Ranking Calculation
  const rankedAuditors = useMemo(() => {
    return [...auditors].sort((a, b) => {
      const scoreA = (a.score_pontualidade * 0.7) + Math.min(30, a.total_auditorias * 0.8) - (Math.max(0, a.dias_medio_desvio) * 3);
      const scoreB = (b.score_pontualidade * 0.7) + Math.min(30, b.total_auditorias * 0.8) - (Math.max(0, b.dias_medio_desvio) * 3);
      return scoreB - scoreA;
    });
  }, [auditors]);

  // Available cycles
  const availableCycles = useMemo(() => {
    const set = new Set<string>();
    processedSchedules.forEach(s => {
      if (s.ciclo) set.add(s.ciclo);
    });
    set.add(currentCiclo);
    return Array.from(set).sort().reverse();
  }, [processedSchedules, currentCiclo]);

  // Filtered schedules
  const filteredSchedules = useMemo(() => {
    return processedSchedules.filter(s => {
      if (filterAuditor !== 'all' && s.auditor_id !== filterAuditor) return false;
      if (filterCiclo !== 'all' && s.ciclo !== filterCiclo) return false;
      if (filterStatus !== 'all') {
        if (filterStatus === 'pendentes' && (s.computedStatus === 'realizada_no_prazo' || s.computedStatus === 'realizada_com_atraso')) return false;
        if (filterStatus !== 'pendentes' && s.computedStatus !== filterStatus) return false;
      }
      return true;
    }).sort((a, b) => b.data_sugerida.localeCompare(a.data_sugerida));
  }, [processedSchedules, filterAuditor, filterCiclo, filterStatus]);

  // Stats for the active cycle
  const cycleStats = useMemo(() => {
    const forCycle = processedSchedules.filter(s => (s.ciclo || currentCiclo) === currentCiclo);
    const completed = forCycle.filter(s => s.computedStatus === 'realizada_no_prazo' || s.computedStatus === 'realizada_com_atraso').length;
    const pending = forCycle.filter(s => s.computedStatus === 'pendente' || s.computedStatus === 'atrasada').length;
    return {
      totalSectors: sectors.length,
      scheduled: forCycle.length,
      completed,
      pending
    };
  }, [processedSchedules, sectors, currentCiclo]);

  // Open modal for creating new schedule
  const handleOpenNewSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm({
      setor_id: sectors.length > 0 ? sectors[0].id : '',
      auditor_id: auditors.length > 0 ? auditors[0].id : '',
      data_sugerida: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      ciclo: currentCiclo,
      turno: 'Turno 1',
      observacoes: 'Auditoria mensal programada'
    });
    setIsModalOpen(true);
  };

  // Open modal for editing existing schedule
  const handleOpenEditSchedule = (sched: ScheduledAudit) => {
    setEditingSchedule(sched);
    setScheduleForm({
      id: sched.id,
      setor_id: sched.setor_id,
      auditor_id: sched.auditor_id,
      data_sugerida: sched.data_sugerida,
      ciclo: sched.ciclo || getCicloAuditoria(sched.data_sugerida),
      turno: sched.turno || 'Turno 1',
      observacoes: sched.observacoes || ''
    });
    setIsModalOpen(true);
  };

  // Submit Schedule Form (Create or Edit)
  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const sector = sectors.find(s => s.id === scheduleForm.setor_id);
    const auditor = auditors.find(a => a.id === scheduleForm.auditor_id);

    if (!sector || !auditor) {
      alert('Selecione um setor e um auditor válidos.');
      return;
    }

    if (editingSchedule && onUpdateSchedule) {
      const updated: ScheduledAudit = {
        ...editingSchedule,
        setor_id: sector.id,
        setor_nome: sector.nome,
        auditor_id: auditor.id,
        auditor_nome: auditor.nome,
        data_sugerida: scheduleForm.data_sugerida,
        ciclo: scheduleForm.ciclo || getCicloAuditoria(scheduleForm.data_sugerida),
        turno: scheduleForm.turno,
        observacoes: scheduleForm.observacoes
      };
      onUpdateSchedule(updated);
    } else {
      const newEntry: ScheduledAudit = {
        id: `sched-${Date.now()}`,
        ciclo: scheduleForm.ciclo || getCicloAuditoria(scheduleForm.data_sugerida),
        setor_id: sector.id,
        setor_nome: sector.nome,
        auditor_id: auditor.id,
        auditor_nome: auditor.nome,
        data_sugerida: scheduleForm.data_sugerida,
        turno: scheduleForm.turno,
        status: 'pendente',
        observacoes: scheduleForm.observacoes
      };
      onAddSchedule(newEntry);
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (status: 'pendente' | 'realizada_no_prazo' | 'realizada_com_atraso' | 'atrasada') => {
    switch (status) {
      case 'realizada_no_prazo':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'Realizada no Prazo',
          icon: CheckCircle2
        };
      case 'realizada_com_atraso':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Realizada c/ Atraso',
          icon: Clock
        };
      case 'atrasada':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-black',
          label: 'Data Vencida',
          icon: AlertTriangle
        };
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Aguardando Vistoria',
          icon: Clock
        };
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
      
      {/* Hero Banner with Current Cycle Highlight */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200 mb-3 shadow-inner">
              <CalendarCheck2 className="w-4 h-4 text-emerald-400" />
              <span>Ciclo de Auditorias {currentCiclo} (Mensal)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Calendário & Cronograma de Vistorias dos Setores
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Agendamento mensal de cada setor com designação do auditor interno responsável, acompanhamento de pontualidade e controle de datas limites.
            </p>
          </div>

          <button
            onClick={handleOpenNewSchedule}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>+ Agendar Vistoria do Setor</span>
          </button>
        </div>

        {/* Cycle Quick Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-emerald-800/60">
          <div className="bg-slate-900/60 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Setores</span>
            <span className="text-xl font-black text-white font-mono">{cycleStats.totalSectors}</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Agendadas no Ciclo</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{cycleStats.scheduled}</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Concluídas no Ciclo</span>
            <span className="text-xl font-black text-emerald-300 font-mono">{cycleStats.completed}</span>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-xs p-3.5 rounded-2xl border border-emerald-500/20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pendentes de Execução</span>
            <span className={`text-xl font-black font-mono ${cycleStats.pending > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {cycleStats.pending}
            </span>
          </div>
        </div>
      </div>

      {/* SCHEDULED CALENDAR & AGENDA DE VISTORIAS */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CalendarIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Cronograma de Vistorias dos Setores
              </h2>
              <p className="text-xs text-slate-500">
                Datas sugeridas para cada área fabril e auditor responsável designado
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCiclo}
              onChange={(e) => setFilterCiclo(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            >
              <option value="all">Todos os Ciclos</option>
              {availableCycles.map(c => (
                <option key={c} value={c}>Ciclo {c}</option>
              ))}
            </select>

            <select
              value={filterAuditor}
              onChange={(e) => setFilterAuditor(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Auditores</option>
              {auditors.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Status</option>
              <option value="pendentes">Pendentes / Atrasadas</option>
              <option value="realizada_no_prazo">Realizadas no Prazo</option>
              <option value="realizada_com_atraso">Realizadas com Atraso</option>
              <option value="atrasada">Data Vencida</option>
            </select>
          </div>
        </div>

        {/* Schedule List Cards */}
        {filteredSchedules.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Nenhum agendamento encontrado</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Clique no botão "+ Agendar Vistoria do Setor" acima para cadastrar o cronograma de vistorias com os auditores internos.
            </p>
            <button
              onClick={handleOpenNewSchedule}
              className="mt-2 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Programar Primeira Vistoria</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSchedules.map(item => {
              const badge = getStatusBadge(item.computedStatus);
              const BadgeIcon = badge.icon;
              const isCompleted = item.computedStatus === 'realizada_no_prazo' || item.computedStatus === 'realizada_com_atraso';

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600" />
                        {item.setor_nome}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          Ciclo {item.ciclo}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <div>
                            <span className="text-[10px] text-slate-400 block font-bold uppercase">Auditor Responsável</span>
                            <strong className="text-slate-900 text-xs">{item.auditor_nome}</strong>
                          </div>
                        </div>
                        {item.turno && (
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-medium text-slate-600">
                            {item.turno}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                        <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Data Sugerida</span>
                          <strong className="text-slate-900">
                            {new Date(item.data_sugerida + 'T00:00:00').toLocaleDateString('pt-BR')}
                          </strong>
                        </div>

                        {item.data_realizada ? (
                          <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                            <span className="text-[10px] text-emerald-800 uppercase font-bold block">Realizada Em</span>
                            <strong className="text-emerald-900">
                              {new Date(item.data_realizada + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </strong>
                          </div>
                        ) : (
                          <div className="bg-white p-2 rounded-xl border border-slate-200/80">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                            <span className="text-amber-700 font-bold">Pendente</span>
                          </div>
                        )}
                      </div>

                      {item.observacoes && (
                        <p className="text-[11px] text-slate-500 pt-1 italic">
                          "{item.observacoes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                    {/* Edit and Delete Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditSchedule(item)}
                        className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Editar agendamento"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {onDeleteSchedule && (
                        <button
                          onClick={() => {
                            if (confirm(`Deseja remover o agendamento de vistoria do setor ${item.setor_nome}?`)) {
                              onDeleteSchedule(item.id);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Excluir agendamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {isCompleted ? (
                      <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Vistoria Concluída
                      </span>
                    ) : (
                      <button
                        onClick={() => onExecuteSchedule(item)}
                        className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Iniciar Auditoria Deste Setor</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TOP AUDITORS RANKING (Pódio e Rank de Pontualidade) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Ranking de Participação & Pontualidade dos Auditores
              </h2>
              <p className="text-xs text-slate-500">
                Critério: Total de inspeções concluídas e cumprimento das datas sugeridas no ciclo mensal
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Reconhecimento Interno
          </span>
        </div>

        {rankedAuditors.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">Nenhum auditor cadastrado ainda</p>
            <p className="text-xs text-slate-400 mt-1">Cadastre seus auditores no menu "Cadastros" para gerar o ranking de pontualidade e participação.</p>
          </div>
        ) : (
          <>
            {/* Podium Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankedAuditors.slice(0, 3).map((auditor, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;

                return (
                  <div
                    key={auditor.id}
                    className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                      isFirst
                        ? 'bg-gradient-to-b from-amber-50 to-white border-2 border-amber-400 shadow-md md:-translate-y-2'
                        : isSecond
                        ? 'bg-gradient-to-b from-slate-50 to-white border-slate-300 shadow-sm'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                          isFirst ? 'bg-amber-400 text-slate-950' :
                          isSecond ? 'bg-slate-300 text-slate-800' :
                          'bg-amber-800 text-white'
                        }`}>
                          {isFirst ? '🥇 1º LUGAR' : isSecond ? '🥈 2º LUGAR' : '🥉 3º LUGAR'}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {auditor.matricula}
                        </span>
                      </div>

                      <div className="mt-4">
                        <h3 className="font-extrabold text-base text-slate-900">{auditor.nome}</h3>
                        <p className="text-xs text-slate-500">{auditor.setor_origem} • {auditor.cargo}</p>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Pontualidade</span>
                          <span className="text-lg font-black text-emerald-700 font-mono">
                            {auditor.score_pontualidade.toFixed(1)}%
                          </span>
                        </div>

                        <div className="bg-slate-50 p-2.5 rounded-xl">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Auditorias</span>
                          <span className="text-lg font-black text-slate-900 font-mono">
                            {auditor.total_auditorias}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        No prazo: <strong className="text-emerald-700">{auditor.auditorias_no_prazo}</strong>
                      </span>
                      <span>
                        Desvio: <strong className={auditor.dias_medio_desvio <= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {auditor.dias_medio_desvio <= 0 ? `${Math.abs(auditor.dias_medio_desvio)}d adiantado` : `+${auditor.dias_medio_desvio}d atraso`}
                        </strong>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Full Auditor Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2.5 px-3">Classificação</th>
                    <th className="py-2.5 px-3">Auditor(a) Interno(a)</th>
                    <th className="py-2.5 px-3">Setor de Origem</th>
                    <th className="py-2.5 px-3 text-center">Total Realizadas</th>
                    <th className="py-2.5 px-3 text-center">No Prazo</th>
                    <th className="py-2.5 px-3 text-center">Com Atraso</th>
                    <th className="py-2.5 px-3 text-center">Índice Pontualidade</th>
                    <th className="py-2.5 px-3 text-right">Desvio Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {rankedAuditors.map((aud, index) => (
                    <tr key={aud.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-400 text-slate-950 font-black' :
                          index === 1 ? 'bg-slate-300 text-slate-800 font-black' :
                          index === 2 ? 'bg-amber-700 text-white font-black' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}º
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {aud.nome}
                        <span className="text-[10px] text-slate-400 font-mono block">{aud.matricula}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{aud.setor_origem}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">{aud.total_auditorias}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">{aud.auditorias_no_prazo}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">{aud.auditorias_com_atraso}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full font-mono font-bold text-xs">
                          {aud.score_pontualidade.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {aud.dias_medio_desvio <= 0 ? (
                          <span className="text-emerald-700 font-bold">
                            {aud.dias_medio_desvio === 0 ? 'Exato (0d)' : `${Math.abs(aud.dias_medio_desvio)}d adiantado`}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-bold">+{aud.dias_medio_desvio}d atrasado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal: Agendar / Editar Vistoria do Setor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                <span>{editingSchedule ? 'Editar Agendamento de Vistoria' : 'Agendar Vistoria do Setor'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="cursor-pointer">
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSubmitSchedule} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Setor Industrial *</label>
                <select
                  value={scheduleForm.setor_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, setor_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.area})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Auditor Interno Responsável *</label>
                <select
                  value={scheduleForm.auditor_id}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, auditor_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                >
                  {auditors.map(a => (
                    <option key={a.id} value={a.id}>{a.nome} • {a.matricula} ({a.cargo})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Data Sugerida para Vistoria *</label>
                  <input
                    type="date"
                    required
                    value={scheduleForm.data_sugerida}
                    onChange={(e) => {
                      const d = e.target.value;
                      setScheduleForm({
                        ...scheduleForm,
                        data_sugerida: d,
                        ciclo: getCicloAuditoria(d)
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Ciclo de Auditoria</label>
                  <input
                    type="text"
                    required
                    value={scheduleForm.ciclo}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, ciclo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-bold font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Turno Sugerido</label>
                <select
                  value={scheduleForm.turno}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, turno: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                >
                  <option value="Turno 1">Turno 1 (Manhã)</option>
                  <option value="Turno 2">Turno 2 (Tarde)</option>
                  <option value="Turno 3">Turno 3 (Noturno / CIP)</option>
                  <option value="Geral">Turno Geral</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Observações / Foco da Inspeção</label>
                <textarea
                  rows={2}
                  value={scheduleForm.observacoes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, observacoes: e.target.value })}
                  placeholder="Ex: Vistoria mensal com foco no senso de limpeza e organização de ferramentas..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-sm"
                >
                  {editingSchedule ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
