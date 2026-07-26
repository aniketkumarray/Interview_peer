'use client';

import React from 'react';
import { Calendar, Clock, Check, X, RefreshCw, Send, CheckCircle2 } from 'lucide-react';
import { Invitation } from '@/types';

interface InvitationCardProps {
  invitation: Invitation;
  type: 'incoming' | 'outgoing' | 'history';
  onAccept?: (invitation: Invitation, selectedSlot: string) => void;
  onCounter?: (invitation: Invitation) => void;
  onDecline?: (invitationId: string) => void;
}

export function InvitationCard({ invitation, type, onAccept, onCounter, onDecline }: InvitationCardProps) {
  const [selectedSlot, setSelectedSlot] = React.useState<string>(
    invitation.proposedSlots[0] || invitation.selectedSlot || ''
  );

  return (
    <div className="glass-card p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="text-xs text-slate-400 font-medium">
              {type === 'incoming' ? `From: ${invitation.senderName}` : `To: ${invitation.receiverName}`}
            </div>
            <h3 className="text-lg font-bold text-white mt-0.5">{invitation.format} Mock Interview</h3>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            invitation.status === 'pending' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
            invitation.status === 'accepted' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
            invitation.status === 'countered' ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' :
            'bg-slate-800 text-slate-400'
          }`}>
            {invitation.status}
          </span>
        </div>

        <p className="text-xs text-slate-300 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 mb-4 italic">
          &ldquo;{invitation.note}&rdquo;
        </p>

        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Proposed Time Slots ({invitation.durationMinutes} mins)
        </div>

        <div className="space-y-2 mb-4">
          {invitation.proposedSlots.map((slot, idx) => {
            const dateStr = new Date(slot).toLocaleString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <label
                key={idx}
                className={`flex items-center space-x-3 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                  selectedSlot === slot
                    ? 'bg-teal-500/15 border-teal-500/50 text-white font-medium'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {type === 'incoming' && (
                  <input
                    type="radio"
                    name={`slot_${invitation.id}`}
                    value={slot}
                    checked={selectedSlot === slot}
                    onChange={() => setSelectedSlot(slot)}
                    className="accent-teal-400"
                  />
                )}
                <Calendar className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>{dateStr}</span>
              </label>
            );
          })}
        </div>
      </div>

      {type === 'incoming' && invitation.status === 'pending' && (
        <div className="pt-4 border-t border-white/5 flex flex-wrap gap-2 justify-end">
          <button
            onClick={() => onDecline?.(invitation.id)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Decline
          </button>
          <button
            onClick={() => onCounter?.(invitation)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-violet-600/30 hover:bg-violet-600/40 text-violet-300 border border-violet-500/40 transition"
          >
            Counter-Offer
          </button>
          <button
            onClick={() => onAccept?.(invitation, selectedSlot)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 shadow-md shadow-teal-500/15 transition"
          >
            Accept Slot
          </button>
        </div>
      )}
    </div>
  );
}
