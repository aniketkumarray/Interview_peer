'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Video, Clock, CheckCircle2, Loader2, Award } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { getSessions } from '@/app/actions/sessions';

export default function SessionsIndexPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSessions();
        setSessions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const upcoming = sessions.filter(s => s.status === 'scheduled');
  const past = sessions.filter(s => s.status !== 'scheduled');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-sandow-500" />
            <span>My Sessions</span>
          </h1>
          <p className="text-slate-400 mt-2">Manage your upcoming mock interviews and view past session history.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-sandow-500" />
            <p>Loading sessions...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Upcoming Sessions */}
            <section>
              <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Upcoming Sessions</h2>
              {upcoming.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {upcoming.map(session => (
                    <Link href={`/sessions/${session.id}`} key={session.id} className="glass-card p-5 rounded-2xl group cursor-pointer block">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 border border-white/10">
                            {session.partnerAvatar && <img src={session.partnerAvatar} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-sandow-400 transition-colors">{session.partnerName}</div>
                            <div className="text-xs text-slate-400">{session.partnerRole}</div>
                          </div>
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/30">
                          {session.format}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300 bg-black/30 p-3 rounded-xl border border-white/5">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-sandow-400" />
                          {new Date(session.scheduledAt).toLocaleDateString(undefined, { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-sandow-400" />
                          {session.durationMinutes} min
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                  <Video className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No upcoming sessions. Head to Discover to find peers!</p>
                </div>
              )}
            </section>

            {/* Past Sessions */}
            {past.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-2">Past Sessions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {past.map(session => (
                    <Link href={`/sessions/${session.id}`} key={session.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/50 hover:bg-slate-900 transition-colors block">
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-white">{session.partnerName}</div>
                        {session.status === 'completed' && <Award className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(session.scheduledAt).toLocaleDateString()} • {session.format}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
