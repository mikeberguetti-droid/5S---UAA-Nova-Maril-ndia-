import React, { useState, useMemo } from 'react';
import { 
  ListTodo, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Camera, 
  Calendar, 
  User, 
  Building2, 
  Filter, 
  Plus, 
  Search, 
  ArrowRight,
  Check,
  X,
  FileCheck2,
  Trash2,
  UploadCloud,
  FileSpreadsheet
} from 'lucide-react';
import { ActionPlan, ActionPlanStatus, Sector, SensoType } from '../types';
import { SENSOS_CONFIG } from '../data/initialData';

interface ActionPlansViewProps {
  actionPlans: ActionPlan[];
  sectors: Sector[];
  onUpdatePlan: (updatedPlan: ActionPlan) => void;
  onCreatePlan: (newPlan: ActionPlan) => void;
  onDeletePlan: (planId: string) => void;
}

export const ActionPlansView: React.FC<ActionPlansViewProps> = ({
  actionPlans,
  sectors,
  onUpdatePlan,
  onCreatePlan,
  onDeletePlan
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'tabela_oficial'>('tabela_oficial');

  // Resolution modal state
  const [resolvingPlan, setResolvingPlan] = useState<ActionPlan | null>(null);
  const [fotoDepoisUrl, setFotoDepoisUrl] = useState<string>('');
  const [justificativa, setJustificativa] = useState<string>('');

  // Create manual UAA action modal
  const [isCreatingManual, setIsCreatingManual] = useState<boolean>(false);
  const [manualForm, setManualForm] = useState<{
    mes: string;
    setor_id: string;
    senso: SensoType;
    fato: string;
    causa: string;
    acao: string;
    responsavel: string;
    prazo: string;
    gravidade: 'baixa' | 'media' | 'alta' | 'critica';
  }>({
    mes: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
    setor_id: sectors.length > 0 ? sectors[0].id : '',
    senso: 'seiri',
    fato: '',
    causa: '',
    acao: '',
    responsavel: '',
    prazo: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
    gravidade: 'media'
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const processedPlans = useMemo(() => {
    return actionPlans.map(p => {
      let currentStatus = p.status;
      if (currentStatus !== 'concluido' && p.data_prazo < todayStr) {
        currentStatus = 'atrasado';
      }
      return {
        ...p,
        computedStatus: currentStatus
      };
    });
  }, [actionPlans, todayStr]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return processedPlans.filter(p => {
      if (filterStatus !== 'all') {
        if (filterStatus === 'abertos' && p.computedStatus === 'concluido') return false;
        if (filterStatus !== 'abertos' && p.computedStatus !== filterStatus) return false;
      }
      if (filterSector !== 'all' && p.setor_id !== filterSector) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchFato = (p.fato || '').toLowerCase().includes(q);
        const matchAcao = (p.acao || '').toLowerCase().includes(q);
        const matchSector = p.setor_nome.toLowerCase().includes(q);
        const matchResp = (p.responsavel || '').toLowerCase().includes(q);
        if (!matchFato && !matchAcao && !matchSector && !matchResp) return false;
      }
      return true;
    });
  }, [processedPlans, filterStatus, filterSector, searchQuery]);

  // Photo upload
  const handleUploadFotoDepois = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFotoDepoisUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit plan resolution
  const handleConfirmResolution = () => {
    if (!resolvingPlan) return;

    const updated: ActionPlan = {
      ...resolvingPlan,
      status: 'concluido',
      data_conclusao: new Date().toISOString().split('T')[0],
      foto_depois: fotoDepoisUrl || resolvingPlan.foto_depois,
      justificativa_conclusao: justificativa || 'Inconformidade corrigida e validada pelo supervisor responsável.'
    };

    onUpdatePlan(updated);
    setResolvingPlan(null);
    setFotoDepoisUrl('');
    setJustificativa('');
  };

  // Create manual plan
  const handleCreateManualPlan = (e: React.FormEvent) => {
    e.preventDefault();
    const sector = sectors.find(s => s.id === manualForm.setor_id) || sectors[0];

    const newPlan: ActionPlan = {
      id: `plano-man-${Date.now()}`,
      auditoria_id: 'avulsa',
      auditoria_codigo: 'AVULSO',
      mes: manualForm.mes,
      setor_id: sector.id,
      setor_nome: sector.nome,
      pergunta_id: `q-custom`,
      criterio_resumo: `Inconformidade em ${SENSOS_CONFIG[manualForm.senso].nomeJapones}`,
      senso: manualForm.senso,
      qtd_problemas: 1,
      data_criacao: todayStr,
      data_prazo: manualForm.prazo,
      fato: manualForm.fato,
      causa: manualForm.causa,
      acao: manualForm.acao,
      responsavel: manualForm.responsavel || sector.responsavel_nome,
      prazo: new Date(manualForm.prazo + 'T00:00:00').toLocaleDateString('pt-BR'),
      status: 'pendente',
      gravidade: manualForm.gravidade
    };

    onCreatePlan(newPlan);
    setIsCreatingManual(false);
  };

  const getStatusBadge = (status: ActionPlanStatus | 'atrasado') => {
    switch (status) {
      case 'concluido':
        return {
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'Concluído',
          icon: CheckCircle2
        };
      case 'atrasado':
        return {
          bg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse font-bold',
          label: 'Prazo Vencido',
          icon: AlertTriangle
        };
      case 'em_andamento':
        return {
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Em Andamento',
          icon: Clock
        };
      default:
        return {
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Pendente',
          icon: Clock
        };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
              Formulário Oficial UAA
            </span>
            <span className="text-xs text-slate-400">Tratamento de Inconformidades</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Plano de Ação - UAA (MÊS | SETOR | FATO | CAUSA | AÇÃO | RESPONSÁVEL | PRAZO)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro justificado de inconformidades com supervisor responsável, data limite e validação do "Antes & Depois"
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setViewMode('tabela_oficial')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'tabela_oficial' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Tabela UAA
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'cards' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'
              }`}
            >
              Cards
            </button>
          </div>

          <button
            onClick={() => setIsCreatingManual(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Nova Ação</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'abertos', label: 'Pendentes & Em Andamento' },
              { id: 'atrasado', label: 'Atrasados' },
              { id: 'concluido', label: 'Concluídos' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full sm:w-auto"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(s => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar fato, ação, gestor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

        </div>
      </div>

      {/* VIEW MODE 1: OFFICIAL UAA TABLE VIEW */}
      {viewMode === 'tabela_oficial' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-red-700 text-white px-6 py-3 font-black text-sm tracking-wide uppercase flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span>PLANO DE AÇÃO - UAA</span>
            </div>
            <span className="text-xs bg-red-800 px-3 py-1 rounded-full text-red-100 font-mono">
              {filteredPlans.length} registro(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3 px-3">MÊS</th>
                  <th className="py-3 px-3">SETOR</th>
                  <th className="py-3 px-3 min-w-[200px]">FATO (Inconformidade)</th>
                  <th className="py-3 px-3 min-w-[180px]">CAUSA</th>
                  <th className="py-3 px-3 min-w-[200px]">AÇÃO</th>
                  <th className="py-3 px-3">RESPONSÁVEL</th>
                  <th className="py-3 px-3">PRAZO</th>
                  <th className="py-3 px-3 text-center">STATUS</th>
                  <th className="py-3 px-3 text-center">VALIDAÇÃO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-800">
                {filteredPlans.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400">
                      Nenhum plano de ação correspondente aos filtros.
                    </td>
                  </tr>
                ) : (
                  filteredPlans.map(plan => {
                    const badge = getStatusBadge(plan.computedStatus);
                    const isCompleted = plan.computedStatus === 'concluido';

                    return (
                      <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                          {plan.mes || 'Novembro/2026'}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {plan.setor_nome}
                        </td>
                        <td className="py-3 px-3 text-slate-900 leading-snug">
                          {plan.fato}
                          {plan.qtd_problemas > 0 && (
                            <span className="text-[10px] text-amber-700 font-bold block">
                              ({plan.qtd_problemas} problema(s))
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-slate-600 leading-snug">
                          {plan.causa || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-900 font-medium leading-snug">
                          {plan.acao || '-'}
                        </td>
                        <td className="py-3 px-3 text-slate-800 font-semibold whitespace-nowrap">
                          {plan.responsavel}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold whitespace-nowrap">
                          <span className={plan.computedStatus === 'atrasado' ? 'text-rose-600' : 'text-slate-800'}>
                            {plan.prazo}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          {isCompleted ? (
                            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                              <span>Validado</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setResolvingPlan(plan);
                                setFotoDepoisUrl(plan.foto_depois || '');
                                setJustificativa(plan.justificativa_conclusao || '');
                              }}
                              className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg border border-emerald-300 transition-colors"
                            >
                              Concluir c/ Foto
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="space-y-4">
          {filteredPlans.map(plan => {
            const badge = getStatusBadge(plan.computedStatus);
            const BadgeIcon = badge.icon;
            const sensoCfg = SENSOS_CONFIG[plan.senso];
            const isCompleted = plan.computedStatus === 'concluido';

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-red-700 text-white text-[10px] font-black px-2.5 py-0.5 rounded">
                      PLANO DE AÇÃO UAA
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {plan.setor_nome} • Mês: {plan.mes}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full border ${badge.bg}`}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{badge.label}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Fato, Causa e Ação */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-2xl">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">FATO (Inconformidade)</span>
                    <p className="font-bold text-slate-900 mt-1">{plan.fato}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">CAUSA (Motivo)</span>
                    <p className="text-slate-700 mt-1">{plan.causa || 'Em investigação'}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">AÇÃO (O que fazer)</span>
                    <p className="font-semibold text-emerald-800 mt-1">{plan.acao || 'Ação imediata'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-6 text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">RESPONSÁVEL</span>
                      <span className="font-bold text-slate-800">{plan.responsavel}</span>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">DATA LIMITE (PRAZO)</span>
                      <span className={`font-mono font-black ${plan.computedStatus === 'atrasado' ? 'text-rose-600' : 'text-slate-800'}`}>
                        {plan.prazo}
                      </span>
                    </div>

                    {plan.foto_antes && (
                      <div className="flex items-center gap-2">
                        <img src={plan.foto_antes} alt="Foto antes" className="w-12 h-12 object-cover rounded-lg border border-slate-300" />
                        <span className="text-[10px] text-slate-400 font-bold">Foto Antes</span>
                      </div>
                    )}
                  </div>

                  <div>
                    {isCompleted ? (
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1 justify-end">
                          <Check className="w-3.5 h-3.5" /> Concluído e Validado
                        </span>
                        {plan.foto_depois && (
                          <span className="text-[10px] text-slate-500 block">Com foto do Depois</span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setResolvingPlan(plan);
                          setFotoDepoisUrl(plan.foto_depois || '');
                          setJustificativa(plan.justificativa_conclusao || '');
                        }}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Validar c/ Foto do Depois</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Encerramento com Foto do Depois */}
      {resolvingPlan && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-slate-900">
                  Encerramento da Inconformidade (Foto do Depois)
                </h3>
              </div>
              <button onClick={() => setResolvingPlan(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Inconformidade (FATO)</span>
                <p className="font-bold text-slate-900 mt-0.5">{resolvingPlan.fato}</p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Setor: {resolvingPlan.setor_nome} • Supervisor: {resolvingPlan.responsavel}
                </span>
              </div>

              {/* Upload Foto do Depois */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Foto Comprobatória da Adequação ("Foto do Depois") *
                </label>
                {fotoDepoisUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={fotoDepoisUrl}
                      alt="Foto do Depois"
                      className="w-32 h-32 object-cover rounded-2xl border-2 border-emerald-500 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFotoDepoisUrl('')}
                      className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/30 rounded-2xl cursor-pointer transition-colors">
                    <UploadCloud className="w-8 h-8 text-emerald-600 mb-2" />
                    <span className="font-bold text-slate-800 text-xs">Capturar Foto do Local Adequado</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Comprova a resolução da inconformidade</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleUploadFotoDepois}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Justificativa de Encerramento */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Parecer Técnico / O que foi corrigido *
                </label>
                <textarea
                  rows={3}
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  placeholder="Descreva a ação corretiva executada e como foi garantido o padrão 5S..."
                  className="w-full text-xs font-medium p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setResolvingPlan(null)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmResolution}
                  className="w-1/2 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition-all active:scale-95"
                >
                  Confirmar Encerramento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Nova Ação Manual com layout UAA */}
      {isCreatingManual && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Cadastrar Nova Inconformidade (Plano de Ação - UAA)
              </h3>
              <button onClick={() => setIsCreatingManual(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateManualPlan} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">MÊS DE REFERÊNCIA *</label>
                  <input
                    type="text"
                    required
                    value={manualForm.mes}
                    onChange={(e) => setManualForm({ ...manualForm, mes: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">SETOR *</label>
                  <select
                    value={manualForm.setor_id}
                    onChange={(e) => setManualForm({ ...manualForm, setor_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">FATO (Inconformidade detectada) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Descreva a inconformidade detalhadamente..."
                  value={manualForm.fato}
                  onChange={(e) => setManualForm({ ...manualForm, fato: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">CAUSA (Por que aconteceu) *</label>
                <input
                  type="text"
                  required
                  placeholder="Identifique o motivo raiz..."
                  value={manualForm.causa}
                  onChange={(e) => setManualForm({ ...manualForm, causa: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">AÇÃO (O que fazer para corrigir) *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ação corretiva proposta..."
                  value={manualForm.acao}
                  onChange={(e) => setManualForm({ ...manualForm, acao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">RESPONSÁVEL (Supervisor) *</label>
                  {(() => {
                    const sec = sectors.find(s => s.id === manualForm.setor_id);
                    if (sec?.responsaveis && sec.responsaveis.length > 1) {
                      return (
                        <div className="flex flex-wrap gap-1 pb-1">
                          {sec.responsaveis.map((r, rIdx) => (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => setManualForm({ ...manualForm, responsavel: `${r.nome}${r.turno ? ` (${r.turno})` : ''}` })}
                              className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 px-2 py-0.5 rounded-lg font-medium transition-colors cursor-pointer"
                            >
                              {r.nome} {r.turno ? `• ${r.turno}` : ''}
                            </button>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  })()}
                  <input
                    type="text"
                    required
                    placeholder="Nome do supervisor responsável"
                    value={manualForm.responsavel}
                    onChange={(e) => setManualForm({ ...manualForm, responsavel: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">PRAZO (Data limite de resolução) *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.prazo}
                    onChange={(e) => setManualForm({ ...manualForm, prazo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingManual(false)}
                  className="w-1/2 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-3 rounded-2xl bg-red-700 hover:bg-red-800 text-white font-bold shadow-md"
                >
                  Salvar no Plano de Ação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
