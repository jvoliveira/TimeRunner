
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { WorkoutPlan, IntervalType, WorkoutSession } from '../types';
import { PlayIcon, PauseIcon, StopIcon } from './Icons';
import { dbService } from '../services/db';

interface Props {
  plan: WorkoutPlan;
  onComplete: () => void;
}

const ActiveWorkout: React.FC<Props> = ({ plan, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(plan.intervals[0].duration);
  const [isActive, setIsActive] = useState(false);
  const [distance, setDistance] = useState(0); 
  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);
  const [gpsStatus, setGpsStatus] = useState<'searching' | 'active' | 'error'>('searching');
  const [showSummary, setShowSummary] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const wakeLockRef = useRef<any>(null);

  const currentInterval = plan.intervals[currentIndex];
  const nextInterval = plan.intervals[currentIndex + 1];

  // Wake Lock com tratamento de erro robusto
  const requestWakeLock = async () => {
    if ('wakeLock' in navigator) {
      try {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn("Wake Lock bloqueado ou indisponível:", err);
      }
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current !== null) {
      wakeLockRef.current.release().then(() => {
        wakeLockRef.current = null;
      }).catch(() => {
        wakeLockRef.current = null;
      });
    }
  };

  // Carrega o arquivo ring.mp3
  useEffect(() => {
    const loadAlertSound = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const response = await fetch('/ring.mp3');
        const arrayBuffer = await response.arrayBuffer();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = decodedBuffer;
      } catch (err) {
        console.error("Erro ao carregar ring.mp3:", err);
      }
    };
    loadAlertSound();
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if ("geolocation" in navigator) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          setGpsStatus('active');
          const newPoint = { lat: position.coords.latitude, lng: position.coords.longitude };
          
          if (isActive) {
            if (lastPositionRef.current) {
              const d = calculateDistance(
                lastPositionRef.current.coords.latitude,
                lastPositionRef.current.coords.longitude,
                newPoint.lat,
                newPoint.lng
              );
              if (d > 0.5 && d < 25) {
                setDistance(prev => prev + d);
                setPath(prev => [...prev, newPoint]);
              }
            } else {
              setPath(prev => prev.length === 0 ? [newPoint] : prev);
            }
          }
          lastPositionRef.current = position;
        },
        (error) => setGpsStatus('error'),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      releaseWakeLock();
    };
  }, [isActive]);

  const saveWorkoutSession = async () => {
    const totalSec = plan.intervals.reduce((a, b) => a + b.duration, 0);
    const pace = distance > 10 ? (totalSec / (distance / 1000)) : 0;
    
    const session: WorkoutSession = {
      id: Date.now().toString(),
      planId: plan.id,
      planName: plan.name,
      duration: totalSec,
      distance: distance,
      date: Date.now(),
      pace: pace,
      path: path
    };

    try {
      await dbService.saveSession(session);
    } catch (err) {
      console.error("Erro ao salvar recorde:", err);
    }
  };

  // Função para tocar o arquivo ring.mp3 carregado
  const playAlert = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const source = ctx.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(ctx.destination);
    source.start(0);
  }, []);

  const announceChange = useCallback(() => {
    playAlert();
  }, [playAlert]);

  useEffect(() => {
    let timer: any = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (isActive && timeLeft === 0) {
      // Tocar som de alerta exatamente no 00:00
      announceChange();

      if (currentIndex < plan.intervals.length - 1) {
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        setTimeLeft(plan.intervals[nextIdx].duration);
      } else {
        setIsActive(false);
        releaseWakeLock();
        saveWorkoutSession();
        setShowSummary(true);
      }
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft, currentIndex, plan.intervals, announceChange]);

  const toggleTimer = () => {
    if (!audioContextRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioCtx();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (!isActive) {
      requestWakeLock();
      
      if (path.length === 0 && lastPositionRef.current) {
        setPath([{
          lat: lastPositionRef.current.coords.latitude,
          lng: lastPositionRef.current.coords.longitude
        }]);
      }
      
      // Feedback sonoro inicial para "despertar" o canal de áudio
      if (currentIndex === 0 && timeLeft === plan.intervals[0].duration) {
        setTimeout(() => playAlert(), 100);
      }
    } else {
      releaseWakeLock();
    }
    setIsActive(!isActive);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDistance = (m: number) => (m / 1000).toFixed(2);
  const progress = ((currentIndex + 1) / plan.intervals.length) * 100;

  if (showSummary) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl shadow-emerald-500/50">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Treino Salvo!</h2>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mb-12">Novo recorde registrado</p>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-12 text-left">
          <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Distância</p>
            <p className="text-3xl font-black text-white">{formatDistance(distance)} <span className="text-sm text-indigo-400">km</span></p>
          </div>
          <div className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700">
            <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">Duração</p>
            <p className="text-3xl font-black text-white">{formatTime(plan.intervals.reduce((a,b) => a + b.duration, 0))}</p>
          </div>
        </div>

        <button 
          onClick={onComplete}
          className="w-full max-w-xs bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col items-center p-6 sm:p-10 animate-in fade-in duration-500">
      <div className="w-full flex justify-between items-start mb-8">
        <div className="flex-1">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic truncate">{plan.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${gpsStatus === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest">
              {gpsStatus === 'active' ? 'GPS ATIVO' : gpsStatus === 'searching' ? 'BUSCANDO GPS...' : 'ERRO NO GPS'}
            </p>
          </div>
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
        <span className="text-7xl sm:text-8xl font-black tabular-nums tracking-tighter text-slate-900 leading-none">
          {formatTime(timeLeft)}
        </span>
      </div>

      <div className="mt-12 w-full space-y-6 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col justify-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Distância</p>
             <p className="font-black text-slate-900 text-3xl tabular-nums">
               {formatDistance(distance)}<span className="text-sm ml-1 text-slate-400">km</span>
             </p>
           </div>
           <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex flex-col justify-center">
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Próximo</p>
             <p className="font-black text-indigo-900 text-lg uppercase truncate">
               {nextInterval ? (nextInterval.type === IntervalType.WALK ? 'Caminhada' : 'Corrida') : 'Final!'}
             </p>
           </div>
        </div>

        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-600 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-auto pt-8 pb-6 w-full flex justify-center gap-6">
        <button 
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-90 ${
            isActive ? 'bg-slate-800' : 'bg-indigo-600 shadow-indigo-200'
          }`}
        >
          {isActive ? <PauseIcon /> : <PlayIcon />}
        </button>
      </div>
    </div>
  );
};

export default ActiveWorkout;
