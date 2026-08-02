'use client';

import React, { useState } from 'react';
import { X, Send, Calendar, Clock, Sparkles } from 'lucide-react';
import { UserProfile, InterviewFormat } from '@/types';
import { getFutureDateTime } from '@/lib/date-utils';

interface SendInvitationModalProps {
  peer: UserProfile | null;
  onClose: () => void;
  onSend: (invitationData: {
    receiverId: string;
    format: string;
    durationMinutes: number;
    note: string;
    proposedSlots: string[];
  }) => void;
}

export function SendInvitationModal({ peer, onClose, onSend }: SendInvitationModalProps) {
  if (!peer) return null;

  const [selectedFormat, setSelectedFormat] = useState<InterviewFormat>(peer.formats[0] || 'System Design');
  const [duration, setDuration] = useState<30 | 45 | 60>(45);
  const [note, setNote] = useState(`Hi ${peer.name.split(' ')[0]}! Would love to swap reciprocal mock interviews on ${selectedFormat}. Let me know if any of these times work!`);
  const [slot1, setSlot1] = useState(() => getFutureDateTime(1, 18));
  const [slot2, setSlot2] = useState(() => getFutureDateTime(2, 19));
  const [slot3, setSlot3] = useState(() => getFutureDateTime(3, 17));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSend({
      receiverId: peer.id,
      format: selectedFormat,
      durationMinutes: duration,
      note,
      proposedSlots: [slot1, slot2, slot3].filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-[2rem] border border-white/10 p-6 shadow-2xl relative bg-[#0A0A0A] max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-sandow-500/20 text-sandow-400 flex items-center justify-center border border-sandow-500/30">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Invite {peer.name} to Mock Practice</h3>
            <p className="text-xs text-slate-400">Reciprocal interview invitation</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Interview Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as InterviewFormat)}
              className="w-full px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
            >
              {peer.formats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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
                      ? 'bg-sandow-500/20 border-sandow-500 text-sandow-400'
                      : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/10'
                  }`}
                >
                  {d} mins
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Propose Up To 3 Time Slots ({peer.timezone})
            </label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
              <input
                type="datetime-local"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
              <input
                type="datetime-local"
                value={slot3}
                onChange={(e) => setSlot3(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Personal Note / Agenda
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-black/50 border border-white/10 text-white text-xs focus:outline-none focus:border-sandow-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-bold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-full text-xs font-bold bg-sandow-500 hover:bg-sandow-400 text-white shadow-[0_0_15px_rgba(255,107,0,0.4)] transition"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
