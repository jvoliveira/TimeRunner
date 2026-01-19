
import { WorkoutPlan, WorkoutSession } from '../types';

const DB_NAME = 'TempoRunnerDB';
const STORE_WORKOUTS = 'workouts';
const STORE_SESSIONS = 'sessions';
const DB_VERSION = 2;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_WORKOUTS)) {
        db.createObjectStore(STORE_WORKOUTS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const dbService = {
  // Planos de Treino
  async getAllWorkouts(): Promise<WorkoutPlan[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_WORKOUTS, 'readonly');
      const store = transaction.objectStore(STORE_WORKOUTS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async addWorkout(plan: WorkoutPlan): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = transaction.objectStore(STORE_WORKOUTS);
      const request = store.add(plan);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async deleteWorkout(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_WORKOUTS, 'readwrite');
      const store = transaction.objectStore(STORE_WORKOUTS);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // Sessões Concluídas (Recordes)
  async saveSession(session: WorkoutSession): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SESSIONS, 'readwrite');
      const store = transaction.objectStore(STORE_SESSIONS);
      const request = store.add(session);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async getAllSessions(): Promise<WorkoutSession[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SESSIONS, 'readonly');
      const store = transaction.objectStore(STORE_SESSIONS);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
};
