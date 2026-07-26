


















PRODUCT REQUIREMENTS DOCUMENT





Mock InterviewPeer Finder





A trusted marketplace for finding, scheduling, and growing with peer mock interviews





Product recommendation: Launch a browse-and-invite marketplace for all job seekers. Keep the first release focused on discovery, scheduling, reciprocal practice, structured feedback, and interview-count gamification.



Status: MVP definition



Version: 1.0



Date: 26 July 2026



Audience: Product, design, engineering, and launch stakeholders



Deployment: Next.js on Vercel with Supabase





Decision-complete scope



This document defines the working MVP, its gamification mechanics, security model, acceptance criteria, and phased release plan. Implementation should not require additional product decisions.







Contents

 TOC \o "1-3" \h \z \u Contents will update when opened in Word.





Navigation: The table of contents is a Word field. It will update automatically when the document opens; select the field and choose Update Field if page numbers are not refreshed.







1. Executive Summary





Mock Interview Peer Finder helps job seekers find a compatible practice partner, coordinate a reciprocal mock interview, meet online, exchange actionable feedback, and build a visible practice habit.

The MVP serves all job seekers while avoiding an exhaustive job-title taxonomy. It combines free-text target roles with controlled filters for industry, experience, language, timezone, and interview format. Users remain in control of partner choice through transparent browsing and invitations rather than opaque automatic matching.

The product will replace the repository's current inventory prototype. The delivery stack is standard Next.js on Vercel with Supabase Auth and Postgres, private external Jitsi rooms, and Resend transactional email. The release intentionally excludes native media, AI feedback, question banks, payments, and community chat.





MVP outcome: A new user can move from sign-in to a mutually accepted peer session in one coherent workflow, then receive feedback and progress toward a meaningful practice milestone.





2. Problem and Opportunity





2.1 Problem statement

Realistic interview practice is difficult to access. Friends may not understand the target role, professional coaching is expensive, and general communities require repeated searching, messaging, and manual scheduling. Existing platforms often solve the practice-room experience but hide partner selection behind scheduled pools or concentrate only on technical roles.

The core problem is not a lack of interview content. It is the difficulty of finding a willing, similarly situated person who is available for the same type of practice and will exchange useful feedback.





2.2 Jobs-to-be-done





When preparing for an interview, help me find someone targeting a comparable role or interview format so the practice feels relevant.





When I identify a potential partner, help us schedule without long message threads or timezone confusion.





When we meet, give us enough structure to run a reciprocal session without requiring a coach.





After practice, help us exchange specific feedback and understand whether we are building a consistent habit.





When I have a poor or unsafe interaction, let me disengage, block, or report without exposing private information.





2.3 Primary personas



Persona



Context



Core need



Early-career applicant



Students and recent graduates



Needs confidence, structure, and peers at a similar level.



Career switcher



Candidates moving into a new function or industry



Needs role-relevant practice without an established professional network.



Experienced candidate



Mid-career and senior professionals



Needs focused behavioral, leadership, case, or domain practice.



Accountability partner



Repeat peer who enjoys reciprocal practice



Needs scheduling, history, and progress signals rather than coaching tools.









3. Goals, Non-goals, and Success





3.1 Product goals





Reduce the effort required to find a relevant and available mock-interview partner.





Create a complete invitation-to-feedback workflow that works across job functions.





Establish trust through privacy controls, mutual confirmation, completion history, and reporting.





Encourage consistent practice through interview-count milestones and optional weekly competition.





Deliver a maintainable hobby-project architecture with minimal operational overhead.





3.2 Non-goals for the MVP





Automatic or AI-based partner matching.





Native video, audio, screen sharing, or collaborative coding.





A proprietary interview question bank or interviewer answer keys.





AI-generated transcripts, scoring, or coaching.





Payments, subscriptions, paid coaches, or marketplace payouts.





Group sessions, community feeds, direct messaging, or native mobile applications.





Identity or employment verification and a custom moderation dashboard.





3.3 MVP success metrics



Metric



Definition



Initial beta target



Profile activation



Completed profile plus at least one availability window



&gt;= 60% of verified sign-ups



