'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Award, Info, ShieldCheck, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { getLeaderboard } from '@/app/actions/leaderboard';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getLeaderboard();
        setEntries(data.entries);
        setCurrentUserId(data.currentUserId);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sandow-500/15 border border-sandow-500/30 text-sandow-400 text-xs font-semibold mb-2">
            <Trophy className="w-3.5 h-3.5" />
            <span>Top 20 Rankings</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Peer Practice Leaderboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ranks opted-in job seekers by verified mock interviews completed. Score only counts after both participants confirm and submit feedback. You can manage your participation in your Profile settings.
          </p>
        </div>

        {/* Leaderboard Table Card */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="p-4 sm:p-6 bg-slate-900/60 border-b border-white/10 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-teal-400" />
              Scores update after <strong>both</strong> participants confirm session completion and submit feedback.
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="w-10 h-10 animate-spin mb-3 text-sandow-500" />
              <p className="text-sm">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Trophy className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No participants yet. Be the first to opt in!</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {entries.map((entry: any) => {
                const isCurrentUser = entry.userId === currentUserId;

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
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-slate-800">
                        {entry.avatarUrl && (
                          <img src={entry.avatarUrl} alt={entry.name} className="w-full h-full object-cover" />
                        )}
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
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{entry.targetRole}</span>
                          {entry.noShowCount > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-red-400/70">
                              <AlertTriangle className="w-3 h-3" />
                              {entry.noShowCount} no-show{entry.noShowCount !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Badge & Stats */}
                    <div className="flex items-center space-x-6 text-right">
                      <div className="hidden sm:block text-xs">
                        <span className="px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300 font-semibold">
                          {entry.currentBadge}
                        </span>
                      </div>

                      <div>
                        <div className="font-bold text-base text-teal-400">{entry.weeklyCount} Mocks</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
