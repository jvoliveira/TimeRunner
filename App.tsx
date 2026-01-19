
import React, { useState, useEffect } from 'react';
import WorkoutEditor from './components/WorkoutEditor';
import ActiveWorkout from './components/ActiveWorkout';
import SessionDetail from './components/SessionDetail';
import { WorkoutPlan, WorkoutSession } from './types';
import { PlayIcon, TrashIcon } from './components/Icons';
import { dbService } from './services/db';

type View = 'list' | 'create' | 'records';

const App: React.FC = () => {
  const [savedWorkouts, setSavedWorkouts] = useState<WorkoutPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<WorkoutPlan | null>(null);
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null);
  const [view, setView] = useState<View>('list');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const workoutsData = await dbService.getAllWorkouts();
      const sessionsData = await dbService.getAllSessions();
      setSavedWorkouts(workoutsData);
      setSessions(sessionsData);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = async (plan: WorkoutPlan) => {
    try {
      await dbService.addWorkout(plan);
      await loadData();
      setView('list');
    } catch (err) {
      alert("Erro ao salvar treino.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await dbService.deleteWorkout(id);
      await loadData();
    } catch (err) {
      console.error("Erro ao deletar:", err);
    }
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number) => {
    if (!pace || !isFinite(pace)) return "--:--";
    return formatTime(pace);
  };

  const bestDistance = sessions.length > 0 ? Math.max(...sessions.map(s => s.distance)) : 0;
  const bestDuration = sessions.length > 0 ? Math.max(...sessions.map(s => s.duration)) : 0;
  const bestPace = sessions.filter(s => s.pace > 0).length > 0 
    ? Math.min(...sessions.filter(s => s.pace > 0).map(s => s.pace)) 
    : 0;

  if (activeWorkout) {
    return (
      <ActiveWorkout 
        plan={activeWorkout} 
        onComplete={() => {
          setActiveWorkout(null);
          loadData();
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {selectedSession && (
        <SessionDetail 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}

      <header className="px-6 pt-10 pb-6 sticky top-0 bg-slate-50/80 backdrop-blur-md z-10 border-b border-slate-100">
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">
          Time<span className="text-indigo-600">RUNNER</span>
        </h1>
        <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2">Sua jornada, seu ritmo.</p>
      </header>

      <main className="px-6 mt-6">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-slate-300 font-black uppercase text-xs tracking-widest">Carregando Banco Local...</div>
        ) : view === 'list' ? (
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
                        <span>{formatTime(workout.intervals.reduce((a,b) => a + b.duration, 0))}</span>
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
                  <p className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Crie sua rotina acima</p>
                </div>
              )}
            </div>
          </div>
        ) : view === 'create' ? (
          <div className="animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setView('list')} className="w-10 h-10 flex items-center justify-center bg-white rounded-full border border-slate-200 text-slate-400">←</button>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nova Rotina</h2>
            </div>
            <WorkoutEditor onSave={handleAddWorkout} />
          </div>
        ) : (
          <div className="animate-in slide-in-from-bottom duration-500 space-y-8">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight italic">Hall da Fama</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-indigo-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">Maior Distância</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-black italic tracking-tighter">{(bestDistance / 1000).toFixed(2)}</p>
                  <p className="text-lg font-black uppercase opacity-60">km</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Melhor Pace</p>
                   <p className="text-3xl font-black text-slate-900 italic">{formatPace(bestPace)}</p>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">min/km</p>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Maior Tempo</p>
                   <p className="text-3xl font-black text-slate-900 italic">{formatTime(bestDuration)}</p>
                   <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1">Duração</p>
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Atividades Recentes</h3>
                <div className="space-y-3">
                  {sessions.slice(-10).reverse().map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => setSelectedSession(session)}
                      className="bg-white px-5 py-4 rounded-3xl border border-slate-50 shadow-sm flex items-center justify-between active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase truncate max-w-[150px]">{session.planName}</p>
                        <p className="text-[9px] font-bold text-slate-300 uppercase">{new Date(session.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-indigo-600 text-sm">{(session.distance / 1000).toFixed(2)} km</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase">{formatPace(session.pace)} /km</p>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-10 text-slate-300 font-bold text-xs uppercase italic">Sem registros</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex items-center justify-around px-10 pb-2 z-40">
        <button onClick={() => setView('list')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'list' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <div className="w-5 h-5"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Treinos</span>
        </button>
        <button onClick={() => setView('create')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'create' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <div className="w-5 h-5"><svg fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4"/></svg></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Criar</span>
        </button>
        <button onClick={() => setView('records')} className={`flex flex-col items-center gap-1.5 transition-all ${view === 'records' ? 'text-indigo-600 scale-110' : 'text-slate-300'}`}>
          <div className="w-5 h-5"><svg fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div>
          <span className="text-[9px] font-black uppercase tracking-widest">Recordes</span>
        </button>
      </div>
    </div>
  );
};

export default App;