Time to first action



Median time from onboarding completion to first invitation



&lt;= 10 minutes



Invitation acceptance



Accepted invitations divided by resolved invitations



&gt;= 30%



Time to first match



Median time from onboarding to accepted session



&lt; 72 hours



Session completion



Completed sessions divided by scheduled sessions



&gt;= 60%



Feedback completion



Completed sessions with at least one feedback submission



&gt;= 50%



No-show rate



No-show sessions divided by scheduled sessions



&lt; 20%



Trust



Critical privacy or authorization incidents



0





Targets are launch hypotheses. Recalibrate them after the first 50 activated users without redefining the underlying metric formulas.





4. Competitor Feature Analysis

The market demonstrates that reciprocal practice, scheduling, and structured feedback are valuable. It also demonstrates the operational cost of automatic matching, native interview infrastructure, and content libraries.



Competitor pattern



Strengths



MVP response



Exponent Practice



Automatic matching, fixed session slots, reciprocal one-hour interviews, video, collaborative editors, supplied questions, reminders, peer feedback, and paid AI feedback.



Adopt reciprocal practice, scheduling, and feedback. Defer automatic matching, native rooms, editors, question banks, credits, and AI.



InterviewBit



Anonymous profiles, matching by availability and experience, curated interviewer guidance, built-in audio/editor tools, 90-minute reciprocal sessions, and peer evaluation.



Adopt profile privacy and compatibility attributes. Defer automatic pairing, native tools, and curated question content.



Peer-directory products



Searchable profiles, role and level filters, direct invitations, external coordination, and study-buddy relationships.



Use controlled discovery and invitation workflows as the MVP foundation; improve the weak scheduling and feedback experience.









Differentiation: Broad role coverage, visible compatibility reasons, user-selected partners, lightweight scheduling, private feedback, and interview-count gamification in one free workflow.





5. Product Principles



Principle



Product implication



Control over opacity



Users choose peers from transparent attributes instead of trusting an unexplained score.



Practice over content



The product coordinates people and sessions; it does not compete with question libraries.



Reciprocity



Each session is designed for both participants to interview and be interviewed.



Progress without pressure



Personal milestones are always available; public competition is optional.



Privacy by default



Only authenticated users discover profiles, emails stay private, and leaderboard visibility is opt-in.



Hobby-project discipline



Prefer deterministic workflows and external meeting infrastructure over operationally heavy systems.









6. End-to-End User Journey







Figure 1. The MVP closes the loop from partner discovery to measurable practice progress.





Sign in - Use Google OAuth or an email magic link. Unauthenticated visitors may view the landing page but not profiles.





Onboard - Enter public display information, practice preferences, timezone, languages, and recurring availability.





Discover - Filter eligible peers and review visible overlap reasons such as shared format, language, experience band, or availability.





Invite - Propose a format, 30/45/60-minute duration, short message, and one to three exact time options.





Negotiate - The recipient accepts one option, declines, or counters with replacement options in the same invitation.





Practice - Acceptance atomically creates a session, private Jitsi room, confirmation email, and downloadable calendar event.





Reflect - Both users confirm completion, report no-shows if needed, and exchange structured private feedback.





Progress - Eligible completed sessions update lifetime milestones and, when enabled, the weekly leaderboard.





7. Functional Requirements





7.1 Authentication and onboarding





Support Google OAuth and email magic-link authentication through Supabase Auth.





Require a completed profile before discovery, invitations, session access, or leaderboard enrollment.





Collect display name, OAuth avatar or initials, target job title, industry, experience band, languages, timezone, short bio, and interview formats.





Collect one or more recurring weekly availability windows in the user's timezone and store normalized values for overlap calculations.





Permit profile deactivation, which immediately removes the user from discovery and public rankings.





7.2 Peer discovery





Expose profiles only to authenticated users with completed onboarding.





Filter by interview format, industry, experience band, language, timezone, and availability overlap.





Exclude the current user, inactive profiles, blocked relationships, and profiles with no compatible format.





Show human-readable match reasons; do not display a proprietary numerical compatibility score.





Sort by shared interview format, overlapping availability, and recent activity.





