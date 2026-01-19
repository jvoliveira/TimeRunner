import React, { useEffect, useRef } from 'react';
import { WorkoutSession } from '../types';

interface Props {
  session: WorkoutSession;
  onClose: () => void;
}

const SessionDetail: React.FC<Props> = ({ session, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number) => {
    if (!pace || !isFinite(pace)) return "--:--";
    return formatTime(pace);
  };

  const drawRoute = (ctx: CanvasRenderingContext2D, width: number, height: number, path: {lat: number, lng: number}[]) => {
    // Limpar o canvas e desenhar fundo
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#f1f5f9'; // slate-100
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 24);
    ctx.fill();

    if (!path || path.length === 0) {
      ctx.fillStyle = '#94a3b8';
      ctx.font = '800 12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('SEM TRAJETO REGISTRADO', width / 2, height / 2);
      return;
    }

    // Achar limites geográficos
    const lats = path.map(p => p.lat);
    const lngs = path.map(p => p.lng);
    let minLat = Math.min(...lats);
    let maxLat = Math.max(...lats);
    let minLng = Math.min(...lngs);
    let maxLng = Math.max(...lngs);

    const padding = 60;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;

    // Função de projeção básica (centraliza se não houver movimento)
    const getX = (lng: number) => {
      if (lngDiff === 0) return width / 2;
      return padding + ((lng - minLng) / lngDiff) * innerWidth;
    };
    
    const getY = (lat: number) => {
      if (latDiff === 0) return height / 2;
      return height - (padding + ((lat - minLat) / latDiff) * innerHeight);
    };

    // Se tiver apenas 1 ponto, desenha apenas um marcador grande
    if (path.length === 1) {
      const x = getX(path[0].lng);
      const y = getY(path[0].lat);
      ctx.fillStyle = '#6366f1';
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.stroke();
      return;
    }

    // Desenhar Sombra do Percurso
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.1)';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    path.forEach((p, i) => {
      const x = getX(p.lng);
      const y = getY(p.lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Desenhar Linha Principal
    ctx.beginPath();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    path.forEach((p, i) => {
      const x = getX(p.lng);
      const y = getY(p.lat);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Marcadores Início e Fim
    const startX = getX(path[0].lng);
    const startY = getY(path[0].lat);
    const endX = getX(path[path.length - 1].lng);
    const endY = getY(path[path.length - 1].lat);

    // Início (Verde)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(startX, startY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fim (Vermelho)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(endX, endY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.stroke();
  };

  useEffect(() => {
    // Garantir que o canvas existe e tem dimensões antes de desenhar
    const handle = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const dpr = window.devicePixelRatio || 1;
          const rect = canvas.getBoundingClientRect();
          
          // Ajustar para High DPI
          canvas.width = rect.width * dpr;
          canvas.height = rect.height * dpr;
          ctx.scale(dpr, dpr);
          
          drawRoute(ctx, rect.width, rect.height, session.path);
        }
      }
    });
    return () => cancelAnimationFrame(handle);
  }, [session]);

  const handleShare = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h = 1350;
    canvas.width = w;
    canvas.height = h;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 60px Inter';
    ctx.fillText('TimeRUNNER', 80, 120);
    ctx.fillStyle = '#6366f1';
    ctx.fillText('RUNNER', 255, 120);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '700 30px Inter';
    ctx.fillText(new Date(session.date).toLocaleDateString().toUpperCase(), 80, 170);

    const mapW = 920;
    const mapH = 750;
    const mapX = 80;
    const mapY = 250;

    ctx.save();
    ctx.translate(mapX, mapY);
    
    // Fundo do mapa no card de share
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.beginPath();
    ctx.roundRect(0, 0, mapW, mapH, 60);
    ctx.fill();

    const path = session.path;
    if (path.length > 0) {
      const lats = path.map(p => p.lat);
      const lngs = path.map(p => p.lng);
      let minLat = Math.min(...lats);
      let maxLat = Math.max(...lats);
      let minLng = Math.min(...lngs);
      let maxLng = Math.max(...lngs);

      const p = 120;
      const iW = mapW - p * 2;
      const iH = mapH - p * 2;
      const lD = maxLat - minLat;
      const gD = maxLng - minLng;

      const gX = (lng: number) => gD === 0 ? mapW/2 : p + ((lng - minLng) / gD) * iW;
      const gY = (lat: number) => lD === 0 ? mapH/2 : mapH - (p + ((lat - minLat) / lD) * iH);

      if (path.length >= 2) {
        ctx.beginPath();
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 18;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        path.forEach((pt, i) => {
          const x = gX(pt.lng);
          const y = gY(pt.lat);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();
      }

      // Marcadores Share
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(gX(path[0].lng), gY(path[0].lat), 18, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    const drawStat = (label: string, value: string, unit: string, x: number, y: number) => {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '900 30px Inter';
      ctx.fillText(label.toUpperCase(), x, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 100px Inter';
      ctx.fillText(value, x, y + 100);
      const valW = ctx.measureText(value).width;
      ctx.fillStyle = '#6366f1';
      ctx.font = '900 40px Inter';
      ctx.fillText(unit, x + valW + 15, y + 100);
    };

    drawStat('Distância', (session.distance / 1000).toFixed(2), 'KM', 80, 1080);
    drawStat('Pace', formatPace(session.pace), '/KM', 580, 1080);
    drawStat('Duração', formatTime(session.duration), 'MIN', 80, 1250);

    try {
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
      if (blob) {
        const file = new File([blob], 'treino-timerunner.png', { type: 'image/png' });
        if (navigator.share) {
          await navigator.share({
            files: [file],
            title: 'Resumo de Treino TimeRunner',
            text: `Hoje bati ${(session.distance/1000).toFixed(2)}km no TimeRunner! 🏃‍♂️⚡`
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'meu-treino.png';
          a.click();
        }
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[70] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 active:bg-slate-200">←</button>
        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Resumo do Treino</h2>
        <button onClick={handleShare} className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6a3 3 0 100-2.684m0 2.684l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
        </button>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto no-scrollbar pb-10">
        <div className="bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-inner border border-slate-200">
          <canvas ref={canvasRef} className="w-full h-80 block" style={{ width: '100%', height: '320px' }} />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Distância</p>
             <p className="text-3xl font-black text-slate-900">{(session.distance / 1000).toFixed(2)} <span className="text-xs text-indigo-400 uppercase">km</span></p>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pace Médio</p>
             <p className="text-3xl font-black text-slate-900">{formatPace(session.pace)} <span className="text-xs text-indigo-400 uppercase">min/km</span></p>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Duração</p>
             <p className="text-3xl font-black text-slate-900">{formatTime(session.duration)} <span className="text-xs text-indigo-400 uppercase">total</span></p>
           </div>
           <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data</p>
             <p className="text-lg font-black text-slate-900 pt-2">{new Date(session.date).toLocaleDateString()}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SessionDetail;
