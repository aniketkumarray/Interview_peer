'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth-context';
import { 
  User, 
  Briefcase, 
  Globe, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Upload,
  RefreshCw,
  Camera
} from 'lucide-react';
import { InterviewFormat, ExperienceLevel, AvailabilityWindow } from '@/types';
import { MOCK_CURRENT_USER } from '@/lib/demo-store';

const ALL_FORMATS: InterviewFormat[] = [
  'Behavioral',
  'System Design',
  'Coding',
  'Product Management',
  'Case Interview',
  'HR & Culture',
];

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Entry-level (0-2 yrs)',
  'Mid-level (3-5 yrs)',
  'Senior (6+ yrs)',
  'Lead / Executive',
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
] as const;

const TIMEZONES = [
  'UTC-12:00 (Baker Island)',
  'UTC-11:00 (Samoa, Niue)',
  'UTC-10:00 (Hawaii-Aleutian, HST)',
  'UTC-09:00 (Alaska, AKST)',
  'UTC-08:00 (Pacific Time, PST / US & Canada)',
  'UTC-07:00 (Mountain Time, MST / US & Canada)',
  'UTC-06:00 (Central Time, CST / US & Canada, Mexico)',
  'UTC-05:00 (Eastern Time, EST / US & Canada)',
  'UTC-04:00 (Atlantic Time, AST, Santiago)',
  'UTC-03:30 (Newfoundland)',
  'UTC-03:00 (Buenos Aires, Brasilia, Greenland)',
  'UTC-02:00 (Mid-Atlantic)',
  'UTC-01:00 (Azores, Cape Verde)',
  'UTC+00:00 (Greenwich Mean Time, GMT / London, Lisbon)',
  'UTC+01:00 (Central European Time, CET / Paris, Berlin, Rome)',
  'UTC+02:00 (Eastern European Time, EET / Cairo, Athens, Johannesburg)',
  'UTC+03:00 (Moscow, Riyadh, Nairobi, Istanbul)',
  'UTC+03:30 (Tehran)',
  'UTC+04:00 (Dubai, Abu Dhabi, Baku)',
  'UTC+04:30 (Kabul)',
  'UTC+05:00 (Tashkent, Karachi, Islamabad)',
  'UTC+05:30 (India Standard Time, IST / New Delhi, Mumbai)',
  'UTC+05:45 (Kathmandu)',
  'UTC+06:00 (Dhaka, Almaty)',
  'UTC+06:30 (Yangon)',
  'UTC+07:00 (Bangkok, Jakarta, Hanoi)',
  'UTC+08:00 (Singapore, Beijing, Perth, Manila)',
  'UTC+09:00 (Japan Standard Time, JST / Tokyo, Seoul)',
  'UTC+09:30 (Darwin, Adelaide)',
  'UTC+10:00 (Australian Eastern, AEST / Sydney, Guam)',
  'UTC+11:00 (Solomon Islands, New Caledonia)',
  'UTC+12:00 (New Zealand, NZST / Auckland, Fiji)',
  'UTC+13:00 (Tonga, Samoa)'
];

