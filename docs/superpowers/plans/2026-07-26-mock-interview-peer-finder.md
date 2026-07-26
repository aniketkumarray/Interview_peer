# Mock Interview Peer Finder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create the complete Mock Interview Peer Finder web application with peer discovery, invitation scheduling, Jitsi video call links, dual session confirmation, structured feedback, milestone gamification, and opt-in weekly leaderboards.

**Architecture:** Next.js 16 App Router application built with React 19, TypeScript, Tailwind CSS v4, Supabase Auth & Database schema with RLS, Jitsi Meet URL generator, dynamic `.ics` route handler, and a hybrid local demo store fallback for local development preview.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide React icons, Supabase `@supabase/ssr`, Zod.

## Global Constraints

- Next.js 16 App Router with React 19
- Supabase SSR authentication & RLS schema
- Standard Tailwind CSS styling with WCAG AA compliance and dark glassmorphic design system
- Dynamic `.ics` download endpoint
- Jitsi external video links (`https://meet.jit.si/mock-peer-[id]`)
- Dual-confirmation idempotent milestone counting & daily same-pair credit cap

---

### Task 1: Next.js Project Scaffolding & Shared Types

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `app/layout.tsx`
- Create: `app/globals.css`
- Create: `types/index.ts`
- Create: `components/navbar.tsx`

**Interfaces:**
- Consumes: N/A
- Produces: `UserProfile`, `InterviewType`, `Invitation`, `Session`, `Feedback`, `Badge`, `LeaderboardEntry` types in `types/index.ts`.

- [ ] **Step 1: Write `package.json` and TypeScript configuration**

```json
{
  "name": "mock-interview-peer-finder",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@supabase/ssr": "^0.5.2",
    "@supabase/supabase-js": "^2.48.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.475.0",
    "next": "^15.1.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^22.13.4",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "postcss": "^8.5.2",
    "tailwindcss": "^4.0.7",
    "typescript": "^5.7.3"
  }
}
```

- [ ] **Step 2: Create core TypeScript types in `types/index.ts`**

```typescript
export type InterviewFormat = 
  | 'Behavioral' 
  | 'System Design' 
  | 'Coding' 
  | 'Product Management' 
  | 'Case Interview' 
  | 'HR & Culture';

export type ExperienceLevel = 'Entry-level (0-2 yrs)' | 'Mid-level (3-5 yrs)' | 'Senior (6+ yrs)' | 'Lead / Executive';

export interface AvailabilityWindow {
  id: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string; // '09:00'
  endTime: string;   // '17:00'
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
  currentBadge: string;
  weeklyCount: number;
  uniquePartnersCount: number;
}
```

- [ ] **Step 3: Create global CSS with premium dark theme in `app/globals.css`**

```css
@import "tailwindcss";

@layer base {
  :root {
    --bg-main: #090d16;
    --card-bg: rgba(17, 24, 39, 0.7);
    --border-color: rgba(255, 255, 255, 0.1);
    --accent-teal: #14b8a6;
    --accent-violet: #8b5cf6;
  }

  body {
    background-color: var(--bg-main);
    color: #f3f4f6;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    min-height: 100vh;
  }
}

.glass-panel {
  background: rgba(17, 24, 39, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step 4: Create shared Layout and Navbar in `app/layout.tsx` and `components/navbar.tsx`**

---

### Task 2: Supabase Schema Migration & Local Demo Data Provider

**Files:**
- Create: `supabase/migrations/20260726000000_init_schema.sql`
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/demo-store.ts`

**Interfaces:**
- Consumes: `UserProfile`, `Invitation`, `Session`, `Feedback` types.
- Produces: `getDemoStore()`, `updateDemoStore()`, `useMockData` state and helper routines.

- [ ] **Step 1: Write `supabase/migrations/20260726000000_init_schema.sql` with RLS policies**

- [ ] **Step 2: Create `lib/demo-store.ts` seeded with realistic mock peers, invitations, sessions, badges, and leaderboard entries.**

---

