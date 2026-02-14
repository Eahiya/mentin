
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SIMULATION_SCENARIOS, DANGER_KEYWORDS } from './constants';
import { EmergencyAnalysis, HybridScore, SeverityLevel, LogEntry, CallScenario, EmergencyType } from './types';
import { analyzeEmergencyTranscript, synthesizeSpeech, transcribeAudio } from './services/geminiService';
import AudioWaveform from './components/AudioWaveform';
import LiveTranscript from './components/LiveTranscript';
import IntelligencePanel from './components/IntelligencePanel';
import RoutingDeck from './components/RoutingDeck';
import StatsPanel from './components/StatsPanel';
import { Siren, RotateCcw, ShieldCheck, CheckCircle2, Mic, MicOff, BrainCircuit, Zap, Volume2, Loader2, Activity, Upload, FileAudio } from 'lucide-react';

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function decodeRawPcm(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): AudioBuffer {
  const safeByteLength = data.byteLength - (data.byteLength % 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, safeByteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<CallScenario | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [analysis, setAnalysis] = useState<EmergencyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogEntry['type'] | 'all'>('all');
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<string | null>(null);
  const [hybridScore, setHybridScore] = useState<HybridScore | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const lineIndexRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{ id: Math.random().toString(36), timestamp: Date.now(), message, type }, ...prev.slice(0, 50)]);
  };

  const calculateHybridScore = useCallback((analysisData: EmergencyAnalysis, currentTranscript: string[]): HybridScore => {
    const fullText = currentTranscript.join(' ').toLowerCase();
    const matches = DANGER_KEYWORDS.filter(kw => fullText.includes(kw));
    let distress = 0.2;
    if (analysisData.severity === SeverityLevel.P1) distress += 0.4;
    if (matches.length > 0) distress += 0.3;
    distress = Math.min(distress, 1.0);
    let finalP = analysisData.severity;
    if (matches.length >= 2 && finalP !== SeverityLevel.P1) finalP = SeverityLevel.P1; 
    return { final_priority: finalP, distress_score: distress, keyword_matches: matches, ai_confidence: analysisData.confidence };
  }, []);

  const startSimulation = (scenarioId: string) => {
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    resetSimulation();
    setActiveScenario(scenario);
    setIsSimulating(true);
    addLog(`INIT: ${scenario.name}`, 'alert');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    resetSimulation();
    setIsUploading(true);
    addLog(`INGESTING: ${file.name}`, 'info');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      const fullTranscript = await transcribeAudio(base64Data, file.type);
      addLog(`TRANSCRIPTION COMPLETE`, 'success');

      // Create a dynamic scenario from the transcript
      // Split by common sentence delimiters to simulate call rhythm
      const lines = fullTranscript.split(/[.!?]+(?=\s|$)/).map(l => l.trim()).filter(l => l.length > 0);
      
      const dynamicScenario: CallScenario = {
        id: 'upload-' + Date.now(),
        name: `File: ${file.name}`,
        audioScript: lines,
        expectedType: EmergencyType.Unknown
      };

      setActiveScenario(dynamicScenario);
      setIsSimulating(true);
    } catch (err) {
      addLog("UPLOAD FAILED", 'warning');
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const generateVoiceTest = async (scenarioId: string) => {
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario || isGeneratingVoice) return;
    setIsGeneratingVoice(scenarioId);
    resetSimulation();
    setActiveScenario(scenario);
    const sampleLine = scenario.audioScript[1] || scenario.audioScript[0];
    try {
      const base64Audio = await synthesizeSpeech(sampleLine);
      if (base64Audio) {
        setTranscript([`[CALLER]: ${sampleLine}`]);
        triggerAnalysis([sampleLine]);
        await playDispatcherAudio(base64Audio);
      }
    } catch (err) {
      addLog("VOICE ERROR", "warning");
    } finally {
      setIsGeneratingVoice(null);
    }
  };

  const stopMicrophone = () => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }
    if (audioStream) { audioStream.getTracks().forEach(track => track.stop()); setAudioStream(null); }
    setIsListening(false);
  };

  const startMicrophone = async () => {
    resetSimulation();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setAudioStream(stream);
        setIsListening(true);
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onresult = (event: any) => {
            let finalTranscriptLine = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) finalTranscriptLine = event.results[i][0].transcript;
            }
            if (finalTranscriptLine) {
                setTranscript(prev => {
                    const updated = [...prev, finalTranscriptLine.trim()];
                    triggerAnalysis(updated);
                    return updated;
                });
            }
        };
        recognition.start();
        recognitionRef.current = recognition;
    } catch (err) { addLog("MIC DENIED", 'warning'); }
  };

  const resetSimulation = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    stopMicrophone();
    setActiveScenario(null);
    setTranscript([]);
    setAnalysis(null);
    setIsSimulating(false);
    setIsDispatched(false);
    setIsTakeoverActive(false);
    lineIndexRef.current = 0;
    setHybridScore(null);
    setAudioIntensity(0);
    setLogFilter('all');
    addLog("SYSTEM RESET", 'info');
  };

  const handleTakeover = () => {
    if (isTakeoverActive || isDispatched) return;
    setIsTakeoverActive(true);
    setIsSimulating(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    addLog("DISPATCHER TAKEOVER", 'warning');
  };

  const handleDispatcherResponse = async (text: string) => {
    if (!text.trim()) return;
    setTranscript(prev => [...prev, `[DISPATCHER]: ${text}`]);
    const base64Audio = await synthesizeSpeech(text);
    if (base64Audio) playDispatcherAudio(base64Audio);
  };

  const playDispatcherAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      const uint8Data = decodeBase64(base64);
      const audioBuffer = decodeRawPcm(uint8Data, ctx, 24000, 1);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      setAudioIntensity(1.0);
      source.onended = () => setAudioIntensity(0);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (!isSimulating || !activeScenario || isDispatched || isTakeoverActive) return;
    const playNextLine = () => {
      if (lineIndexRef.current >= activeScenario.audioScript.length) {
        setIsSimulating(false);
        setAudioIntensity(0);
        return;
      }
      setAudioIntensity(Math.random() * 0.4 + 0.4);
      const newLine = activeScenario.audioScript[lineIndexRef.current];
      setTranscript(prev => {
        const updated = [...prev, newLine];
        // Trigger analysis frequently for file uploads too
        if (updated.length % 2 === 0 || lineIndexRef.current === activeScenario.audioScript.length - 1) triggerAnalysis(updated);
        return updated;
      });
      lineIndexRef.current++;
      timeoutRef.current = window.setTimeout(playNextLine, 2000);
    };
    timeoutRef.current = window.setTimeout(playNextLine, 300);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [isSimulating, activeScenario, isDispatched, isTakeoverActive]);

  const triggerAnalysis = async (currentTextLines: string[]) => {
    if (isDispatched) return;
    setIsAnalyzing(true);
    const result = await analyzeEmergencyTranscript(currentTextLines.join(' '));
    setAnalysis(result);
    setHybridScore(calculateHybridScore(result, currentTextLines));
    setIsAnalyzing(false);
  };

  const handleDispatch = () => {
    if (!analysis || isDispatched) return;
    setIsDispatched(true);
    setIsSimulating(false);
    stopMicrophone();
    addLog(`DISPATCHED: ${analysis.recommended_route}`, 'success');
  };

  const handleOverride = (service: string) => {
    if (!analysis || isDispatched) return;
    setAnalysis(prev => prev ? { ...prev, recommended_route: service + " (OVERRIDE)" } : null);
    addLog(`OVERRIDE: ${service}`, 'warning');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100">
      <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shadow-sm z-20">
        <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl transition-all duration-500 ${isDispatched ? 'bg-blue-600' : isTakeoverActive ? 'bg-orange-600' : 'bg-slate-900 shadow-md'}`}>
                 <Siren className={`w-6 h-6 text-white ${isDispatched ? 'animate-pulse' : ''}`} />
            </div>
            <div>
                <h1 className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">RAPID-100 <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded ml-2 font-bold uppercase">Dispatcher v4</span></h1>
                <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-1 flex items-center gap-1.5">
                    {isTakeoverActive ? <Zap className="w-3 h-3 text-orange-600" /> : <Activity className="w-3 h-3 text-emerald-600" />}
                    {isTakeoverActive ? 'Manual Override Active' : 'Neural Triage Monitor'}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-6">
             <div className="hidden xl:flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1">
                {SIMULATION_SCENARIOS.map(s => (
                  <button 
                    key={`voice-${s.id}`} 
                    onClick={() => generateVoiceTest(s.id)}
                    disabled={isGeneratingVoice !== null || isDispatched || isSimulating || isListening || isUploading}
                    className="px-3 py-1.5 rounded-md text-[11px] font-bold text-slate-600 hover:bg-white hover:text-blue-600 hover:shadow-sm transition-all disabled:opacity-30 flex items-center gap-1.5"
                  >
                    {isGeneratingVoice === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Volume2 className="w-3 h-3" />}
                    {s.expectedType}
                  </button>
                ))}
             </div>

             <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="audio/*" className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isDispatched || isSimulating || isTakeoverActive || isUploading} 
                  className={`text-[11px] font-bold px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${isUploading ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white hover:text-slate-900'} disabled:opacity-50`}
                >
                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} {isUploading ? 'PROCESSING' : 'UPLOAD SIGNAL'}
                </button>
                <div className="w-px bg-slate-200 mx-1.5" />
                <button onClick={() => isListening ? stopMicrophone() : startMicrophone()} disabled={isDispatched || isSimulating || isTakeoverActive || isUploading} className={`text-[11px] font-bold px-4 py-1.5 rounded-md transition-all flex items-center gap-2 ${isListening ? 'bg-red-600 text-white shadow-lg shadow-red-200' : 'text-slate-600 hover:bg-white hover:text-slate-900'} disabled:opacity-50`}>
                    {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />} {isListening ? 'STOP MIC' : 'LIVE MIC'}
                </button>
                <div className="w-px bg-slate-200 mx-1.5" />
                {SIMULATION_SCENARIOS.map(s => (
                    <button key={s.id} onClick={() => startSimulation(s.id)} disabled={isSimulating || isDispatched || isListening || isTakeoverActive || isUploading} className={`text-[11px] font-bold px-4 py-1.5 rounded-md transition-all ${activeScenario?.id === s.id ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'} disabled:opacity-50`}>
                        {s.name.split(' ')[0]}
                    </button>
                ))}
             </div>
             <button onClick={resetSimulation} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition">
                <RotateCcw className="w-5 h-5" />
             </button>
        </div>
      </header>

      <main className="flex-1 p-6 grid grid-cols-12 grid-rows-12 gap-6 h-[calc(100vh-64px)] overflow-hidden">
        <div className="col-span-12 lg:col-span-4 row-span-12 flex flex-col gap-6 overflow-hidden">
            <div className="flex-none">
                <AudioWaveform isActive={isSimulating || isListening || audioIntensity > 0} intensity={audioIntensity} stream={audioStream} />
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
                <LiveTranscript transcript={transcript} />
            </div>
             <div className="h-32 flex-none">
                 <StatsPanel />
             </div>
        </div>
        <div className="col-span-12 md:col-span-7 lg:col-span-5 row-span-12 flex flex-col gap-6 overflow-hidden">
             <div className="flex-1 min-h-0 relative overflow-hidden">
                <IntelligencePanel analysis={analysis} hybridScore={hybridScore} loading={isAnalyzing} />
                {isDispatched && (
                    <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-2xl border-2 border-blue-200">
                        <div className="bg-white border border-slate-200 px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 text-center">
                             <CheckCircle2 className="w-16 h-16 text-blue-600" />
                             <span className="text-slate-900 font-extrabold text-3xl tracking-tight">DISPATCH COMPLETE</span>
                             <span className="text-xs text-slate-500 font-mono bg-slate-100 px-3 py-1 rounded-full">TRANS-ID: {Math.floor(Math.random() * 900000)}</span>
                             <button onClick={resetSimulation} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition">Reset Console</button>
                        </div>
                    </div>
                )}
             </div>
        </div>
        <div className="col-span-12 md:col-span-5 lg:col-span-3 row-span-12 flex flex-col gap-6 overflow-hidden">
            <div className="flex-[2] overflow-hidden">
                <RoutingDeck 
                  analysis={analysis} 
                  onOverride={handleOverride} 
                  onDispatch={handleDispatch} 
                  isDispatched={isDispatched}
                  isTakeoverActive={isTakeoverActive}
                  onTakeover={handleTakeover}
                  onDispatcherResponse={handleDispatcherResponse}
                />
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 overflow-hidden flex flex-col shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" /> Network Status Logs
                  </span>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 font-mono text-[10px] leading-tight">
                    {logs.filter(log => logFilter === 'all' || log.type === logFilter).map(log => (
                        <div key={log.id} className="flex gap-2">
                             <span className="text-slate-400 flex-none">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}</span>
                             <span className={`font-medium ${log.type === 'alert' ? 'text-blue-600' : log.type === 'success' ? 'text-emerald-600' : log.type === 'warning' ? 'text-red-600' : 'text-slate-600'}`}>
                               [{log.type.toUpperCase()}] {log.message}
                             </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
