import React, { useState } from 'react';
import { 
  Settings, 
  Building2, 
  Users, 
  ListChecks, 
  Plus, 
  Trash2, 
  Edit, 
  Download, 
  UploadCloud, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck,
  Save,
  X,
  User,
  Database,
  Cloud,
  Key,
  Copy,
  RefreshCw,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Sector, Auditor, ChecklistQuestion, SensoType, SectorResponsavel } from '../types';
import { SENSOS_CONFIG } from '../data/initialData';
import { 
  getSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  syncAllToSupabase,
  SUPABASE_SQL_SCHEMA,
  SupabaseConfig 
} from '../services/supabaseSync';
import { syncAllToFirestore } from '../services/firestoreSync';
import { 
  getStoredAudits, 
  getStoredActionPlans, 
  getStoredScheduledAudits, 
  getStoredPhotos 
} from '../services/storage';

interface ManagementViewProps {
  sectors: Sector[];
  auditors: Auditor[];
  questions: ChecklistQuestion[];
  onSaveSectors: (sectors: Sector[]) => void;
  onSaveAuditors: (auditors: Auditor[]) => void;
  onSaveQuestions: (questions: ChecklistQuestion[]) => void;
  onResetData: () => void;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
  sectors,
  auditors,
  questions,
  onSaveSectors,
  onSaveAuditors,
  onSaveQuestions,
  onResetData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'setores' | 'auditores' | 'checklist' | 'sistema'>('setores');

