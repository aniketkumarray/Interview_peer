'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Inbox, Send, History, CheckCircle2 } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { InvitationCard } from '@/components/invitation-card';
import { CounterOfferModal } from '@/components/counter-offer-modal';
import { MOCK_INVITATIONS } from '@/lib/demo-store';
import { Invitation } from '@/types';

export default function InvitationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'history'>('incoming');
  const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
  const [counterTarget, setCounterTarget] = useState<Invitation | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const incomingList = invitations.filter((inv) => inv.receiverId === 'usr_me');
  const outgoingList = invitations.filter((inv) => inv.senderId === 'usr_me');
  const historyList = invitations.filter((inv) => inv.status === 'accepted' || inv.status === 'declined');

  const handleAccept = (invitation: Invitation, selectedSlot: string) => {
    // Mark as accepted and redirect to newly scheduled session
    const updated = invitations.map((inv) =>
      inv.id === invitation.id ? { ...inv, status: 'accepted' as const, selectedSlot } : inv
    );
    setInvitations(updated);
    setToastMessage(`Invitation accepted! Dynamic Jitsi meeting room created.`);

    setTimeout(() => {
      router.push('/sessions/sess_101');
    }, 1500);
  };

  const handleCounterSubmit = (invitationId: string, newSlots: string[], note: string) => {
    const updated = invitations.map((inv) =>
      inv.id === invitationId ? { ...inv, status: 'countered' as const, proposedSlots: newSlots, note } : inv
    );
    setInvitations(updated);
    setToastMessage(`Counter-offer submitted to ${counterTarget?.senderName}!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDecline = (invitationId: string) => {
    const updated = invitations.map((inv) =>
      inv.id === invitationId ? { ...inv, status: 'declined' as const } : inv
    );
    setInvitations(updated);
    setToastMessage(`Invitation declined.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span>Invitations & Scheduling</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                {incomingList.length} Incoming
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage incoming interview requests, send counter-offers, and view scheduled history.
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 border-b border-white/10 mb-8 pb-3">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'incoming'
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Incoming ({incomingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outgoing')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'outgoing'
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Outgoing ({outgoingList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-teal-500/20 border border-teal-500/40 text-teal-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>History ({historyList.length})</span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'incoming' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incomingList.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                type="incoming"
                onAccept={handleAccept}
                onCounter={(i) => setCounterTarget(i)}
                onDecline={handleDecline}
              />
            ))}
          </div>
        )}

        {activeTab === 'outgoing' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {outgoingList.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} type="outgoing" />
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {historyList.map((inv) => (
              <InvitationCard key={inv.id} invitation={inv} type="history" />
            ))}
          </div>
        )}

        {/* Counter Offer Modal */}
        <CounterOfferModal
          invitation={counterTarget}
          onClose={() => setCounterTarget(null)}
          onSubmit={handleCounterSubmit}
        />
      </main>
    </div>
  );
}
