
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SIMULATION_SCENARIOS, DANGER_KEYWORDS } from './constants';
import { EmergencyAnalysis, HybridScore, SeverityLevel, LogEntry, CallScenario, EmergencyType } from './types';
import { analyzeEmergencyTranscript, synthesizeSpeech } from './services/geminiService';
import AudioWaveform from './components/AudioWaveform';
import LiveTranscript from './components/LiveTranscript';
import IntelligencePanel from './components/IntelligencePanel';
import RoutingDeck from './components/RoutingDeck';
import StatsPanel from './components/StatsPanel';
import { Siren, RotateCcw, ShieldCheck, CheckCircle2, Mic, MicOff, BrainCircuit, Zap, Volume2, Loader2 } from 'lucide-react';

/**
 * BASE64 DECODER
 * Standard utility to convert base64 strings to Uint8Array
 */
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * RAW PCM DECODER
 * Manually decodes 16-bit Mono PCM data into a Web Audio API AudioBuffer.
 * This is necessary because Gemini TTS returns raw bytes without a header (WAV/MP3).
 */
function decodeRawPcm(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): AudioBuffer {
  // 16-bit PCM means 2 bytes per sample.
  const safeByteLength = data.byteLength - (data.byteLength % 2);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, safeByteLength / 2);
  
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize 16-bit signed integer (-32768 to 32767) to float (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const App: React.FC = () => {
  // State
  const [activeScenario, setActiveScenario] = useState<CallScenario | null>(null);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [analysis, setAnalysis] = useState<EmergencyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDispatched, setIsDispatched] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<LogEntry['type'] | 'all'>('all');
  const [audioIntensity, setAudioIntensity] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState<string | null>(null);

  // Refs
  const timeoutRef = useRef<number | null>(null);
  const lineIndexRef = useRef(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [{
        id: Math.random().toString(36),
        timestamp: Date.now(),
        message,
        type
    }, ...prev.slice(0, 50)]);
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
    return {
        final_priority: finalP,
        distress_score: distress,
        keyword_matches: matches,
        ai_confidence: analysisData.confidence
    };
  }, []);

  const [hybridScore, setHybridScore] = useState<HybridScore | null>(null);

  const startSimulation = (scenarioId: string) => {
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario) return;
    resetSimulation();
    setActiveScenario(scenario);
    setIsSimulating(true);
    addLog(`CALL INITIALIZED: ${scenario.name}`, 'alert');
  };

  const generateVoiceTest = async (scenarioId: string) => {
    const scenario = SIMULATION_SCENARIOS.find(s => s.id === scenarioId);
    if (!scenario || isGeneratingVoice) return;
    
    setIsGeneratingVoice(scenarioId);
    resetSimulation();
    setActiveScenario(scenario);
    
    // Pick the most impactful line from the script for the demo
    const sampleLine = scenario.audioScript[1] || scenario.audioScript[0];
    addLog(`GENERATING VOICE SAMPLE: ${scenario.expectedType}...`, 'info');

    try {
      const base64Audio = await synthesizeSpeech(sampleLine);
      if (base64Audio) {
        addLog(`VOICE SAMPLE READY - PLAYING`, 'success');
        setTranscript([`[CALLER]: ${sampleLine}`]);
        triggerAnalysis([sampleLine]);
        await playDispatcherAudio(base64Audio);
      } else {
        addLog("VOICE GENERATION FAILED", "warning");
      }
    } catch (err) {
      addLog("VOICE ENGINE ERROR", "warning");
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
        addLog("HARDWARE MIC ACTIVE - LISTENING...", 'alert');
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) { addLog("SPEECH RECOGNITION NOT SUPPORTED", "warning"); return; }
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
        recognition.onerror = (event: any) => { addLog(`MIC ERROR: ${event.error}`, 'warning'); stopMicrophone(); };
        recognition.start();
        recognitionRef.current = recognition;
    } catch (err) { addLog("MIC ACCESS DENIED", 'warning'); }
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
    addLog("SYSTEM RESET COMPLETE", 'info');
  };

  const handleTakeover = () => {
    if (isTakeoverActive || isDispatched) return;
    setIsTakeoverActive(true);
    setIsSimulating(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    addLog("MANUAL INTERVENTION: DISPATCHER TOOK OVER CALL", 'warning');
  };

  const handleDispatcherResponse = async (text: string) => {
    if (!text.trim()) return;
    setTranscript(prev => [...prev, `[DISPATCHER]: ${text}`]);
    addLog(`VOICE RESPONSE SENT: "${text.substring(0, 30)}..."`, 'success');
    
    const base64Audio = await synthesizeSpeech(text);
    if (base64Audio) {
      playDispatcherAudio(base64Audio);
    }
  };

  const playDispatcherAudio = async (base64: string) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      
      const uint8Data = decodeBase64(base64);
      const audioBuffer = decodeRawPcm(uint8Data, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      
      setAudioIntensity(1.0);
      source.onended = () => setAudioIntensity(0);
    } catch (e) {
      console.error("Audio playback error:", e);
      addLog("AUDIO ENGINE ERROR - SEE CONSOLE", "warning");
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && analysis && !isDispatched && !isTakeoverActive) handleDispatch();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analysis, isDispatched, isTakeoverActive]);

  useEffect(() => {
    if (!isSimulating || !activeScenario || isDispatched || isTakeoverActive) return;
    const playNextLine = () => {
      if (lineIndexRef.current >= activeScenario.audioScript.length) {
        setIsSimulating(false);
        setAudioIntensity(0);
        addLog("CALL DISCONNECTED", 'info');
        return;
      }
      setAudioIntensity(Math.random() * 0.5 + 0.5);
      setTimeout(() => setAudioIntensity(0.1), 1200);
      const newLine = activeScenario.audioScript[lineIndexRef.current];
      setTranscript(prev => {
        const updated = [...prev, newLine];
        if (updated.length % 2 === 0 || lineIndexRef.current === activeScenario.audioScript.length - 1) triggerAnalysis(updated);
        return updated;
      });
      lineIndexRef.current++;
      timeoutRef.current = window.setTimeout(playNextLine, Math.random() * 1500 + 1500);
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
    addLog(`TRIAGE UPDATED: ${result.emergency_type}`, 'success');
  };

  const handleDispatch = () => {
    if (!analysis || isDispatched) return;
    setIsDispatched(true);
    setIsSimulating(false);
    stopMicrophone();
    addLog(`DISPATCH CONFIRMED: ${analysis.recommended_route}`, 'success');
    setTimeout(() => addLog("INCIDENT ARCHIVED", 'info'), 4000);
  };

  const handleOverride = (service: string) => {
    if (!analysis || isDispatched) return;
    setAnalysis(prev => prev ? { ...prev, recommended_route: service + " (OVERRIDE)" } : null);
    addLog(`OPERATOR OVERRIDE: ${service}`, 'warning');
  };

  const filteredLogs = logs.filter(log => logFilter === 'all' || log.type === logFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      <header className="h-16 border-b border-slate-800 bg-slate-950 flex items-center justify-between px-6 shadow-sm z-20">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-all duration-500 ${isDispatched ? 'bg-blue-600' : isTakeoverActive ? 'bg-orange-500' : 'bg-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`}>
                 <Siren className={`w-6 h-6 text-white ${isDispatched ? 'animate-pulse' : ''}`} />
            </div>
            <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">RAPID-100 <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded ml-2 font-mono text-emerald-400">NEURAL CORE</span></h1>
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-1 flex items-center gap-1">
                    {isTakeoverActive ? <Zap className="w-3 h-3 text-orange-400 animate-pulse" /> : <BrainCircuit className="w-3 h-3 text-emerald-500" />}
                    {isTakeoverActive ? 'Manual Dispatcher Takeover Active' : 'Neural Model Triage Active'}
                </p>
            </div>
        </div>
        
        <div className="flex items-center gap-4">
             {/* Voice Test Buttons */}
             <div className="hidden xl:flex items-center bg-slate-900/50 rounded-md p-1 border border-slate-800 gap-1">
                <span className="text-[9px] font-bold text-slate-500 px-2 uppercase tracking-tighter">Voice Demo</span>
                {SIMULATION_SCENARIOS.map(s => (
                  <button 
                    key={`voice-${s.id}`} 
                    onClick={() => generateVoiceTest(s.id)}
                    disabled={isGeneratingVoice !== null || isDispatched || isSimulating || isListening}
                    className={`p-1.5 rounded transition-all hover:bg-slate-800 text-slate-400 hover:text-emerald-400 disabled:opacity-30 relative group`}
                    title={`Generate ${s.expectedType} Voice Sample`}
                  >
                    {isGeneratingVoice === s.id ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <Volume2 className="w-4 h-4" />}
                    <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[8px] text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-slate-700">{s.expectedType} CLIP</span>
                  </button>
                ))}
             </div>

             <div className="flex bg-slate-900 rounded-md p-1 border border-slate-800">
                <button onClick={() => isListening ? stopMicrophone() : startMicrophone()} disabled={isDispatched || isSimulating || isTakeoverActive} className={`text-xs font-semibold px-3 py-1.5 rounded transition-all flex items-center gap-2 ${isListening ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'} disabled:opacity-50`}>
                    {isListening ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />} {isListening ? 'STOP MIC' : 'LIVE MIC'}
                </button>
                <div className="w-px bg-slate-800 mx-1" />
                {SIMULATION_SCENARIOS.map(s => (
                    <button key={s.id} onClick={() => startSimulation(s.id)} disabled={isSimulating || isDispatched || isListening || isTakeoverActive} className={`text-xs font-semibold px-3 py-1.5 rounded transition-all ${activeScenario?.id === s.id ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800'} disabled:opacity-50`}>
                        {s.name.split(' ')[0]}
                    </button>
                ))}
             </div>
             <button onClick={resetSimulation} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition">
                <RotateCcw className="w-5 h-5" />
             </button>
        </div>
      </header>

      <main className="flex-1 p-4 grid grid-cols-12 grid-rows-12 gap-4 h-[calc(100vh-64px)] overflow-hidden">
        <div className="col-span-12 lg:col-span-4 row-span-12 flex flex-col gap-4 overflow-hidden">
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
        <div className="col-span-12 md:col-span-7 lg:col-span-5 row-span-12 flex flex-col gap-4 overflow-hidden">
             <div className="flex-1 min-h-0 relative overflow-hidden">
                <IntelligencePanel analysis={analysis} hybridScore={hybridScore} loading={isAnalyzing} />
                {isDispatched && (
                    <div className="absolute inset-0 z-20 bg-emerald-950/20 backdrop-blur-[1px] flex items-center justify-center border-2 border-emerald-500/50 rounded-lg">
                        <div className="bg-slate-900 border border-emerald-500 px-6 py-4 rounded shadow-2xl flex flex-col items-center gap-2">
                             <CheckCircle2 className="w-12 h-12 text-emerald-500 animate-bounce" />
                             <span className="text-emerald-400 font-bold tracking-tighter text-2xl">DISPATCHED</span>
                             <span className="text-[10px] text-slate-400 font-mono">CASE ID: #{Math.floor(Math.random() * 90000 + 10000)}</span>
                        </div>
                    </div>
                )}
             </div>
        </div>
        <div className="col-span-12 md:col-span-5 lg:col-span-3 row-span-12 flex flex-col gap-4 overflow-hidden">
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
            <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 p-3 overflow-hidden flex flex-col">
                <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-2">
                  <span className="text-xs text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Secure Edge Logs
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(['all', 'info', 'alert', 'success', 'warning'] as const).map(type => (
                    <button key={type} onClick={() => setLogFilter(type)} className={`text-[9px] px-1.5 py-0.5 rounded border transition-all uppercase font-mono ${logFilter === type ? 'bg-slate-700 border-slate-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-600'}`}>{type}</button>
                  ))}
                </div>
                <div className="space-y-2 overflow-y-auto flex-1 font-mono text-[9px]">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="flex gap-2 group">
                             <span className="text-slate-600 flex-none">{new Date(log.timestamp).toLocaleTimeString([], {hour12: false, minute:'2-digit', second:'2-digit'})}</span>
                             <span className={`${log.type === 'alert' ? 'text-emerald-400' : log.type === 'success' ? 'text-blue-400' : log.type === 'warning' ? 'text-orange-400' : 'text-slate-500'}`}>[{log.type.toUpperCase()}] {log.message}</span>
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