### Task 3: Landing Page & Onboarding Flow (`/`, `/onboarding`)

**Files:**
- Create: `app/page.tsx`
- Create: `app/onboarding/page.tsx`
- Create: `components/onboarding-wizard.tsx`

**Interfaces:**
- Consumes: `UserProfile`, `AvailabilityWindow` types, `lib/demo-store.ts`.
- Produces: Interactive onboarding flow saving target roles, availability, and format preferences.

- [ ] **Step 1: Create Landing Page in `app/page.tsx` with hero, features, badges showcase, and CTA**
- [ ] **Step 2: Create Onboarding Wizard in `app/onboarding/page.tsx`**

---

### Task 4: Peer Discovery & Peer Profile (`/discover`, `/peers/[id]`)

**Files:**
- Create: `app/discover/page.tsx`
- Create: `app/peers/[id]/page.tsx`
- Create: `components/peer-card.tsx`
- Create: `components/send-invitation-modal.tsx`

**Interfaces:**
- Consumes: `UserProfile`, `InterviewFormat`, `lib/demo-store.ts`.
- Produces: Filtering UI, compatibility reason breakdown, peer detail view, invitation creation.

- [ ] **Step 1: Create `app/discover/page.tsx` with search, format filters, timezone calculation**
- [ ] **Step 2: Create `app/peers/[id]/page.tsx` with profile details, earned badges, and invitation modal**

---

### Task 5: Invitation Negotiation & Management (`/invitations`)

**Files:**
- Create: `app/invitations/page.tsx`
- Create: `components/invitation-card.tsx`
- Create: `components/counter-offer-modal.tsx`

**Interfaces:**
- Consumes: `Invitation`, `Session`, `lib/demo-store.ts`.
- Produces: Accept, Counter, Decline, Cancel actions, generating session records upon acceptance.

- [ ] **Step 1: Create `app/invitations/page.tsx` with Incoming, Outgoing, and History tabs**
- [ ] **Step 2: Connect invitation acceptance to automatic Jitsi session creation**

---

### Task 6: Session Room, Jitsi Link, Dynamic Calendar (.ics) & Dual Confirmation (`/sessions/[id]`, `/api/calendar/[id]`)

**Files:**
- Create: `app/sessions/[id]/page.tsx`
- Create: `app/api/calendar/[id]/route.ts`
- Create: `components/feedback-form.tsx`

**Interfaces:**
- Consumes: `Session`, `Feedback`, `lib/demo-store.ts`.
- Produces: External Jitsi video link launcher, dynamic `.ics` calendar file generator, dual-confirmation state updater, private feedback form.

- [ ] **Step 1: Create `.ics` Calendar Route Handler in `app/api/calendar/[id]/route.ts`**
- [ ] **Step 2: Create Session Detail Page in `app/sessions/[id]/page.tsx`**
- [ ] **Step 3: Implement Dual Confirmation & Feedback Submission**

---

### Task 7: Gamification Milestones & Weekly Opt-In Leaderboard (`/leaderboard`, `/profile`)

**Files:**
- Create: `app/leaderboard/page.tsx`
- Create: `app/profile/page.tsx`
- Create: `components/milestone-celebration-modal.tsx`
- Create: `lib/gamification.ts`

**Interfaces:**
- Consumes: `verifiedInterviewCount`, `LeaderboardEntry`, `lib/demo-store.ts`.
- Produces: Badge calculator, milestone popups, weekly leaderboard table with opt-in toggle.

- [ ] **Step 1: Create `lib/gamification.ts` for badge rules & milestone detection**
- [ ] **Step 2: Create `components/milestone-celebration-modal.tsx`**
- [ ] **Step 3: Create `app/leaderboard/page.tsx`**
- [ ] **Step 4: Create `app/profile/page.tsx`**

---

### Task 8: Verification & Build Check

**Files:**
- Test: Build verification & static analysis (`npm run build`)

- [ ] **Step 1: Run `npm run build` to ensure error-free compilation**
- [ ] **Step 2: Verify complete user journey end-to-end**
