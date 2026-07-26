'use client';

import React, { useState } from 'react';
import { X, Send, Calendar, Clock, Sparkles } from 'lucide-react';
import { UserProfile, InterviewFormat } from '@/types';

interface SendInvitationModalProps {
  peer: UserProfile | null;
  onClose: () => void;
  onSend: (invitationData: any) => void;
}

export function SendInvitationModal({ peer, onClose, onSend }: SendInvitationModalProps) {
  if (!peer) return null;

  const [selectedFormat, setSelectedFormat] = useState<InterviewFormat>(peer.formats[0] || 'System Design');
  const [duration, setDuration] = useState<30 | 45 | 60>(45);
  const [note, setNote] = useState(`Hi ${peer.name.split(' ')[0]}! Would love to swap reciprocal mock interviews on ${selectedFormat}. Let me know if any of these times work!`);
  const [slot1, setSlot1] = useState('2026-07-28T18:00');
  const [slot2, setSlot2] = useState('2026-07-29T19:00');
  const [slot3, setSlot3] = useState('2026-07-30T17:00');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend({
      peerId: peer.id,
      format: selectedFormat,
      durationMinutes: duration,
      note,
      proposedSlots: [slot1, slot2, slot3].filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Invite {peer.name} to Mock Practice</h3>
            <p className="text-xs text-slate-400">Reciprocal interview invitation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Interview Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as InterviewFormat)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none"
            >
              {peer.formats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Session Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d as any)}
                  className={`py-2 rounded-xl text-xs font-bold border transition ${
                    duration === d
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {d} mins
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Propose Up To 3 Time Slots ({peer.timezone})
            </label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              />
              <input
                type="datetime-local"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              />
              <input
                type="datetime-local"
                value={slot3}
                onChange={(e) => setSlot3(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Personal Note / Agenda
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 hover:scale-[1.02] transition"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
