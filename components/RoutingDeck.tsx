
import React, { useState } from 'react';
import { EmergencyAnalysis } from '../types';
import { Truck, Shield, Stethoscope, PhoneForwarded, Zap, Send, MessageSquare, AlertCircle, X } from 'lucide-react';

interface RoutingDeckProps {
  analysis: EmergencyAnalysis | null;
  onOverride: (service: string) => void;
  onDispatch: () => void;
  isDispatched: boolean;
  isTakeoverActive: boolean;
  onTakeover: () => void;
  onDispatcherResponse: (text: string) => void;
}

const RoutingDeck: React.FC<RoutingDeckProps> = ({ 
  analysis, onOverride, onDispatch, isDispatched, isTakeoverActive, onTakeover, onDispatcherResponse 
}) => {
  const [responseValue, setResponseValue] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const recommended = analysis?.recommended_route || "Awaiting Data";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (responseValue.trim()) {
      onDispatcherResponse(responseValue);
      setResponseValue('');
    }
  };

  const handleConfirmDispatch = () => {
    onDispatch();
    setShowConfirmModal(false);
  };

  return (
    <div className={`bg-slate-900 rounded-lg border h-full flex flex-col transition-all duration-500 relative overflow-hidden ${
      isTakeoverActive 
        ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/50' 
        : 'border-slate-700'
    }`}>
      {/* Dispatch Confirmation Modal Overlay */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl w-full max-w-xs animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-emerald-500/10 p-3 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">Confirm Dispatch</h4>
              <p className="text-sm text-slate-400 mb-6">Are you sure you want to dispatch emergency units to this location?</p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleConfirmDispatch}
                  className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-shadow shadow-[0_4px_12px_rgba(16,185,129,0.4)]"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Manual Mode Banner */}
      {isTakeoverActive && (
        <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 animate-pulse z-30" />
      )}
      
      <div className={`p-3 border-b flex justify-between items-center bg-slate-800/50 ${isTakeoverActive ? 'border-orange-500/50 bg-orange-950/20' : 'border-slate-700'}`}>
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
            <PhoneForwarded className={`w-4 h-4 ${isTakeoverActive ? 'text-orange-400' : 'text-slate-400'}`} />
            Routing & Intervention
        </h3>
        {isTakeoverActive && (
          <div className="flex items-center gap-1.5 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] bg-orange-600 px-2 py-0.5 rounded text-white font-black tracking-tighter shadow-lg uppercase">
              Manual Mode
            </span>
          </div>
        )}
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        
        {/* Recommendation / Active Status */}
        <div className={`text-center py-5 rounded-lg border transition-all duration-300 ${
            isDispatched 
            ? 'bg-blue-900/20 border-blue-500/50' 
            : isTakeoverActive 
            ? 'bg-orange-900/10 border-orange-500/40 shadow-inner'
            : 'bg-slate-800 border-slate-600'
        } mb-4 flex-none`}>
            <span className={`text-[10px] uppercase tracking-widest block mb-1 font-bold ${
              isTakeoverActive ? 'text-orange-300' : 'text-slate-400'
            }`}>
                {isDispatched ? 'Status' : (isTakeoverActive ? 'Manual Control Active' : 'System Recommendation')}
            </span>
            <div className={`text-2xl font-black tracking-tighter break-words px-2 mb-4 drop-shadow-sm ${
                isDispatched ? 'text-blue-400' : isTakeoverActive ? 'text-orange-400' : 'text-white'
            }`}>
                {recommended.toUpperCase()}
            </div>
            
            <div className="flex justify-center gap-3">
                 {!isDispatched && (
                    <>
                      <button 
                          onClick={() => setShowConfirmModal(true)}
                          disabled={!analysis}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-5 py-2.5 rounded transition shadow-[0_4px_10px_rgba(16,185,129,0.3)] disabled:opacity-50 active:scale-95 uppercase"
                      >
                          Confirm
                      </button>
                      {!isTakeoverActive && (
                        <button 
                          onClick={onTakeover}
                          className="bg-orange-600 hover:bg-orange-500 text-white text-xs font-black px-5 py-2.5 rounded transition shadow-[0_4px_10px_rgba(249,115,22,0.3)] flex items-center gap-1.5 active:scale-95 uppercase"
                        >
                            <Zap className="w-3.5 h-3.5" />
                            Take Over
                        </button>
                      )}
                    </>
                 )}
                 {isDispatched && (
                    <div className="text-blue-400 text-sm font-black animate-pulse flex items-center gap-2 uppercase tracking-tighter">
                      <Zap className="w-5 h-5" /> Unit En Route
                    </div>
                 )}
            </div>
        </div>

        {/* Takeover Input / Dispatcher Response */}
        {isTakeoverActive && !isDispatched && (
          <div className="mb-4 flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500">
            <label className="text-[10px] text-orange-300 uppercase tracking-widest font-black block mb-2 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" />
              Direct Response (Synthesized TTS)
            </label>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                autoFocus
                type="text"
                value={responseValue}
                onChange={(e) => setResponseValue(e.target.value)}
                placeholder="Issue instructions to caller..."
                className="flex-1 bg-slate-950 border border-orange-500/30 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 text-slate-100 transition-all placeholder:text-slate-600"
              />
              <button 
                type="submit"
                className="bg-orange-600 hover:bg-orange-500 p-2.5 rounded-md text-white transition-all flex items-center justify-center shadow-lg active:scale-90"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
            <div className="flex items-center gap-2 mt-3">
              <div className="h-[1px] flex-1 bg-orange-500/20" />
              <p className="text-[9px] text-orange-400/60 italic font-mono uppercase tracking-tighter">Secure Neural Voice Uplink Active</p>
              <div className="h-[1px] flex-1 bg-orange-500/20" />
            </div>
          </div>
        )}

        {/* Manual Overrides */}
        <div className={`flex-none mt-auto ${isDispatched ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
            <span className={`text-[10px] uppercase tracking-widest block mb-2 font-bold ${isTakeoverActive ? 'text-orange-400/80' : 'text-slate-500'}`}>
              Resource Override
            </span>
            <div className="grid grid-cols-3 gap-2">
                <button 
                    onClick={() => onOverride("Ambulance")}
                    className="bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-500/50 text-slate-400 hover:text-red-200 p-2.5 rounded-md flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold"
                >
                    <Stethoscope className="w-4 h-4 text-red-500" />
                    Medical
                </button>
                <button 
                    onClick={() => onOverride("Fire Dept")}
                    className="bg-slate-800 hover:bg-orange-900/30 border border-slate-700 hover:border-orange-500/50 text-slate-400 hover:text-orange-200 p-2.5 rounded-md flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold"
                >
                    <Truck className="w-4 h-4 text-orange-500" />
                    Fire
                </button>
                <button 
                    onClick={() => onOverride("Police")}
                    className="bg-slate-800 hover:bg-blue-900/30 border border-slate-700 hover:border-blue-500/50 text-slate-400 hover:text-blue-200 p-2.5 rounded-md flex flex-col items-center gap-1.5 transition-all text-[11px] font-bold"
                >
                    <Shield className="w-4 h-4 text-blue-500" />
                    Police
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default RoutingDeck;
