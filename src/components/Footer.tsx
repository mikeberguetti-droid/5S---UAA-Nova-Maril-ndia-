import React from 'react';
import { Award, ShieldCheck, Heart, Sparkles, RotateCcw } from 'lucide-react';

interface FooterProps {
  onResetData: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onResetData }) => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 mt-16 no-print pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Institutional Dedication Box */}
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-800/90 to-blue-950/70 rounded-2xl p-6 md:p-8 border border-emerald-700/40 shadow-xl mb-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Award className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <span className="text-[11px] font-bold tracking-widest uppercase text-emerald-400 block mb-1">
                  Reconhecimento Institucional
                </span>
                <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                  Coordenação do Programa 5S UAA - Nova Marilândia
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Agradecimento especial a todos os Auditores Internos, Facilitadores dos 5 Sensos, Lideranças Operacionais e Colaboradores que mantêm diariamente o compromisso inegociável com a organização, limpeza, segurança alimentar e bem-estar no chão de fábrica da União Avícola.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/60 rounded-xl px-4 py-2.5 shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Certificação Interna</span>
                <span className="text-xs font-bold text-white">Ciclo de Excelência 5S</span>
              </div>
            </div>
          </div>
        </div>

        {/* 5S Principles Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-sky-400 font-extrabold text-xs block">1º SEIRI</span>
            <span className="text-[11px] text-slate-300 font-medium">Utilização</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-teal-400 font-extrabold text-xs block">2º SEITON</span>
            <span className="text-[11px] text-slate-300 font-medium">Organização</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-emerald-400 font-extrabold text-xs block">3º SEISO</span>
            <span className="text-[11px] text-slate-300 font-medium">Limpeza</span>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-amber-400 font-extrabold text-xs block">4º SEIKETSU</span>
            <span className="text-[11px] text-slate-300 font-medium">Padronização</span>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
            <span className="text-purple-400 font-extrabold text-xs block">5º SHITSUKE</span>
            <span className="text-[11px] text-slate-300 font-medium">Disciplina</span>
          </div>
        </div>

        {/* Bottom Credits & Reset action */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© 2026 União Avícola Agroindustrial • UAA Nova Marilândia / MT</span>
            <span>•</span>
            <span className="text-emerald-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Qualidade Assegurada
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onResetData}
              className="flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors text-xs"
              title="Restaura os dados padrão de fábrica da UAA"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Dados Originais</span>
            </button>
            <span className="text-slate-700">|</span>
            <span className="text-[11px]">Desenvolvido para Chão de Fábrica</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
