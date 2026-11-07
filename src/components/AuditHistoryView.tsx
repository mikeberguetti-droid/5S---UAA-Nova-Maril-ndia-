import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  Search, 
  FileText, 
  Printer, 
  Award, 
  Building2, 
  User, 
  TrendingUp, 
  ChevronRight,
  Filter,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Save,
  Clock,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';
import { Audit, Sector, Auditor, ChecklistQuestion, AuditCriterionAnswer, SensoType } from '../types';
import { SENSOS_CONFIG, calculatePointsFromProblems } from '../data/initialData';
import { getCicloAuditoria } from '../services/storage';

interface AuditHistoryViewProps {
  audits: Audit[];
  sectors: Sector[];
  auditors: Auditor[];
  questions: ChecklistQuestion[];
  onViewReport: (audit: Audit) => void;
  onNewAudit: (sectorId?: string) => void;
  onUpdateAudit: (updatedAudit: Audit) => void;
  onDeleteAudit: (auditId: string) => void;
}

export const AuditHistoryView: React.FC<AuditHistoryViewProps> = ({
  audits,
  sectors,
  auditors,
  questions,
  onViewReport,
  onNewAudit,
  onUpdateAudit,
  onDeleteAudit
}) => {
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterCiclo, setFilterCiclo] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editing modal state
  const [editingAudit, setEditingAudit] = useState<Audit | null>(null);
  const [editForm, setEditForm] = useState<Audit | null>(null);
  const [activeSensoEditTab, setActiveSensoEditTab] = useState<SensoType>('seiri');

  // Deletion modal state
  const [auditToDelete, setAuditToDelete] = useState<Audit | null>(null);

  // Available cycles
  const availableCycles = useMemo(() => {
    const set = new Set<string>();
    audits.forEach(a => {
      const c = a.ciclo || getCicloAuditoria(a.data);
      if (c) set.add(c);
    });
    // Add current cycle
    set.add(getCicloAuditoria());
    return Array.from(set).sort().reverse();
  }, [audits]);

  // Filtered Audits
  const filteredAudits = useMemo(() => {
    return audits.filter(a => {
      if (filterSector !== 'all' && a.setor_id !== filterSector) {
        return false;
      }
      const c = a.ciclo || getCicloAuditoria(a.data);
      if (filterCiclo !== 'all' && c !== filterCiclo) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSector = a.setor_nome.toLowerCase().includes(q);
        const matchAuditor = a.auditor_nome.toLowerCase().includes(q);
        const matchCode = a.codigo.toLowerCase().includes(q);
        if (!matchSector && !matchAuditor && !matchCode) return false;
      }
      return true;
    }).sort((a, b) => b.data.localeCompare(a.data));
  }, [audits, filterSector, filterCiclo, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (audit: Audit) => {
    setEditingAudit(audit);
    // Clone deeply to avoid mutating directly
    setEditForm(JSON.parse(JSON.stringify(audit)));
    setActiveSensoEditTab('seiri');
  };

  // Recalculate score for the edited audit
  const recalculateEditedAuditScores = (currentAudit: Audit): Audit => {
    const sensos: SensoType[] = ['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'];
    const notasSensos: Record<SensoType, number> = {
      seiri: 100,
      seiton: 100,
      seiso: 100,
      seiketsu: 100,
      shitsuke: 100
    };

    let totalProblems = 0;
    let totalCriteriosSemProblemas = 0;

    sensos.forEach(senso => {
      const answersForSenso = currentAudit.respostas.filter(r => r.senso === senso);
      if (answersForSenso.length > 0) {
        const sumPoints = answersForSenso.reduce((acc, curr) => acc + curr.pontos, 0);
        notasSensos[senso] = Math.round((sumPoints / answersForSenso.length) * 10) / 10;
      }
    });

    currentAudit.respostas.forEach(r => {
      totalProblems += r.qtd_evidencias;
      if (r.qtd_evidencias === 0) {
        totalCriteriosSemProblemas += 1;
      }
    });

    const finalAvg = Object.values(notasSensos).reduce((acc, val) => acc + val, 0) / 5;

    return {
      ...currentAudit,
      notas_sensos: notasSensos,
      nota_final: Math.round(finalAvg * 10) / 10,
      total_problemas: totalProblems,
      criterios_sem_problemas: totalCriteriosSemProblemas
    };
  };

  // Update answer problem count in edit mode
  const handleUpdateAnswerProblems = (perguntaId: string, newCount: number) => {
    if (!editForm) return;
    const clampedCount = Math.max(0, newCount);
    const calculatedPoints = calculatePointsFromProblems(clampedCount);

    const updatedRespostas = editForm.respostas.map(r => {
      if (r.pergunta_id === perguntaId) {
        return {
          ...r,
          qtd_evidencias: clampedCount,
          pontos: calculatedPoints
        };
      }
      return r;
    });

    const updated = {
      ...editForm,
      respostas: updatedRespostas
    };

    setEditForm(recalculateEditedAuditScores(updated));
  };

  // Update text field in edited answer
  const handleUpdateAnswerField = (perguntaId: string, field: keyof AuditCriterionAnswer, value: any) => {
    if (!editForm) return;
    const updatedRespostas = editForm.respostas.map(r => {
      if (r.pergunta_id === perguntaId) {
        return {
          ...r,
          [field]: value
        };
      }
      return r;
    });

    setEditForm({
      ...editForm,
      respostas: updatedRespostas
    });
  };

  // Save changes from Edit Modal
  const handleSaveEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;

    // Ensure ciclo is properly set if date changed
    const ciclo = editForm.ciclo || getCicloAuditoria(editForm.data);
    const finalAuditToSave = {
      ...editForm,
      ciclo
    };

    onUpdateAudit(finalAuditToSave);
    setEditingAudit(null);
    setEditForm(null);
  };

  // Confirm and delete audit
  const handleConfirmDelete = () => {
    if (auditToDelete) {
      onDeleteAudit(auditToDelete.id);
      setAuditToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Gestão de Auditorias
            </span>
            <span className="text-xs text-slate-400">Listagem Oficial • Edição & Exclusão</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Listagem e Controle de Auditorias 5S
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerenciamento de fichas arquivadas com opções de edição de critérios, emissão de relatórios oficiais e exclusão de vistorias
          </p>
        </div>

        <button
          onClick={() => onNewAudit()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <History className="w-4 h-4" />
          <span>Realizar Nova Inspeção</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Setores Auditados</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
          </div>

          {/* Ciclo de Auditorias filter */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <select
              value={filterCiclo}
              onChange={(e) => setFilterCiclo(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
            >
              <option value="all">Todos os Ciclos</option>
              {availableCycles.map(c => (
                <option key={c} value={c}>Ciclo de Auditorias {c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, setor ou auditor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Audits List */}
      <div className="space-y-3">
        {filteredAudits.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <History className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-extrabold text-base text-slate-800">Nenhuma auditoria encontrada</h3>
            <p className="text-xs text-slate-500 mt-1">
              Altere os filtros de pesquisa ou clique em "Realizar Nova Inspeção" para registrar uma nova auditoria.
            </p>
          </div>
        ) : (
          filteredAudits.map(audit => {
            const isGold = audit.nota_final >= 90;
            const isSilver = audit.nota_final >= 80 && audit.nota_final < 90;
            const ciclo = audit.ciclo || getCicloAuditoria(audit.data);

            return (
              <div
                key={audit.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      {audit.codigo}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono">
                      Ciclo {ciclo}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                      {audit.turno}
                    </span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      isGold ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      isSilver ? 'bg-slate-200 text-slate-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {isGold ? '🏆 Selo Ouro' : isSilver ? '🥈 Selo Prata' : '⚠️ Selo Bronze'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {audit.setor_nome}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Auditor: <strong className="text-slate-700">{audit.auditor_nome}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(audit.data + 'T00:00:00').toLocaleDateString('pt-BR')} ({audit.hora || '08:00'})
                    </span>
                  </div>
                </div>

                {/* Score and Action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full lg:w-auto gap-4 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div className="text-left lg:text-right pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Nota Final</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {audit.nota_final.toFixed(1)}%
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      {audit.criterios_sem_problemas ?? (25 - (audit.total_problemas || 0))} itens conformes
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Report Button */}
                    <button
                      onClick={() => onViewReport(audit)}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                      title="Ver e imprimir relatório oficial"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span>Relatório</span>
                    </button>

                    {/* Edit Audit Button */}
                    <button
                      onClick={() => handleOpenEdit(audit)}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
                      title="Editar dados e notas desta auditoria"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Editar</span>
                    </button>

                    {/* Delete Audit Button */}
                    <button
                      onClick={() => setAuditToDelete(audit)}
                      className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition-all active:scale-95 cursor-pointer"
                      title="Apagar esta auditoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL: EDITAR AUDITORIA COMPLETA */}
      {editingAudit && editForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  Edição de Auditoria • {editForm.codigo}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                  Editar Auditoria: {editForm.setor_nome}
                </h3>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Nota Recalculada</span>
                  <span className="text-xl font-black text-emerald-700 font-mono">
                    {editForm.nota_final.toFixed(1)}%
                  </span>
                </div>

                <button 
                  onClick={() => setEditingAudit(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
              
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Data da Inspeção *</label>
                  <input
                    type="date"
                    required
                    value={editForm.data}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setEditForm({
                        ...editForm,
                        data: newDate,
                        ciclo: getCicloAuditoria(newDate)
                      });
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Horário</label>
                  <input
                    type="time"
                    value={editForm.hora}
                    onChange={(e) => setEditForm({ ...editForm, hora: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Turno</label>
                  <select
                    value={editForm.turno}
                    onChange={(e) => setEditForm({ ...editForm, turno: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-semibold"
                  >
                    <option value="Turno 1">Turno 1 (Manhã)</option>
                    <option value="Turno 2">Turno 2 (Tarde)</option>
                    <option value="Turno 3">Turno 3 (Noturno / CIP)</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Ciclo de Auditorias</label>
                  <input
                    type="text"
                    value={editForm.ciclo || getCicloAuditoria(editForm.data)}
                    onChange={(e) => setEditForm({ ...editForm, ciclo: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-900 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Auditor Selection & General Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Auditor Interno Responsável *</label>
                  <select
                    value={editForm.auditor_id}
                    onChange={(e) => {
                      const aud = auditors.find(a => a.id === e.target.value);
                      if (aud) {
                        setEditForm({
                          ...editForm,
                          auditor_id: aud.id,
                          auditor_nome: aud.nome
                        });
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    {auditors.map(a => (
                      <option key={a.id} value={a.id}>{a.nome} ({a.matricula})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Observações Gerais da Vistoria</label>
                  <input
                    type="text"
                    value={editForm.observacoes_gerais || ''}
                    onChange={(e) => setEditForm({ ...editForm, observacoes_gerais: e.target.value })}
                    placeholder="Comentários sobre a postura do setor..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              {/* Senses Tabs for Criteria Editing */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-700 tracking-wider">
                    Avaliação dos Critérios por Senso
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Ajuste a quantidade de desvios para recalcular as notas automaticamente
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {(['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'] as SensoType[]).map(s => {
                    const cfg = SENSOS_CONFIG[s];
                    const sensoScore = editForm.notas_sensos[s] ?? 100;
                    const isActive = activeSensoEditTab === s;

                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setActiveSensoEditTab(s)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>{cfg.nomePortugues.split(' ')[0]}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-black/20 text-emerald-300">
                          {sensoScore.toFixed(0)}%
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Criteria items for the selected Senso */}
                <div className="space-y-3 pt-1">
                  {editForm.respostas
                    .filter(r => r.senso === activeSensoEditTab)
                    .map((resp, idx) => {
                      const q = questions.find(item => item.id === resp.pergunta_id);

                      return (
                        <div
                          key={resp.pergunta_id}
                          className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">
                                Item #{idx + 1}
                              </span>
                              <h4 className="font-extrabold text-slate-900 text-xs">
                                {q ? q.descricao_criterio : resp.pergunta_id}
                              </h4>
                              {q?.padrao_esperado && (
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  <strong>Padrão:</strong> {q.padrao_esperado}
                                </p>
                              )}
                            </div>

                            {/* Score Points Badge */}
                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-1 rounded-xl text-xs font-black font-mono border ${
                                resp.pontos === 100
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : resp.pontos >= 50
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}>
                                {resp.pontos} pts
                              </span>
                            </div>
                          </div>

                          {/* Problem Counter Controller */}
                          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div>
                              <span className="font-bold text-slate-800 block text-xs">
                                Quantidade de Inconformidades / Desvios:
                              </span>
                              <span className="text-[10px] text-slate-400">
                                (0=100pts, 1=80pts, 2=70pts, 3=50pts, 4=30pts, 5=10pts, 6+=0pts)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleUpdateAnswerProblems(resp.pergunta_id, resp.qtd_evidencias - 1)}
                                disabled={resp.qtd_evidencias <= 0}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 font-bold text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                -
                              </button>

                              <span className="w-8 text-center font-mono font-black text-sm text-slate-900">
                                {resp.qtd_evidencias}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleUpdateAnswerProblems(resp.pergunta_id, resp.qtd_evidencias + 1)}
                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Extra Fields if problems > 0 */}
                          {resp.qtd_evidencias > 0 && (
                            <div className="space-y-2 pt-1 border-t border-slate-200/60">
                              <div className="space-y-1">
                                <label className="font-bold text-slate-700 block text-[11px]">
                                  Descrição do Fato / Inconformidade:
                                </label>
                                <input
                                  type="text"
                                  value={resp.fato || resp.descricao || ''}
                                  onChange={(e) => handleUpdateAnswerField(resp.pergunta_id, 'fato', e.target.value)}
                                  placeholder="Descreva o problema encontrado..."
                                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs"
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="space-y-1">
                                  <label className="font-bold text-slate-700 block text-[11px]">
                                    Supervisor Responsável:
                                  </label>
                                  <input
                                    type="text"
                                    value={resp.supervisor_responsavel || ''}
                                    onChange={(e) => handleUpdateAnswerField(resp.pergunta_id, 'supervisor_responsavel', e.target.value)}
                                    placeholder="Nome do supervisor"
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="font-bold text-slate-700 block text-[11px]">
                                    Data Limite (Prazo):
                                  </label>
                                  <input
                                    type="date"
                                    value={resp.data_limite || ''}
                                    onChange={(e) => handleUpdateAnswerField(resp.pergunta_id, 'data_limite', e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-slate-900 text-xs font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingAudit(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações da Auditoria</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DE AUDITORIA */}
      {auditToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-rose-200 animate-scaleUp space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-base text-slate-900">
                Apagar Auditoria {auditToDelete.codigo}?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Você está prestes a excluir permanentemente a auditoria do setor{' '}
                <strong className="text-slate-800">{auditToDelete.setor_nome}</strong> realizada em{' '}
                <strong className="text-slate-800 font-mono">
                  {new Date(auditToDelete.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                </strong>.
              </p>
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 text-left mt-2 font-medium">
                ⚠️ <strong>Atenção:</strong> Os planos de ação 5W2H vinculados a esta auditoria também serão removidos e a nota do setor será recalculada.
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAuditToDelete(null)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Sim, Apagar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