export function OnboardingWizard() {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=PeerUser123');
  const [targetRole, setTargetRole] = useState(MOCK_CURRENT_USER.targetRole);
  const [industry, setIndustry] = useState(MOCK_CURRENT_USER.industry);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(MOCK_CURRENT_USER.experienceLevel);
  const [timezone, setTimezone] = useState('UTC+05:30 (India Standard Time, IST / New Delhi, Mumbai)');
  const [bio, setBio] = useState(MOCK_CURRENT_USER.bio);
  const [selectedFormats, setSelectedFormats] = useState<InterviewFormat[]>(MOCK_CURRENT_USER.formats);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>(MOCK_CURRENT_USER.availability);
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(MOCK_CURRENT_USER.leaderboardOptIn);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds 5MB limit. Please choose a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatarUrl(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const randomizeAvatar = () => {
    const randomSeed = Math.random().toString(36).substring(7);
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`);
  };

  const toggleFormat = (fmt: InterviewFormat) => {
    if (selectedFormats.includes(fmt)) {
      setSelectedFormats(selectedFormats.filter((f) => f !== fmt));
    } else {
      setSelectedFormats([...selectedFormats, fmt]);
    }
  };

  const addAvailabilityWindow = () => {
    const newWindow: AvailabilityWindow = {
      id: `w_${Date.now()}`,
      dayOfWeek: 'Monday',
      startTime: '18:00',
      endTime: '21:00',
      timezone: timezone,
    };
    setAvailability([...availability, newWindow]);
  };

  const removeAvailabilityWindow = (id: string) => {
    setAvailability(availability.filter((a) => a.id !== id));
  };

  const handleSave = async () => {
    if (!user || !user.email) return;
    setIsSaving(true);
    
    try {
      const finalAvatarUrl = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || user.email)}`;

      // 1. Insert Profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        name: name || user.email.split('@')[0],
        avatar_url: finalAvatarUrl,
        target_role: targetRole,
        industry: industry,
        experience_level: experienceLevel,
        timezone: timezone,
        bio: bio,
        leaderboard_opt_in: leaderboardOptIn,
      });

      if (profileError) throw profileError;

      // 2. Insert Interview Formats
      if (selectedFormats.length > 0) {
        const formatsToInsert = selectedFormats.map(fmt => ({
          profile_id: user.id,
          format: fmt
        }));
        await supabase.from('profile_interview_types').insert(formatsToInsert);
      }

      // 3. Insert Availability Windows
      if (availability.length > 0) {
        const windowsToInsert = availability.map(win => ({
          profile_id: user.id,
          day_of_week: win.dayOfWeek,
          start_time: win.startTime,
          end_time: win.endTime,
          timezone: win.timezone
        }));
        await supabase.from('availability_windows').insert(windowsToInsert);
      }

      router.push('/profile');
      router.refresh();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto glass-panel p-6 sm:p-10 rounded-2xl border border-white/10 shadow-2xl">
      {/* Progress Bar Header */}
      <div className="mb-8 border-b border-white/10 pb-6">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
          <span>STEP {step} OF 3</span>
          <span>{step === 1 ? 'Target & Background' : step === 2 ? 'Interview Formats' : 'Availability & Privacy'}</span>
        </div>
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-violet-500 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Target Role & Experience */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-teal-400" />
              <span>Tell peers what you are preparing for</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Your profile helps compatible peers connect with you for relevant practice.
            </p>
          </div>

          {/* Profile Picture Upload & Customization */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-teal-400 bg-slate-950 shrink-0 shadow-lg group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || 'user')}`}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
              <label className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                <Camera className="w-6 h-6 text-teal-400" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Profile Photo *
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Upload a custom photo or generate an avatar.
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <label className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 text-xs font-semibold cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={randomizeAvatar}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-violet-400" />
                  <span>Randomize Avatar</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 mb-4"
            />

            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Target Role / Job Title *
            </label>
            <input
              type="text"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer, Product Manager, Data Scientist"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Industry / Domain
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Technology, Fintech, Healthcare"
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
                className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-teal-400"
              >
                {EXPERIENCE_LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl} className="bg-slate-900">
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Primary Timezone *
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white focus:outline-none focus:border-teal-400"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz} className="bg-slate-900 text-slate-100">
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Bio & Focus Areas
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Share what specific companies or topics you are practicing (e.g. L6 system design, STAR behavioral stories, LeetCode Mediums)..."
              className="w-full px-4 py-3 rounded-xl bg-slate-900/90 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-lg shadow-teal-500/20"
            >
              <span>Next: Formats</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Formats */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-400" />
              <span>Select Interview Formats You Offer & Request</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Reciprocal interviews work best when both partners practice complementary or identical interview types.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_FORMATS.map((fmt) => {
              const isSelected = selectedFormats.includes(fmt);
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => toggleFormat(fmt)}
                  className={`p-4 rounded-xl text-left border transition-all flex items-start justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-violet-600/30 to-indigo-600/30 border-violet-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{fmt}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {fmt === 'System Design' && 'Architecture, scalability, trade-offs'}
                      {fmt === 'Coding' && 'Algorithms, data structures, edge cases'}
                      {fmt === 'Behavioral' && 'STAR format, leadership principles'}
                      {fmt === 'Product Management' && 'Product sense, execution, metrics'}
                      {fmt === 'Case Interview' && 'Market entry, profitability, framework'}
                      {fmt === 'HR & Culture' && 'Elevator pitch, salary negotiation'}
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />}
                </button>
              );
            })}
          </div>

          <div className="pt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 transition shadow-lg shadow-teal-500/20"
            >
              <span>Next: Availability</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Availability & Leaderboard Opt-in */}
      {step === 3 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-6 h-6 text-teal-400" />
              <span>Recurring Availability & Preferences</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Add your weekly open windows so peers know when you can meet.
            </p>
          </div>

          {/* Availability Windows */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Weekly Time Slots
              </label>
              <button
                type="button"
                onClick={addAvailabilityWindow}
                className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-400 hover:text-teal-300"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Time Window</span>
              </button>
            </div>

            {availability.map((win) => (
              <div key={win.id} className="flex items-center gap-3 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                <select
                  value={win.dayOfWeek}
                  onChange={(e) => {
                    setAvailability(
                      availability.map((a) =>
                        a.id === win.id ? { ...a, dayOfWeek: e.target.value as any } : a
                      )
                    );
                  }}
                  className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>

                <div className="flex items-center space-x-1 text-xs text-slate-300">
                  <input
                    type="time"
                    value={win.startTime}
                    onChange={(e) => {
                      setAvailability(
                        availability.map((a) => (a.id === win.id ? { ...a, startTime: e.target.value } : a))
                      );
                    }}
                    className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={win.endTime}
                    onChange={(e) => {
                      setAvailability(
                        availability.map((a) => (a.id === win.id ? { ...a, endTime: e.target.value } : a))
                      );
                    }}
                    className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 focus:outline-none"
                  />
                </div>

                <span className="text-xs text-slate-500 ml-auto">{win.timezone}</span>

                <button
                  type="button"
                  onClick={() => removeAvailabilityWindow(win.id)}
                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Leaderboard Opt-In Switch */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div className="font-semibold text-white text-sm">Opt-In to Weekly Top 20 Leaderboard</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Showcase your practice streak on the public rankings. Disabled by default; you can leave anytime.
                </div>
              </div>
              <input
                type="checkbox"
                checked={leaderboardOptIn}
                onChange={(e) => setLeaderboardOptIn(e.target.checked)}
                className="w-5 h-5 accent-teal-400 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center space-x-2 px-8 py-3 rounded-xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 hover:from-teal-300 hover:to-emerald-300 text-slate-950 transition shadow-lg shadow-teal-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save & Discover Peers'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
