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
      
      if (isDanger) {
        return <span key={index} className="bg-red-900/50 text-red-200 font-bold px-1 rounded mx-0.5">{word}</span>;
      }
      return <span key={index} className="mx-0.5">{word}</span>;
    });
  };

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 flex flex-col h-full shadow-lg">
      <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="font-semibold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
          Live Transcript
        </h3>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded">WHISPER-V3-TURBO</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed space-y-2">
        {transcript.length === 0 ? (
          <div className="text-slate-500 italic text-center mt-10">Waiting for voice activity...</div>
        ) : (
            transcript.map((line, i) => (
                <div key={i} className={`p-2 rounded border-l-2 ${i % 2 === 0 ? 'border-blue-500 bg-slate-800/30' : 'border-indigo-500 bg-slate-800/10'}`}>
                    <span className="text-slate-500 text-xs mr-2 select-none">
                         {new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                    </span>
                    <span className="text-slate-200">
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