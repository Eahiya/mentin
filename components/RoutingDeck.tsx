
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
  const recommended = analysis?.recommended_route || "No Route Data";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (responseValue.trim()) {
      onDispatcherResponse(responseValue);
      setResponseValue('');
    }
  };

  return (
    <div className={`bg-white rounded-2xl border h-full flex flex-col transition-all duration-500 relative overflow-hidden shadow-sm ${
      isTakeoverActive ? 'border-orange-500 ring-4 ring-orange-50' : 'border-slate-200'
    }`}>
      {showConfirmModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-blue-50 p-4 rounded-full mb-6">
                <AlertCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-3">Execute Dispatch</h4>
              <p className="text-sm text-slate-500 mb-8 font-medium">Verify units and location before confirming. This action triggers immediate field response.</p>
              
              <div className="flex gap-4 w-full">
                <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition-colors">Cancel</button>
                <button onClick={() => { onDispatch(); setShowConfirmModal(false); }} className="flex-1 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold transition-all shadow-lg shadow-blue-200">CONFIRM</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`p-5 border-b flex justify-between items-center ${isTakeoverActive ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
        <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
            <PhoneForwarded className={`w-5 h-5 ${isTakeoverActive ? 'text-orange-600' : 'text-slate-400'}`} />
            Deployment
        </h3>
        {isTakeoverActive && <span className="text-[10px] font-black text-orange-600 bg-white border border-orange-200 px-2.5 py-1 rounded-full uppercase tracking-widest">Manual Controller Active</span>}
      </div>
      
      <div className="p-6 flex-1 flex flex-col">
        <div className={`text-center p-6 rounded-2xl border mb-6 ${
            isDispatched ? 'bg-blue-50 border-blue-100' : isTakeoverActive ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'
        }`}>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Routing Status</span>
            <div className="text-2xl font-black text-slate-900 mb-6 tracking-tight">{recommended.toUpperCase()}</div>
            
            <div className="flex flex-col gap-3">
                 {!isDispatched && (
                    <>
                      <button onClick={() => setShowConfirmModal(true)} disabled={!analysis} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-black py-3.5 rounded-xl transition shadow-lg shadow-blue-200 disabled:opacity-30 uppercase tracking-tighter">Authorize Dispatch</button>
                      {!isTakeoverActive && (
                        <button onClick={onTakeover} className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 text-sm font-black py-3 rounded-xl transition flex items-center justify-center gap-2 uppercase tracking-tighter">
                            <Zap className="w-4 h-4" /> Take Over Call
                        </button>
                      )}
                    </>
                 )}
                 {isDispatched && <div className="text-blue-600 text-sm font-black py-2 bg-white rounded-lg border border-blue-200 animate-pulse uppercase tracking-widest">UNITS DEPLOYED</div>}
            </div>
        </div>

        {isTakeoverActive && !isDispatched && (
          <div className="mb-6 flex-1 animate-in fade-in slide-in-from-bottom-2">
            <label className="text-[10px] text-orange-600 font-black uppercase tracking-widest mb-2 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" /> Synthetic Voice Relay
            </label>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input autoFocus type="text" value={responseValue} onChange={(e) => setResponseValue(e.target.value)} placeholder="Type instructions..." className="flex-1 bg-white border-2 border-orange-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 font-medium" />
              <button type="submit" className="bg-orange-600 hover:bg-orange-700 p-3 rounded-xl text-white shadow-lg transition-transform active:scale-90"><Send className="w-5 h-5" /></button>
            </form>
          </div>
        )}

        <div className={`mt-auto ${isDispatched ? 'opacity-30' : ''}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 block">Service Overrides</span>
            <div className="grid grid-cols-3 gap-3">
                <button onClick={() => onOverride("Ambulance")} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-red-400 text-slate-600 hover:text-red-700 p-3 rounded-xl flex flex-col items-center gap-2 transition-all text-xs font-black shadow-sm">
                    <Stethoscope className="w-5 h-5 text-red-500" /> Medical
                </button>
                <button onClick={() => onOverride("Fire Dept")} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-orange-400 text-slate-600 hover:text-orange-700 p-3 rounded-xl flex flex-col items-center gap-2 transition-all text-xs font-black shadow-sm">
                    <Truck className="w-5 h-5 text-orange-500" /> Fire
                </button>
                <button onClick={() => onOverride("Police")} className="bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 text-slate-600 hover:text-blue-700 p-3 rounded-xl flex flex-col items-center gap-2 transition-all text-xs font-black shadow-sm">
                    <Shield className="w-5 h-5 text-blue-500" /> Police
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RoutingDeck;
