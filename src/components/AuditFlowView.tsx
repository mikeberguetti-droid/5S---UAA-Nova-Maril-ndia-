import React, { useState, useEffect, useRef } from 'react';
import { 
  ClipboardCheck, 
  Camera, 
  Mic, 
  MicOff, 
  Volume2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Calendar, 
  Clock, 
  Users, 
  Plus,
  Minus,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  FileText,
  User,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Sector, 
  Auditor, 
  ChecklistQuestion, 
  Audit, 
  AuditCriterionAnswer, 
  SensoType,
  ScheduledAudit
} from '../types';
import { 
  SENSOS_CONFIG, 
  SCORING_SCALE, 
  calculatePointsFromProblems 
} from '../data/initialData';

interface AuditFlowViewProps {
  sectors: Sector[];
  auditors: Auditor[];
  questions: ChecklistQuestion[];
  preselectedSectorId?: string;
  preselectedSchedule?: ScheduledAudit;
  activeAuditor: Auditor | null;
  onFinishAudit: (newAudit: Audit) => void;
  onCancel: () => void;
  onViewReport: (audit: Audit) => void;
  onGoToCadastros?: () => void;
}

export const AuditFlowView: React.FC<AuditFlowViewProps> = ({
  sectors,
  auditors,
  questions,
  preselectedSectorId,
  preselectedSchedule,
  activeAuditor,
  onFinishAudit,
  onCancel,
  onViewReport,
  onGoToCadastros
}) => {
  // Header form states
  const [selectedSectorId, setSelectedSectorId] = useState<string>(
    preselectedSchedule?.setor_id || preselectedSectorId || (sectors.length > 0 ? sectors[0].id : '')
  );
  const [selectedAuditorId, setSelectedAuditorId] = useState<string>(
    preselectedSchedule?.auditor_id || (activeAuditor ? activeAuditor.id : (auditors.length > 0 ? auditors[0].id : ''))
  );
  const [auditDate, setAuditDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [auditTime, setAuditTime] = useState<string>(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
  const [auditShift, setAuditShift] = useState<'Turno 1' | 'Turno 2' | 'Turno 3' | 'Administrativo'>('Turno 1');
  const [generalObservations, setGeneralObservations] = useState<string>('');

  // Senses navigation
  const sensosList: SensoType[] = ['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'];
  const [activeSenso, setActiveSenso] = useState<SensoType>('seiri');

  // Answers Map: key is question id
  const [answers, setAnswers] = useState<Record<string, AuditCriterionAnswer>>({});

  // Voice dictation state
  const [isDictating, setIsDictating] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Photo modal preview
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Completion modal state
  const [completedAudit, setCompletedAudit] = useState<Audit | null>(null);

  // Active sector info
  const selectedSector = sectors.find(s => s.id === selectedSectorId) || sectors[0];
  const selectedAuditor = auditors.find(a => a.id === selectedAuditorId) || activeAuditor || auditors[0];

  // Initialize answers for all 25 criteria
  useEffect(() => {
    const initialMap: Record<string, AuditCriterionAnswer> = {};
    const defaultDeadline = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];

    questions.forEach(q => {
      initialMap[q.id] = {
        pergunta_id: q.id,
        senso: q.senso,
        qtd_evidencias: 0, // Starts clean with 0 problems = 100 points
        pontos: 100,
        descricao: '',
        foto_url: undefined,
        fato: '',
        causa: '',
        acao: '',
        supervisor_responsavel: selectedSector ? selectedSector.responsavel_nome : '',
        data_limite: defaultDeadline
      };
    });
    setAnswers(initialMap);
  }, [questions, selectedSectorId]);

  // Adjust problem quantity stepper
  const handleStepQuantity = (questionId: string, senso: SensoType, delta: number) => {
    setAnswers(prev => {
      const current = prev[questionId] || {
        pergunta_id: questionId,
        senso,
        qtd_evidencias: 0,
        pontos: 100,
        descricao: ''
      };

      const newQtd = Math.max(0, current.qtd_evidencias + delta);
      const newPoints = calculatePointsFromProblems(newQtd);

      return {
        ...prev,
        [questionId]: {
          ...current,
          pergunta_id: questionId,
          senso,
          qtd_evidencias: newQtd,
          pontos: newPoints,
          supervisor_responsavel: current.supervisor_responsavel || selectedSector.responsavel_nome
        }
      };
    });
  };

  // Set explicit quantity
  const handleSetQuantity = (questionId: string, senso: SensoType, qtd: number) => {
    setAnswers(prev => {
      const current = prev[questionId];
      const newPoints = calculatePointsFromProblems(qtd);

      return {
        ...prev,
        [questionId]: {
          ...current,
          pergunta_id: questionId,
          senso,
          qtd_evidencias: qtd,
          pontos: newPoints,
          supervisor_responsavel: current?.supervisor_responsavel || selectedSector.responsavel_nome
        }
      };
    });
  };

  // Update text fields
  const handleUpdateField = (questionId: string, field: keyof AuditCriterionAnswer, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        [field]: value
      }
    }));
  };

  // Handle Photo Upload / Camera
  const handleImageCapture = (questionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      handleUpdateField(questionId, 'foto_url', base64);
    };
    reader.readAsDataURL(file);
  };

  // Speech Recognition (Dictation for shop floor)
  const toggleDictation = (targetKey: string, questionId: string, fieldName: 'descricao' | 'fato' | 'causa' | 'acao') => {
    if (isDictating === targetKey) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(null);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Reconhecimento de voz não suportado neste navegador. Utilize o teclado.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      
      setAnswers(prev => {
        const item = prev[questionId];
        const currentVal = (item as any)[fieldName] || '';
        const updated = currentVal ? `${currentVal} ${transcript}` : transcript;
        return {
          ...prev,
          [questionId]: {
            ...item,
            [fieldName]: updated
          }
        };
      });
    };

    recognition.onerror = () => setIsDictating(null);
    recognition.onend = () => setIsDictating(null);

    recognitionRef.current = recognition;
    recognition.start();
    setIsDictating(targetKey);
  };

  // Instant Calculation of Scores per Senso & Overall
  const scoreCalculations = React.useMemo(() => {
    const sensoTotals: Record<SensoType, { sumPoints: number; count: number; problems: number }> = {
      seiri: { sumPoints: 0, count: 0, problems: 0 },
      seiton: { sumPoints: 0, count: 0, problems: 0 },
      seiso: { sumPoints: 0, count: 0, problems: 0 },
      seiketsu: { sumPoints: 0, count: 0, problems: 0 },
      shitsuke: { sumPoints: 0, count: 0, problems: 0 }
    };

    let totalProblems = 0;
    let totalCriteria = 0;
    let criteriaZeroProblems = 0;
    let grandPointsSum = 0;

    questions.forEach(q => {
      const ans = answers[q.id];
      const pts = ans ? ans.pontos : 100;
      const problems = ans ? ans.qtd_evidencias : 0;

      sensoTotals[q.senso].sumPoints += pts;
      sensoTotals[q.senso].count += 1;
      sensoTotals[q.senso].problems += problems;

      grandPointsSum += pts;
      totalProblems += problems;
      totalCriteria += 1;
      if (problems === 0) criteriaZeroProblems += 1;
    });

    const finalSensoPercentages: Record<SensoType, number> = {
      seiri: 100,
      seiton: 100,
      seiso: 100,
      seiketsu: 100,
      shitsuke: 100
    };

    sensosList.forEach(s => {
      const item = sensoTotals[s];
      finalSensoPercentages[s] = item.count > 0 ? item.sumPoints / item.count : 100;
    });

    const overallScore = totalCriteria > 0 ? grandPointsSum / totalCriteria : 100;

    return {
      finalSensoPercentages,
      overallScore,
      totalProblems,
      criteriaZeroProblems,
      sensoTotals
    };
  }, [answers, questions]);

  // Questions of active senso
  const currentSensoQuestions = questions.filter(q => q.senso === activeSenso);

  // Finalize Audit
  const handleFinalizeAudit = () => {
    const randomNum = Math.floor(100 + Math.random() * 900);
    const auditCode = `AUD-${new Date().getFullYear()}-${randomNum}`;

    const newAudit: Audit = {
      id: `aud-${Date.now()}`,
      codigo: auditCode,
      setor_id: selectedSector.id,
      setor_nome: selectedSector.nome,
      auditor_id: selectedAuditor.id,
      auditor_nome: selectedAuditor.nome,
      data: auditDate,
      data_sugerida: preselectedSchedule?.data_sugerida,
      hora: auditTime,
      turno: auditShift,
      status: 'concluida',
      notas_sensos: scoreCalculations.finalSensoPercentages,
      nota_final: parseFloat(scoreCalculations.overallScore.toFixed(1)),
      total_problemas: scoreCalculations.totalProblems,
      criterios_sem_problemas: scoreCalculations.criteriaZeroProblems,
      observacoes_gerais: generalObservations,
      respostas: Object.values(answers)
    };

    // Confetti celebration
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    setCompletedAudit(newAudit);
    onFinishAudit(newAudit);
  };

  // Guard when no sectors or auditors exist yet
  if (sectors.length === 0 || auditors.length === 0) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
          <ClipboardCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900">
          Pronto para Cadastrar e Simular!
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
          Todos os cadastros e registros anteriores foram limpos. Para realizar sua simulação, cadastre um auditor e um setor da fábrica.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <button
            type="button"
            onClick={() => onGoToCadastros ? onGoToCadastros() : onCancel()}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95"
          >
            Cadastrar Auditor & Setor Agora
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 py-3 rounded-2xl transition-all"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-28">
      
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Formulário Oficial de Auditoria 5S
              </span>
              <span className="text-xs text-slate-400">Padrão UAA</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Auditoria 5S • Registro em Campo
            </h1>
          </div>
        </div>

        {/* Live Score & Problems Counter */}
        <div className="flex items-center gap-4 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Nota Total</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono leading-none">
              {scoreCalculations.overallScore.toFixed(1)}%
            </div>
          </div>
          <div className="h-8 w-px bg-slate-700" />
          <div className="text-right text-xs">
            <div className="text-slate-300 font-medium">Inconformidades:</div>
            <div className={`font-mono font-black text-base ${
              scoreCalculations.totalProblems > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {scoreCalculations.totalProblems} problemas
            </div>
          </div>
        </div>
      </div>

      {/* OFFICIAL SCORING SCALE (From top-left of the document) */}
      <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-sm border border-slate-800 space-y-2.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              Tabela Oficial de Pontuação da Auditoria 5S
            </span>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            5S Objetivo: Melhorar a organização, limpeza e disciplina no ambiente de trabalho
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-[10px] text-slate-400 uppercase">
                <th className="py-2 px-3 text-left font-sans font-bold">Qtd de Problemas</th>
                <th className="py-2 px-2 text-rose-400">6 ou mais</th>
                <th className="py-2 px-2 text-amber-400">5</th>
                <th className="py-2 px-2 text-amber-400">4</th>
                <th className="py-2 px-2 text-amber-300">3</th>
                <th className="py-2 px-2 text-blue-300">2</th>
                <th className="py-2 px-2 text-emerald-400">1</th>
                <th className="py-2 px-2 text-emerald-300 font-bold">0</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-800 font-bold text-white text-sm">
                <td className="py-2 px-3 text-left font-sans text-xs text-slate-300 font-bold">Pontos</td>
                <td className="py-2 px-2 text-rose-400 font-black">0</td>
                <td className="py-2 px-2 text-amber-400 font-black">10</td>
                <td className="py-2 px-2 text-amber-400 font-black">30</td>
                <td className="py-2 px-2 text-amber-300 font-black">50</td>
                <td className="py-2 px-2 text-blue-300 font-black">70</td>
                <td className="py-2 px-2 text-emerald-400 font-black">80</td>
                <td className="py-2 px-2 text-emerald-300 font-black bg-emerald-950/40">100</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Header Parameters Form */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="font-extrabold text-slate-900 text-base">Identificação da Auditoria</h2>
          </div>
          {preselectedSchedule && (
            <span className="text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Data Sugerida: {new Date(preselectedSchedule.data_sugerida + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          {/* Sector selection */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-bold text-slate-700 block">SETOR: *</label>
            <select
              value={selectedSectorId}
              onChange={(e) => setSelectedSectorId(e.target.value)}
              className="w-full font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {sectors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.area}) • Resp: {s.responsavel_nome}
                </option>
              ))}
            </select>
          </div>

          {/* Auditor selection */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="font-bold text-slate-700 block">AUDITOR: *</label>
            <select
              value={selectedAuditorId}
              onChange={(e) => setSelectedAuditorId(e.target.value)}
              className="w-full font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {auditors.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nome} • {a.matricula} ({a.cargo})
                </option>
              ))}
            </select>
          </div>

          {/* Date conducted */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">DATA REALIZADA: *</label>
            <input
              type="date"
              value={auditDate}
              onChange={(e) => setAuditDate(e.target.value)}
              className="w-full font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Time conducted */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">HORA: *</label>
            <input
              type="time"
              value={auditTime}
              onChange={(e) => setAuditTime(e.target.value)}
              className="w-full font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Shift */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">TURNO: *</label>
            <select
              value={auditShift}
              onChange={(e) => setAuditShift(e.target.value as any)}
              className="w-full font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Turno 1">Turno 1 (Manhã)</option>
              <option value="Turno 2">Turno 2 (Tarde)</option>
              <option value="Turno 3">Turno 3 (Noturno / CIP)</option>
              <option value="Administrativo">Administrativo</option>
            </select>
          </div>

          {/* Sector Supervisor info */}
          <div className="space-y-1 bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                Supervisores do Setor ({selectedSector.responsaveis?.length || 1})
              </span>
              <span className="font-bold text-slate-900 text-xs">
                {selectedSector.responsaveis && selectedSector.responsaveis.length > 0
                  ? selectedSector.responsaveis.map(r => `${r.nome}${r.turno ? ` (${r.turno})` : ''}`).join(' • ')
                  : selectedSector.responsavel_nome}
              </span>
            </div>
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
              Meta: {selectedSector.meta_5s}%
            </span>
          </div>

        </div>
      </div>

      {/* Senses Navigation Tabs */}
      <div className="bg-white rounded-3xl p-3 border border-slate-200 shadow-sm sticky top-16 z-30">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {sensosList.map((senso, idx) => {
            const cfg = SENSOS_CONFIG[senso];
            const score = scoreCalculations.finalSensoPercentages[senso];
            const problems = scoreCalculations.sensoTotals[senso].problems;
            const isActive = activeSenso === senso;

            return (
              <button
                key={senso}
                onClick={() => setActiveSenso(senso)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl whitespace-nowrap transition-all font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: cfg.corPrimaria, color: '#fff' }}>
                  {idx + 1}
                </span>
                <span>{cfg.nomeJapones}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? 'bg-slate-800 text-emerald-300' : 'bg-white text-slate-600'
                }`}>
                  {score.toFixed(0)}%
                </span>
                {problems > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sense Banner Header */}
      <div 
        className="rounded-3xl p-5 border shadow-sm transition-all text-white flex items-center justify-between gap-4"
        style={{ 
          background: `linear-gradient(135deg, ${SENSOS_CONFIG[activeSenso].corPrimaria} 0%, #0f172a 100%)`,
          borderColor: SENSOS_CONFIG[activeSenso].corBorda 
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
              {SENSOS_CONFIG[activeSenso].nomeJapones}
            </span>
            <span className="text-xs font-semibold text-white/90">
              {SENSOS_CONFIG[activeSenso].nomePortugues}
            </span>
          </div>
          <p className="text-xs text-white/80 mt-1 max-w-xl">
            {SENSOS_CONFIG[activeSenso].significado}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] uppercase font-bold text-white/70 block">Média do Senso</span>
          <span className="text-2xl sm:text-3xl font-black font-mono">
            {scoreCalculations.finalSensoPercentages[activeSenso].toFixed(0)}%
          </span>
        </div>
      </div>

      {/* EXACT VERIFICATION LINES FROM AUDITORIA 5S */}
      <div className="space-y-4">
        {currentSensoQuestions.map((q) => {
          const ans = answers[q.id] || {
            pergunta_id: q.id,
            senso: q.senso,
            qtd_evidencias: 0,
            pontos: 100,
            descricao: '',
            supervisor_responsavel: selectedSector.responsavel_nome
          };

          const hasProblems = ans.qtd_evidencias > 0;

          return (
            <div
              key={q.id}
              className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all ${
                ans.qtd_evidencias >= 4 
                  ? 'border-rose-400 shadow-md ring-2 ring-rose-100' 
                  : ans.qtd_evidencias > 0 
                  ? 'border-amber-300 shadow-sm ring-1 ring-amber-100' 
                  : 'border-slate-200 shadow-sm'
              }`}
            >
              {/* Criterion Line Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                    {q.numero}
                  </span>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    {q.titulo}
                  </h3>
                </div>

                {/* Points indicator badge for this line */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-xl text-xs font-mono font-black ${
                    ans.pontos === 100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    ans.pontos >= 50 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {ans.pontos} PONTOS
                  </span>
                </div>
              </div>

              {/* Expected Standard reminder */}
              {q.padrao_esperado && (
                <div className="bg-slate-50 rounded-xl p-2.5 mb-3 text-xs text-slate-600 border border-slate-100">
                  <strong className="text-slate-800">Padrão Esperado:</strong> {q.padrao_esperado}
                </div>
              )}

              {/* STEPPER CONTROL: Aumentar / Diminuir QTD DE EVIDÊNCIAS / PROBLEMAS */}
              <div className="bg-slate-100 p-3.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide block">
                    Qtd de Evidências / Inconformidades
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Use os botões de (+) e (-) ou selecione o número de problemas encontrados no posto
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stepper buttons [-] [value] [+] */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-2xl p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => handleStepQuantity(q.id, q.senso, -1)}
                      disabled={ans.qtd_evidencias <= 0}
                      className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 flex items-center justify-center text-slate-800 transition-colors"
                      title="Diminuir inconformidade"
                    >
                      <Minus className="w-4 h-4 font-black" />
                    </button>

                    <div className="px-4 text-center">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {ans.qtd_evidencias}
                      </span>
                      <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                        {ans.qtd_evidencias === 1 ? 'problema' : 'problemas'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleStepQuantity(q.id, q.senso, 1)}
                      className="w-9 h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white transition-colors shadow-sm"
                      title="Aumentar inconformidade"
                    >
                      <Plus className="w-4 h-4 font-black" />
                    </button>
                  </div>

                  {/* Quick Pill options */}
                  <div className="hidden lg:flex items-center gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleSetQuantity(q.id, q.senso, num)}
                        className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all ${
                          ans.qtd_evidencias === num 
                            ? 'bg-slate-900 text-white' 
                            : 'bg-white hover:bg-slate-200 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {num === 6 ? '6+' : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* DESCRIÇÃO DA VERIFICAÇÃO (Voice Dictation + Typing) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span>DESCRIÇÃO / OBSERVAÇÕES DO AUDITOR</span>
                    {hasProblems && (
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.2 rounded font-bold">
                        Inconformidade Justificada
                      </span>
                    )}
                  </label>

                  {/* Voice Dictation Button */}
                  <button
                    type="button"
                    onClick={() => toggleDictation(`desc-${q.id}`, q.id, 'descricao')}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl transition-all ${
                      isDictating === `desc-${q.id}`
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700'
                    }`}
                    title="Clique para falar e ditar a descrição"
                  >
                    {isDictating === `desc-${q.id}` ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{isDictating === `desc-${q.id}` ? 'Ouvindo...' : 'Ditar por Voz'}</span>
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={ans.descricao}
                  onChange={(e) => handleUpdateField(q.id, 'descricao', e.target.value)}
                  placeholder={
                    hasProblems
                      ? "Descreva a inconformidade encontrada no setor (ex: onde está localizado, qual o desvio de padrão)..."
                      : "Padrão conforme. Anotações opcionais do auditor..."
                  }
                  className="w-full text-xs font-medium p-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* UAA PLANO DE AÇÃO FIELDS (When qtd_evidencias > 0) */}
                {hasProblems && (
                  <div className="bg-amber-50/40 border border-amber-200/80 rounded-2xl p-4 space-y-3 mt-3 animate-fadeIn">
                    <div className="flex items-center gap-2 border-b border-amber-200/60 pb-2">
                      <AlertCircle className="w-4 h-4 text-amber-700" />
                      <span className="text-xs font-extrabold uppercase tracking-wide text-amber-900">
                        Preenchimento do Plano de Ação - UAA
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* FATO */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">FATO (Inconformidade detectada) *</label>
                          <button
                            type="button"
                            onClick={() => toggleDictation(`fato-${q.id}`, q.id, 'fato')}
                            className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Mic className="w-3 h-3" /> Ditar
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Ex: Mangueira sem suporte tocando a água do piso"
                          value={ans.fato || ''}
                          onChange={(e) => handleUpdateField(q.id, 'fato', e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      {/* CAUSA */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">CAUSA (Por que aconteceu) *</label>
                          <button
                            type="button"
                            onClick={() => toggleDictation(`causa-${q.id}`, q.id, 'causa')}
                            className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Mic className="w-3 h-3" /> Ditar
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Ex: Quebra do suporte durante troca de turno"
                          value={ans.causa || ''}
                          onChange={(e) => handleUpdateField(q.id, 'causa', e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      {/* AÇÃO */}
                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">AÇÃO (O que será feito para corrigir) *</label>
                          <button
                            type="button"
                            onClick={() => toggleDictation(`acao-${q.id}`, q.id, 'acao')}
                            className="text-[10px] text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                          >
                            <Mic className="w-3 h-3" /> Ditar
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Ex: Soldar novo suporte de inox na coluna central"
                          value={ans.acao || ''}
                          onChange={(e) => handleUpdateField(q.id, 'acao', e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>

                      {/* RESPONSÁVEL */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-bold text-slate-800">SUPERVISOR RESPONSÁVEL *</label>
                          {selectedSector.responsaveis && selectedSector.responsaveis.length > 1 && (
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Selecione o supervisor desta ação:
                            </span>
                          )}
                        </div>

                        {selectedSector.responsaveis && selectedSector.responsaveis.length > 1 && (
                          <div className="flex flex-wrap gap-1 pb-1">
                            {selectedSector.responsaveis.map((r, rIdx) => {
                              const label = `${r.nome}${r.turno ? ` (${r.turno})` : ''}`;
                              const isSelected = (ans.supervisor_responsavel || selectedSector.responsavel_nome) === label ||
                                (ans.supervisor_responsavel || selectedSector.responsavel_nome) === r.nome;
                              return (
                                <button
                                  key={rIdx}
                                  type="button"
                                  onClick={() => handleUpdateField(q.id, 'supervisor_responsavel', label)}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                      : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {r.nome} {r.turno ? `• ${r.turno}` : ''}
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleUpdateField(q.id, 'supervisor_responsavel', selectedSector.responsaveis!.map(r => r.nome).join(' / '))}
                              className="text-[11px] px-2.5 py-1 rounded-lg border bg-white hover:bg-slate-100 text-slate-600 border-slate-300 font-medium transition-all cursor-pointer"
                            >
                              Todos os Supervisores
                            </button>
                          </div>
                        )}

                        <input
                          type="text"
                          placeholder="Nome do supervisor responsável"
                          value={ans.supervisor_responsavel || selectedSector.responsavel_nome}
                          onChange={(e) => handleUpdateField(q.id, 'supervisor_responsavel', e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white font-semibold"
                        />
                      </div>

                      {/* PRAZO LIMITE */}
                      <div className="space-y-1">
                        <label className="font-bold text-slate-800">DATA LIMITE DE RESOLUÇÃO *</label>
                        <input
                          type="date"
                          value={ans.data_limite || ''}
                          onChange={(e) => handleUpdateField(q.id, 'data_limite', e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Photo */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {ans.foto_url ? (
                    <div className="relative group inline-block">
                      <img
                        src={ans.foto_url}
                        alt="Evidência fotográfica"
                        onClick={() => setPreviewPhotoUrl(ans.foto_url || null)}
                        className="w-20 h-20 object-cover rounded-xl border-2 border-emerald-500 shadow-sm cursor-pointer"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateField(q.id, 'foto_url', undefined)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 transition-colors">
                      <Camera className="w-4 h-4 text-emerald-600" />
                      <span>{hasProblems ? 'Anexar Foto da Inconformidade' : 'Anexar Foto de Evidência'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={(e) => handleImageCapture(q.id, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Senses Navigation Step Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4">
        {sensosList.indexOf(activeSenso) > 0 ? (
          <button
            type="button"
            onClick={() => {
              const currentIdx = sensosList.indexOf(activeSenso);
              setActiveSenso(sensosList[currentIdx - 1]);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-bold text-xs transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Senso Anterior</span>
          </button>
        ) : <div />}

        {sensosList.indexOf(activeSenso) < sensosList.length - 1 ? (
          <button
            type="button"
            onClick={() => {
              const currentIdx = sensosList.indexOf(activeSenso);
              setActiveSenso(sensosList[currentIdx + 1]);
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-bold text-xs transition-colors shadow-md ml-auto"
          >
            <span>Próximo Senso ({SENSOS_CONFIG[sensosList[sensosList.indexOf(activeSenso) + 1]].nomeJapones})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : <div />}
      </div>

      {/* General Observations Box */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
        <label className="font-extrabold text-sm text-slate-900 block">
          Considerações Finais da Auditoria 5S
        </label>
        <textarea
          rows={3}
          value={generalObservations}
          onChange={(e) => setGeneralObservations(e.target.value)}
          placeholder="Registre destaques gerais da caminhada no setor, engajamento da supervisão e compromisso com o 5S..."
          className="w-full text-xs font-medium p-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Floating Bottom Action Bar */}
      <div className="sticky bottom-16 lg:bottom-4 z-40 bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 sm:p-5 text-white shadow-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-300">Setor: <strong className="text-white">{selectedSector.nome}</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-xs text-emerald-400 font-bold">Nota Total: {scoreCalculations.overallScore.toFixed(1)}%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total de {scoreCalculations.totalProblems} inconformidade(s) registrada(s). Somatória calculada automaticamente no ranking.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-4 py-3 rounded-2xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleFinalizeAudit}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Concluir e Somar no Ranking</span>
          </button>
        </div>
      </div>

      {/* Modal for Zooming Photos */}
      {previewPhotoUrl && (
        <div 
          onClick={() => setPreviewPhotoUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm cursor-pointer"
        >
          <div className="max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden p-2">
            <img src={previewPhotoUrl} alt="Visualização ampliada" className="w-full h-auto rounded-xl max-h-[80vh] object-contain" />
          </div>
        </div>
      )}

      {/* Completion Dialog */}
      {completedAudit && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-500/30 text-center animate-scaleUp">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-4 text-emerald-700">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Auditoria Concluída e Somada no Ranking!
            </span>

            <h3 className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
              {completedAudit.setor_nome}
            </h3>

            <div className="my-5 p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-around">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Nota Final</span>
                <span className="text-3xl font-black text-emerald-400 font-mono">
                  {completedAudit.nota_final.toFixed(1)}%
                </span>
              </div>
              <div className="w-px h-10 bg-slate-700" />
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Inconformidades</span>
                <span className="text-xl font-black text-amber-400 font-mono block mt-1">
                  {completedAudit.total_problemas}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              A nota foi calculada conforme a escala oficial (0 a 100 pontos por linha), registrada no ranking setorial da UAA e o cronograma de pontualidade do auditor foi atualizado.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={() => onViewReport(completedAudit)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Visualizar Relatório Consolidado</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
              >
                Voltar ao Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
