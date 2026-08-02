'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Video, Calendar, Clock, CheckCircle2, Star, ArrowLeft,
  ShieldCheck, Award, Loader2, AlertTriangle, UserX, Mic, Briefcase
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { FeedbackForm } from '@/components/feedback-form';
import { getSessionById, confirmSessionCompletion } from '@/app/actions/sessions';
import { submitFeedback, checkFeedbackExists } from '@/app/actions/feedback';
import { reportNoShow } from '@/app/actions/no-show';

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<{ submitted: boolean; bothSubmitted: boolean }>({ submitted: false, bothSubmitted: false });
  const [showNoShowConfirm, setShowNoShowConfirm] = useState(false);
  const [noShowLoading, setNoShowLoading] = useState(false);

  const loadSession = async () => {
    try {
      setLoading(true);
      const data = await getSessionById(sessionId);
      if (data) setSession(data);

      // Check feedback status
      const fbStatus = await checkFeedbackExists(sessionId);
      setFeedbackStatus(fbStatus);
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
      setToastMessage('Session marked as completed!');
      if (res.status === 'completed') {
        setShowCelebration(true);
      }
      await loadSession();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleFeedbackSubmit = async (feedback: any) => {
    if (!session) return;
    await submitFeedback({
      sessionId,
      recipientId: session.partnerId,
      role: session.userRole,
      ratings: feedback.ratings,
      strengths: feedback.strengths,
      growthAreas: feedback.growthAreas,
    });
    await loadSession();
  };

  const handleReportNoShow = async () => {
    try {
      setNoShowLoading(true);
      const res = await reportNoShow(sessionId);
      setShowNoShowConfirm(false);
      setToastMessage(res.message || 'No-show reported successfully.');
      await loadSession();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setNoShowLoading(false);
    }
  };

  // Check if session time has passed (for no-show eligibility)
  const isSessionTimePassed = session
    ? new Date() > new Date(new Date(session.scheduledAt).getTime() + session.durationMinutes * 60000)
    : false;

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
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between animate-fadeIn">
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
              <p className="text-sm text-slate-300 mt-1">Both participants confirmed. Submit feedback below to earn your verified interview credit.</p>
            </div>
          </div>
        )}

        {/* Role Badge */}
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold mb-6 ${
          session.userRole === 'interviewer'
            ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
            : 'bg-sandow-500/15 text-sandow-300 border border-sandow-500/30'
        }`}>
          {session.userRole === 'interviewer' ? <Mic className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
          <span>Your role: {session.userRole === 'interviewer' ? 'Interviewer (Host)' : 'Interviewee'}</span>
        </div>

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
              {session.status === 'scheduled' && (
                <>
                  <a
                    href={session.jitsiRoomUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition"
                  >
                    <Video className="w-4 h-4" />
                    <span>{session.userRole === 'interviewer' ? 'Start Room (Host)' : 'Join Room'}</span>
                  </a>
                  <button className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition">
                    <Calendar className="w-4 h-4" />
                    <span>Add to Cal</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Status Tracker & Confirmation */}
        <div className="bg-[#0f1219] border border-white/5 rounded-2xl p-6 sm:p-8 mb-8">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            Session Status
            {session.status === 'no_show' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 uppercase">No-Show</span>
            )}
            {session.status === 'disputed' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Disputed</span>
            )}
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

          {/* Action Buttons */}
          {session.status === 'scheduled' && (
            <div className="flex flex-col sm:flex-row gap-3">
              {!session.userConfirmed && (
                <button
                  onClick={handleConfirmCompletion}
                  className="flex-1 py-3 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition text-xs shadow-lg shadow-teal-500/20"
                >
                  ✅ Mark Session as Completed
                </button>
              )}

              {/* No-Show Button — only visible after session time has passed */}
              {isSessionTimePassed && !session.userConfirmed && (
                <button
                  onClick={() => setShowNoShowConfirm(true)}
                  className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition text-xs"
                >
                  <UserX className="w-4 h-4 inline mr-1.5" />
                  Report Partner No-Show
                </button>
              )}
            </div>
          )}

          {session.status === 'completed' && (
            <div className="mt-4 p-4 rounded-xl bg-sandow-500/10 border border-sandow-500/20 text-center text-sm text-sandow-200">
              This session was successfully completed.
              {!feedbackStatus.bothSubmitted && (
                <span className="block text-xs text-slate-400 mt-1">
                  Score will update once both participants submit feedback.
                </span>
              )}
              {feedbackStatus.bothSubmitted && (
                <span className="block text-xs text-teal-300 mt-1 font-semibold">
                  ✅ Both feedbacks submitted — verified interview credit awarded!
                </span>
              )}
            </div>
          )}

          {session.status === 'no_show' && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-200">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              A no-show was reported for this session. The absent party&apos;s public stats have been updated.
            </div>
          )}

          {session.status === 'disputed' && (
            <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center text-sm text-amber-200">
              <AlertTriangle className="w-5 h-5 inline mr-2" />
              Both participants reported the other as no-show. This session is under review.
            </div>
          )}
        </div>

        {/* No-Show Confirmation Dialog */}
        {showNoShowConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel w-full max-w-md rounded-2xl border border-white/10 p-6 shadow-2xl">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Report No-Show</h3>
                  <p className="text-xs text-slate-400">This action has consequences</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-200">
                  <strong>⚠️ What happens:</strong>
                  <ul className="mt-1.5 space-y-1 text-red-300/80">
                    <li>• {session.partnerName}&apos;s no-show count will increase by 1</li>
                    <li>• This will be visible on their public profile</li>
                    <li>• If they also report you, the session becomes &quot;disputed&quot;</li>
                  </ul>
                </div>
                <p className="text-xs text-slate-300">
                  Only report a no-show if your partner genuinely did not attend the session. False reports may lead to disputes on your own record.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowNoShowConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportNoShow}
                  disabled={noShowLoading}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition disabled:opacity-50"
                >
                  {noShowLoading ? 'Reporting...' : 'Confirm No-Show Report'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Section (only for completed sessions) */}
        {session.status === 'completed' && (
          <div className="mt-8">
            <FeedbackForm
              partnerName={session.partnerName}
              role={session.userRole}
              onSubmitFeedback={handleFeedbackSubmit}
              disabled={feedbackStatus.submitted}
            />
          </div>
        )}

      </main>
    </div>
  );
}
