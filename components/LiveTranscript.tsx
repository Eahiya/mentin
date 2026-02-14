
import React, { useEffect, useRef } from 'react';
import { DANGER_KEYWORDS } from '../constants';

interface LiveTranscriptProps {
  transcript: string[];
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ transcript }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const highlightKeywords = (text: string) => {
    const words = text.split(' ');
    return words.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '');
      const isDanger = DANGER_KEYWORDS.some(kw => cleanWord.includes(kw) || kw.includes(cleanWord));
      if (isDanger) return <span key={index} className="bg-red-50 text-red-700 font-bold px-1 rounded border border-red-100">{word}</span>;
      return <span key={index} className="mx-0.5">{word}</span>;
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 flex flex-col h-full shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-900 flex items-center gap-2.5">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          Live Relay
        </h3>
        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Stream Secured</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {transcript.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-40">
             <div className="w-12 h-0.5 bg-slate-200 mb-2" />
             <div className="text-xs font-bold uppercase tracking-widest">Awaiting Signal</div>
          </div>
        ) : (
            transcript.map((line, i) => (
                <div key={i} className={`p-4 rounded-xl border-l-4 transition-all ${i % 2 === 0 ? 'border-blue-500 bg-blue-50/30' : 'border-slate-300 bg-slate-50/50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          {line.startsWith('[DISPATCHER]') ? 'System Out' : 'Caller In'}
                        </span>
                        <span className="text-[10px] text-slate-300 font-mono">
                          {new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                        </span>
                    </div>
                    <span className="text-slate-900 font-medium text-sm leading-relaxed block">
                        {highlightKeywords(line)}
                    </span>
                </div>
            ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LiveTranscript;
