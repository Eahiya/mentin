
import React from 'react';
import { EmergencyAnalysis, SeverityLevel, HybridScore } from '../types';
import { AlertTriangle, Flame, ShieldAlert, HeartPulse, Activity, Cpu, BrainCircuit } from 'lucide-react';

interface IntelligencePanelProps {
  analysis: EmergencyAnalysis | null;
  hybridScore: HybridScore | null;
  loading: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ analysis, hybridScore, loading }) => {
  if (!analysis && !loading) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 h-full flex items-center justify-center p-8 text-slate-500">
        <div className="text-center">
            <BrainCircuit className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Awaiting Neural Inference...</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (level: string) => {
    switch (level) {
      case SeverityLevel.P1: return 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.5)]';
      case SeverityLevel.P2: return 'bg-orange-500 text-white';
      case SeverityLevel.P3: return 'bg-yellow-500 text-black';
      default: return 'bg-slate-600';
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
        case 'Fire': return <Flame className="w-6 h-6 text-orange-400" />;
        case 'Medical': return <HeartPulse className="w-6 h-6 text-red-400" />;
        case 'Crime': return <ShieldAlert className="w-6 h-6 text-blue-400" />;
        default: return <AlertTriangle className="w-6 h-6 text-yellow-400" />;
    }
  };

  const confidenceValue = analysis ? (analysis.confidence * 100) : 0;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 h-full flex flex-col relative overflow-hidden">
      {loading && (
        <div className="absolute inset-0 bg-slate-900/80 z-10 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-2"></div>
             <span className="text-emerald-400 text-xs font-mono animate-pulse">NEURAL CORE INFERENCE...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex justify-between items-center">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-500" />
            Neural Triage Intelligence
        </h3>
        <div className="flex items-center gap-2">
             <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">SYSTEM: {analysis && analysis.confidence > 0 ? 'ONLINE' : 'FALLBACK'}</span>
        </div>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6">
        
        {/* Top Row: Type & Priority */}
        <div className="flex gap-4">
            <div className="flex-1 bg-slate-800/50 p-3 rounded border border-slate-700 flex flex-col justify-between">
                <div>
                  <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Neural Classification</span>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-100">
                      {analysis ? getIcon(analysis.emergency_type) : null}
                      {analysis?.emergency_type || "Analysing..."}
                  </div>
                </div>
                
                {/* AI Confidence Score Section */}
                <div className="mt-3 pt-3 border-t border-slate-700/50">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[9px] text-slate-500 uppercase font-mono tracking-tighter">AI Confidence</span>
                        <span className={`text-[10px] font-mono font-bold ${confidenceValue > 80 ? 'text-emerald-400' : confidenceValue > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {confidenceValue.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden border border-slate-800">
                        <div 
                            className={`h-full transition-all duration-700 ease-out ${confidenceValue > 80 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : confidenceValue > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${confidenceValue}%` }}
                        />
                    </div>
                </div>
            </div>
            
            <div className="flex-1 bg-slate-800/50 p-3 rounded border border-slate-700">
                <span className="text-xs text-slate-400 uppercase tracking-wider block mb-1">Hybrid Priority</span>
                <div className="flex items-center justify-between">
                     <span className={`text-xl font-bold px-3 py-0.5 rounded ${getPriorityColor(hybridScore?.final_priority || SeverityLevel.P3)}`}>
                        {hybridScore?.final_priority || "--"}
                    </span>
                    {hybridScore && hybridScore.distress_score > 0.6 && (
                        <span className="text-xs text-red-400 font-mono animate-pulse border border-red-900 bg-red-900/20 px-1 rounded">
                            DISTRESS ALERT
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* Summary */}
        <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Semantic Summary</span>
            <p className="text-slate-300 bg-slate-800 p-3 rounded border-l-2 border-emerald-500 text-sm leading-relaxed">
                {analysis?.summary || "Waiting for audio patterns..."}
            </p>
        </div>

        {/* Risks */}
        <div>
             <span className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Neural Risk Analysis</span>
             <div className="flex flex-wrap gap-2">
                {analysis?.key_risks.map((risk, idx) => (
                    <span key={idx} className="bg-red-900/30 text-red-300 border border-red-900/50 px-2 py-1 rounded text-xs font-semibold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {risk}
                    </span>
                ))}
                {!analysis?.key_risks.length && <span className="text-slate-500 text-sm italic">Scanning stream...</span>}
             </div>
        </div>
        
         {/* Reasoning */}
         <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider mb-2 block">Inference Logic Trace</span>
            <p className="text-slate-400 text-[10px] italic font-mono bg-slate-950 p-2 rounded border border-slate-800">
                &gt; {analysis?.reasoning_trace || "Core standby..."}
            </p>
        </div>

      </div>
    </div>
  );
};

export default IntelligencePanel;