Reveal display name, avatar or initials, role, industry, experience band, languages, formats, availability summary, earned badges, and completed-interview count; never reveal email.





7.3 Invitations and scheduling





An invitation includes sender, recipient, interview format, optional message, duration, and one to three future UTC timestamps.





Allowed durations are 30, 45, and 60 minutes; the default is 60 minutes for reciprocal practice.





The recipient may accept one option, decline, or counter with one to three replacement options.





States are pending, countered, accepted, declined, expired, and cancelled.





Unanswered invitations expire after 72 hours. Expiry is derived from the timestamp and does not require a background job.





Permit one pending invitation per pair and interview format and no more than ten new invitations per sender per UTC day.





Acceptance must be transactional: create exactly one session, close all alternatives, and remain idempotent under retries.





7.4 Session experience





Generate an unguessable room identifier from the session UUID and use it in an external Jitsi URL.





Make the room link and calendar download visible only to the two authenticated participants.





Provide the agreed format, duration, participant profiles, suggested reciprocal structure, and optional preparation note.





Send immediate acceptance and cancellation emails and attach or link an iCalendar event.





Do not record, proxy, transcribe, or store call media.





Support scheduled, completed, cancelled, no-show, and disputed session states.





For MVP rescheduling, cancel the existing session and create a replacement invitation.





7.5 Feedback





Allow feedback only after a participant confirms session completion.





Collect 1-5 ratings for preparedness, communication, and helpfulness, plus strengths and improvement notes.





Make submitted feedback readable only by its recipient and immutable except for moderator removal.





Do not publish written feedback or individual ratings on profiles.





Show aggregate trust indicators only after at least three eligible completed sessions.





7.6 Trust and safety





Allow users to block another profile from all discovery, invitation, session, and leaderboard surfaces.





Allow reporting from peer and session pages with a controlled reason and optional details.





A report marks the associated session disputed and freezes gamification credit until resolved.





Use Supabase Studio for MVP moderation; no custom admin application is required.





Never expose Auth emails, service-role credentials, private feedback, report details, or room links through public profile queries.





8. Gamification Specification





8.1 Interview Journey

Gamification rewards verified practice rather than arbitrary activity. The authoritative measure is eligible completed interviews; the MVP does not introduce abstract XP, coins, streak penalties, or redeemable credits.



Verified interviews



Badge



Meaning



1



First Mock



Completed the first mutually confirmed peer session.



3



Momentum



Established an initial practice rhythm.



5



Practice Regular



Demonstrated repeat engagement.



10



Double Digits



Reached ten eligible completed sessions.



25



Peer Pro



Built substantial reciprocal-practice experience.



50



Practice Champion



Maintained a long-term practice habit.



100



Century Club



Reached the highest launch milestone.









Show lifetime count, current badge, next milestone, and a progress bar on the authenticated dashboard.





Show earned badges and completed-interview count on authenticated peer profiles.





Display a single accessible milestone celebration when a badge is first earned.





Respect prefers-reduced-motion and provide equivalent text and screen-reader announcements.





Award badges permanently; leaderboard opt-out never removes personal progress.





8.2 Counting rules





Count a session only after both participants independently confirm completion.





Do not count cancelled, no-show, disputed, reported, or incomplete sessions.





Make confirmation idempotent and award each eligible session at most once per participant.





Credit only the first mutually completed session between the same pair per UTC day toward badges and leaderboards.





Retain additional same-day sessions in history and allow feedback, but mark them non-creditable.





Derive progress from eligible session records or an authoritative view rather than an editable profile counter.





8.3 Opt-in weekly leaderboard



Rule



Definition



Participation



Disabled by default; a user must explicitly opt in and may leave immediately.



Window



Monday 00:00 UTC through Sunday 23:59 UTC.



Ranking



Eligible interviews completed during the current window.



Tie-break 1



Higher number of unique practice partners.



Tie-break 2



Earlier timestamp for reaching the tied score.



Display



Top 20: rank, display name, avatar/initials, current badge, and weekly count.



Privacy



No email, written feedback, report history, or non-opted-in user appears.









