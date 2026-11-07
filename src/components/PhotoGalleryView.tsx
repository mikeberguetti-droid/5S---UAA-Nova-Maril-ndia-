import React, { useState, useMemo } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Building2, 
  Calendar, 
  Filter, 
  Plus, 
  Trash2, 
  Maximize2, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Eye, 
  X,
  User,
  Tag,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Sector, Audit, ActionPlan, SensoType, SectorPhoto } from '../types';
import { SENSOS_CONFIG } from '../data/initialData';
import { getCicloAuditoria } from '../services/storage';

interface PhotoGalleryViewProps {
  sectors: Sector[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  customPhotos: SectorPhoto[];
  onAddCustomPhoto: (photo: SectorPhoto) => void;
  onDeleteCustomPhoto: (photoId: string) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  sectors,
  audits,
  actionPlans,
  customPhotos,
  onAddCustomPhoto,
  onDeleteCustomPhoto
}) => {
  const [selectedSectorId, setSelectedSectorId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedSenso, setSelectedSenso] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<SectorPhoto | null>(null);

  // New photo form state
  const [newPhotoForm, setNewPhotoForm] = useState<{
    setor_id: string;
    mes: string;
    ciclo: string;
    data: string;
    foto_url: string;
    titulo: string;
    descricao: string;
    senso: SensoType;
    tipo: 'evidencia_auditoria' | 'plano_antes' | 'plano_depois' | 'registro_setor';
    supervisor_nome?: string;
  }>({
    setor_id: sectors.length > 0 ? sectors[0].id : '',
    mes: 'Novembro/2026',
    ciclo: '2026/11',
    data: new Date().toISOString().split('T')[0],
    foto_url: '',
    titulo: '',
    descricao: '',
    senso: 'seiso',
    tipo: 'evidencia_auditoria',
    supervisor_nome: ''
  });

  // Aggregate all photos from:
  // 1. Audit criterion answers (respostas com foto_url)
  // 2. Action plans (foto_antes e foto_depois)
  // 3. Custom uploaded photos
  const allPhotos = useMemo<SectorPhoto[]>(() => {
    const list: SectorPhoto[] = [];

    // 1. From Audits
    audits.forEach(audit => {
      const auditCiclo = audit.ciclo || getCicloAuditoria(audit.data);
      const auditDate = new Date(audit.data + 'T00:00:00');
      const monthName = auditDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      audit.respostas.forEach(resp => {
        if (resp.foto_url && resp.foto_url.trim()) {
          list.push({
            id: `audit-photo-${audit.id}-${resp.pergunta_id}`,
            setor_id: audit.setor_id,
            setor_nome: audit.setor_nome,
            mes: capitalizedMonth,
            ciclo: auditCiclo,
            data: audit.data,
            foto_url: resp.foto_url,
            titulo: resp.fato || `Apontamento em ${SENSOS_CONFIG[resp.senso].nomePortugues}`,
            descricao: resp.descricao || `Foto registrada durante auditoria ${audit.codigo}.`,
            senso: resp.senso,
            tipo: 'evidencia_auditoria',
            auditoria_id: audit.id,
            auditoria_codigo: audit.codigo,
            auditor_nome: audit.auditor_nome,
            supervisor_nome: resp.supervisor_responsavel
          });
        }
      });
    });

    // 2. From Action Plans
    actionPlans.forEach(plan => {
      const planCiclo = plan.ciclo || '2026/11';
      if (plan.foto_antes && plan.foto_antes.trim()) {
        list.push({
          id: `plan-antes-${plan.id}`,
          setor_id: plan.setor_id,
          setor_nome: plan.setor_nome,
          mes: plan.mes || 'Novembro/2026',
          ciclo: planCiclo,
          data: plan.data_criacao,
          foto_url: plan.foto_antes,
          titulo: `Fato: ${plan.fato.slice(0, 50)}`,
          descricao: `Evidência Inicial (Antes) - Plano de Ação 5W2H: ${plan.acao}`,
          senso: plan.senso,
          tipo: 'plano_antes',
          auditoria_id: plan.auditoria_id,
          auditoria_codigo: plan.auditoria_codigo,
          supervisor_nome: plan.responsavel
        });
      }

      if (plan.foto_depois && plan.foto_depois.trim()) {
        list.push({
          id: `plan-depois-${plan.id}`,
          setor_id: plan.setor_id,
          setor_nome: plan.setor_nome,
          mes: plan.mes || 'Novembro/2026',
          ciclo: planCiclo,
          data: plan.data_conclusao || plan.data_prazo,
          foto_url: plan.foto_depois,
          titulo: `Melhoria Concluída: ${plan.fato.slice(0, 50)}`,
          descricao: `Evidência Resolvida (Depois) - Validação da Ação Corretiva.`,
          senso: plan.senso,
          tipo: 'plano_depois',
          auditoria_id: plan.auditoria_id,
          auditoria_codigo: plan.auditoria_codigo,
          supervisor_nome: plan.responsavel
        });
      }
    });

    // 3. Custom standalone photos
    list.push(...customPhotos);

    return list.sort((a, b) => b.data.localeCompare(a.data));
  }, [audits, actionPlans, customPhotos]);

  // Unique months available in photos
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    allPhotos.forEach(p => {
      if (p.mes) set.add(p.mes);
    });
    // Add current month if empty
    if (set.size === 0) set.add('Novembro/2026');
    return Array.from(set);
  }, [allPhotos]);

  // Photo counts per sector
  const photoCountsBySector = useMemo(() => {
    const map: Record<string, number> = {};
    allPhotos.forEach(p => {
      map[p.setor_id] = (map[p.setor_id] || 0) + 1;
    });
    return map;
  }, [allPhotos]);

  // Filtered photos based on user selections
  const filteredPhotos = useMemo(() => {
    return allPhotos.filter(p => {
      if (selectedSectorId !== 'all' && p.setor_id !== selectedSectorId) return false;
      if (selectedMonth !== 'all' && p.mes !== selectedMonth) return false;
      if (selectedSenso !== 'all' && p.senso !== selectedSenso) return false;
      if (selectedType !== 'all' && p.tipo !== selectedType) return false;
      return true;
    });
  }, [allPhotos, selectedSectorId, selectedMonth, selectedSenso, selectedType]);

  // Handle local image upload via file input
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setNewPhotoForm(prev => ({
          ...prev,
          foto_url: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveNewPhotoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhotoForm.foto_url) {
      alert('Por favor, anexe uma foto ou imagem.');
      return;
    }
    const sec = sectors.find(s => s.id === newPhotoForm.setor_id);
    const newEntry: SectorPhoto = {
      id: `photo-${Date.now()}`,
      setor_id: newPhotoForm.setor_id,
      setor_nome: sec ? sec.nome : 'Setor Não Informado',
      mes: newPhotoForm.mes,
      ciclo: newPhotoForm.ciclo || getCicloAuditoria(newPhotoForm.data),
      data: newPhotoForm.data,
      foto_url: newPhotoForm.foto_url,
      titulo: newPhotoForm.titulo || 'Registro Fotográfico 5S',
      descricao: newPhotoForm.descricao || 'Foto armazenada no mural setorial.',
      senso: newPhotoForm.senso,
      tipo: newPhotoForm.tipo,
      supervisor_nome: newPhotoForm.supervisor_nome || sec?.responsavel_nome
    };

    onAddCustomPhoto(newEntry);
    setIsUploadModalOpen(false);
    // Reset form
    setNewPhotoForm({
      setor_id: sectors.length > 0 ? sectors[0].id : '',
      mes: 'Novembro/2026',
      ciclo: '2026/11',
      data: new Date().toISOString().split('T')[0],
      foto_url: '',
      titulo: '',
      descricao: '',
      senso: 'seiso',
      tipo: 'registro_setor',
      supervisor_nome: ''
    });
  };

  const getTipoBadge = (tipo: SectorPhoto['tipo']) => {
    switch (tipo) {
      case 'evidencia_auditoria':
        return { label: 'Evidência 5S', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'plano_antes':
        return { label: 'Antes (Desvio)', bg: 'bg-rose-100 text-rose-800 border-rose-300' };
      case 'plano_depois':
        return { label: 'Depois (Resolvido)', bg: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return { label: 'Registro do Setor', bg: 'bg-slate-100 text-slate-800 border-slate-300' };
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24">

      {/* Main Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Mural & Gestão Visual
            </span>
            <span className="text-xs text-slate-400">Banco de Evidências Fotográficas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
            Galeria & Armazenamento de Fotos por Setor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Exposição completa de fotos de vistorias, registros dos 5 Sensos e validações do "Antes & Depois" organizadas setor a setor com filtros mensais.
          </p>
        </div>

        <button
          onClick={() => {
            if (sectors.length === 0) {
              alert('Cadastre ao menos um setor antes de adicionar fotos.');
              return;
            }
            setNewPhotoForm(prev => ({
              ...prev,
              setor_id: selectedSectorId !== 'all' ? selectedSectorId : sectors[0].id
            }));
            setIsUploadModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Camera className="w-4 h-4" />
          <span>+ Adicionar Foto / Evidência</span>
        </button>
      </div>

      {/* 1. SELEÇÃO DE SETOR (Separadas por Setor) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span>1. Selecione o Setor Industrial</span>
          </label>
          <span className="text-[11px] text-slate-400 font-medium">
            Total de {allPhotos.length} foto(s) catalogada(s)
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => setSelectedSectorId('all')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              selectedSectorId === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Layers className="w-4 h-4 opacity-75" />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                selectedSectorId === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {allPhotos.length}
              </span>
            </div>
            <p className="font-extrabold text-xs leading-tight">Todos os Setores</p>
            <span className="text-[10px] opacity-70 block mt-0.5">Visão Geral</span>
          </button>

          {sectors.map(sec => {
            const count = photoCountsBySector[sec.id] || 0;
            const isSelected = selectedSectorId === sec.id;

            return (
              <button
                key={sec.id}
                onClick={() => setSelectedSectorId(sec.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm scale-102'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Building2 className="w-4 h-4 opacity-75" />
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </div>
                <p className="font-extrabold text-xs leading-tight truncate" title={sec.nome}>
                  {sec.nome}
                </p>
                <span className="text-[10px] opacity-75 block truncate mt-0.5">
                  {sec.area}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. FILTRO MÊS A MÊS E CRITÉRIOS SECUNDÁRIOS */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>2. Filtro Mês a Mês (Ciclo de Auditorias)</span>
          </label>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
            Ciclo Atual: 2026/11
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Mês a Mês */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setSelectedMonth('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedMonth === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos os Meses
            </button>

            {availableMonths.map(mes => (
              <button
                key={mes}
                onClick={() => setSelectedMonth(mes)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedMonth === mes
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {mes}
              </button>
            ))}
          </div>

          <div className="hidden sm:block h-5 w-px bg-slate-200" />

          {/* Senso Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSenso}
              onChange={(e) => setSelectedSenso(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os 5 Sensos</option>
              <option value="seiri">1. Seiri (Utilização)</option>
              <option value="seiton">2. Seiton (Organização)</option>
              <option value="seiso">3. Seiso (Limpeza)</option>
              <option value="seiketsu">4. Seiketsu (Padronização)</option>
              <option value="shitsuke">5. Shitsuke (Disciplina)</option>
            </select>
          </div>

          {/* Tipo Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Tipos de Evidência</option>
              <option value="evidencia_auditoria">Evidências de Auditoria 5S</option>
              <option value="plano_antes">Planos de Ação (Antes)</option>
              <option value="plano_depois">Planos de Ação (Depois / Concluído)</option>
              <option value="registro_setor">Registros Fotográficos Avulsos</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. GALERIA DE FOTOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">
            Exibindo <strong>{filteredPhotos.length}</strong> foto(s) encontrada(s)
            {selectedSectorId !== 'all' && (
              <> no setor <strong className="text-emerald-700">{sectors.find(s => s.id === selectedSectorId)?.nome}</strong></>
            )}
            {selectedMonth !== 'all' && (
              <> no mês <strong className="text-emerald-700">{selectedMonth}</strong></>
            )}
          </span>

          {(selectedSectorId !== 'all' || selectedMonth !== 'all' || selectedSenso !== 'all' || selectedType !== 'all') && (
            <button
              onClick={() => {
                setSelectedSectorId('all');
                setSelectedMonth('all');
                setSelectedSenso('all');
                setSelectedType('all');
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300 space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="font-extrabold text-base text-slate-800">
              Nenhuma foto cadastrada para os filtros selecionados
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Ao realizar auditorias, registrar inconformidades no plano de ação 5W2H ou adicionar fotos manuais ao setor, as imagens ficarão catalogadas aqui.
            </p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-2 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              <span>Adicionar Primeira Foto do Setor</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPhotos.map((photo) => {
              const tipoBadge = getTipoBadge(photo.tipo);
              const sensoCfg = photo.senso ? SENSOS_CONFIG[photo.senso] : null;

              return (
                <div
                  key={photo.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between group"
                >
                  {/* Image container */}
                  <div className="relative aspect-video sm:aspect-4/3 bg-slate-950 overflow-hidden">
                    <img
                      src={photo.foto_url}
                      alt={photo.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => setPreviewPhoto(photo)}
                    />

                    {/* Top Badges */}
                    <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm backdrop-blur-xs ${tipoBadge.bg}`}>
                        {tipoBadge.label}
                      </span>
                      {sensoCfg && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white border border-white/20">
                          {sensoCfg.nomePortugues}
                        </span>
                      )}
                    </div>

                    {/* Bottom overlay with quick view */}
                    <button
                      onClick={() => setPreviewPhoto(photo)}
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-xs transition-colors cursor-pointer"
                      title="Ver em tamanho real"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                        <span className="flex items-center gap-1 font-bold text-slate-800">
                          <Building2 className="w-3 h-3 text-emerald-600" />
                          {photo.setor_nome}
                        </span>
                        <span className="bg-slate-100 px-1.5 py-0.2 rounded font-semibold text-slate-700">
                          {photo.mes}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-xs text-slate-900 leading-snug line-clamp-2">
                        {photo.titulo}
                      </h4>

                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {photo.descricao}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(photo.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>

                      {/* Delete button if standalone photo */}
                      {photo.id.startsWith('photo-') ? (
                        <button
                          onClick={() => {
                            if (confirm('Deseja excluir esta foto armazenada?')) {
                              onDeleteCustomPhoto(photo.id);
                            }
                          }}
                          className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Excluir foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="font-mono text-[9px] text-slate-400">
                          {photo.auditoria_codigo || '5S UAA'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: ADICIONAR NOVA FOTO AO SETOR */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" />
                <span>Armazenar Nova Evidência Fotográfica</span>
              </h3>
              <button 
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPhotoSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Setor Industrial *</label>
                  <select
                    value={newPhotoForm.setor_id}
                    onChange={(e) => setNewPhotoForm({ ...newPhotoForm, setor_id: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    {sectors.map(s => (
                      <option key={s.id} value={s.id}>{s.nome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Mês de Referência *</label>
                  <input
                    type="text"
                    required
                    value={newPhotoForm.mes}
                    onChange={(e) => setNewPhotoForm({ ...newPhotoForm, mes: e.target.value })}
                    placeholder="Ex: Novembro/2026"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Senso Correspondente *</label>
                  <select
                    value={newPhotoForm.senso}
                    onChange={(e) => setNewPhotoForm({ ...newPhotoForm, senso: e.target.value as SensoType })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="seiri">1. Seiri (Utilização)</option>
                    <option value="seiton">2. Seiton (Organização)</option>
                    <option value="seiso">3. Seiso (Limpeza)</option>
                    <option value="seiketsu">4. Seiketsu (Padronização)</option>
                    <option value="shitsuke">5. Shitsuke (Disciplina)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Tipo de Registro</label>
                  <select
                    value={newPhotoForm.tipo}
                    onChange={(e) => setNewPhotoForm({ ...newPhotoForm, tipo: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="evidencia_auditoria">Evidência de Auditoria</option>
                    <option value="plano_antes">Evidência Antes (Desvio)</option>
                    <option value="plano_depois">Evidência Depois (Melhoria)</option>
                    <option value="registro_setor">Registro Fotográfico Geral</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Título do Registro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Organização do painel de ferramentas da esteira"
                  value={newPhotoForm.titulo}
                  onChange={(e) => setNewPhotoForm({ ...newPhotoForm, titulo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  placeholder="Explique o que a imagem retrata, conformidade ou oportunidade de melhoria..."
                  value={newPhotoForm.descricao}
                  onChange={(e) => setNewPhotoForm({ ...newPhotoForm, descricao: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Photo Input / Upload */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Carregar Foto / Imagem *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
              </div>

              {/* Preview if uploaded */}
              {newPhotoForm.foto_url && (
                <div className="rounded-xl overflow-hidden border border-slate-300 max-h-48 bg-slate-900">
                  <img src={newPhotoForm.foto_url} alt="Preview" className="w-full h-48 object-contain" />
                </div>
              )}

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer shadow-sm"
                >
                  Salvar Foto no Mural
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIGHTBOX: FULLSCREEN PHOTO PREVIEW */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[95vh] animate-scaleUp">
            
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                  {previewPhoto.setor_nome} • {previewPhoto.mes}
                </span>
                <h3 className="font-extrabold text-base text-white mt-1">
                  {previewPhoto.titulo}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewPhoto.foto_url}
                  download={`5S-evidencia-${previewPhoto.setor_nome.replace(/\s+/g, '_')}-${previewPhoto.data}.jpg`}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                  title="Baixar Foto"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  onClick={() => setPreviewPhoto(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Photo area */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-black/60">
              <img
                src={previewPhoto.foto_url}
                alt={previewPhoto.titulo}
                className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Details Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 text-xs text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-slate-300 max-w-xl">
                {previewPhoto.descricao}
              </p>

              <div className="flex items-center gap-4 text-slate-400 shrink-0 font-mono text-[11px]">
                {previewPhoto.senso && (
                  <span>Senso: <strong className="text-emerald-400">{SENSOS_CONFIG[previewPhoto.senso].nomePortugues}</strong></span>
                )}
                <span>Data: <strong className="text-white">{new Date(previewPhoto.data + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
