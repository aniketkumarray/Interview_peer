'use client';

import React, { useState } from 'react';
import { Star, Send, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FeedbackFormProps {
  partnerName: string;
  onSubmitFeedback: (feedback: any) => void;
}

export function FeedbackForm({ partnerName, onSubmitFeedback }: FeedbackFormProps) {
  const [preparedness, setPreparedness] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [helpfulness, setHelpfulness] = useState<number>(5);
  const [strengths, setStrengths] = useState('Great structured breakdown, clear trade-off analysis, and realistic scenario handling.');
  const [growthAreas, setGrowthAreas] = useState('Could clarify API error responses earlier during the interview.');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitFeedback({
      preparednessRating: preparedness,
      communicationRating: communication,
      helpfulnessRating: helpfulness,
      strengths,
      growthAreas,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="p-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-center animate-fadeIn">
        <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-white">Private Feedback Submitted!</h3>
        <p className="text-xs text-slate-300 mt-1">
          Thank you for helping {partnerName} grow. Your private feedback has been delivered securely.
        </p>
      </div>
    );
  }

  const renderStars = (rating: number, setRating: (val: number) => void) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          className="p-1 focus:outline-none transition hover:scale-110"
        >
          <Star
            className={`w-5 h-5 ${
              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="glass-panel p-6 rounded-2xl border border-white/10">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
          <Star className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-white">Private Peer Feedback for {partnerName}</h3>
          <p className="text-xs text-slate-400">Constructive feedback (visible only to recipient)</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Preparedness
            </label>
            {renderStars(preparedness, setPreparedness)}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Communication
            </label>
            {renderStars(communication, setCommunication)}
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Helpfulness
            </label>
            {renderStars(helpfulness, setHelpfulness)}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Key Strengths
          </label>
          <textarea
            rows={2}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
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
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Feedback</span>
          </button>
        </div>
      </form>
    </div>
  );
}