Quality safeguard: A global leaderboard is intentionally secondary to personal milestones. It rewards practice volume but cannot unlock product access, monetary value, or preferential matching.





9. Information Architecture and UX



Route



Purpose



Required content



/



Public landing



Value proposition, how it works, supported formats, trust, competitor-informed differentiation, and sign-in CTA.



/onboarding



Profile setup



Stepwise form for identity, goals, formats, timezone, languages, and weekly availability.



/discover



Peer discovery



Filters, match reasons, availability summaries, progress badges, and invite CTA.



/peers/[id]



Peer detail



Full public profile, shared attributes, availability overlap, invitation form, block/report.



/invitations



Requests



Incoming/outgoing tabs, status, expiry, time options, accept/decline/counter.



/sessions/[id]



Session



Schedule, participants, Jitsi link, calendar download, cancellation, completion, and feedback.



/leaderboard



Weekly ranking



Opt-in state, top 20, current user position if ranked, and personal progress.



/profile



Account and privacy



Preferences, availability, badges, leaderboard toggle, deactivation, and blocked users.









9.1 Visual and accessibility direction





Use a professional, trust-led interface: off-white canvas, deep ink typography, restrained violet/teal accents, generous whitespace, and clear profile cards.





Use the competitor screenshot only as a structural reference for clarity; do not reproduce Exponent branding, page composition, or proprietary assets.





Meet WCAG 2.2 AA contrast and keyboard requirements for discovery, forms, modals, dialogs, and session controls.





Provide persistent labels, actionable validation, logical focus movement, visible focus states, and reduced-motion alternatives.





Design mobile-first for discovery and invitations while keeping data-dense management surfaces readable on desktop.





10. Technical Architecture







Figure 2. Supabase is the system of record; Vercel hosts the web application and protected server functions.





10.1 Repository migration





Replace the current inventory product surface and preserve Git history.





Remove vinext, Cloudflare Worker, Vite, Wrangler, D1/Drizzle, and Sites-specific runtime configuration.





Retain Next.js 16, React 19, TypeScript, Tailwind CSS, and the App Router.





Refactor the monolithic page into route-focused server and client components with shared UI primitives.





10.2 Application boundaries



Boundary



Responsibility



Next.js UI



Server-rendered public/authenticated routes, forms, progressive enhancement, and responsive presentation.



Server actions



Validated profile, invitation, session, feedback, block, report, and leaderboard mutations.



Route handlers



Auth callback, authorized calendar download, and health/smoke endpoints.



Supabase Auth



Google OAuth, email magic link, cookie-based SSR sessions, and verified claims.



Supabase Postgres



Application records, RLS, state-transition RPCs, progress views, and authoritative timestamps.



Jitsi



External unrecorded meeting room generated from an unguessable session identifier.



Resend



Immediate transactional email; email failure never rolls back an accepted session.





The MVP has no separate API service. Protected reads use server components or Supabase clients governed by RLS. Protected writes use server actions and database functions so authorization and state transitions remain testable and centralized.





10.3 Email and calendar behavior





Send immediate emails for new invitations, counters, acceptance, cancellation, and available feedback.





Generate an RFC 5545-compatible .ics file using UTC timestamps and a stable session UID.





Do not implement hourly reminder jobs on the Vercel Hobby plan; calendar applications provide reminder behavior for the MVP.





Log delivery failures without exposing provider responses to end users; show that the in-app record is authoritative.





11. Data Model and Security



Entity



Purpose



profiles



Public display attributes, target role, industry, experience, languages, timezone, bio, activity state, leaderboard opt-in.



profile_interview_types



Normalized many-to-many set of supported practice formats.



availability_windows



Recurring weekday, start/end minutes, and timezone ownership.



invitations



Participants, format, message, duration, state, expiry, and audit timestamps.



invitation_time_options



One to three proposed UTC times and selected state.



sessions



Accepted invitation, scheduled time, duration, room identifier, state, dispute status.



session_confirmations



Per-participant completed/no-show confirmation and credited status.



feedback



Reviewer, recipient, private ratings, text, and immutable timestamps.



user_badges



Permanent badge awards linked to authoritative progress thresholds.



blocks



