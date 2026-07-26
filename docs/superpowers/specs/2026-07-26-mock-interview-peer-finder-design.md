# Mock Interview Peer Finder Design Specification

**Date:** 2026-07-26  
**Status:** Approved  
**Author:** Antigravity AI  

---

## 1. Executive Summary & Goals

The **Mock Interview Peer Finder** is a peer-to-peer marketplace designed to help job seekers find compatible practice partners, schedule reciprocal mock interviews, meet via private video links, exchange structured feedback, and build a consistent practice habit through gamification.

The system replaces the legacy inventory prototype with a modern Next.js 16 (App Router) web application deployed on Vercel with Supabase as the system of record.

---

## 2. Technical Stack & Architecture

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS v4 / Vanilla CSS design system with curated dark mode aesthetics, glassmorphism, responsive cards, smooth transitions, and WCAG AA contrast compliance.
- **Backend & Database:** Supabase (`@supabase/ssr`), PostgreSQL database with Row Level Security (RLS), atomic RPC functions, Zod schema validation.
- **Video & Calendar:** External Jitsi Meet rooms (`meet.jit.si/mock-peer-[session_id]`) and dynamic `.ics` calendar invitation generation route handler.
- **Emails:** Transactional email sending via Resend API (invitation received, accepted, feedback provided).
- **Hybrid Preview Mode:** Out-of-the-box local demo data provider allowing complete client-side flow testing and UI demonstration even before live Supabase credentials are bound.

---

## 3. Core User Journeys & Route Hierarchy

### Route Map
- `/` — Premium Landing Page with value proposition, feature highlights, badge previews, and CTA.
- `/onboarding` — Interactive wizard for profile setup (target role, industry, experience level, language, timezone, format preferences, recurring availability).
- `/discover` — Peer search & filtering engine with real-time compatibility match indicators.
- `/peers/[id]` — Detailed peer profile with earned badges, target role, interview formats, availability schedule, and "Send Invitation" CTA.
- `/invitations` — Dashboard for managing incoming and outgoing invitation requests, counter-offers, and history.
- `/sessions/[id]` — Session room with Jitsi video link, downloadable `.ics` calendar file, dual completion confirmation, and post-session feedback form.
- `/leaderboard` — Opt-in weekly rankings (Top 20) with partner count tie-breaking and rank calculation.
- `/profile` — User preferences, earned milestone badges, privacy settings, leaderboard opt-in toggle, and blocked user management.

---

## 4. Gamification & Abuse Prevention Rules

1. **Interview Journey Milestones (`verified_interview_count`):**
   - 1 session: **First Mock**
   - 3 sessions: **Momentum**
   - 5 sessions: **Practice Regular**
   - 10 sessions: **Double Digits**
   - 25 sessions: **Peer Pro**
   - 50 sessions: **Practice Champion**
   - 100 sessions: **Century Club**

2. **Dual-Confirmation Rule:**
   - A mock interview is counted toward milestone badges and leaderboards ONLY after BOTH participants independently mark the session as `completed`.
   - Disputed, cancelled, or no-show sessions receive 0 credit.

3. **Daily Same-Pair Cap:**
   - Only the **first mutually completed session** between the same pair of users per UTC calendar day credits milestone count or leaderboard points. Additional sessions in the same day are logged in session history but do not increment counters.

4. **Leaderboard Rules:**
   - Participation is strictly opt-in (`leaderboard_opt_in = false` by default).
   - Ranks top 20 opted-in users by eligible completed interviews between Monday 00:00 UTC and Sunday 23:59 UTC.
   - Tie-breaking: 1st by number of unique practice partners in the week, 2nd by timestamp when the score was reached.

---

## 5. Database Schema & Security (Supabase PostgreSQL + RLS)

### Key Tables
- `profiles` — User metadata, target role, industry, experience, timezone, bio, `leaderboard_opt_in`, `verified_interview_count`.
- `profile_interview_types` — Formats offered/requested per profile (Behavioral, System Design, Coding, Product Management, Case, HR).
- `availability_windows` — Recurring day of week, start time, end time, timezone.
- `invitations` — `id`, `sender_id`, `receiver_id`, `format`, `duration_minutes`, `note`, `status` (`pending`, `countered`, `accepted`, `declined`, `expired`, `cancelled`), `created_at`.
- `invitation_time_options` — Up to 3 proposed ISO timestamps per invitation.
- `sessions` — `id`, `invitation_id`, `user1_id`, `user2_id`, `scheduled_at`, `duration_minutes`, `jitsi_room_url`, `status` (`scheduled`, `completed`, `cancelled`, `no_show`, `disputed`).
- `session_confirmations` — `session_id`, `user_id`, `confirmed_at`.
- `feedback` — `id`, `session_id`, `reviewer_id`, `recipient_id`, `preparedness_rating`, `communication_rating`, `helpfulness_rating`, `strengths`, `growth_areas`, `created_at`.
- `blocks` & `reports` — Safety and blocking controls.

---

## 6. Verification & Quality Plan

- Zod schema validation on all server actions and form inputs.
- Dual confirmation idempotency unit tests.
- Accessibility compliance (WCAG AA contrast, keyboard focus rings, `prefers-reduced-motion` celebration modals).
- Full end-to-end user flow verification.
