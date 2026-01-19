
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPlan, IntervalType } from '../types';
import { PlayIcon, PauseIcon, StopIcon } from './Icons';

interface Props {
  plan: WorkoutPlan;
  onComplete: () => void;
}

const ActiveWorkout: React.FC<Props> = ({ plan, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(plan.intervals[0].duration);
  const [isActive, setIsActive] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  const currentInterval = plan.intervals[currentIndex];
  const nextInterval = plan.intervals[currentIndex + 1];

  const playTone = useCallback((frequency: number, type: 'single' | 'double' = 'single') => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;

    const createSound = (startTime: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Som padrão fixo (estilo sino agradável)
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.5, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    };

    if (type === 'double') {
      createSound(ctx.currentTime, frequency);
      createSound(ctx.currentTime + 0.3, frequency * 1.2);
    } else {
      createSound(ctx.currentTime, frequency);
    }
  }, []);

  const announceChange = useCallback((type: IntervalType) => {
    if (type === IntervalType.RUN) {
      playTone(880, 'double');
    } else if (type === IntervalType.WALK) {
      playTone(440, 'single');
    } else {
      playTone(330, 'single');
    }
  }, [playTone]);

  useEffect(() => {
    let timer: any = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      if (currentIndex < plan.intervals.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTimeLeft(plan.intervals[nextIdx].duration);
        announceChange(plan.intervals[nextIdx].type);
      } else {
        setIsActive(false);
        playTone(1200, 'double');
        onComplete();
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, currentIndex, plan.intervals, onComplete, announceChange, playTone]);

  const toggleTimer = () => {
    if (!isActive && currentIndex === 0 && timeLeft === plan.intervals[0].duration) {
      announceChange(currentInterval.type);
    }
    setIsActive(!isActive);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIndex + 1) / plan.intervals.length) * 100;
  const totalDuration = plan.intervals.reduce((acc, i) => acc + i.duration, 0);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-6 sm:p-10 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-center mb-12">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">{plan.name}</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Seg. {currentIndex + 1} de {plan.intervals.length}</p>
        </div>
        <button onClick={onComplete} className="text-slate-300 p-2 hover:bg-slate-50 rounded-full transition-colors"><StopIcon /></button>
      </div>

      <div className={`w-72 h-72 sm:w-80 sm:h-80 rounded-full border-[16px] flex flex-col items-center justify-center shadow-2xl transition-all duration-500 ${
        currentInterval.type === IntervalType.WALK ? 'border-emerald-500 bg-emerald-50 shadow-emerald-100' : 
        currentInterval.type === IntervalType.RUN ? 'border-orange-500 bg-orange-50 shadow-orange-100' : 'border-slate-300 bg-slate-50'
      }`}>
        <span className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${
          currentInterval.type === IntervalType.WALK ? 'text-emerald-600' : 'text-orange-600'
        }`}>
          {currentInterval.type === IntervalType.WALK ? 'Caminhada' : 'Corrida'}
        </span>
        <span className="text-7xl sm:text-8xl font-black tabular-nums tracking-tighter text-slate-900">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="mt-16 w-full space-y-8 flex-1 flex flex-col justify-center">
        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1">
          <div 
            className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximo</p>
             <p className="font-black text-slate-800 text-sm">
               {nextInterval ? (nextInterval.type === IntervalType.WALK ? 'Caminhada' : 'Corrida') : 'Final!'}
             </p>
           </div>
           <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total</p>
             <p className="font-black text-indigo-900 text-lg">{formatTime(totalDuration)}</p>
           </div>
        </div>
      </div>

      <div className="mt-auto pt-10 pb-6 w-full flex justify-center gap-6">
        <button 
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-90 ${
            isActive ? 'bg-slate-800' : 'bg-indigo-600'
          }`}
        >
          {isActive ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
};

export default ActiveWorkout;