Directional user block that suppresses all mutual surfaces.



reports



Private moderation reason, details, session reference, status, and audit fields.









11.1 Database functions and views





accept_invitation(invitation_id, option_id): verify recipient, pending state, future option, and transactionally create exactly one session.





confirm_session_completion(session_id, outcome): record one participant response, finalize when both agree, determine credit eligibility, and award newly crossed badges.





user_progress: derive eligible lifetime count, badge state, next milestone, and remaining interviews.





weekly_leaderboard: expose top 20 opted-in users for the current UTC week with deterministic tie-breaks.





11.2 Row-Level Security



Surface



Policy intent



Profiles



Owner updates; authenticated completed users read approved public columns only.



Availability



Owner writes; authenticated discovery may read normalized availability fields.



Invitations



Only sender and recipient read; constrained server action or RPC performs transitions.



Sessions



Only the two participants read room details or mutate participant outcomes.



Feedback



Reviewer inserts after completion; only recipient reads; no public select.



Gamification



Users read own progress; leaderboard exposes only opted-in public projection.



Blocks/reports



Owner creates and reads own blocks; report details limited to reporter and service role.









Security invariant: The service-role key is server-only. Client authorization relies on verified Supabase claims and RLS, never on an unvalidated session object or hidden UI controls.





12. Non-functional Requirements



Quality attribute



Requirement



Performance



Public landing LCP under 2.5 seconds at the 75th percentile; discovery results render within 1.5 seconds for the initial beta dataset.



Reliability



Invitation acceptance and completion confirmation are transactional and idempotent.



Accessibility



WCAG 2.2 AA, keyboard-complete workflows, semantic headings, labeled forms, and reduced motion.



Privacy



No public email exposure, no call recording, private feedback, opt-in leaderboard, and account deactivation.



Localization readiness



Store UTC timestamps and IANA timezones; keep display strings separable even though MVP is English-only.



Observability



Structured server logs for auth callback, mutation failures, email delivery, and database RPC errors without sensitive payloads.



Maintainability



Typed Supabase schema, focused modules, reusable validation, and migration-controlled database changes.









13. Analytics and Measurement

Use database records as the primary funnel evidence. Avoid duplicating sensitive profile or feedback content into a third-party analytics system. Vercel Web Analytics may measure anonymous page traffic; product conversion metrics come from Supabase.



Event



Trigger and privacy rule



profile_completed



User first satisfies onboarding requirements.



discovery_filter_used



An authenticated user changes a discovery filter; store filter category, not free-text value.



invitation_sent



Valid invitation is created.



invitation_resolved



Accepted, declined, countered, expired, or cancelled.



session_completed



Both users confirm completion.



feedback_submitted



Private feedback record is created; never copy its text into analytics.



badge_awarded



A user crosses a milestone.



leaderboard_opted_in/out



A user changes public ranking preference.



report_submitted



Trust event created; store reason category only in analytics.









14. Test and Acceptance Plan





14.1 Automated testing





Unit tests: validation, timezone conversion, overlap calculations, invitation expiry, .ics output, badge thresholds, UTC week boundaries, and ranking tie-breaks.





Database integration tests: RLS isolation, transactional acceptance, duplicate prevention, invite limits, block exclusion, idempotent confirmation, daily same-pair credit, badge awards, and leaderboard privacy.





Playwright tests: two-user onboarding, discovery, invite/counter/accept, meeting access, completion, feedback, milestone celebration, leaderboard opt-in, and withdrawal.





Accessibility tests: keyboard navigation, focus management, semantic forms, contrast, screen-reader status announcements, and reduced motion.





Build checks: lint, TypeScript, Next.js production build, migration replay, environment validation, and route smoke tests.





14.2 MVP acceptance scenarios



ID



Acceptance criterion



Priority



A1



A verified user completes onboarding and immediately appears in eligible discovery results.



Required



A2



A user filters peers, opens a profile, and sends one to three valid time options.



Required



A3



The recipient counters or accepts; acceptance creates one session under concurrent retries.



Required



A4



Only participants can view the Jitsi link or download the calendar event.



Required



A5



