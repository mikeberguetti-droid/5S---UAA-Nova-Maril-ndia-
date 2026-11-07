/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getStoredSectors, 
  saveStoredSectors, 
  getStoredAuditors, 
  saveStoredAuditors, 
  getStoredQuestions, 
  saveStoredQuestions, 
  getStoredAudits, 
  saveStoredAudits, 
  getStoredActionPlans, 
  saveStoredActionPlans, 
  getStoredScheduledAudits,
  saveStoredScheduledAudits,
  getStoredActiveUser, 
  saveStoredActiveUser,
  registerNewAudit,
  deleteStoredAudit,
  updateStoredAudit,
  deleteStoredSchedule,
  updateStoredSchedule,
  getStoredPhotos,
  addStoredPhoto,
  deleteStoredPhoto,
  resetAllData
} from './services/storage';
import { Sector, Auditor, ChecklistQuestion, Audit, ActionPlan, ScheduledAudit, SectorPhoto } from './types';
import { loadAllFromFirestore, syncAllToFirestore } from './services/firestoreSync';
import { Header, AppTabType } from './components/Header';
import { Footer } from './components/Footer';
import { DashboardView } from './components/DashboardView';
import { AuditFlowView } from './components/AuditFlowView';
import { ActionPlansView } from './components/ActionPlansView';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { AuditHistoryView } from './components/AuditHistoryView';
import { PhotoGalleryView } from './components/PhotoGalleryView';
import { ManagementView } from './components/ManagementView';
import { ReportModal } from './components/ReportModal';
import { SupabaseModal } from './components/SupabaseModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<AppTabType>('dashboard');

  // App Data States
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [questions, setQuestions] = useState<ChecklistQuestion[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [scheduledAudits, setScheduledAudits] = useState<ScheduledAudit[]>([]);
  const [customPhotos, setCustomPhotos] = useState<SectorPhoto[]>([]);
  const [activeAuditor, setActiveAuditor] = useState<Auditor | null>(null);

  // Modal / Flow States
  const [preselectedSectorId, setPreselectedSectorId] = useState<string | undefined>(undefined);
  const [preselectedSchedule, setPreselectedSchedule] = useState<ScheduledAudit | undefined>(undefined);
  const [selectedAuditForReport, setSelectedAuditForReport] = useState<Audit | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    const loadedSectors = getStoredSectors();
    const loadedAuditors = getStoredAuditors();
    const loadedQuestions = getStoredQuestions();
    const loadedAudits = getStoredAudits();
    const loadedPlans = getStoredActionPlans();
    const loadedSchedules = getStoredScheduledAudits();
    const loadedPhotos = getStoredPhotos();
    const loadedUser = getStoredActiveUser();

    setSectors(loadedSectors);
    setAuditors(loadedAuditors);
    setQuestions(loadedQuestions);
    setAudits(loadedAudits);
    setActionPlans(loadedPlans);
    setScheduledAudits(loadedSchedules);
    setCustomPhotos(loadedPhotos);
    setActiveAuditor(loadedUser || (loadedAuditors.length > 0 ? loadedAuditors[0] : null));

    // Connect & Reconcile with Firestore in Cloud
    loadAllFromFirestore()
      .then(cloudData => {
        if (cloudData && (cloudData.sectors.length > 0 || cloudData.audits.length > 0)) {
          if (cloudData.sectors.length > 0) {
            setSectors(cloudData.sectors);
            saveStoredSectors(cloudData.sectors);
          }
          if (cloudData.auditors.length > 0) {
            setAuditors(cloudData.auditors);
            saveStoredAuditors(cloudData.auditors);
          }
          if (cloudData.audits.length > 0) {
            setAudits(cloudData.audits);
            saveStoredAudits(cloudData.audits);
          }
          if (cloudData.actionPlans.length > 0) {
            setActionPlans(cloudData.actionPlans);
            saveStoredActionPlans(cloudData.actionPlans);
          }
          if (cloudData.scheduledAudits.length > 0) {
            setScheduledAudits(cloudData.scheduledAudits);
            saveStoredScheduledAudits(cloudData.scheduledAudits);
          }
          if (cloudData.photos.length > 0) {
            setCustomPhotos(cloudData.photos);
          }
          console.log('Dados do Programa 5S sincronizados com a nuvem Firestore com sucesso.');
        } else {
          // First time cloud run: Seed initial factory data to Firestore
          syncAllToFirestore({
            sectors: loadedSectors,
            auditors: loadedAuditors,
            audits: loadedAudits,
            actionPlans: loadedPlans,
            scheduledAudits: loadedSchedules,
            photos: loadedPhotos,
            questions: loadedQuestions
          }).then(res => {
            if (res.success) {
              console.log('Carga inicial da fábrica UAA enviada para o Firestore.');
            }
          });
        }
      })
      .catch(err => {
        console.warn('Iniciando em modo offline / cache local:', err);
      });
  }, []);

  // Save Sectors
  const handleSaveSectors = (updated: Sector[]) => {
    setSectors(updated);
    saveStoredSectors(updated);
  };

  // Save Auditors
  const handleSaveAuditors = (updated: Auditor[]) => {
    setAuditors(updated);
    saveStoredAuditors(updated);
    if ((!activeAuditor || !updated.some(a => a.id === activeAuditor.id)) && updated.length > 0) {
      setActiveAuditor(updated[0]);
      saveStoredActiveUser(updated[0]);
    }
  };

  // Save Questions
  const handleSaveQuestions = (updated: ChecklistQuestion[]) => {
    setQuestions(updated);
    saveStoredQuestions(updated);
  };

  // Save Active Auditor
  const handleSelectAuditor = (auditor: Auditor) => {
    setActiveAuditor(auditor);
    saveStoredActiveUser(auditor);
  };

  // Start new audit
  const handleStartAudit = (sectorId?: string) => {
    setPreselectedSectorId(sectorId);
    setPreselectedSchedule(undefined);
    setActiveTab('nova-auditoria');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Execute a scheduled audit from Calendar
  const handleExecuteScheduledAudit = (schedule: ScheduledAudit) => {
    setPreselectedSchedule(schedule);
    setPreselectedSectorId(schedule.setor_id);
    setActiveTab('nova-auditoria');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Finish new audit
  const handleFinishAudit = (newAudit: Audit) => {
    const { audit, generatedPlans, updatedAuditors, updatedSchedules } = registerNewAudit(
      newAudit, 
      questions, 
      sectors, 
      auditors, 
      scheduledAudits
    );

    setAudits(prev => [audit, ...prev]);
    setActionPlans(prev => [...generatedPlans, ...prev]);
    setAuditors(updatedAuditors);
    setScheduledAudits(updatedSchedules);

    // Update active auditor if it was the one who performed
    if (activeAuditor && activeAuditor.id === audit.auditor_id) {
      const refreshed = updatedAuditors.find(a => a.id === audit.auditor_id);
      if (refreshed) setActiveAuditor(refreshed);
    }
    
    // Refresh sectors
    setSectors(getStoredSectors());
  };

  // Edit/Update Audit
  const handleUpdateAudit = (updatedAudit: Audit) => {
    updateStoredAudit(updatedAudit);
    setAudits(prev => prev.map(a => a.id === updatedAudit.id ? updatedAudit : a));
    setSectors(getStoredSectors());
  };

  // Delete Audit
  const handleDeleteAudit = (auditId: string) => {
    deleteStoredAudit(auditId);
    setAudits(prev => prev.filter(a => a.id !== auditId));
    setActionPlans(prev => prev.filter(p => p.auditoria_id !== auditId));
    setSectors(getStoredSectors());
  };

  // Add new schedule entry
  const handleAddSchedule = (newSchedule: ScheduledAudit) => {
    const updated = [newSchedule, ...scheduledAudits];
    setScheduledAudits(updated);
    saveStoredScheduledAudits(updated);
  };

  // Update schedule entry
  const handleUpdateSchedule = (schedule: ScheduledAudit) => {
    updateStoredSchedule(schedule);
    setScheduledAudits(prev => prev.map(s => s.id === schedule.id ? schedule : s));
  };

  // Delete schedule entry
  const handleDeleteSchedule = (scheduleId: string) => {
    deleteStoredSchedule(scheduleId);
    setScheduledAudits(prev => prev.filter(s => s.id !== scheduleId));
  };

  // Photo handlers
  const handleAddCustomPhoto = (photo: SectorPhoto) => {
    addStoredPhoto(photo);
    setCustomPhotos(prev => [photo, ...prev]);
  };

  const handleDeleteCustomPhoto = (photoId: string) => {
    deleteStoredPhoto(photoId);
    setCustomPhotos(prev => prev.filter(p => p.id !== photoId));
  };

  // Update Action Plan
  const handleUpdatePlan = (updatedPlan: ActionPlan) => {
    const updated = actionPlans.map(p => p.id === updatedPlan.id ? updatedPlan : p);
    setActionPlans(updated);
    saveStoredActionPlans(updated);
  };

  // Create Manual Action Plan
  const handleCreatePlan = (newPlan: ActionPlan) => {
    const updated = [newPlan, ...actionPlans];
    setActionPlans(updated);
    saveStoredActionPlans(updated);
  };

  // Delete Action Plan
  const handleDeletePlan = (planId: string) => {
    const updated = actionPlans.filter(p => p.id !== planId);
    setActionPlans(updated);
    saveStoredActionPlans(updated);
  };

  // Reset factory data
  const handleResetData = () => {
    if (confirm('Atenção: Deseja restaurar os dados originais da fábrica UAA Nova Marilândia?')) {
      resetAllData();
      window.location.reload();
    }
  };

  const openActionPlansCount = actionPlans.filter(p => p.status === 'pendente' || p.status === 'em_andamento').length;
  const pendingSchedulesCount = scheduledAudits.filter(s => s.status === 'pendente' || s.status === 'atrasada').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeAuditor={activeAuditor}
        allAuditors={auditors}
        onSelectAuditor={handleSelectAuditor}
        openActionPlansCount={openActionPlansCount}
        pendingSchedulesCount={pendingSchedulesCount}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* TAB 1: Dashboard & Indicadores (Gestão à Vista) */}
        {activeTab === 'dashboard' && (
          <DashboardView
            sectors={sectors}
            audits={audits}
            actionPlans={actionPlans}
            onStartAudit={handleStartAudit}
            onViewAudit={(audit) => setSelectedAuditForReport(audit)}
            onViewActionPlans={() => setActiveTab('planos-acao')}
          />
        )}

        {/* TAB 2: Nova Auditoria (Fluxo com Escala Oficial, Stepper, Voz e 5W2H) */}
        {activeTab === 'nova-auditoria' && (
          <AuditFlowView
            sectors={sectors}
            auditors={auditors}
            questions={questions}
            preselectedSectorId={preselectedSectorId}
            preselectedSchedule={preselectedSchedule}
            activeAuditor={activeAuditor}
            onFinishAudit={handleFinishAudit}
            onCancel={() => setActiveTab('dashboard')}
            onViewReport={(audit) => setSelectedAuditForReport(audit)}
            onGoToCadastros={() => setActiveTab('cadastros')}
          />
        )}

        {/* TAB 3: Planos de Ação (Tabela Oficial UAA) */}
        {activeTab === 'planos-acao' && (
          <ActionPlansView
            actionPlans={actionPlans}
            sectors={sectors}
            onUpdatePlan={handleUpdatePlan}
            onCreatePlan={handleCreatePlan}
            onDeletePlan={handleDeletePlan}
          />
        )}

        {/* TAB 4: Calendário de Auditorias & Ranking de Pontualidade */}
        {activeTab === 'calendario' && (
          <ScheduleCalendarView
            scheduledAudits={scheduledAudits}
            auditors={auditors}
            sectors={sectors}
            onAddSchedule={handleAddSchedule}
            onExecuteSchedule={handleExecuteScheduledAudit}
            onDeleteSchedule={handleDeleteSchedule}
            onUpdateSchedule={handleUpdateSchedule}
          />
        )}

        {/* TAB 5: Auditorias (Listagem com Editar & Apagar) */}
        {activeTab === 'historico' && (
          <AuditHistoryView
            audits={audits}
            sectors={sectors}
            auditors={auditors}
            questions={questions}
            onViewReport={(audit) => setSelectedAuditForReport(audit)}
            onNewAudit={handleStartAudit}
            onUpdateAudit={handleUpdateAudit}
            onDeleteAudit={handleDeleteAudit}
          />
        )}

        {/* TAB 6: Armazenamento e Exposição das Fotos por Setor (Mês a Mês) */}
        {activeTab === 'fotos' && (
          <PhotoGalleryView
            sectors={sectors}
            audits={audits}
            actionPlans={actionPlans}
            customPhotos={customPhotos}
            onAddCustomPhoto={handleAddCustomPhoto}
            onDeleteCustomPhoto={handleDeleteCustomPhoto}
          />
        )}

        {/* TAB 7: Cadastros Gerais */}
        {activeTab === 'cadastros' && (
          <ManagementView
            sectors={sectors}
            auditors={auditors}
            questions={questions}
            onSaveSectors={handleSaveSectors}
            onSaveAuditors={handleSaveAuditors}
            onSaveQuestions={handleSaveQuestions}
            onResetData={handleResetData}
          />
        )}

      </main>

      {/* Institutional Dedicated Footer */}
      <Footer onResetData={handleResetData} />

      {/* Printable Report Modal */}
      {selectedAuditForReport && (
        <ReportModal
          audit={selectedAuditForReport}
          sector={sectors.find(s => s.id === selectedAuditForReport.setor_id)}
          questions={questions}
          onClose={() => setSelectedAuditForReport(null)}
        />
      )}

      {/* Supabase Connection & Sincronizar Agora Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        sectors={sectors}
        auditors={auditors}
        questions={questions}
        audits={audits}
        actionPlans={actionPlans}
        scheduledAudits={scheduledAudits}
        photos={customPhotos}
      />
    </div>
  );
}