  // Cloud & Supabase States
  const [supabaseConfigState, setSupabaseConfigState] = useState<SupabaseConfig>(() => getSupabaseConfig());
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [isSyncingFirestore, setIsSyncingFirestore] = useState(false);
  const [firestoreSyncMessage, setFirestoreSyncMessage] = useState<string | null>(null);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig(supabaseConfigState);
    setSupabaseTestResult({ success: true, message: 'Configuração do Supabase salva com sucesso!' });
  };

  const handleTestSupabase = async () => {
    setIsTestingSupabase(true);
    setSupabaseTestResult(null);
    const res = await testSupabaseConnection(supabaseConfigState);
    setIsTestingSupabase(false);
    setSupabaseTestResult(res);
  };

  const handleSyncSupabaseNow = async () => {
    saveSupabaseConfig(supabaseConfigState);
    setIsSyncingSupabase(true);
    setSupabaseSyncMessage(null);

    const audits = getStoredAudits();
    const plans = getStoredActionPlans();
    const schedules = getStoredScheduledAudits();
    const photos = getStoredPhotos();

    const res = await syncAllToSupabase({
      sectors,
      auditors,
      audits,
      actionPlans: plans,
      scheduledAudits: schedules,
      photos,
      questions
    });

    setIsSyncingSupabase(false);
    if (res.success) {
      setSupabaseSyncMessage({
        success: true,
        message: `Sincronização concluída com sucesso! ${res.count} registros gravados. Ao dar um F5 na tela do Supabase do seu print, os registros aparecerão lá preenchidos!`
      });
    } else {
      setSupabaseSyncMessage({
        success: false,
        message: `Erro ao sincronizar com Supabase: ${res.error}`
      });
    }
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 3000);
  };

  const handleForceFirestoreSync = async () => {
    setIsSyncingFirestore(true);
    setFirestoreSyncMessage(null);
    const audits = getStoredAudits();
    const plans = getStoredActionPlans();
    const schedules = getStoredScheduledAudits();
    const photos = getStoredPhotos();

    const res = await syncAllToFirestore({
      sectors,
      auditors,
      audits,
      actionPlans: plans,
      scheduledAudits: schedules,
      photos,
      questions
    });

    setIsSyncingFirestore(false);
    if (res.success) {
      setFirestoreSyncMessage(`Sincronização concluída! ${res.count} registros salvos no banco em nuvem Firestore.`);
    } else {
      setFirestoreSyncMessage(`Erro na sincronização: ${res.error}`);
    }
  };

  // Sector Modal
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [sectorForm, setSectorForm] = useState<Sector>({
    id: '',
    nome: '',
    area: 'Industrial',
    responsavel_nome: '',
    responsavel_cargo: 'Supervisor',
    responsavel_email: '',
    responsaveis: [
      { id: 'resp-1', nome: '', cargo: 'Supervisor', email: '', turno: 'Turno 1' }
    ],
    meta_5s: 80,
    turno_ativo: 'Turnos 1 e 2'
  });

  // Auditor Modal
  const [isAuditorModalOpen, setIsAuditorModalOpen] = useState(false);
  const [editingAuditor, setEditingAuditor] = useState<Auditor | null>(null);
  const [auditorForm, setAuditorForm] = useState<Auditor>({
    id: '',
    nome: '',
    matricula: '',
    setor_origem: '',
    cargo: 'Auditor Interno 5S',
    email: '',
    total_auditorias: 0,
    auditorias_no_prazo: 0,
    auditorias_com_atraso: 0,
    score_pontualidade: 100,
    dias_medio_desvio: 0
  });

  // Checklist Question Modal
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState<ChecklistQuestion>({
    id: '',
    senso: 'seiri',
    numero: 1,
    titulo: '',
    descricao_criterio: '',
    padrao_esperado: '',
    peso: 2,
    ativo: true
  });

  // Helper methods for multiple supervisors
  const addSupervisorRow = () => {
    const currentList = sectorForm.responsaveis || [];
    const newIdx = currentList.length + 1;
    const newResp: SectorResponsavel = {
      id: `resp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nome: '',
      cargo: 'Supervisor',
      email: '',
      turno: newIdx === 2 ? 'Turno 2' : newIdx === 3 ? 'Turno 3' : 'Geral'
    };
    setSectorForm({
      ...sectorForm,
      responsaveis: [...currentList, newResp]
    });
  };

  const removeSupervisorRow = (index: number) => {
    const currentList = sectorForm.responsaveis || [];
    if (currentList.length <= 1) return;
    const updated = currentList.filter((_, idx) => idx !== index);
    setSectorForm({
      ...sectorForm,
      responsaveis: updated
    });
  };

  const updateSupervisorField = (index: number, field: keyof SectorResponsavel, value: string) => {
    const currentList = [...(sectorForm.responsaveis || [])];
    if (!currentList[index]) return;
    currentList[index] = {
      ...currentList[index],
      [field]: value
    };
    setSectorForm({
      ...sectorForm,
      responsaveis: currentList
    });
  };

  // Sector Handlers
  const openNewSector = () => {
    setEditingSector(null);
    setSectorForm({
      id: `sec-${Date.now()}`,
      nome: '',
      area: 'Industrial',
      responsavel_nome: '',
      responsavel_cargo: 'Supervisor',
      responsavel_email: '',
      responsaveis: [
        { id: `resp-${Date.now()}-1`, nome: '', cargo: 'Supervisor', email: '', turno: 'Turno 1' }
      ],
      meta_5s: 80,
      turno_ativo: 'Turnos 1 e 2'
    });
    setIsSectorModalOpen(true);
  };

  const openEditSector = (sec: Sector) => {
    setEditingSector(sec);
    const existingResps: SectorResponsavel[] = sec.responsaveis && sec.responsaveis.length > 0
      ? sec.responsaveis
      : [
          {
            id: `resp-${Date.now()}-1`,
            nome: sec.responsavel_nome || '',
            cargo: sec.responsavel_cargo || 'Supervisor',
            email: sec.responsavel_email || '',
            turno: 'Geral'
          }
        ];

    setSectorForm({
      ...sec,
      responsaveis: existingResps
    });
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    const resps = (sectorForm.responsaveis || []).map(r => ({
      ...r,
      nome: r.nome.trim()
    })).filter(r => r.nome !== '');

    if (resps.length === 0) {
      alert('Por favor, informe ao menos um supervisor responsável com nome preenchido.');
      return;
    }

    const primaryResp = resps[0];
    const joinedNames = resps.map(r => r.nome).join(', ');

    const payload: Sector = {
      ...sectorForm,
      responsavel_nome: primaryResp.nome,
      responsavel_cargo: primaryResp.cargo || 'Supervisor',
      responsavel_email: primaryResp.email || '',
      responsaveis: resps
    };

    if (editingSector) {
      const updated = sectors.map(s => s.id === editingSector.id ? payload : s);
      onSaveSectors(updated);
    } else {
      onSaveSectors([...sectors, payload]);
    }
    setIsSectorModalOpen(false);
  };

  const handleDeleteSector = (id: string) => {
    if (confirm('Deseja realmente remover este setor da lista de cadastros?')) {
      onSaveSectors(sectors.filter(s => s.id !== id));
    }
  };

  // Auditor Handlers
  const openNewAuditor = () => {
    setEditingAuditor(null);
    setAuditorForm({
      id: `aud-${Date.now()}`,
      nome: '',
      matricula: `UAA-${Math.floor(1000 + Math.random() * 9000)}`,
      setor_origem: '',
      cargo: 'Auditor Interno 5S',
      email: '',
      total_auditorias: 0,
      auditorias_no_prazo: 0,
      auditorias_com_atraso: 0,
      score_pontualidade: 100,
      dias_medio_desvio: 0
    });
    setIsAuditorModalOpen(true);
  };

  const handleSaveAuditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAuditor) {
      const updated = auditors.map(a => a.id === editingAuditor.id ? auditorForm : a);
      onSaveAuditors(updated);
    } else {
      onSaveAuditors([...auditors, auditorForm]);
    }
    setIsAuditorModalOpen(false);
  };

  const handleDeleteAuditor = (id: string) => {
    if (confirm('Remover auditor cadastrado?')) {
      onSaveAuditors(auditors.filter(a => a.id !== id));
    }
  };

  // Question Handlers
  const openNewQuestion = () => {
    setQuestionForm({
      id: `q-${Date.now()}`,
      senso: 'seiri',
      numero: questions.filter(q => q.senso === 'seiri').length + 1,
      titulo: '',
      descricao_criterio: '',
      padrao_esperado: '',
      peso: 2,
      ativo: true
    });
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveQuestions([...questions, questionForm]);
    setIsQuestionModalOpen(false);
  };

  const handleDeleteQuestion = (id: string) => {
    if (confirm('Remover pergunta do checklist 5S?')) {
      onSaveQuestions(questions.filter(q => q.id !== id));
    }
  };

  // JSON Export / Backup
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({ sectors, auditors, questions, exportedAt: new Date().toISOString() }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `5S_UAA_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Configurações & Cadastros
            </span>
            <span className="text-xs text-slate-400">Parâmetros Operacionais</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Cadastros Gerais da Fábrica
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestão de setores industriais, auditores certificados e parametrização do checklist dos 5 Sensos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('setores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'setores' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Setores & Áreas ({sectors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auditores')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'auditores' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Auditores Internos ({auditors.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'checklist' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ListChecks className="w-4 h-4" />
          <span>Checklist dos 5 Sensos ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('sistema')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeSubTab === 'sistema' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Dados & Manutenção</span>
        </button>
      </div>

      {/* SUBTAB 1: Setores & Áreas */}
      {activeSubTab === 'setores' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Setores Cadastrados na Unidade</h2>
              <p className="text-xs text-slate-500">Áreas industriais, utilidades e administrativas sujeitas a auditorias 5S</p>
            </div>
            <button
              onClick={openNewSector}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Setor</span>
            </button>
          </div>

          {sectors.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Nenhum setor cadastrado ainda</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Clique no botão "+ Novo Setor" acima para cadastrar a primeira área fabril da unidade (ex: Farinha e Gordura/Graxaria, Abate, Cortes, Manutenção, Caldeira).
              </p>
              <button
                onClick={openNewSector}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Setor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectors.map(sec => (
                <div
                  key={sec.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] uppercase font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {sec.area}
                      </span>
                      <span className="text-xs font-bold text-emerald-800 font-mono">
                        Meta: {sec.meta_5s}%
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-2">{sec.nome}</h3>
                    <div className="text-xs text-slate-500 mt-2 space-y-1.5">
                      <div>
                        <span className="font-bold text-slate-700 block text-[11px]">
                          Supervisores Responsáveis ({sec.responsaveis?.length || 1}):
                        </span>
                        {sec.responsaveis && sec.responsaveis.length > 0 ? (
                          <div className="mt-1 space-y-1">
                            {sec.responsaveis.map((r, rIdx) => (
                              <div key={r.id || rIdx} className="bg-white p-2 rounded-xl border border-slate-200/80 text-[11px] shadow-2xs">
                                <div className="font-bold text-slate-900 flex items-center justify-between">
                                  <span>{r.nome}</span>
                                  {r.turno && (
                                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-1.5 py-0.2 rounded">
                                      {r.turno}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <span>{r.cargo}</span>
                                  {r.email && <span className="truncate">• {r.email}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-0.5 text-slate-800 font-medium">
                            {sec.responsavel_nome} <span className="text-slate-400">({sec.responsavel_cargo})</span>
                          </p>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                        <strong>Turnos de Operação:</strong> {sec.turno_ativo}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-200">
                    <button
                      onClick={() => openEditSector(sec)}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSector(sec.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: Auditores Internos */}
      {activeSubTab === 'auditores' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Corpo de Auditores Internos 5S</h2>
              <p className="text-xs text-slate-500">Colaboradores treinados e qualificados para conduzir auditorias cruzadas</p>
            </div>
            <button
              onClick={openNewAuditor}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Auditor</span>
            </button>
          </div>

          {auditors.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-800">Nenhum auditor cadastrado ainda</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Clique no botão "+ Novo Auditor" acima para cadastrar o auditor interno que conduzirá as avaliações do 5S na unidade.
              </p>
              <button
                onClick={openNewAuditor}
                className="mt-4 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Primeiro Auditor</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {auditors.map(aud => (
                <div
                  key={aud.id}
                  className="bg-slate-50 rounded-2xl p-4 border border-slate-200 hover:border-emerald-400 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {aud.nome.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                          {aud.matricula}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900">{aud.nome}</h3>
                    <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                      <p><strong>Cargo:</strong> {aud.cargo}</p>
                      <p><strong>Origem:</strong> {aud.setor_origem}</p>
                      <p><strong>Auditorias:</strong> {aud.total_auditorias} realizadas</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setEditingAuditor(aud);
                        setAuditorForm(aud);
                        setIsAuditorModalOpen(true);
                      }}
                      className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAuditor(aud.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: Checklist dos 5 Sensos */}
      {activeSubTab === 'checklist' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Perguntas Parametrizadas do Checklist</h2>
              <p className="text-xs text-slate-500">Critérios divididos rigorosamente entre os 5 Sensos da metodologia 5S</p>
            </div>
            <button
              onClick={openNewQuestion}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Critério</span>
            </button>
          </div>

          {(['seiri', 'seiton', 'seiso', 'seiketsu', 'shitsuke'] as SensoType[]).map(senso => {
            const cfg = SENSOS_CONFIG[senso];
            const sensoQuestions = questions.filter(q => q.senso === senso);

            return (
              <div key={senso} className="space-y-3">
                <div 
                  className="flex items-center justify-between p-3 rounded-2xl text-white"
                  style={{ backgroundColor: cfg.corPrimaria }}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm uppercase tracking-wide">
                      {cfg.nomeJapones} — {cfg.nomePortugues}
                    </span>
                  </div>
                  <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
                    {sensoQuestions.length} critérios
                  </span>
                </div>

                <div className="space-y-2">
                  {sensoQuestions.map((q, i) => (
                    <div 
                      key={q.id}
                      className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{i + 1}. {q.titulo}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                            Peso {q.peso}
                          </span>
                        </div>
                        <p className="text-slate-600">{q.descricao_criterio}</p>
                        <p className="text-emerald-800 font-medium">Padrão esperado: {q.padrao_esperado}</p>
                      </div>

                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 shrink-0"
                        title="Remover pergunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 4: Sistema e Manutenção */}
      {activeSubTab === 'sistema' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="font-extrabold text-base text-slate-900">Banco de Dados em Nuvem & Manutenção</h2>
            <p className="text-xs text-slate-500">Persistência segura em tempo real, sincronização em nuvem e exportações da UAA</p>
          </div>

          {/* CLOUD FIRESTORE STATUS CARD */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-slate-900 text-white border border-emerald-500/40 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white">Banco de Dados em Nuvem Ativo</h3>
                    <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-ping"></span>
                      CONECTADO
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    Google Cloud Firestore (Enterprise Edition) • Projeto: <code className="text-white font-mono font-bold">gen-lang-client-0546145391</code>
                  </p>
                </div>
              </div>

              <button
                onClick={handleForceFirestoreSync}
                disabled={isSyncingFirestore}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFirestore ? 'animate-spin' : ''}`} />
                <span>{isSyncingFirestore ? 'Sincronizando...' : 'Forçar Sincronização Agora'}</span>
              </button>
            </div>

            {firestoreSyncMessage && (
              <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-400/50 text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{firestoreSyncMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-800/60 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Setores Ativos</span>
                <span className="text-sm font-bold text-white">{sectors.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Auditores Cadastrados</span>
                <span className="text-sm font-bold text-white">{auditors.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Critérios 5S</span>
                <span className="text-sm font-bold text-white">{questions.length}</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block">Persistência</span>
                <span className="text-xs font-bold text-emerald-400">Automática</span>
              </div>
            </div>
          </div>

          {/* SUPABASE INTEGRATION & SECRETS */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800 font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Integração Supabase & Secrets</h3>
                  <p className="text-xs text-slate-500">Conecte também ao seu banco relacional PostgreSQL do Supabase via Secrets</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopySchema}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>{copiedSchema ? 'Copiado para o Clipboard!' : 'Copiar Script SQL do Supabase'}</span>
              </button>
            </div>

            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-700" />
                <span>Como configurar via Secrets no painel do AI Studio:</span>
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Adicione no painel <strong>Secrets</strong>: <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-950 font-mono">VITE_SUPABASE_URL</code> (ex: <span className="font-mono">https://xyz.supabase.co</span>) e <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-blue-950 font-mono">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>

            <form onSubmit={handleSaveSupabase} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Supabase Project URL</label>
                  <input
                    type="url"
                    value={supabaseConfigState.url}
                    onChange={(e) => setSupabaseConfigState({ ...supabaseConfigState, url: e.target.value })}
                    placeholder="https://seu-projeto.supabase.co"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Publishable key (Chave Pública do seu print)</label>
                  <input
                    type="text"
                    value={supabaseConfigState.anonKey}
                    onChange={(e) => setSupabaseConfigState({ ...supabaseConfigState, anonKey: e.target.value })}
                    placeholder="sb_publishable_mIaweUTjrXmXnBZBvx-w0Q_..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Salvar Configuração
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase || !supabaseConfigState.url}
                    className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    {isTestingSupabase ? 'Testando Conexão...' : 'Testar Conexão Supabase'}
                  </button>
                </div>

                {supabaseTestResult && (
                  <div className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${
                    supabaseTestResult.success 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {supabaseTestResult.success ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    )}
                    <span>{supabaseTestResult.message}</span>
                  </div>
                )}
              </div>
            </form>

            {/* O CARD VERDE PEDIDO: Sincronizar Dados Já Cadastrados no App */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-5 text-white shadow-md space-y-3.5 border border-emerald-400/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                  <Zap className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-white">
                    Sincronizar Dados Já Cadastrados no App
                  </h4>
                  <p className="text-[11px] text-emerald-100">
                    Grave instantaneamente todos os setores, auditores, auditorias, notas e planos do navegador no Supabase
                  </p>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleSyncSupabaseNow}
                  disabled={isSyncingSupabase || !supabaseConfigState.url || !supabaseConfigState.anonKey}
                  className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-white hover:bg-emerald-50 text-emerald-900 font-black text-xs sm:text-sm transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-emerald-700 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                  <span>{isSyncingSupabase ? 'Gravando dados no Supabase...' : 'Sincronizar Agora'}</span>
                </button>
              </div>

              {supabaseSyncMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 animate-fadeIn ${
                  supabaseSyncMessage.success 
                    ? 'bg-emerald-950 text-emerald-200 border border-emerald-400' 
                    : 'bg-rose-950 text-rose-200 border border-rose-400'
                }`}>
                  {supabaseSyncMessage.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{supabaseSyncMessage.message}</span>
                </div>
              )}
            </div>
          </div>

          {/* BACKUP & RESTORE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Download className="w-4 h-4 text-emerald-600" />
                <span>Exportar Dados em JSON (Backup Completo)</span>
              </h3>
              <p className="text-xs text-slate-600">
                Gere uma cópia de segurança completa com todos os setores, perguntas, auditorias e planos de ação 5W2H registrados.
              </p>
              <button
                onClick={handleExportJSON}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Fazer Download do Arquivo JSON
              </button>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
              <h3 className="font-extrabold text-sm text-rose-900 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>Restaurar Dados Originais de Fábrica</span>
              </h3>
              <p className="text-xs text-rose-700">
                Restaura os dados iniciais pré-configurados da UAA - Nova Marilândia, recarregando setores, auditores e auditorias de exemplo.
              </p>
              <button
                onClick={onResetData}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Resetar e Carregar Padrão UAA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sector Edit/New */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingSector ? 'Editar Setor Industrial' : 'Cadastrar Novo Setor'}
              </h3>
              <button onClick={() => setIsSectorModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>

            <form onSubmit={handleSaveSector} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nome do Setor *</label>
                <input
                  type="text"
                  required
                  value={sectorForm.nome}
                  onChange={(e) => setSectorForm({ ...sectorForm, nome: e.target.value })}
                  placeholder="Ex: Sala de Cortes / Filetagem"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Área Operacional *</label>
                  <select
                    value={sectorForm.area}
                    onChange={(e) => setSectorForm({ ...sectorForm, area: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Industrial">Industrial</option>
                    <option value="Utilidades">Utilidades</option>
                    <option value="Apoio">Apoio</option>
                    <option value="Administrativo">Administrativo</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Meta 5S (%) *</label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    required
                    value={sectorForm.meta_5s}
                    onChange={(e) => setSectorForm({ ...sectorForm, meta_5s: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* SUPERVISORES RESPONSÁVEIS */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-extrabold text-slate-800 text-xs block">
                      Supervisores / Gestores Responsáveis ({sectorForm.responsaveis?.length || 1}) *
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Adicione um ou mais supervisores para este setor industrial
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addSupervisorRow}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ Adicionar Responsável</span>
                  </button>
                </div>

                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {sectorForm.responsaveis?.map((resp, idx) => (
                    <div 
                      key={resp.id || idx} 
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 relative group hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                          {idx === 0 ? 'Supervisor 1 (Principal)' : `Supervisor ${idx + 1}`}
                        </span>
                        {sectorForm.responsaveis && sectorForm.responsaveis.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSupervisorRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Remover responsável"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">
                          Nome do Gestor Responsável *
                        </label>
                        <input
                          type="text"
                          required={idx === 0}
                          value={resp.nome}
                          onChange={(e) => updateSupervisorField(idx, 'nome', e.target.value)}
                          placeholder="Ex: Daniel de Carvalho"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Cargo *</label>
                          <input
                            type="text"
                            required={idx === 0}
                            value={resp.cargo}
                            onChange={(e) => updateSupervisorField(idx, 'cargo', e.target.value)}
                            placeholder="Ex: Supervisor"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700 block">Turno / Atuação</label>
                          <input
                            type="text"
                            value={resp.turno || ''}
                            onChange={(e) => updateSupervisorField(idx, 'turno', e.target.value)}
                            placeholder="Ex: Turno 1 ou Geral"
                            className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 block">E-mail Corporativo</label>
                        <input
                          type="email"
                          value={resp.email || ''}
                          onChange={(e) => updateSupervisorField(idx, 'email', e.target.value)}
                          placeholder="gestor@uniaoavicola.com.br"
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSectorModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Auditor Edit/New */}
      {isAuditorModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingAuditor ? 'Editar Auditor Interno' : 'Cadastrar Novo Auditor'}
              </h3>
              <button onClick={() => setIsAuditorModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditor} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={auditorForm.nome}
                  onChange={(e) => setAuditorForm({ ...auditorForm, nome: e.target.value })}
                  placeholder="Ex: João Paulo Mendes"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Matrícula UAA *</label>
                  <input
                    type="text"
                    required
                    value={auditorForm.matricula}
                    onChange={(e) => setAuditorForm({ ...auditorForm, matricula: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Setor de Origem *</label>
                  <input
                    type="text"
                    required
                    value={auditorForm.setor_origem}
                    onChange={(e) => setAuditorForm({ ...auditorForm, setor_origem: e.target.value })}
                    placeholder="Ex: Qualidade Assegurada"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Cargo / Qualificação 5S *</label>
                <input
                  type="text"
                  required
                  value={auditorForm.cargo}
                  onChange={(e) => setAuditorForm({ ...auditorForm, cargo: e.target.value })}
                  placeholder="Ex: Auditor Líder 5S"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">E-mail Corporativo</label>
                <input
                  type="email"
                  value={auditorForm.email}
                  onChange={(e) => setAuditorForm({ ...auditorForm, email: e.target.value })}
                  placeholder="auditor@uniaoavicola.com.br"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAuditorModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Salvar Auditor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Checklist Question */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900">
                Adicionar Novo Critério ao Checklist 5S
              </h3>
              <button onClick={() => setIsQuestionModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Senso *</label>
                  <select
                    value={questionForm.senso}
                    onChange={(e) => setQuestionForm({ ...questionForm, senso: e.target.value as SensoType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value="seiri">1º Seiri (Utilização)</option>
                    <option value="seiton">2º Seiton (Organização)</option>
                    <option value="seiso">3º Seiso (Limpeza)</option>
                    <option value="seiketsu">4º Seiketsu (Padronização)</option>
                    <option value="shitsuke">5º Shitsuke (Disciplina)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Peso Avaliativo *</label>
                  <select
                    value={questionForm.peso}
                    onChange={(e) => setQuestionForm({ ...questionForm, peso: parseInt(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                  >
                    <option value={1}>Peso 1 (Padrão)</option>
                    <option value={2}>Peso 2 (Importante)</option>
                    <option value={3}>Peso 3 (Crítico / BPF)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Título do Critério *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Identificação de linhas de refrigeração e válvulas"
                  value={questionForm.titulo}
                  onChange={(e) => setQuestionForm({ ...questionForm, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Descrição Detalhada do que Inspecionar *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: Inspecionar etiquetas de identificação de sentido de fluxo de amônia e água gelada..."
                  value={questionForm.descricao_criterio}
                  onChange={(e) => setQuestionForm({ ...questionForm, descricao_criterio: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Padrão Esperado de Excelência *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ex: 100% das tubulações sinalizadas segundo norma ABNT com setas visíveis a 3 metros..."
                  value={questionForm.padrao_esperado}
                  onChange={(e) => setQuestionForm({ ...questionForm, padrao_esperado: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Salvar Pergunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
