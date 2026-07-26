'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Trophy, Award, Users, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { MOCK_LEADERBOARD, MOCK_CURRENT_USER } from '@/lib/demo-store';

export default function LeaderboardPage() {
  const [optIn, setOptIn] = useState(MOCK_CURRENT_USER.leaderboardOptIn);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleToggleOptIn = () => {
    const nextState = !optIn;
    setOptIn(nextState);
    setToastMessage(
      nextState
        ? 'You have opted into the Weekly Leaderboard! Your verified sessions will now appear on rankings.'
        : 'You have opted out of the Weekly Leaderboard. Your milestone badges remain intact.'
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>Weekly Top 20 Rankings</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Peer Practice Leaderboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Ranks opted-in job seekers by verified mock interviews completed this UTC week.
            </p>
          </div>

          {/* Opt-In Toggle Button */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center space-x-4 shrink-0">
            <div>
              <div className="text-xs font-bold text-white">Leaderboard Participation</div>
              <div className="text-[11px] text-slate-400">{optIn ? 'Active (Opted-in)' : 'Hidden (Opted-out)'}</div>
            </div>
            <button
              onClick={handleToggleOptIn}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                optIn
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {optIn ? 'Opt-Out' : 'Opt-In Now'}
            </button>
          </div>
        </div>

        {/* Leaderboard Table Card */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-400" />
              Ties broken by <strong>Unique Practice Partners</strong> count.
            </span>
            <span>Week resets Sunday 23:59 UTC</span>
          </div>

          <div className="divide-y divide-white/5">
            {MOCK_LEADERBOARD.map((entry) => {
              const isCurrentUser = entry.userId === MOCK_CURRENT_USER.id;

              return (
                <div
                  key={entry.userId}
                  className={`p-4 sm:p-5 flex items-center justify-between gap-4 transition ${
                    isCurrentUser
                      ? 'bg-gradient-to-r from-teal-500/10 via-violet-500/10 to-transparent border-l-4 border-l-teal-400'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {/* Rank Indicator */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm ${
                      entry.rank === 1 ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20' :
                      entry.rank === 2 ? 'bg-slate-300 text-slate-950' :
                      entry.rank === 3 ? 'bg-amber-700 text-white' :
                      'bg-slate-900 border border-slate-800 text-slate-400'
                    }`}>
                      #{entry.rank}
                    </div>

                    {/* Avatar & User Details */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0">
                      <Image src={entry.avatarUrl} alt={entry.name} fill className="object-cover" />
                    </div>

                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{entry.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-semibold border border-teal-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{entry.targetRole}</div>
                    </div>
                  </div>

                  {/* Badge & Weekly Stats */}
                  <div className="flex items-center space-x-6 text-right">
                    <div className="hidden sm:block text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold">
                        {entry.currentBadge}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-base text-teal-400">{entry.weeklyCount} Mocks</div>
                      <div className="text-[11px] text-slate-400">{entry.uniquePartnersCount} unique partners</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
