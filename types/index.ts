export type InterviewFormat = 
  | 'Behavioral' 
  | 'Domain / Role-Specific' 
  | 'Case Interview' 
  | 'Coding / Technical' 
  | 'System Design' 
  | 'Analytical / Quantitative'
  | 'HR & Culture Fit';

export type ExperienceLevel = 
  | 'Entry-level (0-2 yrs)' 
  | 'Mid-level (3-5 yrs)' 
  | 'Senior (6+ yrs)' 
  | 'Lead / Executive';

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // e.g. '09:00'
  endTime: string;   // e.g. '17:00'
  timezone: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
  targetRole: string;
  industry: string;
  experienceLevel: ExperienceLevel;
  timezone: string;
  languages: string[];
  bio: string;
  formats: InterviewFormat[];
  availability: AvailabilityWindow[];
  verifiedInterviewCount: number;
  leaderboardOptIn: boolean;
  createdAt: string;
}

export type InvitationStatus = 'pending' | 'countered' | 'accepted' | 'declined' | 'expired' | 'cancelled';

export interface Invitation {
  id: string;
  senderId: string;
  receiverId: string;
  senderName?: string;
  receiverName?: string;
  format: InterviewFormat;
  durationMinutes: 30 | 45 | 60;
  note: string;
  proposedSlots: string[]; // ISO strings
  selectedSlot?: string;
  status: InvitationStatus;
  createdAt: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'disputed';

export interface Session {
  id: string;
  invitationId: string;
  user1Id: string;
  user2Id: string;
  partnerName?: string;
  partnerRole?: string;
  format: InterviewFormat;
  durationMinutes: number;
  scheduledAt: string;
  jitsiRoomUrl: string;
  status: SessionStatus;
  user1Confirmed: boolean;
  user2Confirmed: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  sessionId: string;
  reviewerId: string;
  recipientId: string;
  preparednessRating: number; // 1-5
  communicationRating: number; // 1-5
  helpfulnessRating: number; // 1-5
  strengths: string;
  growthAreas: string;
  createdAt: string;
}

export interface Badge {
  id: string;
  title: string;
  countRequired: number;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string;
  targetRole: string;
  currentBadge: string;
  weeklyCount: number;
  uniquePartnersCount: number;
}
