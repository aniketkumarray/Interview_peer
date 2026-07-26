'use client';

import React, { useState } from 'react';
import { Search, Filter, Sparkles, RefreshCw } from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { PeerCard } from '@/components/peer-card';
import { SendInvitationModal } from '@/components/send-invitation-modal';
import { MOCK_PEERS } from '@/lib/demo-store';
import { UserProfile, InterviewFormat } from '@/types';

export default function DiscoverPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<string>('ALL');
  const [selectedExpFilter, setSelectedExpFilter] = useState<string>('ALL');
  const [selectedPeerForInvite, setSelectedPeerForInvite] = useState<UserProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredPeers = MOCK_PEERS.filter((peer) => {
    const matchesSearch =
      peer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.targetRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
      peer.bio.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFormat =
      selectedFormatFilter === 'ALL' || peer.formats.includes(selectedFormatFilter as InterviewFormat);

    const matchesExp = selectedExpFilter === 'ALL' || peer.experienceLevel.includes(selectedExpFilter);

    return matchesSearch && matchesFormat && matchesExp;
  });

  const handleSendInvitation = (data: any) => {
    setToastMessage(`Invitation successfully sent! Check your Outgoing Invitations tab.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toast Alert */}
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-sm font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-teal-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              <span>Discover Practice Peers</span>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {filteredPeers.length} Available
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Find partners targeting your role and schedule 1-on-1 reciprocal mock sessions.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by role (e.g. Full Stack, Staff Engineer, PM), skills, or bio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-400"
              />
            </div>

            {/* Format Filter */}
            <select
              value={selectedFormatFilter}
              onChange={(e) => setSelectedFormatFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none"
            >
              <option value="ALL">All Formats</option>
              <option value="System Design">System Design</option>
              <option value="Coding">Coding</option>
              <option value="Behavioral">Behavioral</option>
              <option value="Product Management">Product Management</option>
              <option value="Case Interview">Case Interview</option>
            </select>

            {/* Experience Filter */}
            <select
              value={selectedExpFilter}
              onChange={(e) => setSelectedExpFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-white text-sm focus:outline-none"
            >
              <option value="ALL">All Experience Levels</option>
              <option value="Entry-level">Entry-level (0-2 yrs)</option>
              <option value="Mid-level">Mid-level (3-5 yrs)</option>
              <option value="Senior">Senior (6+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Peers Grid */}
        {filteredPeers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPeers.map((peer) => (
              <PeerCard
                key={peer.id}
                peer={peer}
                onInviteClick={(p) => setSelectedPeerForInvite(p)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 glass-panel rounded-2xl border border-white/10 p-8">
            <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No matching peers found</h3>
            <p className="text-slate-400 text-sm mt-1">Try relaxing your search terms or format filters.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFormatFilter('ALL');
                setSelectedExpFilter('ALL');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-teal-300 hover:bg-slate-700 transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Send Invitation Modal */}
        <SendInvitationModal
          peer={selectedPeerForInvite}
          onClose={() => setSelectedPeerForInvite(null)}
          onSend={handleSendInvitation}
        />
      </main>
    </div>
  );
}
