'use client';

import React, { useState } from 'react';
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
  Award
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { FeedbackForm } from '@/components/feedback-form';
import { MOCK_SESSIONS } from '@/lib/demo-store';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const session = MOCK_SESSIONS.find((s) => s.id === sessionId) || MOCK_SESSIONS[0];

  const [userConfirmed, setUserConfirmed] = useState(session.user1Confirmed);
  const [partnerConfirmed, setPartnerConfirmed] = useState(session.user2Confirmed);
  const [sessionCompleted, setSessionCompleted] = useState(session.status === 'completed');
  const [showCelebration, setShowCelebration] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmCompletion = () => {
    setUserConfirmed(true);
    // Simulating dual confirmation for demo
    setPartnerConfirmed(true);
    setSessionCompleted(true);
    setShowCelebration(true);
    setToastMessage('Session mutually confirmed! Milestone progress updated.');
  };

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

        {/* Milestone Celebration Modal Callout */}
        {showCelebration && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-violet-900/60 via-indigo-900/60 to-teal-900/60 border border-teal-500/50 shadow-2xl text-center animate-fadeIn relative overflow-hidden">
            <div className="text-4xl mb-2">⚡</div>
            <h2 className="text-2xl font-extrabold text-white">Milestone Badge Unlocked!</h2>
            <p className="text-sm text-teal-200 mt-1 max-w-lg mx-auto">
              Congratulations! You unlocked the <strong className="text-white font-bold">Momentum</strong> badge (3 verified mock interviews completed).
            </p>
            <button
              onClick={() => setShowCelebration(false)}
              className="mt-4 px-6 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition"
            >
              Continue to Feedback
            </button>
          </div>
        )}

        {/* Main Session Banner Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 mb-8 relative">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold mb-3">
                <Video className="w-3.5 h-3.5" />
                <span>{session.format} Reciprocal Practice</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Mock Interview with {session.partnerName}
              </h1>

              <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  {new Date(session.scheduledAt).toLocaleString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-slate-500" />
                  {session.durationMinutes} minutes
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <a
                href={`/api/calendar/${session.id}`}
                download
                className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-semibold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 text-xs transition"
              >
                <Download className="w-4 h-4 text-teal-400" />
                <span>Download .ics Calendar</span>
              </a>

              <a
                href={session.jitsiRoomUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition text-xs"
              >
                <Video className="w-4 h-4" />
                <span>Join Jitsi Video Room</span>
                <ExternalLink className="w-3.5 h-3.5 ml-0.5 opacity-70" />
              </a>
            </div>
          </div>
        </div>

        {/* Dual Confirmation Status */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 mb-8">
          <h3 className="font-bold text-base text-white mb-2">Dual Session Completion Confirmation</h3>
          <p className="text-xs text-slate-400 mb-4">
            Sessions require mutual confirmation from both participants before counting toward milestone badges and leaderboards.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              userConfirmed ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className="font-semibold">Your Confirmation</span>
              {userConfirmed ? (
                <span className="inline-flex items-center gap-1 font-bold text-teal-400">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : (
                <span>Pending</span>
              )}
            </div>

            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              partnerConfirmed ? 'bg-teal-500/10 border-teal-500/40 text-teal-300' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              <span className="font-semibold">{session.partnerName}&apos;s Confirmation</span>
              {partnerConfirmed ? (
                <span className="inline-flex items-center gap-1 font-bold text-teal-400">
                  <CheckCircle2 className="w-4 h-4" /> Confirmed
                </span>
              ) : (
                <span>Awaiting partner</span>
              )}
            </div>
          </div>

          {!userConfirmed && (
            <button
              onClick={handleConfirmCompletion}
              className="w-full py-3 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition text-xs shadow-lg shadow-teal-500/20"
            >
              Mark Session Completed (I Finished This Interview)
            </button>
          )}
        </div>

        {/* Structured Feedback Form */}
        <FeedbackForm
          partnerName={session.partnerName || 'Peer'}
          onSubmitFeedback={(fb) => console.log('Feedback submitted:', fb)}
        />
      </main>
    </div>
  );
}