Both users confirm completion and each receives exactly one eligible interview credit.



Required



A6



Crossing a threshold awards one permanent badge and shows next-milestone progress.



Required



A7



An opted-in user appears in the correct weekly rank and disappears immediately after opt-out.



Required



A8



Feedback is readable only by the recipient; blocked users disappear from all mutual surfaces.



Required



A9



Cancelled, no-show, disputed, and duplicate same-pair daily sessions do not earn credit.



Required



A10



The complete two-user flow works on the deployed Vercel production URL.



Launch gate









15. Rollout and Roadmap



Phase



Deliverables



Exit criterion



Foundation



Convert repository to standard Next.js; configure Supabase SSR, migrations, RLS, auth, and Vercel environments.



Build and auth smoke test pass.



Marketplace



Onboarding, availability, discovery, profiles, invitations, negotiation, and limits.



Two test users reach accepted session.



Practice loop



Session page, Jitsi, calendar, email, completion, feedback, block/report.



End-to-end journey passes.



Gamification



Progress view, badges, celebrations, opt-in weekly leaderboard, anti-farming rules.



Threshold and privacy tests pass.



Closed beta



Invite an initial real cohort, monitor funnel metrics, moderate reports in Supabase Studio.



No critical privacy defects; targets reviewed.



Public MVP



Open verified sign-up, publish support content, and monitor Supabase/Vercel limits.



Production acceptance criteria remain green.









15.1 Later iterations





Automatic slot-based matching after the marketplace has sufficient supply.





Role-specific directories and format leaderboards when category density is meaningful.





Calendar-provider integrations and precise reminders on infrastructure that supports them.





Native interview rooms, collaborative editors, and structured question kits.





AI transcripts or feedback only with explicit consent, retention controls, and demonstrated demand.





Paid coaching or membership only after the free peer loop has proven retention.





16. Risks and Mitigations



Risk



Impact



Mitigation



Cold start



Users see too few relevant peers.



Launch with a recruited beta cohort across several broad formats; show empty-state invitations to expand availability.



No-shows



Trust and completion decline.



Mutual confirmation, no-show reporting, visible completion history after sufficient sessions, and cancellation guidance.



Quantity gaming



Badges or ranks reward low-quality sessions.



Dual confirmation, same-pair daily credit limit, dispute freeze, unique-partner tie-break, and no monetary rewards.



Role taxonomy sprawl



All-job-seeker coverage becomes unmanageable.



Free-text target title plus controlled industry, format, experience, language, and timezone fields.



Privacy leakage



Email, feedback, or room link reaches an unauthorized user.



Public projections, verified claims, comprehensive RLS tests, server-only secrets, and participant-only routes.



External room dependency



Jitsi availability or policy changes.



Keep room provider behind one adapter and permit a replacement meeting URL in a later release.



Hobby-plan limits



Email, function, or database usage exceeds free tiers.



Immediate-only email, no media storage, usage dashboards, rate limits, and documented upgrade thresholds.









17. Assumptions and Final Decisions





The product serves all job seekers and is not limited to technical interviews.





Browse-and-invite is the MVP matching model; automatic matching is deferred.





The current inventory prototype is replaced rather than preserved in a sub-application.





The product is free, English-first, responsive, and open to verified public sign-up.





Jitsi provides external meeting rooms; the product stores no recordings or call media.





Personal milestones are always available; leaderboard participation is disabled by default and opt-in.





OAuth avatars or initials are used; custom avatar uploads are deferred.





Supabase is the sole system of record; Vercel hosts Next.js and server functions.





Production contains no fabricated peer profiles; demo users are confined to preview or local environments.





No unresolved product decisions are required before implementation begins.





18. Sources

The following sources informed competitor analysis and current platform implementation choices. Product requirements in this PRD are original decisions rather than reproductions of competitor designs.



1. Exponent Practice - peer and AI mock interviews



2. InterviewBit - peer mock interviews



3. Supabase - creating an SSR client for Next.js



4. Supabase - Postgres Row-Level Security



5. Vercel - cron usage and Hobby-plan limits



6. Supabase - database webhooks



7. Supabase - sending email from Edge Functions with Resend



