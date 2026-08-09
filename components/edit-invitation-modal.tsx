'use client';

import React, { useState, useEffect } from 'react';
import { X, Edit3, Calendar, Clock } from 'lucide-react';
import { Invitation, InterviewFormat } from '@/types';
import { getFutureDateTime } from '@/lib/date-utils';

interface EditInvitationModalProps {
  invitation: Invitation | null;
  onClose: () => void;
  onSave: (invitationId: string, updatedData: {
    format: string;
    durationMinutes: number;
    note: string;
    proposedSlots: string[];
  }) => void;
}

export function EditInvitationModal({ invitation, onClose, onSave }: EditInvitationModalProps) {
  if (!invitation) return null;

  // Form formats list
  const formats: InterviewFormat[] = ['Behavioral', 'Domain / Role-Specific', 'Case Interview', 'Coding / Technical', 'System Design', 'Analytical / Quantitative', 'HR & Culture Fit'];

  const [selectedFormat, setSelectedFormat] = useState<string>(invitation.format);
  const [duration, setDuration] = useState<number>(invitation.durationMinutes || 45);
  const [note, setNote] = useState<string>(invitation.note || '');

  // Helper to format ISO string to YYYY-MM-DDTHH:mm for datetime-local
  const formatIsoToLocalInput = (isoString?: string) => {
    if (!isoString) return getFutureDateTime(1, 18);
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return getFutureDateTime(1, 18);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const [slot1, setSlot1] = useState(() => formatIsoToLocalInput(invitation.proposedSlots[0]));
  const [slot2, setSlot2] = useState(() => formatIsoToLocalInput(invitation.proposedSlots[1] || getFutureDateTime(2, 19)));
  const [slot3, setSlot3] = useState(() => formatIsoToLocalInput(invitation.proposedSlots[2] || getFutureDateTime(3, 17)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(invitation.id, {
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
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Edit3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white">Edit Sent Invitation</h3>
            <p className="text-xs text-slate-400">Update request details before recipient responds</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Interview Format
            </label>
            <select
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-sandow-500"
            >
              {formats.map((fmt) => (
                <option key={fmt} value={fmt}>
                  {fmt}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Session Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 45, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition border ${
                    duration === d
                      ? 'bg-sandow-500/20 border-sandow-500 text-sandow-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {d} mins
                </button>
              ))}
            </div>
          </div>

          {/* Proposed Time Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Propose Up to 3 Time Slots
            </label>
            <div className="space-y-2">
              <input
                type="datetime-local"
                value={slot1}
                onChange={(e) => setSlot1(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
              <input
                type="datetime-local"
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
              <input
                type="datetime-local"
                value={slot3}
                onChange={(e) => setSlot3(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500"
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Personal Note / Agenda
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-sandow-500"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg shadow-amber-500/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
