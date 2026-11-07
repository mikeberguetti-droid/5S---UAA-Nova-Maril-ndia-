import React from 'react';
import { 
  BarChart3, 
  ListTodo, 
  History, 
  Settings, 
  PlusCircle, 
  Factory, 
  UserCheck,
  ChevronDown,
  Calendar as CalendarIcon,
  Camera,
  Database
} from 'lucide-react';
import { Auditor } from '../types';

export type AppTabType = 'dashboard' | 'nova-auditoria' | 'planos-acao' | 'calendario' | 'historico' | 'fotos' | 'cadastros';

interface HeaderProps {
  activeTab: AppTabType;
  setActiveTab: (tab: AppTabType) => void;
  activeAuditor: Auditor | null;
  allAuditors: Auditor[];
  onSelectAuditor: (auditor: Auditor) => void;
  openActionPlansCount: number;
  pendingSchedulesCount?: number;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeAuditor,
  allAuditors,
  onSelectAuditor,
  openActionPlansCount,
  pendingSchedulesCount = 0,
  onOpenSupabaseModal
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-emerald-900/60 shadow-lg text-white no-print">
      {/* Top corporate bar */}
      <div className="bg-emerald-800 text-emerald-100 text-[11px] font-medium px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-emerald-700/50">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span className="tracking-wide uppercase font-semibold text-white">União Avícola Agroindustrial S.A.</span>
          <span className="hidden sm:inline text-emerald-300">•</span>
          <span className="hidden sm:inline text-emerald-200">UAA - Nova Marilândia / MT</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-200">
          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="bg-emerald-950/70 hover:bg-emerald-950 text-emerald-200 hover:text-white border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              title="Abrir painel de conexão e sincronização com o Supabase"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>Conectar Supabase</span>
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-emerald-950/80 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span>Nuvem Conectada</span>
          </div>
          <span className="hidden md:inline bg-emerald-950/80 px-2.5 py-0.5 rounded font-mono font-bold text-emerald-300 border border-emerald-600/40">
            Ciclo de Auditorias 2026/11
          </span>
          <span className="bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold border border-emerald-600/40">
            PADRÃO EXCELÊNCIA 5S
          </span>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Identity */}
          <div 
            onClick={() => setActiveTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-md shadow-emerald-950/40 border border-emerald-400/30 group-hover:scale-105 transition-transform">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                  PROGRAMA 5S <span className="text-emerald-400">UAA</span>
                </span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold">
                  v3.0
                </span>
              </div>
              <p className="text-xs text-emerald-400/90 font-medium hidden sm:block">
                Do cuidado ao resultado. • União Avícola
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('historico')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'historico'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Listagem de auditorias realizadas com opção de editar ou apagar"
            >
              <History className="w-4 h-4" />
              <span>Auditorias</span>
            </button>

            <button
              onClick={() => setActiveTab('calendario')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'calendario'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Calendário</span>
              {pendingSchedulesCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {pendingSchedulesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('fotos')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'fotos'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
              title="Armazenamento e exposição de fotos separadas por setor com filtro mês a mês"
            >
              <Camera className="w-4 h-4 text-emerald-300" />
              <span>Mural de Fotos</span>
            </button>

            <button
              onClick={() => setActiveTab('planos-acao')}
              className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'planos-acao'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Planos 5W2H</span>
              {openActionPlansCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-sm">
                  {openActionPlansCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('cadastros')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'cadastros'
                  ? 'bg-emerald-600 text-white shadow-sm font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Cadastros</span>
            </button>
          </nav>

          {/* Right side: Active Auditor Profile & CTA */}
          <div className="flex items-center gap-3">
            {/* Quick Auditor Switcher or Cadastrar button */}
            {activeAuditor ? (
              <div className="relative group">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700/70 hover:border-slate-600 rounded-xl px-2.5 py-1.5 cursor-pointer transition-colors">
                  <div className="w-7 h-7 rounded-full bg-emerald-900/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-200 leading-tight flex items-center gap-1">
                      {activeAuditor.nome.split(' ')[0]}
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                    <div className="text-[10px] text-emerald-400 font-medium">
                      {activeAuditor.matricula}
                    </div>
                  </div>
                </div>

                {/* Auditor dropdown */}
                <div className="absolute right-0 mt-1 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 hidden group-hover:block z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700">
                    Alternar Auditor Interno
                  </div>
                  {allAuditors.map((aud) => (
                    <button
                      key={aud.id}
                      onClick={() => onSelectAuditor(aud)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/80 transition-colors ${
                        aud.id === activeAuditor.id ? 'bg-emerald-950/60 text-emerald-300 font-bold' : 'text-slate-300'
                      }`}
                    >
                      <div>
                        <p className="font-medium text-white">{aud.nome}</p>
                        <p className="text-[10px] text-slate-400">{aud.setor_origem} • {aud.matricula}</p>
                      </div>
                      {aud.id === activeAuditor.id && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('cadastros')}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-bold transition-colors"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Cadastrar Auditor</span>
              </button>
            )}

            {onOpenSupabaseModal && (
              <button
                onClick={onOpenSupabaseModal}
                className="hidden sm:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                title="Conectar ao Supabase e Sincronizar Agora"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Conectar Supabase</span>
              </button>
            )}

            {/* Quick Action button */}
            <button
              onClick={() => setActiveTab('nova-auditoria')}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-md transition-all active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Iniciar Auditoria</span>
              <span className="sm:hidden">Auditar</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around text-slate-400 shadow-2xl overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('historico')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'historico' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Auditorias</span>
        </button>

        <button
          onClick={() => setActiveTab('calendario')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'calendario' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Calendário</span>
        </button>

        <button
          onClick={() => setActiveTab('nova-auditoria')}
          className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl text-[9px] font-bold shrink-0 ${
            activeTab === 'nova-auditoria' 
              ? 'bg-emerald-600 text-white -translate-y-1 shadow-lg shadow-emerald-900/50' 
              : 'text-emerald-400'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Auditar</span>
        </button>

        <button
          onClick={() => setActiveTab('fotos')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'fotos' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Fotos</span>
        </button>

        <button
          onClick={() => setActiveTab('planos-acao')}
          className={`relative flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'planos-acao' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>Planos</span>
        </button>

        <button
          onClick={() => setActiveTab('cadastros')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[9px] font-semibold shrink-0 ${
            activeTab === 'cadastros' ? 'text-emerald-400 font-bold' : 'hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cadastros</span>
        </button>
      </div>
    </header>
  );
};
