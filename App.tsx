
import React, { useState, useEffect } from 'react';
import WorkoutEditor from './components/WorkoutEditor';
import ActiveWorkout from './components/ActiveWorkout';
import { WorkoutPlan } from './types';
import { PlayIcon, TrashIcon } from './components/Icons';
import { dbService } from './services/db';

const App: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<WorkoutPlan[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const data = await dbService.getAll();
      setSavedWorkouts(data);
    } catch (err) {
      console.error("Erro ao carregar treinos:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (plan: WorkoutPlan) => {
    try {
      await dbService.add(plan);
      await loadWorkouts();
      setView('list');
    } catch (err) {
      alert("Erro ao salvar treino.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbService.delete(id);
      await loadWorkouts();
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const formatTotalTime = (plan: WorkoutPlan) => {
    const total = plan.intervals.reduce((acc, i) => acc + i.duration, 0);
    const m = Math.floor(total / 60);
    const s = total % 60;
    return s > 0 ? `${m}m ${s}s` : `${m} min`;
  };

  if (activeWorkout) {
    return (
      <ActiveWorkout 
        plan={activeWorkout} 
        onComplete={() => setActiveWorkout(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      <header className="px-6 pt-10 pb-6 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-100">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
          Time<span className="text-indigo-600">RUNNER</span>
        </h1>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Alternador de corrida!</p>
      </header>

      <main className="px-6 mt-6">
        {view === 'list' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Meus Treinos</h2>
              <button 
                onClick={() => setView('create')}
                className="bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-full shadow-lg shadow-indigo-100 active:scale-95 transition-all"
              >
                + Novo
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase text-xs tracking-widest">Carregando...</div>
            ) : (
              <div className="grid gap-4">
                {savedWorkouts.length > 0 ? (
                  savedWorkouts.map(workout => (
                    <div 
                      key={workout.id}
                      onClick={() => setActiveWorkout(workout)}
                      className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <div className="pl-2">
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{workout.name}</h3>
                        <div className="flex gap-2 items-center text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                          <span>{workout.intervals.length} seg.</span>
                          <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                          <span>{formatTotalTime(workout)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => handleDelete(workout.id, e)}
                          className="text-slate-200 p-2 hover:text-red-400 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                        <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                          <PlayIcon />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center flex flex-col items-center justify-center gap-4 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                      <PlayIcon />
                    </div>
                    <div>
                      <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Nenhum treino salvo</p>
                      <p className="text-xs text-slate-300 font-bold mt-1">Crie sua primeira rotina acima</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4 mb-6">
              <button 
                onClick={() => setView('list')}
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-slate-400"
              >
                ←
              </button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Rotina</h2>
            </div>
            <WorkoutEditor onSave={handleAddWorkout} />
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-10 pb-2">
        <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'list' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <div className="w-5 h-5"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Treinos</span>
        </button>
        <button onClick={() => setView('create')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'create' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <div className="w-5 h-5"><svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Criar</span>
        </button>
      </div>
    </div>
  );
};

export default App;
