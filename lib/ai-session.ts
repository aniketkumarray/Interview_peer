'use client';

/**
 * AI Interview Session Manager
 * 
 * Persists interview state in localStorage so users can resume
 * interrupted sessions without wasting another Gemini API call.
 * Sessions expire after 24 hours.
 */

const SESSION_KEY = 'peerconnect_ai_interview_session';
const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface AIInterviewSession {
  /** Unique session identifier */
  id: string;
  /** Interview format (e.g., 'Behavioral', 'System Design') */
  format: string;
  /** Target role/domain (e.g., 'Product Manager') */
  domain: string;
  /** The 4 AI-generated questions */
  questions: string[];
  /** User's answers (may be partial, empty, or '(Skipped)') */
  answers: string[];
  /** Index of the current question (0-3) */
  currentIndex: number;
  /** Timestamp when session was created */
  createdAt: number;
  /** Timestamp of last activity */
  updatedAt: number;
}

/** Generate a simple unique session ID */
function generateSessionId(): string {
  return `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Get the active session from localStorage (null if expired or absent) */
export function getActiveSession(): AIInterviewSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    
    const session: AIInterviewSession = JSON.parse(raw);
    
    // Check expiry
    if (Date.now() - session.createdAt > SESSION_EXPIRY_MS) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    // Validate structure
    if (!session.questions || !Array.isArray(session.questions) || session.questions.length === 0) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/** Create a new session and save it */
export function createSession(
  format: string,
  domain: string,
  questions: string[]
): AIInterviewSession {
  const session: AIInterviewSession = {
    id: generateSessionId(),
    format,
    domain,
    questions,
    answers: ['', '', '', ''],
    currentIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to save AI interview session:', e);
  }
  
  return session;
}

/** Update session state (answers, currentIndex) */
export function updateSession(
  updates: Partial<Pick<AIInterviewSession, 'answers' | 'currentIndex'>>
): void {
  if (typeof window === 'undefined') return;
  
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return;
    
    const session: AIInterviewSession = JSON.parse(raw);
    
    if (updates.answers !== undefined) session.answers = updates.answers;
    if (updates.currentIndex !== undefined) session.currentIndex = updates.currentIndex;
    session.updatedAt = Date.now();
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Failed to update AI interview session:', e);
  }
}

/** Clear the session (call after successful submission) */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Failed to clear AI interview session:', e);
  }
}

/** Format the session age as a human-readable string */
export function formatSessionAge(session: AIInterviewSession): string {
  const ageMs = Date.now() - session.updatedAt;
  const mins = Math.floor(ageMs / 60000);
  
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  
  return 'yesterday';
}
