import React, { useState, useMemo } from 'react';
import { 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Factory, 
  ShieldCheck, 
  ArrowUpRight, 
  Filter, 
  ChevronRight,
  Flame,
  Award,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Sector, Audit, ActionPlan, SensoType } from '../types';
import { HISTORICAL_EVOLUTION, SENSOS_CONFIG } from '../data/initialData';
import { RadarChart } from './RadarChart';
import { EvolutionChart } from './EvolutionChart';

interface DashboardViewProps {
  sectors: Sector[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  onStartAudit: (sectorId?: string) => void;
  onViewAudit: (audit: Audit) => void;
  onViewActionPlans: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  sectors,
  audits,
  actionPlans,
  onStartAudit,
  onViewAudit,
  onViewActionPlans
}) => {
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('all');
  const [radarSectorId, setRadarSectorId] = useState<string>('all');
  const [evolutionSectorId, setEvolutionSectorId] = useState<string>('all');

  // Calculate General Factory Stats
  const stats = useMemo(() => {
    const validAudits = audits.filter(a => a.status === 'concluida');
    const totalAudits = validAudits.length;
    
    // Average score across sectors
    const sectorsWithScore = sectors.filter(s => s.ultima_nota !== undefined);
    const avgScore = sectorsWithScore.length > 0
      ? sectorsWithScore.reduce((acc, s) => acc + (s.ultima_nota || 0), 0) / sectorsWithScore.length
      : 0;

    // Conformance rate (% of sectors reaching meta_5s)
    const sectorsMeetingMeta = sectors.filter(s => (s.ultima_nota || 0) >= s.meta_5s).length;
    const conformanceRate = sectors.length > 0 ? (sectorsMeetingMeta / sectors.length) * 100 : 0;

    // Action plans stats
    const pendingPlans = actionPlans.filter(p => p.status === 'pendente' || p.status === 'em_andamento').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const overduePlans = actionPlans.filter(p => 
      (p.status === 'pendente' || p.status === 'em_andamento') && p.data_prazo < todayStr
    ).length;

    // Senses averages for factory
    const sensosAvg: Record<SensoType, number> = {
      seiri: 0,
      seiton: 0,
      seiso: 0,
      seiketsu: 0,
      shitsuke: 0
    };

    if (validAudits.length > 0) {
      (['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'] as SensoType[]).forEach(senso => {
        const sum = validAudits.reduce((acc, a) => acc + (a.notas_sensos?.[senso] || 0), 0);
        sensosAvg[senso] = sum / validAudits.length;
      });
    } else {
      sensosAvg.seiri = 0;
      sensosAvg.seiton = 0;
      sensosAvg.seiso = 0;
      sensosAvg.seiketsu = 0;
      sensosAvg.shitsuke = 0;
    }

    return {
      totalAudits,
      avgScore,
      conformanceRate,
      sectorsMeetingMeta,
      pendingPlans,
      overduePlans,
      sensosAvg
    };
  }, [sectors, audits, actionPlans]);

  // Ranked Sectors
  const rankedSectors = useMemo(() => {
    let list = [...sectors];
    if (selectedAreaFilter !== 'all') {
      list = list.filter(s => s.area === selectedAreaFilter);
    }
    return list.sort((a, b) => (b.ultima_nota || 0) - (a.ultima_nota || 0));
  }, [sectors, selectedAreaFilter]);

  // Top 3 Podium
  const top1 = rankedSectors[0];
  const top2 = rankedSectors[1];
  const top3 = rankedSectors[2];

  // Radar Scores according to selector
  const activeRadarScores = useMemo(() => {
    if (radarSectorId === 'all') {
      return stats.sensosAvg;
    }
    const sectorAudits = audits.filter(a => a.setor_id === radarSectorId && a.status === 'concluida');
    if (sectorAudits.length > 0) {
      return sectorAudits[0].notas_sensos;
    }
    return stats.sensosAvg;
  }, [radarSectorId, audits, stats.sensosAvg]);

  // Identify Bottleneck & Strongest Sense
  const senseAnalysis = useMemo(() => {
    const entries = Object.entries(activeRadarScores) as [SensoType, number][];
    entries.sort((a, b) => b[1] - a[1]);
    const strongest = entries[0];
    const weakest = entries[entries.length - 1];
    return {
      strongest: { senso: strongest[0], score: strongest[1], cfg: SENSOS_CONFIG[strongest[0]] },
      weakest: { senso: weakest[0], score: weakest[1], cfg: SENSOS_CONFIG[weakest[0]] }
    };
  }, [activeRadarScores]);

  const getBadgeClass = (score?: number) => {
    if (!score) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (score >= 95) return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
    if (score >= 90) return 'bg-blue-50 text-blue-800 border-blue-300 font-bold';
    if (score >= 80) return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
    return 'bg-rose-50 text-rose-800 border-rose-300 font-bold';
  };

  const getSealName = (score?: number) => {
    if (!score) return 'Sem Auditoria';
    if (score >= 95) return 'Selo Diamante';
    if (score >= 90) return 'Selo Ouro';
    if (score >= 80) return 'Selo Prata';
    return 'Selo Bronze (Atenção)';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Hero / Factory Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-800/60 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-200 mb-3 shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Do cuidado ao resultado.</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Programa 5S - União Avícola Agroindustrial
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl leading-relaxed">
              Consolidação de auditorias internas, classificação dos setores fabris, planos corretivos 5W2H e indicadores dos 5 Sensos da União Avícola.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onStartAudit()}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-3 rounded-2xl shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95"
            >
              <Factory className="w-5 h-5" />
              <span>Iniciar Auditoria</span>
            </button>
            <button
              onClick={onViewActionPlans}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-white font-semibold px-4 py-3 rounded-2xl border border-slate-700 transition-all"
            >
              <span>Ver Planos UAA</span>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Urgent Overdue Alert if any */}
        {stats.overduePlans > 0 && (
          <div className="mt-6 bg-rose-950/80 border border-rose-600/50 rounded-2xl p-3.5 flex items-center justify-between gap-4 text-rose-200 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                <strong>Atenção:</strong> Existem <strong className="text-white underline">{stats.overduePlans} ações corretivas 5W2H</strong> com prazo de resolução vencido.
              </span>
            </div>
            <button
              onClick={onViewActionPlans}
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors"
            >
              Regularizar Ações
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Nota Média Geral */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nota Média da Fábrica</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {stats.avgScore.toFixed(1)}%
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              +1.5% vs mês ant.
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Meta Corporativa: 90.0%</span>
            <span className="font-semibold text-emerald-700">Acima da Meta</span>
          </div>
        </div>

        {/* KPI 2: Taxa de Conformidade Setorial */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Setores Conformes</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {stats.conformanceRate.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-500">
              ({stats.sectorsMeetingMeta} de {sectors.length} áreas)
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${stats.conformanceRate}%` }} 
            />
          </div>
        </div>

        {/* KPI 3: Auditorias Realizadas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auditorias no Ciclo</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {stats.totalAudits}
            </span>
            <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
              100% Cobertura
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Última auditoria realizada hoje
          </div>
        </div>

        {/* KPI 4: Planos de Ação 5W2H */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Planos 5W2H Abertos</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono">
              {stats.pendingPlans}
            </span>
            {stats.overduePlans > 0 ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                {stats.overduePlans} vencidos
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Todos no prazo
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Resolução média: 6 dias</span>
            <button onClick={onViewActionPlans} className="text-emerald-700 font-semibold hover:underline">
              Gerenciar
            </button>
          </div>
        </div>

      </div>

      {/* Podium dos 3 Melhores Setores (Reconhecimento) */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white border border-slate-700/60 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Pódio de Excelência 5S • UAA Nova Marilândia
              </h2>
              <p className="text-xs text-slate-300">
                Reconhecimento às equipes industriais com as mais altas pontuações do ciclo
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-400/10 border border-amber-400/30 text-amber-300 px-3 py-1 rounded-full">
            Premiação Mensal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {!top1 && (
            <div className="md:col-span-3 text-center py-8 text-slate-300 space-y-2">
              <p className="font-extrabold text-sm text-white">Nenhum setor avaliado ainda.</p>
              <p className="text-xs text-slate-400">Cadastre seu primeiro setor e realize uma auditoria para preencher o pódio de excelência 5S.</p>
            </div>
          )}
          
          {/* 2º Lugar - Prata */}
          {top2 && (
            <div className="bg-slate-800/80 border border-slate-600/60 rounded-2xl p-5 relative flex flex-col justify-between order-2 md:order-1 hover:border-slate-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="bg-slate-600 text-slate-200 text-xs font-black px-2.5 py-1 rounded-lg">
                  2º LUGAR
                </span>
                <span className="text-xs font-bold text-slate-300">🥈 Selo Ouro</span>
              </div>
              <div className="my-4">
                <h3 className="font-extrabold text-base text-white">{top2.nome}</h3>
                <p className="text-xs text-slate-400 mt-1">Gestor: {top2.responsavel_nome}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">{top2.ultima_nota?.toFixed(1)}%</span>
                  <span className="text-xs text-emerald-400 font-medium">Meta: {top2.meta_5s}%</span>
                </div>
              </div>
              <button
                onClick={() => onStartAudit(top2.id)}
                className="w-full text-center text-xs font-bold py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Auditar Setor
              </button>
            </div>
          )}

          {/* 1º Lugar - Campeão Ouro */}
          {top1 && (
            <div className="bg-gradient-to-b from-amber-500/20 to-slate-800/90 border-2 border-amber-400/80 rounded-2xl p-6 relative flex flex-col justify-between order-1 md:order-2 shadow-2xl scale-100 md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-1 rounded-full shadow-md flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-slate-950 fill-current" />
                <span>1º LUGAR • CAMPEÃO</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-amber-300">🏆 Destaque Fabril</span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-2 py-0.5 rounded">
                  {getSealName(top1.ultima_nota)}
                </span>
              </div>
              <div className="my-4">
                <h3 className="font-extrabold text-lg text-white tracking-tight">{top1.nome}</h3>
                <p className="text-xs text-slate-300 mt-1">Gestor(a): {top1.responsavel_nome}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-300 font-mono">
                    {top1.ultima_nota?.toFixed(1)}%
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    +{( (top1.ultima_nota || 0) - top1.meta_5s ).toFixed(1)}% acima da meta
                  </span>
                </div>
              </div>
              <button
                onClick={() => onStartAudit(top1.id)}
                className="w-full text-center text-xs font-bold py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-md"
              >
                Reauditar Campeão
              </button>
            </div>
          )}

          {/* 3º Lugar - Bronze */}
          {top3 && (
            <div className="bg-slate-800/80 border border-amber-700/50 rounded-2xl p-5 relative flex flex-col justify-between order-3 hover:border-amber-600/70 transition-colors">
              <div className="flex items-center justify-between">
                <span className="bg-amber-800 text-amber-200 text-xs font-black px-2.5 py-1 rounded-lg">
                  3º LUGAR
                </span>
                <span className="text-xs font-bold text-amber-400">🥉 Selo Ouro</span>
              </div>
              <div className="my-4">
                <h3 className="font-extrabold text-base text-white">{top3.nome}</h3>
                <p className="text-xs text-slate-400 mt-1">Gestor: {top3.responsavel_nome}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white font-mono">{top3.ultima_nota?.toFixed(1)}%</span>
                  <span className="text-xs text-emerald-400 font-medium">Meta: {top3.meta_5s}%</span>
                </div>
              </div>
              <button
                onClick={() => onStartAudit(top3.id)}
                className="w-full text-center text-xs font-bold py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors"
              >
                Auditar Setor
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Two Column Grid: Radar Chart Analysis vs. Evolution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Radar Chart (Spider Web) for 5 Sensos */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Gráfico Teia de Aranha (5 Sensos)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Desempenho comparado dos sensos e identificação de gargalos
                </p>
              </div>

              {/* Sector selector for Radar */}
              <select
                value={radarSectorId}
                onChange={(e) => setRadarSectorId(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">Média Geral UAA</option>
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            {/* Render Radar Component */}
            <div className="my-2 py-2 flex items-center justify-center">
              <RadarChart 
                scores={activeRadarScores}
                benchmarkScores={{ seiri: 90, seiton: 90, seiso: 90, seiketsu: 90, shitsuke: 90 }}
                benchmarkLabel="Meta 90%"
                size={290}
              />
            </div>
          </div>

          {/* Senses Bottleneck & Highlights Summary */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider block">
                Ponto Forte
              </span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                {senseAnalysis.strongest.cfg.nomeJapones} ({senseAnalysis.strongest.score.toFixed(0)}%)
              </span>
              <span className="text-[11px] text-emerald-700 leading-tight block mt-0.5">
                {senseAnalysis.strongest.cfg.nomePortugues}
              </span>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider block">
                Oportunidade / Gargalo
              </span>
              <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                {senseAnalysis.weakest.cfg.nomeJapones} ({senseAnalysis.weakest.score.toFixed(0)}%)
              </span>
              <span className="text-[11px] text-amber-700 leading-tight block mt-0.5">
                {senseAnalysis.weakest.cfg.nomePortugues}
              </span>
            </div>
          </div>
        </div>

        {/* Historical Evolution Chart */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Histórico Evolutivo das Notas 5S
                </h3>
                <p className="text-xs text-slate-500">
                  Avanço percentual das notas da unidade e setores nos últimos meses
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full">
                Tendência de Alta ↗
              </span>
            </div>

            <div className="my-2">
              <EvolutionChart
                data={HISTORICAL_EVOLUTION}
                sectors={sectors}
                selectedSectorId={evolutionSectorId}
                onSelectSector={setEvolutionSectorId}
              />
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-600" />
              <span>A média fabril subiu de 83.4% em Julho para 91.9% no ciclo atual.</span>
            </div>
            <span className="font-semibold text-slate-700">Auditores Ativos: 4</span>
          </div>
        </div>

      </div>

      {/* Full Sector Ranking Table & Filter */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight">
              Ranking Geral de Todos os Setores da Fábrica
            </h3>
            <p className="text-xs text-slate-500">
              Classificação geral ponderada para reconhecimento e conformidade normativa
            </p>
          </div>

          {/* Area Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Área:
            </span>
            {['all', 'Industrial', 'Utilidades', 'Apoio', 'Administrativo'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedAreaFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedAreaFilter === filter
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter === 'all' ? 'Todos os Setores' : filter}
              </button>
            ))}
          </div>
        </div>

        {/* Ranking List */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3">Posição</th>
                <th className="py-3 px-3">Setor Industrial</th>
                <th className="py-3 px-3">Área / Turno</th>
                <th className="py-3 px-3">Gestor Responsável</th>
                <th className="py-3 px-3">Última Auditoria</th>
                <th className="py-3 px-3 text-right">Nota Atual</th>
                <th className="py-3 px-3 text-center">Classificação</th>
                <th className="py-3 px-3 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
              {rankedSectors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-bold text-slate-700">Nenhum setor cadastrado na unidade ainda.</p>
                    <p className="text-xs text-slate-400 mt-1">Acesse a aba <strong>Cadastros</strong> no menu para cadastrar seu primeiro setor.</p>
                  </td>
                </tr>
              ) : (
                rankedSectors.map((sector, index) => {
                const score = sector.ultima_nota || 0;
                const isTop3 = index < 3;
                const reachesMeta = score >= sector.meta_5s;

                return (
                  <tr 
                    key={sector.id} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                          index === 0 ? 'bg-amber-400 text-slate-950 font-black shadow-sm' :
                          index === 1 ? 'bg-slate-300 text-slate-800 font-black' :
                          index === 2 ? 'bg-amber-700 text-white font-black' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {index + 1}º
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {sector.nome}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Meta: {sector.meta_5s}%
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {sector.area}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {sector.turno_ativo}
                      </div>
                    </td>

                    <td className="py-3.5 px-3">
                      {sector.responsaveis && sector.responsaveis.length > 1 ? (
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span>{sector.responsaveis[0].nome}</span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded" title={sector.responsaveis.map(r => `${r.nome} (${r.cargo})`).join(', ')}>
                              +{sector.responsaveis.length - 1} resp.
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate max-w-[160px]" title={sector.responsaveis.map(r => `${r.nome} (${r.cargo})`).join(', ')}>
                            {sector.responsaveis.map(r => r.nome).join(', ')}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-800">{sector.responsavel_nome}</div>
                          <div className="text-[10px] text-slate-400">{sector.responsavel_cargo}</div>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-slate-500 font-mono text-[11px]">
                      {sector.ultima_auditoria ? (
                        new Date(sector.ultima_auditoria + 'T00:00:00').toLocaleDateString('pt-BR')
                      ) : (
                        <span className="text-amber-600">Pendente</span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right">
                      <div className="font-black text-sm text-slate-900 font-mono">
                        {score > 0 ? `${score.toFixed(1)}%` : '-'}
                      </div>
                      <div className="w-24 ml-auto bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            score >= 90 ? 'bg-emerald-600' : score >= 80 ? 'bg-blue-600' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, score)}%` }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] border ${getBadgeClass(score)}`}>
                        {getSealName(score)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => onStartAudit(sector.id)}
                        className="bg-emerald-50 hover:bg-emerald-600 hover:text-white text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-300 transition-all active:scale-95"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
