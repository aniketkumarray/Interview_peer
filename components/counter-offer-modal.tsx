'use client';

import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { Invitation } from '@/types';
import { getFutureDateTime } from '@/lib/date-utils';

interface CounterOfferModalProps {
  invitation: Invitation | null;
  onClose: () => void;
  onSubmit: (invitationId: string, newSlots: string[], note: string) => void;
}

export function CounterOfferModal({ invitation, onClose, onSubmit }: CounterOfferModalProps) {
  if (!invitation) return null;

  const [slot1, setSlot1] = useState(() => getFutureDateTime(1, 18));
  const [slot2, setSlot2] = useState(() => getFutureDateTime(2, 19));
  const [note, setNote] = useState('Hey! The initial proposed slots overlap with my work schedule. Could any of these alternative times work for you?');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(invitation.id, [slot1, slot2].filter(Boolean), note);
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
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center border border-violet-500/30">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Send Counter-Offer Schedule</h3>
            <p className="text-xs text-slate-400">Propose new time slots to {invitation.senderName}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              New Proposed Times
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
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Reason / Note
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
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition"
            >
              Submit Counter-Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
