
import React, { useEffect, useRef } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  intensity?: number;
  stream?: MediaStream | null;
}

const AudioWaveform: React.FC<AudioWaveformProps> = ({ isActive, intensity = 0.5, stream }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  useEffect(() => {
    if (!stream || !isActive) {
      analyserRef.current = null;
      return;
    }

    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    
    source.connect(analyser);
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    return () => {
      audioCtx.close();
    };
  }, [stream, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let offset = 0;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);
      
      if (!isActive) {
        ctx.beginPath();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.stroke();
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx.beginPath();
      ctx.strokeStyle = stream ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.moveTo(0, centerY);

      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteTimeDomainData(dataArrayRef.current);
        const sliceWidth = width * 1.0 / dataArrayRef.current.length;
        let x = 0;

        for (let i = 0; i < dataArrayRef.current.length; i++) {
          const v = dataArrayRef.current[i] / 128.0;
          const y = v * height / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }
      } else {
        // Simulated wave
        for (let x = 0; x < width; x++) {
          const amplitude = (height / 3) * intensity;
          const frequency = 0.05;
          const y = centerY + 
            Math.sin(x * frequency + offset) * amplitude * Math.random() +
            Math.sin(x * 0.1 + offset * 2) * (amplitude * 0.5);
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();
      offset += 0.2;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, intensity, stream]);

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 p-2 h-24 flex flex-col relative overflow-hidden transition-colors ${stream && isActive ? 'bg-red-950/10 border-red-900/50' : ''}`}>
        <div className="absolute top-2 left-3 text-[10px] font-mono text-slate-400 flex items-center gap-2 z-10">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? (stream ? 'bg-red-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-600'}`}></div>
            {stream && isActive ? 'LIVE MIC (HARDWARE)' : 'DIGITAL SIGNAL'}
        </div>
      <canvas ref={canvasRef} width={600} height={100} className="w-full h-full opacity-80" />
    </div>
  );
};

export default AudioWaveform;
