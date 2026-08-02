'use client';

import React, { useState } from 'react';
import { Star, Send, CheckCircle2, Mic, Brain, MessageSquare, HelpCircle, Target } from 'lucide-react';

// Role-specific rating dimensions
const INTERVIEWER_DIMENSIONS = [
  { key: 'problemSolving', label: 'Problem-Solving Approach', icon: Brain, description: 'How well did they break down and solve the problem?' },
  { key: 'communication', label: 'Communication & Articulation', icon: MessageSquare, description: 'How clearly did they explain their thought process?' },
  { key: 'technicalDepth', label: 'Technical Depth', icon: Target, description: 'How deep was their technical knowledge?' },
];

const INTERVIEWEE_DIMENSIONS = [
  { key: 'questionQuality', label: 'Question Quality & Clarity', icon: HelpCircle, description: 'Were the questions well-structured and clear?' },
  { key: 'guidance', label: 'Hint Delivery & Guidance', icon: Mic, description: 'How helpful were the hints when you got stuck?' },
  { key: 'feedbackQuality', label: 'Constructive Feedback Quality', icon: MessageSquare, description: 'How useful was the feedback after the interview?' },
];

interface FeedbackFormProps {
  partnerName: string;
  role: 'interviewer' | 'interviewee';
  onSubmitFeedback: (feedback: {
    role: 'interviewer' | 'interviewee';
    ratings: Record<string, number>;
    strengths: string;
    growthAreas: string;
  }) => void;
  disabled?: boolean;
}

export function FeedbackForm({ partnerName, role, onSubmitFeedback, disabled }: FeedbackFormProps) {
  const dimensions = role === 'interviewer' ? INTERVIEWER_DIMENSIONS : INTERVIEWEE_DIMENSIONS;
  const roleLabel = role === 'interviewer' ? 'Interviewer' : 'Interviewee';
  const partnerRoleLabel = role === 'interviewer' ? 'Interviewee' : 'Interviewer';

  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(dimensions.map(d => [d.key, 4]))
  );
  const [strengths, setStrengths] = useState('');
  const [growthAreas, setGrowthAreas] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmitFeedback({ role, ratings, strengths, growthAreas });
      setSubmitted(true);
    } catch (err: any) {
      alert(err.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (disabled) {
    return (
      <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center animate-fadeIn">
        <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Feedback Already Submitted!</h3>
        <p className="text-xs text-slate-300 mt-1">
          You have already submitted your {roleLabel.toLowerCase()} feedback for this session.
        </p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center animate-fadeIn">
        <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Feedback Submitted!</h3>
        <p className="text-xs text-slate-300 mt-1">
          Thank you for rating {partnerName} as {partnerRoleLabel.toLowerCase()}. Your feedback helps the community grow.
        </p>
        <p className="text-xs text-slate-400 mt-2">
          Score will update once both participants have submitted feedback.
        </p>
      </div>
    );
  }

  const renderStars = (key: string) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRatings(prev => ({ ...prev, [key]: star }))}
          className="p-1 focus:outline-none transition hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              star <= (ratings[key] || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
          role === 'interviewer' 
            ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' 
            : 'bg-sandow-500/20 text-sandow-400 border-sandow-500/30'
        }`}>
          <Star className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">
            Rate {partnerName} as {partnerRoleLabel}
          </h3>
          <p className="text-xs text-slate-400">
            You were the <span className="font-semibold text-slate-200">{roleLabel}</span> — rate your partner&apos;s {partnerRoleLabel.toLowerCase()} skills
          </p>
        </div>
      </div>

      {/* Role indicator badge */}
      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-5 ${
        role === 'interviewer'
          ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30'
          : 'bg-sandow-500/15 text-sandow-300 border border-sandow-500/30'
      }`}>
        <span>{role === 'interviewer' ? '🎤' : '💼'}</span>
        <span>Your role: {roleLabel}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {dimensions.map((dim) => {
            const Icon = dim.icon;
            return (
              <div key={dim.key} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-3.5 h-3.5 text-slate-400" />
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {dim.label}
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 mb-2">{dim.description}</p>
                {renderStars(dim.key)}
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Key Strengths
          </label>
          <textarea
            rows={2}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder={role === 'interviewer' 
              ? "What did they do well as an interviewee? (e.g., great problem breakdown, clear communication...)"
              : "What did they do well as an interviewer? (e.g., realistic questions, helpful hints...)"
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500 placeholder:text-slate-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Areas for Growth
          </label>
          <textarea
            rows={2}
            value={growthAreas}
            onChange={(e) => setGrowthAreas(e.target.value)}
            placeholder={role === 'interviewer'
              ? "How could they improve? (e.g., could structure answers better, need deeper technical depth...)"
              : "How could they improve as an interviewer? (e.g., give more time to think, clearer follow-ups...)"
            }
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500 placeholder:text-slate-600"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
