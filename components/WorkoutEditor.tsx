
import React, { useState } from 'react';
import { WorkoutInterval, IntervalType, WorkoutPlan } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface Props {
  onSave: (plan: WorkoutPlan) => void;
}

const WorkoutEditor: React.FC<Props> = ({ onSave }) => {
  const [name, setName] = useState('');
  const [intervals, setIntervals] = useState<WorkoutInterval[]>([]);

  const addInterval = (type: IntervalType) => {
    setIntervals([
      ...intervals,
      { id: Math.random().toString(36).substr(2, 9), type, duration: 60 }
    ]);
  };

  const removeInterval = (id: string) => {
    setIntervals(intervals.filter(i => i.id !== id));
  };

  const updateDuration = (id: string, delta: number) => {
    setIntervals(intervals.map(i => {
      if (i.id === id) {
        return { ...i, duration: Math.max(5, i.duration + delta) };
      }
      return i;
    }));
  };

  const handleSave = () => {
    if (intervals.length === 0 || !name.trim()) return;
    onSave({ 
      id: Date.now().toString(), 
      name: name.trim(), 
      intervals
    });
    setIntervals([]);
    setName('');
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="space-y-4">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Treino</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Corrida 5km"
            className="w-full bg-white border border-slate-200 px-4 py-3 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow mt-1 font-bold"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => addInterval(IntervalType.WALK)} className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-emerald-100 shadow-sm active:scale-95 transition-all">
            <PlusIcon /> Caminhada
          </button>
          <button onClick={() => addInterval(IntervalType.RUN)} className="flex items-center justify-center gap-2 bg-orange-50 text-orange-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border border-orange-100 shadow-sm active:scale-95 transition-all">
            <PlusIcon /> Corrida
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-[45vh] overflow-y-auto no-scrollbar pb-4 border-t border-slate-100 pt-4">
        {intervals.map((interval, idx) => (
          <div key={interval.id} className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-50">
            <div className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${
                interval.type === IntervalType.WALK ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {idx + 1}
              </div>
              <div>
                <p className="font-black text-slate-800 text-xs uppercase">{interval.type === IntervalType.WALK ? 'Caminhada' : 'Corrida'}</p>
                <p className="text-[10px] text-slate-400 font-bold">{formatTime(interval.duration)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-50 rounded-xl p-1">
                <button onClick={() => updateDuration(interval.id, -15)} className="w-8 h-8 flex items-center justify-center text-slate-500 font-black">-</button>
                <span className="w-10 text-center font-black text-[9px] text-slate-400">15s</span>
                <button onClick={() => updateDuration(interval.id, 15)} className="w-8 h-8 flex items-center justify-center text-slate-500 font-black">+</button>
              </div>
              <button onClick={() => removeInterval(interval.id)} className="text-red-300 p-2 hover:text-red-500">
                <TrashIcon />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={handleSave}
        disabled={intervals.length === 0 || !name.trim()}
        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-xl shadow-slate-200 disabled:opacity-30 disabled:grayscale transition-all active:scale-[0.98] uppercase text-xs tracking-[0.2em]"
      >
        Salvar
      </button>
    </div>
  );
};

export default WorkoutEditor;
