import React from 'react';
import { 
  X, 
  Printer, 
  Award, 
  Factory,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Audit, Sector, ChecklistQuestion } from '../types';
import { SENSOS_CONFIG } from '../data/initialData';

interface ReportModalProps {
  audit: Audit;
  sector?: Sector;
  questions: ChecklistQuestion[];
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  audit,
  sector,
  questions,
  onClose
}) => {
  const sensosList: ('seiri' | 'seiton' | 'seiso' | 'seiketsu' | 'shitsuke')[] = [
    'seiri',
    'seiton',
    'seiso',
    'seiketsu',
    'shitsuke'
  ];

  const handlePrint = () => {
    window.print();
  };

  const getSealText = (score: number) => {
    if (score >= 95) return '🏆 SELO DIAMANTE (EXCELÊNCIA INDUSTRIAL)';
    if (score >= 90) return '🥇 SELO OURO (CERTIFICADO 5S)';
    if (score >= 80) return '🥈 SELO PRATA (CONFORME COM RESSALVAS)';
    return '⚠️ SELO BRONZE (PLANO DE AÇÃO IMEDIATO)';
  };

  // Find answers with problems
  const negativeAnswers = audit.respostas.filter(r => r.qtd_evidencias > 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full my-auto shadow-2xl border border-slate-300 overflow-hidden text-slate-900 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none">
        
        {/* Action Header (Hidden in Print) */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-500/40">
              {audit.codigo}
            </span>
            <span className="font-bold text-sm hidden sm:inline">Relatório Oficial de Auditoria 5S • UAA</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Gerar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div className="p-6 sm:p-10 space-y-6 text-xs bg-white">
          
          {/* Institutional Document Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-800 flex items-center justify-center text-white shrink-0 print:border print:border-slate-800">
                  <Factory className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-slate-950">
                    AUDITORIA 5S — UNIÃO AVÍCOLA AGROINDUSTRIAL
                  </h1>
                  <p className="text-xs font-bold text-emerald-800">
                    UAA - Nova Marilândia / MT • Coordenação do Programa 5S
                  </p>
                  <p className="text-[11px] text-slate-500 italic">
                    5S OBJETIVO: MELHORAR A ORGANIZAÇÃO, LIMPEZA E DISCIPLINA NO AMBIENTE DE TRABALHO.
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-50 print:bg-transparent p-3 rounded-xl border border-slate-200 print:border-none">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">CÓDIGO DE REGISTRO</span>
                <span className="text-sm font-mono font-black text-slate-900">{audit.codigo}</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Realizada: {new Date(audit.data + 'T00:00:00').toLocaleDateString('pt-BR')} ({audit.hora || '08:00'})
                </span>
              </div>
            </div>
          </div>

          {/* OFFICIAL HEADER FIELDS FROM DOCUMENT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-100 rounded-2xl border border-slate-300 font-bold text-xs uppercase">
            <div>
              <span className="text-slate-500 text-[10px] block">DATA DA AUDITORIA:</span>
              <span className="text-slate-900">{new Date(audit.data + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">AUDITOR INTERNO:</span>
              <span className="text-slate-900">{audit.auditor_nome}</span>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] block">SETOR AVALIADO:</span>
              <span className="text-slate-900">{audit.setor_nome}</span>
            </div>
          </div>

          {/* SCORING SCALE BAR (From document top-left) */}
          <div className="bg-slate-900 text-white p-3 rounded-xl overflow-x-auto text-center font-mono text-xs">
            <div className="grid grid-cols-8 gap-1 items-center">
              <span className="text-[10px] text-slate-400 font-sans font-bold uppercase text-left col-span-2">
                Escala Oficial:
              </span>
              <span>0 prob = 100</span>
              <span>1 prob = 80</span>
              <span>2 prob = 70</span>
              <span>3 prob = 50</span>
              <span>4 prob = 30</span>
              <span>≥6 prob = 0</span>
            </div>
          </div>

          {/* Overall Score & Certification Seal */}
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">Classificação Final</span>
                <span className="font-extrabold text-sm sm:text-base text-slate-900">
                  {getSealText(audit.nota_final)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Nota Final Ponderada</span>
              <span className="font-black text-2xl text-emerald-800 font-mono">
                {audit.nota_final.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-600 block">
                Total de Inconformidades: <strong>{audit.total_problemas}</strong>
              </span>
            </div>
          </div>

          {/* Senso Breakdown */}
          <div>
            <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">
              Desempenho por Senso 5S
            </h3>
            <table className="w-full text-left border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="py-2 px-3">Senso</th>
                  <th className="py-2 px-3">Conceito</th>
                  <th className="py-2 px-3 text-right">Média dos 5 Critérios</th>
                  <th className="py-2 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {sensosList.map(senso => {
                  const cfg = SENSOS_CONFIG[senso];
                  const score = audit.notas_sensos?.[senso] ?? 90;
                  const isGood = score >= 90;

                  return (
                    <tr key={senso} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">
                        {cfg.nomeJapones} ({cfg.nomePortugues})
                      </td>
                      <td className="py-2 px-3 text-slate-500 text-[11px]">
                        {cfg.significado}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-sm">
                        {score.toFixed(1)}%
                      </td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isGood ? 'Conforme' : 'Atenção'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* OFFICIAL PLANO DE AÇÃO - UAA SECTION (From the second document) */}
          <div className="print-break-inside-avoid">
            <div className="bg-red-700 text-white px-3 py-1.5 rounded-t-xl font-black text-xs uppercase flex items-center justify-between">
              <span>PLANO DE AÇÃO - UAA (INCONFORMIDADES JUSTIFICADAS)</span>
              <span>{negativeAnswers.length} Ação(ões)</span>
            </div>

            {negativeAnswers.length === 0 ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-b-xl text-emerald-800 font-medium">
                Nenhuma inconformidade registrada nesta auditoria. Padrão 100% conforme.
              </div>
            ) : (
              <div className="border border-slate-300 rounded-b-xl overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-[9px] font-black uppercase text-slate-700">
                      <th className="p-2">SETOR</th>
                      <th className="p-2">FATO</th>
                      <th className="p-2">CAUSA</th>
                      <th className="p-2">AÇÃO</th>
                      <th className="p-2">RESPONSÁVEL</th>
                      <th className="p-2">PRAZO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-[11px]">
                    {negativeAnswers.map((item, idx) => {
                      const q = questions.find(q => q.id === item.pergunta_id);
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2 font-bold text-slate-900 whitespace-nowrap">
                            {audit.setor_nome}
                          </td>
                          <td className="p-2 font-medium text-slate-900">
                            {item.fato || item.descricao || q?.titulo}
                          </td>
                          <td className="p-2 text-slate-600">
                            {item.causa || 'Desvio identificado na auditoria'}
                          </td>
                          <td className="p-2 font-medium text-emerald-900">
                            {item.acao || 'Adequar conforme padrão'}
                          </td>
                          <td className="p-2 font-bold text-slate-800 whitespace-nowrap">
                            {item.supervisor_responsavel || sector?.responsavel_nome}
                          </td>
                          <td className="p-2 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {item.data_limite ? new Date(item.data_limite + 'T00:00:00').toLocaleDateString('pt-BR') : '7 dias'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Observations */}
          {audit.observacoes_gerais && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-500 block mb-0.5">
                Observações Gerais do Auditor
              </span>
              <p className="italic text-slate-700">"{audit.observacoes_gerais}"</p>
            </div>
          )}

          {/* Signatures */}
          <div className="pt-8 border-t-2 border-slate-300 print-break-inside-avoid">
            <div className={`grid ${
              (sector?.responsaveis?.length || 1) >= 2 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'
            } gap-6 text-center`}>
              <div>
                <div className="border-b border-slate-900 w-3/4 mx-auto mb-2" />
                <p className="font-extrabold text-xs text-slate-900">{audit.auditor_nome}</p>
                <p className="text-[10px] text-slate-500">Auditor Interno 5S • UAA</p>
              </div>

              {sector?.responsaveis && sector.responsaveis.length > 0 ? (
                sector.responsaveis.map((resp, rIdx) => (
                  <div key={rIdx}>
                    <div className="border-b border-slate-900 w-3/4 mx-auto mb-2" />
                    <p className="font-extrabold text-xs text-slate-900">{resp.nome}</p>
                    <p className="text-[10px] text-slate-500">
                      {resp.cargo} {resp.turno ? `(${resp.turno})` : ''} • Responsável
                    </p>
                  </div>
                ))
              ) : (
                <div>
                  <div className="border-b border-slate-900 w-3/4 mx-auto mb-2" />
                  <p className="font-extrabold text-xs text-slate-900">{sector?.responsavel_nome || 'Supervisor da Área'}</p>
                  <p className="text-[10px] text-slate-500">Supervisor Responsável pelo Setor</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-[9px] text-slate-400 text-center pt-3 border-t border-slate-100">
            União Avícola Agroindustrial • UAA Nova Marilândia / MT • Registro de Auditoria 5S
          </div>

        </div>

      </div>
    </div>
  );
};
