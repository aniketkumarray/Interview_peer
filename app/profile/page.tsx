'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import { 
  User, 
  Briefcase, 
  Globe, 
  Award, 
  CheckCircle2, 
  ShieldAlert, 
  Trophy,
  Sparkles,
  Lock,
  Pencil,
  X,
  Check,
  Camera,
  Upload,
  Target,
  Clock,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import { Navbar } from '@/components/navbar';
import { ALL_BADGES } from '@/lib/demo-store';
import { getMilestoneProgress } from '@/lib/gamification';
import { useAuth } from '@/components/auth-context';
import { createClient } from '@/lib/supabase/client';
import { useSearchParams, useRouter } from 'next/navigation';
import { UserProfile, ExperienceLevel, InterviewFormat, AvailabilityWindow } from '@/types';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  
  const { user: authUser, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal States
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFormatsOpen, setIsFormatsOpen] = useState(tab === 'formats');
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(tab === 'availability');
  const [editForm, setEditForm] = useState({
    name: '',
    targetRole: '',
    experienceLevel: '',
    timezone: '',
    bio: '',
    avatarUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function fetchProfile() {
      if (authLoading) return;
      if (!authUser) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          profile_interview_types (format),
          availability_windows (id, day_of_week, start_time, end_time, timezone)
        `)
        .eq('id', authUser.id)
        .single();

      if (error || !data) {
        router.push('/onboarding');
      } else {
        const formats = (data.profile_interview_types || []).map((f: any) => f.format) as InterviewFormat[];
        const availability = (data.availability_windows || []).map((w: any) => ({
          id: w.id,
          dayOfWeek: w.day_of_week,
          startTime: w.start_time,
          endTime: w.end_time,
          timezone: w.timezone
        })) as AvailabilityWindow[];

        const profile: UserProfile = {
          id: data.id,
          name: data.name,
          email: data.email,
          avatarUrl: data.avatar_url,
          targetRole: data.target_role,
          industry: data.industry,
          experienceLevel: data.experience_level,
          timezone: data.timezone,
          bio: data.bio,
          formats: formats,
          availability: availability,
          verifiedInterviewCount: data.verified_interview_count,
          leaderboardOptIn: data.leaderboard_opt_in,
          languages: data.languages || ['English'],
          createdAt: data.created_at,
        };
        setUser(profile);
        setLeaderboardOptIn(data.leaderboard_opt_in);
        setEditForm({
          name: data.name || '',
          targetRole: data.target_role || '',
          experienceLevel: data.experience_level || '',
          timezone: data.timezone || '',
          bio: data.bio || '',
          avatarUrl: data.avatar_url || ''
        });
      }
      setLoading(false);
    }
    fetchProfile();
  }, [authUser, authLoading, router, supabase]);

  const handleToggleOptIn = async () => {
    if (!user) return;
    const nextState = !leaderboardOptIn;
    
    setLeaderboardOptIn(nextState);
    
    const { error } = await supabase
      .from('profiles')
      .update({ leaderboard_opt_in: nextState })
      .eq('id', user.id);
      
    if (!error) {
      setToastMessage(nextState ? 'Opted into Weekly Leaderboard!' : 'Opted out of Weekly Leaderboard.');
    } else {
      setLeaderboardOptIn(!nextState);
      setToastMessage('Failed to update preference.');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        name: editForm.name,
        target_role: editForm.targetRole,
        experience_level: editForm.experienceLevel,
        timezone: editForm.timezone,
        bio: editForm.bio,
        avatar_url: editForm.avatarUrl
      })
      .eq('id', user.id);

    setSaving(false);

    if (error) {
      setToastMessage('Failed to update profile.');
    } else {
      setUser((prev) => prev ? {
        ...prev,
        name: editForm.name,
        targetRole: editForm.targetRole,
        experienceLevel: editForm.experienceLevel as ExperienceLevel,
        timezone: editForm.timezone,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl
      } : null);
      setIsEditOpen(false);
      setToastMessage('Profile updated successfully!');
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('Image size must be under 5MB');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      setEditForm((prev) => ({ ...prev, avatarUrl: dataUrl }));

      // If uploaded from profile card directly, save immediately to DB
      if (user) {
        setUser((prev) => prev ? { ...prev, avatarUrl: dataUrl } : null);
        await supabase
          .from('profiles')
          .update({ avatar_url: dataUrl })
          .eq('id', user.id);
        setToastMessage('Profile picture updated successfully!');
        setTimeout(() => setToastMessage(null), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveFormats = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    // 1. Delete existing formats
    await supabase.from('profile_interview_types').delete().eq('profile_id', user.id);
    
    // 2. Insert new formats
    if (user.formats.length > 0) {
      const formatsToInsert = user.formats.map(fmt => ({
        profile_id: user.id,
        format: fmt
      }));
      await supabase.from('profile_interview_types').insert(formatsToInsert);
    }
    
    setSaving(false);
    setIsFormatsOpen(false);
    setToastMessage('Formats updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    
    // 1. Delete existing availability
    await supabase.from('availability_windows').delete().eq('profile_id', user.id);
    
    // 2. Insert new availability
    if (user.availability.length > 0) {
      const windowsToInsert = user.availability.map(win => ({
        profile_id: user.id,
        day_of_week: win.dayOfWeek,
        start_time: win.startTime,
        end_time: win.endTime,
        timezone: win.timezone
      }));
      await supabase.from('availability_windows').insert(windowsToInsert);
    }
    
    setSaving(false);
    setIsAvailabilityOpen(false);
    setToastMessage('Availability updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFormat = (fmt: InterviewFormat) => {
    if (!user) return;
    const current = user.formats || [];
    const updated = current.includes(fmt) 
      ? current.filter(f => f !== fmt) 
      : [...current, fmt];
    setUser({ ...user, formats: updated });
  };

  const addAvailabilityWindow = () => {
    if (!user) return;
    const newWindow: AvailabilityWindow = {
      id: `w_${Date.now()}`,
      dayOfWeek: 'Monday',
      startTime: '18:00',
      endTime: '21:00',
      timezone: user.timezone || 'UTC+05:30 (India Standard Time, IST / New Delhi, Mumbai)',
    };
    setUser({ ...user, availability: [...(user.availability || []), newWindow] });
  };

  const removeAvailabilityWindow = (id: string) => {
    if (!user) return;
    setUser({ ...user, availability: user.availability.filter(a => a.id !== id) });
  };

  const ALL_FORMATS: InterviewFormat[] = [
    'Behavioral',
    'Domain / Role-Specific',
    'Case Interview',
    'Coding / Technical',
    'System Design',
    'Analytical / Quantitative',
    'HR & Culture Fit',
  ];

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading profile...</p>
      </div>
    );
  }

  if (!user) return null;

  const { currentBadge, nextBadge, progressPercent } = getMilestoneProgress(user.verifiedInterviewCount);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {toastMessage && (
          <div className="mb-6 p-4 rounded-xl bg-sandow-500/20 border border-sandow-500/40 text-sandow-300 text-sm font-semibold flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-xs text-sandow-400 underline">Dismiss</button>
          </div>
        )}

        {/* Header Profile Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-[2rem] border border-white/10 mb-8 relative overflow-hidden bg-white/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar / Profile Picture */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-sandow-500/30 shrink-0 shadow-xl bg-black/50 flex items-center justify-center group cursor-pointer"
              title="Click to change profile picture"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-sandow-400" />
              )}
              {/* Overlay hover effect */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                <Camera className="w-5 h-5 text-sandow-400" />
                <span>Upload</span>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{user.name}</h1>
                  {currentBadge && (
                    <span className="px-3 py-1 rounded-full bg-sandow-500/20 text-sandow-400 border border-sandow-500/30 text-xs font-bold flex items-center gap-1">
                      <span>{currentBadge.icon}</span>
                      <span>{currentBadge.title}</span>
                    </span>
                  )}
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditOpen(true)}
                  className="px-4 py-2 rounded-full bg-sandow-500 hover:bg-sandow-400 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.4)] transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              </div>

              <div className="text-xs text-slate-300 font-medium mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-sandow-400 font-bold">{user.targetRole}</span>
                <span>•</span>
                <span>{user.experienceLevel}</span>
                <span>•</span>
                <span>{user.timezone}</span>
              </div>

              <p className="mt-3 text-xs text-slate-300 leading-relaxed max-w-2xl">
                {user.bio || 'No bio added yet.'}
              </p>
            </div>
          </div>
        </div>

        {/* Formats and Availability Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Formats Card */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-sandow-400" />
                <span>Interview Formats</span>
              </h3>
              <button
                onClick={() => setIsFormatsOpen(true)}
                className="text-xs text-sandow-400 hover:text-sandow-300 transition underline font-semibold"
              >
                Edit
              </button>
            </div>
            {user.formats && user.formats.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-auto">
                {user.formats.map((fmt) => (
                  <span
                    key={fmt}
                    className="px-3 py-1.5 rounded-full bg-black/60 text-sandow-400 border border-sandow-500/20 text-[11px] font-semibold tracking-wide"
                  >
                    # {fmt}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-auto">No formats selected.</p>
            )}
          </div>

          {/* Availability Card */}
          <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-sandow-400" />
                <span>Weekly Availability</span>
              </h3>
              <button
                onClick={() => setIsAvailabilityOpen(true)}
                className="text-xs text-sandow-400 hover:text-sandow-300 transition underline font-semibold"
              >
                Edit
              </button>
            </div>
            {user.availability && user.availability.length > 0 ? (
              <div className="space-y-2 mt-auto">
                {user.availability.map((win) => (
                  <div key={win.id} className="flex items-center justify-between px-3 py-2 rounded-xl bg-black/40 border border-white/5 text-xs">
                    <span className="font-semibold text-white">{win.dayOfWeek}</span>
                    <span className="text-slate-400">{win.startTime} - {win.endTime}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic mt-auto">No availability added.</p>
            )}
          </div>
        </div>

        {/* Milestone Journey Progress Card */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/10 mb-8 bg-white/5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-sandow-400" />
                <span>Interview Journey Progress</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {user.verifiedInterviewCount} verified reciprocal sessions completed
              </p>
            </div>

            {nextBadge && (
              <div className="text-right text-xs">
                <span className="text-slate-400">Next Milestone: </span>
                <span className="font-bold text-sandow-400">{nextBadge.title} ({nextBadge.countRequired} Mocks)</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden mb-6 p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-sandow-600 via-sandow-500 to-amber-400 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(255,107,0,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* All Milestone Badges Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ALL_BADGES.map((badge) => {
              const isUnlocked = user.verifiedInterviewCount >= badge.countRequired;
              return (
                <div
                  key={badge.id}
                  className={`p-3 rounded-2xl text-center border transition ${
                    isUnlocked
                      ? 'bg-sandow-500/20 border-sandow-500/40 text-white'
                      : 'bg-black/40 border-white/5 text-slate-600 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1">{isUnlocked ? badge.icon : '🔒'}</div>
                  <div className="font-bold text-xs">{badge.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{badge.countRequired} Mocks</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Privacy & Safety Settings */}
        <div className="glass-panel p-6 rounded-[2rem] border border-white/10 bg-white/5">
          <h3 className="font-bold text-base text-white mb-4">Privacy & Safety Settings</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
              <div>
                <div className="font-semibold text-sm text-white">Leaderboard Participation</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Show your profile on the Weekly Top 20 Leaderboard
                </div>
              </div>
              <input
                type="checkbox"
                checked={leaderboardOptIn}
                onChange={handleToggleOptIn}
                className="w-5 h-5 accent-sandow-500 rounded cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs text-slate-400">
              <span>Blocked Users List</span>
              <span className="font-semibold text-slate-300">0 Users Blocked</span>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />

          <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 shadow-2xl z-10 animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-sandow-400" />
                <span>Edit Profile</span>
              </h2>
              <button onClick={() => setIsEditOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Profile Picture</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl border border-white/10 bg-black/40 overflow-hidden shrink-0 flex items-center justify-center">
                    {editForm.avatarUrl ? (
                      <img src={editForm.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => modalFileInputRef.current?.click()}
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center justify-center gap-2 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-sandow-400" />
                      <span>Upload Photo from Computer</span>
                    </button>
                    <input
                      type="file"
                      ref={modalFileInputRef}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setEditForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      accept="image/*"
                      className="hidden"
                    />
                    <input
                      type="url"
                      placeholder="Or paste image URL (https://...)"
                      value={editForm.avatarUrl}
                      onChange={(e) => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-sandow-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Target Role</label>
                  <select
                    value={editForm.targetRole}
                    onChange={(e) => setEditForm({ ...editForm, targetRole: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                  >
                    <option value="Software Engineer">Software Engineer</option>
                    <option value="Product Manager">Product Manager</option>
                    <option value="Management Consultant">Management Consultant</option>
                    <option value="Data Scientist">Data Scientist</option>
                    <option value="Engineering Manager">Engineering Manager</option>
                    <option value="UI/UX Designer">UI/UX Designer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Experience Level</label>
                  <select
                    value={editForm.experienceLevel}
                    onChange={(e) => setEditForm({ ...editForm, experienceLevel: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                  >
                    <option value="Entry-level (0-2 yrs)">Entry-level (0-2 yrs)</option>
                    <option value="Mid-level (3-5 yrs)">Mid-level (3-5 yrs)</option>
                    <option value="Senior (6+ yrs)">Senior (6+ yrs)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Timezone</label>
                <input
                  type="text"
                  placeholder="e.g. UTC+05:30 (India Standard Time)"
                  value={editForm.timezone}
                  onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Bio</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/60 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-5 py-2.5 rounded-full text-slate-400 hover:text-white text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-sandow-500 hover:bg-sandow-400 text-white font-bold text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(255,107,0,0.4)] disabled:opacity-50"
                >
                  {saving ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Formats Modal */}
      {isFormatsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsFormatsOpen(false)} />

          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 shadow-2xl z-10 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 sticky top-0 bg-[#0A0A0A] z-20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-sandow-400" />
                <span>Edit Interview Formats</span>
              </h2>
              <button onClick={() => setIsFormatsOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFormats} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ALL_FORMATS.map((fmt) => {
                  const isSelected = user?.formats?.includes(fmt);
                  return (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => toggleFormat(fmt)}
                      className={`p-4 rounded-xl text-left border transition-all flex items-start justify-between ${
                        isSelected
                          ? 'bg-sandow-500/20 border-sandow-500/50 text-white shadow-md'
                          : 'bg-black/40 border-white/5 text-slate-400 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{fmt}</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {fmt === 'Behavioral' && 'Past experience, conflict resolution, leadership, teamwork'}
                          {fmt === 'Domain / Role-Specific' && 'Core competency questions tailored to the selected role'}
                          {fmt === 'Case Interview' && 'Business problems, market sizing, strategy scenarios'}
                          {fmt === 'Coding / Technical' && 'For engineering and technical roles'}
                          {fmt === 'System Design' && 'For senior/technical roles'}
                          {fmt === 'Analytical / Quantitative' && 'Data interpretation, estimation, metrics reasoning'}
                          {fmt === 'HR & Culture Fit' && 'Motivation, values alignment, expectations'}
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-sandow-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0A] py-4">
                <button
                  type="button"
                  onClick={() => setIsFormatsOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sandow-500 hover:bg-sandow-400 text-white text-sm font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Formats'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Availability Modal */}
      {isAvailabilityOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsAvailabilityOpen(false)} />

          <div className="relative w-full max-w-2xl bg-[#0A0A0A] border border-white/10 rounded-[2rem] p-6 shadow-2xl z-10 animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6 sticky top-0 bg-[#0A0A0A] z-20">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sandow-400" />
                <span>Edit Weekly Availability</span>
              </h2>
              <button onClick={() => setIsAvailabilityOpen(false)} className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <div className="space-y-4">
                {user?.availability?.map((win, index) => (
                  <div key={win.id} className="p-4 rounded-xl bg-black/40 border border-white/5 flex flex-col sm:flex-row gap-4 items-end sm:items-center">
                    <div className="grid grid-cols-3 gap-4 flex-1 w-full">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Day</label>
                        <select
                          value={win.dayOfWeek}
                          onChange={(e) => {
                            const newAvail = [...(user.availability || [])];
                            newAvail[index].dayOfWeek = e.target.value as any;
                            setUser({ ...user, availability: newAvail });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500"
                        >
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Time</label>
                        <input
                          type="time"
                          value={win.startTime}
                          onChange={(e) => {
                            const newAvail = [...(user.availability || [])];
                            newAvail[index].startTime = e.target.value;
                            setUser({ ...user, availability: newAvail });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500 [color-scheme:dark]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Time</label>
                        <input
                          type="time"
                          value={win.endTime}
                          onChange={(e) => {
                            const newAvail = [...(user.availability || [])];
                            newAvail[index].endTime = e.target.value;
                            setUser({ ...user, availability: newAvail });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-sandow-500 [color-scheme:dark]"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAvailabilityWindow(win.id)}
                      className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition shrink-0 h-[38px] w-[38px] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {(!user?.availability || user.availability.length === 0) && (
                  <div className="text-center py-8 px-4 rounded-xl border border-dashed border-white/10">
                    <p className="text-sm text-slate-400">No availability windows set.</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={addAvailabilityWindow}
                  className="w-full py-3 rounded-xl border border-dashed border-sandow-500/30 text-sandow-400 font-semibold text-sm hover:bg-sandow-500/10 transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Time Window</span>
                </button>
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-[#0A0A0A] py-4">
                <button
                  type="button"
                  onClick={() => setIsAvailabilityOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sandow-500 hover:bg-sandow-400 text-white text-sm font-bold transition shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Availability'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-sandow-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-medium">Loading profile...</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

