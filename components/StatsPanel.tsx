
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T-5', latency: 0.2 },
  { name: 'T-4', latency: 0.3 },
  { name: 'T-3', latency: 0.1 },
  { name: 'T-2', latency: 0.4 },
  { name: 'T-1', latency: 0.3 },
  { name: 'NOW', latency: 0.2 },
];

const StatsPanel: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 h-full p-2 flex flex-col">
       <div className="text-[10px] text-slate-500 mb-2 font-mono flex justify-between px-2">
            <span>EDGE LATENCY (MS)</span>
            <span className="text-emerald-400">AIR-GAPPED: READY</span>
       </div>
       <div className="flex-1 w-full min-h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '10px' }}
                    itemStyle={{ color: '#10b981' }}
                    labelStyle={{ display: 'none' }}
                />
                <Line type="stepAfter" dataKey="latency" stroke="#10b981" strokeWidth={1.5} dot={false} />
            </LineChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};

export default StatsPanel;
