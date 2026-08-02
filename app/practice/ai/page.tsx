'use client';

import React, { useState } from 'react';
import { Bot, Play, Settings2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { AIInterviewRoom } from '@/components/ai-interview-room';
import { InterviewFormat } from '@/types';

const INTERVIEW_FORMATS: InterviewFormat[] = [
  'Behavioral',
  'System Design',
  'Coding',
  'Product Management',
  'Case Interview',
  'HR & Culture'
];

export default function AIPracticePage() {
  const [started, setStarted] = useState(false);
  const [format, setFormat] = useState<InterviewFormat>(INTERVIEW_FORMATS[0]);
  const [domain, setDomain] = useState('');

  if (started) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
          <AIInterviewRoom 
            format={format} 
            domain={domain || 'General Tech'} 
            onReset={() => setStarted(false)}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Header matching Invitations/Sessions/Leaderboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sandow-500/20 border border-sandow-500/30 text-sandow-400 text-xs font-semibold mb-2">
              <Bot className="w-3.5 h-3.5" />
              <span>AI Practice Bot</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">AI Mock Interviewer</h1>
            <p className="text-slate-400 text-sm mt-1">
              Practice 1-on-1 voice interviews with our AI coach. Answer 4 tailored questions, then receive a comprehensive performance evaluation.
            </p>
          </div>
        </div>

        {/* Configuration Card matching app glass-panel cards */}
        <div className="glass-panel rounded-2xl border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
            <div className="p-2 rounded-xl bg-sandow-500/10 border border-sandow-500/20 text-sandow-400">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Configure Your Session</h2>
              <p className="text-xs text-slate-400">Select your interview format and target role</p>
            </div>
          </div>

          <div className="space-y-5">
            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Interview Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as InterviewFormat)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500 appearance-none"
              >
                {INTERVIEW_FORMATS.map(f => (
                  <option key={f} value={f} className="bg-slate-900 text-white">{f}</option>
                ))}
              </select>
            </label>

            <label className="block space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Target Role / Domain</span>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer, Product Manager, Data Scientist..."
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sandow-500"
                required
              />
            </label>
          </div>

          <div className="pt-4">
            <button
              onClick={() => setStarted(true)}
              disabled={!domain.trim()}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl text-sm font-bold bg-sandow-500 hover:bg-sandow-400 text-white shadow-md shadow-sandow-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start AI Mock Practice</span>
            </button>
            <p className="text-center text-xs text-slate-500 mt-4">
              Powered by Chrome Web Speech API & Google Gemini AI • Microphone access required
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
