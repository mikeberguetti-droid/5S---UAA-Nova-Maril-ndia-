import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  Sector, 
  Auditor, 
  ChecklistQuestion, 
  Audit, 
  ActionPlan, 
  ScheduledAudit, 
  SectorPhoto 
} from '../types';

export const COLLECTIONS = {
  SECTORS: 'sectors',
  AUDITORS: 'auditors',
  AUDITS: 'audits',
  ACTION_PLANS: 'actionPlans',
  SCHEDULED_AUDITS: 'scheduledAudits',
  SECTOR_PHOTOS: 'sectorPhotos',
  QUESTIONS: 'checklistQuestions'
};

/**
 * Fetch all items from a collection
 */
export async function fetchCollection<T>(collectionName: string): Promise<T[]> {
  try {
    const colRef = collection(db, collectionName);
    const snapshot = await getDocs(colRef);
    const items: T[] = [];
    snapshot.forEach((docSnap) => {
      items.push(docSnap.data() as T);
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionName);
    return [];
  }
}

/**
 * Save a single document to Firestore
 */
export async function saveDocToFirestore<T extends { id: string }>(collectionName: string, item: T): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, item.id);
    await setDoc(docRef, item, { merge: true });
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${collectionName}/${item.id}`);
    return false;
  }
}

/**
 * Delete a document from Firestore
 */
export async function deleteDocFromFirestore(collectionName: string, id: string): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    return false;
  }
}

/**
 * Batch upload/sync local data to Firestore
 */
export async function syncAllToFirestore(data: {
  sectors: Sector[];
  auditors: Auditor[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  scheduledAudits: ScheduledAudit[];
  photos: SectorPhoto[];
  questions: ChecklistQuestion[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let totalCount = 0;
    
    // Save sectors
    for (const s of data.sectors) {
      await setDoc(doc(db, COLLECTIONS.SECTORS, s.id), s, { merge: true });
      totalCount++;
    }

    // Save auditors
    for (const a of data.auditors) {
      await setDoc(doc(db, COLLECTIONS.AUDITORS, a.id), a, { merge: true });
      totalCount++;
    }

    // Save audits
    for (const aud of data.audits) {
      await setDoc(doc(db, COLLECTIONS.AUDITS, aud.id), aud, { merge: true });
      totalCount++;
    }

    // Save action plans
    for (const p of data.actionPlans) {
      await setDoc(doc(db, COLLECTIONS.ACTION_PLANS, p.id), p, { merge: true });
      totalCount++;
    }

    // Save schedules
    for (const sch of data.scheduledAudits) {
      await setDoc(doc(db, COLLECTIONS.SCHEDULED_AUDITS, sch.id), sch, { merge: true });
      totalCount++;
    }

    // Save photos
    for (const ph of data.photos) {
      await setDoc(doc(db, COLLECTIONS.SECTOR_PHOTOS, ph.id), ph, { merge: true });
      totalCount++;
    }

    // Save questions
    for (const q of data.questions) {
      await setDoc(doc(db, COLLECTIONS.QUESTIONS, q.id), q, { merge: true });
      totalCount++;
    }

    return { success: true, count: totalCount };
  } catch (err: any) {
    console.error('Erro na sincronização em lote com Firestore:', err);
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

/**
 * Load all application data from Firestore
 */
export async function loadAllFromFirestore(): Promise<{
  sectors: Sector[];
  auditors: Auditor[];
  audits: Audit[];
  actionPlans: ActionPlan[];
  scheduledAudits: ScheduledAudit[];
  photos: SectorPhoto[];
  questions: ChecklistQuestion[];
} | null> {
  try {
    const [sectors, auditors, audits, actionPlans, scheduledAudits, photos, questions] = await Promise.all([
      fetchCollection<Sector>(COLLECTIONS.SECTORS),
      fetchCollection<Auditor>(COLLECTIONS.AUDITORS),
      fetchCollection<Audit>(COLLECTIONS.AUDITS),
      fetchCollection<ActionPlan>(COLLECTIONS.ACTION_PLANS),
      fetchCollection<ScheduledAudit>(COLLECTIONS.SCHEDULED_AUDITS),
      fetchCollection<SectorPhoto>(COLLECTIONS.SECTOR_PHOTOS),
      fetchCollection<ChecklistQuestion>(COLLECTIONS.QUESTIONS),
    ]);

    // If at least one collection has documents, return data
    if (
      sectors.length > 0 || 
      audits.length > 0 || 
      auditors.length > 0 || 
      actionPlans.length > 0 || 
      scheduledAudits.length > 0 || 
      photos.length > 0
    ) {
      return {
        sectors,
        auditors,
        audits,
        actionPlans,
        scheduledAudits,
        photos,
        questions
      };
    }
    return null;
  } catch (error) {
    console.warn('Não foi possível carregar do Firestore (utilizando dados locais):', error);
    return null;
  }
}
