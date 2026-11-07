import React, { useState } from 'react';
import { 
  X, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  syncAllToSupabase, 
  SUPABASE_SQL_SCHEMA,
  SupabaseConfig 
} from '../services/supabaseSync';
import { Sector, Auditor, ChecklistQuestion, Audit, ActionPlan, ScheduledAudit, SectorPhoto } from '../types';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: Sector[];
  auditors: Auditor[];
  questions: ChecklistQuestion[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  scheduledAudits: ScheduledAudit[];
  photos: SectorPhoto[];
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  sectors,
  auditors,
  questions,
  audits,
  actionPlans,
  scheduledAudits,
  photos
}) => {
  const [config, setConfig] = useState<SupabaseConfig>(() => getSupabaseConfig());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    saveSupabaseConfig(config);
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(config);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleSyncNow = async () => {
    // Save current config first
    saveSupabaseConfig(config);
    setIsSyncing(true);
    setSyncResult(null);

    const res = await syncAllToSupabase({
      sectors,
      auditors,
      audits,
      actionPlans,
      scheduledAudits,
      photos,
      questions
    });

    setIsSyncing(false);
    if (res.success) {
      setSyncResult({
        success: true,
        count: res.count,
        message: `Sincronização concluída com sucesso! ${res.count} registros gravados. Ao dar um F5 na tela do Supabase, os registros aparecerão lá preenchidos!`
      });
    } else {
      setSyncResult({
        success: false,
        message: `Erro na sincronização: ${res.error || 'Verifique se as tabelas foram criadas no SQL Editor.'}`
      });
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const totalLocalRecords = sectors.length + auditors.length + audits.length + actionPlans.length + scheduledAudits.length + photos.length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-8 max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-950/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">
                  Conectar Supabase
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                  PostgreSQL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Envio automático e sincronização direta para suas tabelas do Supabase
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          
          {/* Informação sobre a Publishable Key da foto enviada */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-emerald-950">
                  Sobre a chave de acesso do Supabase (seu print):
                </p>
                <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                  No novo painel do Supabase, a chave pública agora se chama <strong>Publishable key</strong> (ela começa com <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-300 font-mono text-emerald-950 font-bold">sb_publishable_...</code>, exatamente como aparece no seu print).
                  Basta clicar no ícone de cópia ao lado dela no Supabase e colar no campo abaixo!
                </p>
              </div>
            </div>
          </div>

          {/* Form de Configuração da URL e Chave */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-4">
            <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Dados de Conexão com seu Projeto</span>
              <button
                type="button"
                onClick={handleCopySQL}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-50 border border-emerald-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>{copiedSchema ? 'SQL Copiado!' : 'Copiar Script SQL'}</span>
              </button>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Project URL (URL do Projeto Supabase) *
                </label>
                <input
                  type="url"
                  required
                  value={config.url}
                  onChange={(e) => setConfig({ ...config, url: e.target.value.trim() })}
                  placeholder="Ex: https://vlwgknjcvqgldb.supabase.co"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400">
                  Encontrada em Project Settings &gt; API &gt; Project URL
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Publishable key (Chave Pública do seu print) *
                </label>
                <input
                  type="text"
                  required
                  value={config.anonKey}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value.trim() })}
                  placeholder="sb_publishable_mIaweUTjrXmXnBZBvx-w0Q_..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                <span className="text-[10px] text-slate-400">
                  Cole a chave que aparece em <strong>Publishable key</strong> (campo default do seu print)
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={isTesting || !config.url || !config.anonKey}
                  className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testando Conexão...' : 'Testar Conexão Supabase'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fadeIn ${
                  testResult.success 
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
                    : 'bg-rose-50 text-rose-900 border-rose-300'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* O CARD VERDE PEDIDO: "Sincronizar Dados Já Cadastrados no App" */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 sm:p-6 text-white shadow-lg space-y-4 border border-emerald-400/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Zap className="w-6 h-6 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Sincronizar Dados Já Cadastrados no App
                </h3>
                <p className="text-xs text-emerald-100">
                  Envie todos os setores, auditores, auditorias, notas, planos e fotos para o Supabase de uma só vez
                </p>
              </div>
            </div>

            {/* Contadores dos registros prontos para enviar */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 bg-emerald-950/40 p-3 rounded-xl border border-emerald-400/30 text-center">
              <div>
                <span className="text-[10px] text-emerald-200 block">Setores</span>
                <span className="font-black text-sm text-white">{sectors.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Auditores</span>
                <span className="font-black text-sm text-white">{auditors.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Auditorias</span>
                <span className="font-black text-sm text-white">{audits.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Planos 5W2H</span>
                <span className="font-black text-sm text-white">{actionPlans.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Agendas</span>
                <span className="font-black text-sm text-white">{scheduledAudits.length}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 block">Fotos</span>
                <span className="font-black text-sm text-white">{photos.length}</span>
              </div>
            </div>

            {/* BOTÃO "Sincronizar Agora" */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSyncNow}
                disabled={isSyncing || !config.url || !config.anonKey}
                className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-black text-sm sm:text-base transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 text-emerald-700 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Gravando dados no Supabase...' : 'Sincronizar Agora'}</span>
              </button>
            </div>

            {/* Mensagem de Resultado da Sincronização */}
            {syncResult && (
              <div className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 animate-fadeIn ${
                syncResult.success 
                  ? 'bg-emerald-950 text-emerald-200 border border-emerald-400' 
                  : 'bg-rose-950 text-rose-200 border border-rose-400'
              }`}>
                {syncResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="leading-relaxed">
                  {syncResult.message}
                </div>
              </div>
            )}
          </div>

          {/* Envio Automático Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">
                Envio Automático Ativado:
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Com o Supabase conectado, toda vez que você cadastrar ou editar um auditor, setor, auditoria, plano de ação ou foto, o sistema grava automaticamente no seu banco de dados do Supabase.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
