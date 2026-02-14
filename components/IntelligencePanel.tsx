
import React from 'react';
import { EmergencyAnalysis, SeverityLevel, HybridScore } from '../types';
import { AlertTriangle, Flame, ShieldAlert, HeartPulse, BrainCircuit, Info } from 'lucide-react';

interface IntelligencePanelProps {
  analysis: EmergencyAnalysis | null;
  hybridScore: HybridScore | null;
  loading: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ analysis, hybridScore, loading }) => {
  if (!analysis && !loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 h-full flex items-center justify-center p-12 text-slate-400 shadow-sm">
        <div className="text-center">
            <BrainCircuit className="w-16 h-16 mx-auto mb-6 text-slate-200" />
            <h4 className="text-lg font-bold text-slate-900 mb-2">Awaiting Stream</h4>
            <p className="text-sm max-w-xs mx-auto">Neural Core is standing by for incoming emergency audio or digital simulation.</p>
        </div>
      </div>
    );
  }

  const getPriorityColor = (level: string) => {
    switch (level) {
      case SeverityLevel.P1: return 'bg-red-600 text-white';
      case SeverityLevel.P2: return 'bg-amber-500 text-white';
      case SeverityLevel.P3: return 'bg-blue-600 text-white';
      default: return 'bg-slate-200 text-slate-600';
    }
  };

  const getIcon = (type: string) => {
    switch(type) {
        case 'Fire': return <Flame className="w-6 h-6 text-orange-600" />;
        case 'Medical': return <HeartPulse className="w-6 h-6 text-red-600" />;
        case 'Crime': return <ShieldAlert className="w-6 h-6 text-indigo-600" />;
        default: return <AlertTriangle className="w-6 h-6 text-amber-600" />;
    }
  };

  const confidenceValue = analysis ? (analysis.confidence * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 h-full flex flex-col relative overflow-hidden shadow-sm">
      {loading && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center backdrop-blur-[2px]">
          <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-100 border-t-blue-600 mb-4"></div>
             <span className="text-slate-900 text-xs font-bold tracking-widest uppercase">Analyzing Intent...</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
            <BrainCircuit className="w-5 h-5 text-blue-600" />
            Intelligence Engine
        </h3>
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Neural Status: {analysis ? 'Validated' : 'Idle'}</span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8">
        
        {/* Top Indicators */}
        <div className="grid grid-cols-2 gap-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-2">Classification</span>
                <div className="flex items-center gap-3">
                    {analysis ? getIcon(analysis.emergency_type) : null}
                    <span className="text-2xl font-black text-slate-900">{analysis?.emergency_type || "---"}</span>
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-200/60">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Confidence</span>
                        <span className="text-xs font-bold text-slate-900">{confidenceValue.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${confidenceValue}%` }} />
                    </div>
                </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block mb-2">Risk Rating</span>
                <div className="flex flex-col gap-2">
                    <span className={`text-xl font-black px-4 py-1.5 rounded-lg inline-block w-fit shadow-sm ${getPriorityColor(hybridScore?.final_priority || SeverityLevel.P3)}`}>
                        LEVEL {hybridScore?.final_priority || "--"}
                    </span>
                    {hybridScore && hybridScore.distress_score > 0.6 && (
                        <div className="text-[10px] text-red-600 font-bold flex items-center gap-1.5 mt-1">
                            <AlertTriangle className="w-3 h-3" />
                            CRITICAL DISTRESS DETECTED
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Narrative Summary */}
        <div className="space-y-3">
            <h4 className="text-[11px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                <Info className="w-3.5 h-3.5" />
                Case Narrative
            </h4>
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100">
                <p className="text-slate-800 text-sm leading-relaxed font-medium italic">
                    "{analysis?.summary || "System is awaiting voice data to generate a narrative summary..."}"
                </p>
            </div>
        </div>

        {/* Tactical Risks */}
        <div className="space-y-3">
             <h4 className="text-[11px] text-slate-400 uppercase font-black tracking-widest">Active Risk Factors</h4>
             <div className="flex flex-wrap gap-2">
                {analysis?.key_risks.map((risk, idx) => (
                    <span key={idx} className="bg-white text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-600" />
                        {risk}
                    </span>
                ))}
                {!analysis?.key_risks.length && <span className="text-slate-400 text-xs italic">Scanning transcript for environmental hazards...</span>}
             </div>
        </div>
        
         {/* Internal Logic Trace */}
         <div className="mt-auto">
            <div className="text-[9px] text-slate-400 font-mono bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col gap-1">
                <span className="font-bold uppercase tracking-widest text-slate-500">Inference Trace</span>
                <span className="italic leading-tight">ROOT: {analysis?.reasoning_trace || "Neural model standby."}</span>
            </div>
        </div>

      </div>
    </div>
  );
};

export default IntelligencePanel;
