'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Video, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Download, 
  Star, 
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Award,
  Loader2
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { FeedbackForm } from '@/components/feedback-form';
import { getSessionById, confirmSessionCompletion } from '@/app/actions/sessions';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await getSessionById(sessionId);
      if (data) setSession(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const handleConfirmCompletion = async () => {
    try {
      const res = await confirmSessionCompletion(sessionId);
      setToastMessage('Session mutually confirmed! Milestone progress updated.');
      
      if (res.status === 'completed') {
        setShowCelebration(true);
      }
      
      await loadSession();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
          <Loader2 className="w-12 h-12 animate-spin mb-4 text-sandow-500" />
          <p>Loading session details...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex flex-col items-center justify-center flex-1 text-slate-400">
          <p>Session not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {showCelebration && (
          <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-600/20 border border-orange-500/30 flex items-center justify-between shadow-[0_0_40px_-10px_rgba(245,158,11,0.3)] animate-fadeIn">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                Session Completed!
              </h2>
              <p className="text-sm text-slate-300 mt-1">Both participants confirmed. You've earned +1 Verified Interview credit.</p>
            </div>
          </div>
        )}

        {/* Main Session Banner Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            <div className="flex items-center space-x-5">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-white/10 bg-slate-800">
                  {session.partnerAvatar && <img src={session.partnerAvatar} alt={session.partnerName} className="w-full h-full object-cover" />}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#0A0A0A] p-1 rounded-full">
                  <ShieldCheck className="w-6 h-6 text-sandow-400" />
                </div>
              </div>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
                  Mock with {session.partnerName}
                </h1>
                <div className="text-sm text-sandow-400 font-semibold mb-3">
                  {session.partnerRole} • {session.format}
                </div>
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    {new Date(session.scheduledAt).toLocaleDateString(undefined, { 
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    {session.durationMinutes} min
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <a
                href={session.jitsiRoomUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition"
              >
                <Video className="w-4 h-4" />
                <span>Join Room</span>
              </a>
              <button className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition">
                <Calendar className="w-4 h-4" />
                <span>Add to Cal</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Tracker & Confirmation */}
        <div className="bg-[#0f1219] border border-white/5 rounded-2xl p-6 sm:p-8 mb-8">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            Session Status
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              session.userConfirmed ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className="font-semibold">Your Confirmation</span>
              {session.userConfirmed ? (
                <span className="inline-flex items-center gap-1 font-bold text-teal-400">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : (
                <span>Pending</span>
              )}
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              session.partnerConfirmed ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className="font-semibold">{session.partnerName}&apos;s Confirmation</span>
              {session.partnerConfirmed ? (
                <span className="inline-flex items-center gap-1 font-bold text-teal-400">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : (
                <span>Awaiting partner</span>
              )}
            </div>
          </div>

          {!session.userConfirmed && (
            <button
              onClick={handleConfirmCompletion}
              className="w-full py-3 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition text-xs shadow-lg shadow-teal-500/20"
            >
              Mark Session as Completed
            </button>
          )}

          {session.status === 'completed' && (
            <div className="mt-4 p-4 rounded-xl bg-sandow-500/10 border border-sandow-500/20 text-center text-sm text-sandow-200">
              This session was successfully completed.
            </div>
          )}
        </div>

        {/* Feedback Section (Visible only if completed) */}
        {session.status === 'completed' && (
          <div className="mt-8">
            <FeedbackForm 
              partnerName={session.partnerName} 
              onSubmitFeedback={(data) => console.log('Feedback submitted:', data)} 
            />
          </div>
        )}

      </main>
    </div>
  );
}
