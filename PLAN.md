# Mock Interview Peer Finder MVP with Gamification

## Summary

Replace the current inventory prototype with a peer-practice marketplace for all job seekers. Users will discover compatible peers, schedule reciprocal mock interviews, meet through private Jitsi links, exchange feedback, and progress through an “Interview Journey” based on mutually confirmed sessions. An opt-in weekly leaderboard adds competition without making rankings mandatory.

## Product and PRD Decisions

Create `docs/mock-interview-peer-finder-prd.md` covering personas, jobs-to-be-done, user journeys, requirements, competitor analysis, gamification rules, privacy, data model, success metrics, acceptance criteria, and future roadmap.

### Core journey

1. Sign in using Google or an email magic link.
2. Complete a profile with target role, industry, experience, language, timezone, interview formats, and recurring availability.
3. Browse peers using filters and visible compatibility reasons.
4. Send an invitation with a format, note, duration, and up to three time options.
5. Accept, decline, or counter the invitation.
6. Receive a private Jitsi room and downloadable calendar event after acceptance.
7. Confirm completion and exchange structured private feedback.
8. Earn progress toward the next interview milestone and optionally join the weekly leaderboard.

### Competitor direction

- [Exponent Practice](https://www.tryexponent.com/practice?src=nav) combines automatic matching, reciprocal sessions, video, editors, supplied questions, reminders, peer feedback, and AI feedback. Adopt reciprocal practice, scheduling, and feedback; defer native media and AI.
- [InterviewBit](https://www.interviewbit.com/peer-mock-interview/) emphasizes anonymous matching by availability and experience, interviewer guidance, collaborative tools, and peer evaluation. Adopt privacy and profile compatibility; defer editors and question banks.
- Differentiate through broad role coverage, transparent peer discovery, user-controlled invitations, and motivating practice milestones.

### Scope boundaries

- Include authentication, onboarding, discovery, peer profiles, invitations, scheduling, Jitsi rooms, calendar files, feedback, gamification, block/report, and transactional emails.
- Exclude automatic matching, native video/audio, chat, shared editors, question banks, AI feedback, payments, group sessions, identity verification, and a custom moderation dashboard.

## Gamification System

### Interview Journey

- Base progress entirely on `verified_interview_count`; do not introduce abstract XP in the MVP.
- Unlock permanent badges at:
  - 1 — **First Mock**
  - 3 — **Momentum**
  - 5 — **Practice Regular**
  - 10 — **Double Digits**
  - 25 — **Peer Pro**
  - 50 — **Practice Champion**
  - 100 — **Century Club**
- Show the lifetime count, current badge, next milestone, and progress bar on the dashboard.
- Display earned badges on authenticated peer profiles.
- Show an accessible celebration modal when a new milestone is earned, respecting reduced-motion preferences.

### Counting and abuse prevention

- Count a session only after both participants independently mark it completed.
- Do not count cancelled, disputed, reported, or no-show sessions.
- Make completion confirmation idempotent so repeated requests cannot increase counts.
- Credit only the first mutually completed session between the same pair per UTC day toward badges and leaderboards; additional sessions remain in history and may receive feedback.
- Feedback is encouraged but not required for the interview to count.
- Derive lifetime counts from eligible completed-session records instead of maintaining an editable counter.

### Weekly leaderboard

- Make leaderboard participation opt-in and disabled by default.
- Rank the top 20 opted-in users by eligible interviews completed from Monday 00:00 UTC through Sunday 23:59 UTC.
- Break ties by number of unique practice partners, then by who reached the score first.
- Display only public profile information: display name, avatar/initials, current badge, weekly count, and rank.
- Let users leave the leaderboard instantly without losing personal milestones.
- Add filters by interview format only after sufficient usage; the MVP has one global weekly leaderboard.

## Implementation Changes

- Convert the repository from vinext/Cloudflare Worker, Vite, D1/Drizzle, and Sites configuration to a standard Next.js App Router application deployed on Vercel.
- Keep Next.js 16, React 19, TypeScript, and Tailwind CSS, while replacing the monolithic inventory UI with modular routes:
  - `/` — landing page.
  - `/onboarding` — profile and availability.
  - `/discover` and `/peers/[id]` — peer discovery.
  - `/invitations` — incoming and outgoing requests.
  - `/sessions/[id]` — meeting, completion, and feedback.
  - `/leaderboard` — weekly opt-in rankings.
  - `/profile` — preferences, badges, privacy, and blocked users.
- Use Supabase’s `@supabase/ssr` browser/server clients, cookie-refresh proxy, and validated `getClaims()` authorization. [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Use server actions with Zod validation for mutations and an authorized route handler for `.ics` downloads.
- Send immediate invitation, acceptance, cancellation, and feedback emails through Resend from Vercel functions. Do not rely on timed reminders because Vercel Hobby cron supports only one imprecise daily invocation. [Vercel Hobby limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- Use a professional visual system with off-white surfaces, deep ink typography, restrained violet/teal accents, responsive cards, WCAG AA contrast, keyboard navigation, and reduced-motion support.

## Data Model and Interfaces

- Add Supabase migrations for:
  - `profiles`, including `leaderboard_opt_in`.
  - `profile_interview_types` and `availability_windows`.
  - `invitations` and `invitation_time_options`.
  - `sessions` and `session_confirmations`.
  - `feedback`, `user_badges`, `blocks`, and `reports`.
- Add database functions for atomic invitation acceptance and session-completion confirmation.
- Add read-only views or RPCs for `user_progress` and `weekly_leaderboard`; clients must not calculate authoritative ranks.
- Invitation states: `pending`, `countered`, `accepted`, `declined`, `expired`, and `cancelled`. Pending invitations expire after 72 hours.
- Session states: `scheduled`, `completed`, `cancelled`, `no_show`, and `disputed`.
- Feedback contains 1–5 preparedness, communication, and helpfulness ratings plus strengths and improvement notes; only the recipient can read it.
- Enable RLS on every exposed table. Only participants may access invitations, sessions, room links, confirmations, and feedback. Leaderboard queries expose only opted-in public fields. [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Test and Release Plan

- Unit-test validation, timezone handling, availability overlap, invitation transitions, expiry, calendar generation, badge thresholds, and leaderboard week boundaries.
- Integration-test RLS isolation, atomic acceptance, duplicate-session prevention, idempotent confirmation, dual-confirmation counting, daily same-pair limits, badge awards, tie-breaking, and opt-out privacy.
- Add two-user Playwright journeys covering onboarding, discovery, invitation negotiation, meeting access, completion, feedback, milestone celebration, leaderboard entry, and withdrawal.
- Test cancellations, no-shows, disputes, blocked users, mobile layouts, keyboard access, reduced motion, and empty/error states.
- Verify linting, type-checking, production builds, migrations, Vercel variables, OAuth redirects, and a full production smoke test.
- Accept the MVP when two real users can complete the onboarding-to-feedback flow, receive accurate milestone progress, and appear or disappear from the leaderboard without administrative intervention.

## Assumptions

- Personal milestones are always available; leaderboard participation is optional.
- The current inventory application is intentionally replaced.
- The MVP is free, English-first, publicly accessible, and responsive.
- Jitsi provides external rooms; no recordings or call media are stored.
- Supabase is the system of record, while Vercel hosts Next.js and server functions.
- Production contains no fabricated peers; test profiles remain restricted to preview environments.
