
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
    <div className="bg-white rounded-2xl border border-slate-200 h-full p-4 flex flex-col shadow-sm">
       <div className="text-[10px] text-slate-400 mb-4 font-black tracking-widest flex justify-between px-2 uppercase">
            <span>Core Latency (S)</span>
            <span className="text-blue-600">Secure Uplink</span>
       </div>
       <div className="flex-1 w-full min-h-[80px]">
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 1]} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '10px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#2563eb' }}
                    labelStyle={{ display: 'none' }}
                />
                <Line type="monotone" dataKey="latency" stroke="#2563eb" strokeWidth={3} dot={false} />
            </LineChart>
        </ResponsiveContainer>
       </div>
    </div>
  );
};

export default StatsPanel;
