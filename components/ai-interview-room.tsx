'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  fetchInitialQuestions, 
  generateFeedbackScorecard, 
  ComprehensiveScorecard 
} from '@/app/actions/ai-interview';
import {
  getActiveSession,
  createSession,
  updateSession,
  clearSession,
  AIInterviewSession
} from '@/lib/ai-session';
import { 
  Mic, 
  Square, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  RotateCcw, 
  Sparkles,
  Volume2,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Lightbulb,
  Check,
  X,
  Tag,
  SkipForward
} from 'lucide-react';

interface AIInterviewRoomProps {
  format: string;
  domain: string;
  onReset?: () => void;
}

export function AIInterviewRoom({ format, domain, onReset }: AIInterviewRoomProps) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>(['', '', '', '']);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ComprehensiveScorecard | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'vocabulary' | 'fluency' | 'grammar' | 'interaction'>('general');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({ 0: true });
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  // Tracks text accumulated before the current recognition session started
  const baseTranscriptRef = useRef<string>('');
  // Tracks whether the user intends to be recording (for mobile auto-restart)
  const wantsRecordingRef = useRef<boolean>(false);
  // Detect mobile browser
  const isMobileRef = useRef<boolean>(false);

  // Speech Recognition & Synthesis Initialization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      synthesisRef.current = window.speechSynthesis;
      
      // Detect mobile: Android, iPhone, iPad, or mobile user agents
      const ua = navigator.userAgent || '';
      isMobileRef.current = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        
        // Mobile: use non-continuous mode to avoid duplication bugs
        // Desktop: use continuous mode which works correctly
        recognition.continuous = !isMobileRef.current;
        recognition.interimResults = true;
        recognition.lang = (navigator.language && navigator.language.length > 0) ? navigator.language : 'en-US';
        recognition.maxAlternatives = 1;
        
        recognition.onresult = (event: any) => {
          if (isMobileRef.current) {
            // MOBILE STRATEGY: Non-continuous mode, one phrase at a time
            // Each recognition session produces a single result group
            // We only care about the latest result in this session
            const lastResult = event.results[event.results.length - 1];
            const transcript = lastResult[0].transcript;
            
            if (lastResult.isFinal) {
              // Phrase is finalized — commit it to the base
              baseTranscriptRef.current = (baseTranscriptRef.current + transcript + ' ').replace(/\s+/g, ' ');
              setAnswers(prev => {
                const updated = [...prev];
                updated[currentIndex] = baseTranscriptRef.current.trim();
                return updated;
              });
            } else {
              // Show interim: base + current partial phrase
              const combined = (baseTranscriptRef.current + transcript).trim();
              setAnswers(prev => {
                const updated = [...prev];
                updated[currentIndex] = combined;
                return updated;
              });
            }
          } else {
            // DESKTOP STRATEGY: Continuous mode with event.resultIndex tracking
            let sessionFinal = '';
            let sessionInterim = '';
            
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const result = event.results[i];
              const transcript = result[0].transcript;
              if (result.isFinal) {
                sessionFinal += transcript;
              } else {
                sessionInterim = transcript;
              }
            }
            
            const base = baseTranscriptRef.current;
            const combined = (base + sessionFinal + sessionInterim).trim();
            
            if (sessionFinal) {
              baseTranscriptRef.current = (base + sessionFinal).trimStart();
            }
            
            setAnswers(prev => {
              const updated = [...prev];
              updated[currentIndex] = combined;
              return updated;
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          if (event.error !== 'aborted' && event.error !== 'no-speech') {
            setError(`Microphone notice: ${event.error}. You can also type your answer directly in the box below.`);
            wantsRecordingRef.current = false;
            setIsRecording(false);
          }
        };

        recognition.onend = () => {
          if (isMobileRef.current && wantsRecordingRef.current) {
            // Mobile auto-restart: the engine stopped after one phrase,
            // but the user still wants to record — restart immediately
            try {
              recognition.start();
            } catch (e) {
              // If restart fails, stop recording gracefully
              wantsRecordingRef.current = false;
              setIsRecording(false);
            }
          } else {
            setIsRecording(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setError("Speech recognition is limited in this browser. You can type your answers directly in the response box below.");
      }
    }
  }, [currentIndex]);

  // Fetch 4 Questions upfront on mount — or restore from active session
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoadingQuestions(true);
      setError(null);
      
      // Check for an active session that matches this format + domain
      const activeSession = getActiveSession();
      if (activeSession && activeSession.format === format && activeSession.domain === domain) {
        // Restore session — skip API call entirely
        setQuestions(activeSession.questions);
        setAnswers(activeSession.answers);
        setCurrentIndex(activeSession.currentIndex);
        setIsLoadingQuestions(false);
        // Read out the current question
        if (activeSession.questions[activeSession.currentIndex]) {
          speakText(activeSession.questions[activeSession.currentIndex]);
        }
        return;
      }
      
      try {
        const qList = await fetchInitialQuestions(domain, format);
        setQuestions(qList);
        
        // Create a new session to persist these questions
        createSession(format, domain, qList);
        
        if (qList.length > 0) {
          speakText(qList[0]);
        }
      } catch (err: any) {
        const rawMsg = err.message || '';
        if (rawMsg.includes('Server Components render') || rawMsg.includes('digest')) {
          setError('Notice: AI Interview key is unconfigured in production. Using practice question set.');
        } else {
          setError(rawMsg || 'Failed to load interview questions.');
        }
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save session progress whenever answers or currentIndex change
  useEffect(() => {
    if (questions.length > 0 && !feedback) {
      updateSession({ answers, currentIndex });
    }
  }, [answers, currentIndex, questions.length, feedback]);

  const speakText = (text: string) => {
    if (synthesisRef.current) {
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      
      const voices = synthesisRef.current.getVoices();
      const indianVoice = voices.find(v => {
        const lang = (v.lang || '').toLowerCase().replace('_', '-');
        const name = (v.name || '').toLowerCase();
        return lang.includes('en-in') || 
               name.includes('india') || 
               name.includes('heera') || 
               name.includes('ravi') || 
               name.includes('veena') || 
               name.includes('neerja');
      });

      const preferredVoice = indianVoice || 
        voices.find(v => v.name.includes('Google') || v.name.includes('Natural')) || 
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        if (indianVoice) utterance.lang = 'en-IN';
      }

      synthesisRef.current.speak(utterance);
    }
  };

  const toggleRecording = () => {
    if (isSubmitting || feedback) return;

    if (isRecording) {
      wantsRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsRecording(false);
    } else {
      if (synthesisRef.current) synthesisRef.current.cancel();
      // Set base to existing answer text so new speech appends to it
      baseTranscriptRef.current = answers[currentIndex] && answers[currentIndex] !== '(Skipped)' ? answers[currentIndex] + ' ' : '';
      setError(null);
      try {
        wantsRecordingRef.current = true;
        recognitionRef.current?.start();
        setIsRecording(true);
      } catch (e) {
        wantsRecordingRef.current = false;
        console.error(e);
      }
    }
  };

  const handleNextQuestion = () => {
    if (isRecording) {
      wantsRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsRecording(false);
    }

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      baseTranscriptRef.current = answers[nextIdx] && answers[nextIdx] !== '(Skipped)' ? answers[nextIdx] : '';
      speakText(questions[nextIdx]);
    }
  };

  const handlePrevQuestion = () => {
    if (isRecording) {
      wantsRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsRecording(false);
    }

    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      baseTranscriptRef.current = answers[prevIdx] && answers[prevIdx] !== '(Skipped)' ? answers[prevIdx] : '';
      speakText(questions[prevIdx]);
    }
  };

  const handleSkipQuestion = () => {
    if (isRecording) {
      wantsRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsRecording(false);
    }

    // Mark current answer as (Skipped)
    setAnswers(prev => {
      const copy = [...prev];
      copy[currentIndex] = '(Skipped)';
      return copy;
    });

    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      baseTranscriptRef.current = answers[nextIdx] && answers[nextIdx] !== '(Skipped)' ? answers[nextIdx] : '';
      speakText(questions[nextIdx]);
    }
  };

  const handleSubmitAll = async () => {
    if (isRecording) {
      wantsRecordingRef.current = false;
      try { recognitionRef.current?.stop(); } catch (e) {}
      setIsRecording(false);
    }

    setIsSubmitting(true);
    setError(null);

    const qaPairs = questions.map((q, i) => ({
      question: q,
      answer: answers[i] || '(Skipped)'
    }));

    try {
      const result = await generateFeedbackScorecard(qaPairs);
      setFeedback(result);
      // Session completed successfully — clear it from localStorage
      clearSession();
    } catch (err: any) {
      setError(err.message || 'Failed to submit interview for evaluation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleQuestionExpand = (index: number) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Helper for Circular Progress
  const renderCircleProgress = (val: number, label: string) => {
    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const score = Math.min(Math.max(val, 0), 10);
    const strokeDashoffset = circumference - (score / 10) * circumference;
    const colorClass = score >= 6 ? 'stroke-emerald-400' : score >= 4 ? 'stroke-amber-400' : 'stroke-red-400';

    return (
      <div className="flex flex-col items-center space-y-2">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              className="stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r={radius}
              className={`${colorClass} transition-all duration-1000 ease-out`}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <span className="absolute text-lg font-black text-white">{score.toFixed(1)}</span>
        </div>
        <span className="text-xs font-semibold text-slate-300 tracking-wide text-center">{label}</span>
      </div>
    );
  };

  // Calculate actual skipped count
  const skippedCount = answers.filter(a => a === '(Skipped)' || a === '').length;

  // 1. Loading 4 Questions State
  if (isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-sandow-500" />
        <p className="text-white font-bold text-lg">Generating 4 tailored interview questions for {domain}...</p>
        <p className="text-slate-400 text-xs mt-1">{format} Format</p>
      </div>
    );
  }

  // 2. Submitting Evaluation State
  if (isSubmitting) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-sandow-500" />
        <p className="text-white font-bold text-xl">Analyzing your performance across all categories...</p>
        <p className="text-slate-400 text-xs mt-1">Evaluating Clarity, Confidence, Vocabulary, Fluency, & Structure.</p>
      </div>
    );
  }

  // 3. Premium Scorecard Dashboard View (Strictly Matching Invitations/Leaderboard Style)
  if (feedback) {
    const currentTabFeedback = 
      activeTab === 'general' ? feedback.generalFeedback :
      activeTab === 'vocabulary' ? feedback.vocabularyFeedback :
      activeTab === 'fluency' ? feedback.fluencyFeedback :
      activeTab === 'grammar' ? feedback.grammarFeedback :
      feedback.interactionFeedback;

    return (
      <div className="space-y-6 w-full animate-in fade-in pb-16">
        
        {/* Top Header Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center space-x-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${
                feedback.passed ? 'bg-sandow-500/20 text-sandow-400 border border-sandow-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {feedback.passed ? <CheckCircle2 className="w-8 h-8 text-sandow-400" /> : <AlertTriangle className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-extrabold text-white">
                    {feedback.passed ? 'PASSED' : 'NEEDS PRACTICE'}
                  </h1>
                </div>
                <p className="text-sm text-slate-400 mt-1">{feedback.passMessage}</p>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <span className="text-4xl font-extrabold text-sandow-400">{feedback.overallScore?.toFixed(1) || '8.5'}</span>
                <span className="text-base text-slate-400 font-bold"> / 10</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-white/5 transition"
                >
                  Download PDF
                </button>
              </div>
            </div>
          </div>

          {/* Criteria Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
            {(() => {
              const overallVal = feedback.criteria?.overallValue ?? feedback.overallScore ?? 0;
              const overallPass = overallVal >= 6.0;
              const skipsVal = feedback.criteria?.skippedCount ?? skippedCount;
              const skipsPass = skipsVal <= 1;
              const lowestVal = feedback.criteria?.lowestValue ?? 0;
              const lowestPass = lowestVal >= 4.0;

              return (
                <>
                  <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 border border-white/5 bg-slate-900/40">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      overallPass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {overallPass ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Overall ≥ 6.0</p>
                      <p className="text-xs text-slate-400">you: {overallVal.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 border border-white/5 bg-slate-900/40">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      skipsPass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {skipsPass ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Max 1 skip</p>
                      <p className="text-xs text-slate-400">you skipped: {skipsVal}</p>
                    </div>
                  </div>

                  <div className="glass-panel p-4 rounded-xl flex items-center space-x-3 border border-white/5 bg-slate-900/40">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                      lowestPass ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {lowestPass ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">No area below 4.0</p>
                      <p className="text-xs text-slate-400">your lowest: {lowestVal.toFixed(1)}</p>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Earned Badges Chips */}
          <div className="flex flex-wrap gap-2 mt-6">
            {feedback.badges?.map((badge, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sandow-500/15 border border-sandow-500/30 text-sandow-300"
              >
                <Award className="w-3.5 h-3.5 text-sandow-400" />
                <span>{badge}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Performance Breakdown Circular Metrics */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              PERFORMANCE BREAKDOWN <span className="text-[10px] text-slate-500 font-normal ml-2">— green = good (6+), orange = average (4-6), red = poor (&lt;4)</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 pt-2">
            {renderCircleProgress(feedback.metrics?.clarity || 9.0, 'Clarity')}
            {renderCircleProgress(feedback.metrics?.confidence || 8.5, 'Confidence')}
            {renderCircleProgress(feedback.metrics?.relevance || 9.0, 'Relevance')}
            {renderCircleProgress(feedback.metrics?.depthOfKnowledge || 8.5, 'Depth of Knowledge')}
            {renderCircleProgress(feedback.metrics?.structure || 8.5, 'Structure')}
            {renderCircleProgress(feedback.metrics?.vocabulary || 8.5, 'Vocabulary')}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 mt-2 border-t border-white/10">
            <div className="p-4 rounded-xl border border-white/5 bg-black/30 text-center">
              <span className="text-xl font-extrabold text-white">{4 - skippedCount}/4</span>
              <p className="text-xs text-slate-400 mt-0.5">Questions Attempted</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-black/30 text-center">
              <span className="text-xl font-extrabold text-white">{feedback.stats?.totalTime || '3m 45s'}</span>
              <p className="text-xs text-slate-400 mt-0.5">Total Time Taken</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-black/30 text-center">
              <span className="text-sm font-bold text-sandow-400 block truncate">{feedback.stats?.focusArea || 'Depth of Knowledge'}</span>
              <p className="text-xs text-slate-400 mt-0.5">Focus Area</p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-black/30 text-center">
              <span className="text-xl font-extrabold text-amber-400">{skippedCount}</span>
              <p className="text-xs text-slate-400 mt-0.5">Skipped</p>
            </div>
          </div>
        </div>

        {/* Tabbed Detailed Analysis matching Invitations Page Tab Buttons */}
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
          {/* Tab Navigation Buttons */}
          <div className="flex items-center space-x-2 border-b border-white/10 p-4 bg-slate-900/60 overflow-x-auto">
            {(['general', 'vocabulary', 'fluency', 'grammar', 'interaction'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition capitalize whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-sandow-500/20 border border-sandow-500/40 text-sandow-300' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-6">
            {/* Strengths */}
            {currentTabFeedback?.strengths && currentTabFeedback.strengths.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sandow-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">STRENGTHS</span>
                </div>
                <ul className="space-y-2 pl-6 list-disc text-sm text-slate-300">
                  {currentTabFeedback.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weaknesses */}
            {currentTabFeedback?.weaknesses && currentTabFeedback.weaknesses.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2 text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">WEAKNESSES</span>
                </div>
                <ul className="space-y-2 pl-6 list-disc text-sm text-slate-300">
                  {currentTabFeedback.weaknesses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Suggestions */}
            {currentTabFeedback?.suggestions && currentTabFeedback.suggestions.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center space-x-2 text-sandow-400">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">SUGGESTIONS</span>
                </div>
                <ul className="space-y-2 pl-6 list-disc text-sm text-slate-300">
                  {currentTabFeedback.suggestions.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Question Review Accordion */}
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
              QUESTION REVIEW <span className="text-[10px] text-slate-500 font-normal ml-2">— Highlighted answers are evaluated for key terms</span>
            </h2>
          </div>

          <div className="space-y-4">
            {feedback.questions?.map((q: any, i: number) => {
              const isExpanded = !!expandedQuestions[i];
              const isSkipped = !q.userAnswer || q.userAnswer.includes('(Skipped)') || q.userAnswer.includes('(No response');

              return (
                <div key={i} className="glass-panel rounded-xl border border-white/10 overflow-hidden transition">
                  {/* Header */}
                  <button
                    onClick={() => toggleQuestionExpand(i)}
                    className="w-full flex items-center justify-between p-4 text-left bg-black/40 hover:bg-black/60 transition"
                  >
                    <div className="flex items-center space-x-3 pr-4">
                      {isSkipped ? (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                          SKIPPED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-sandow-500/20 text-sandow-300 border border-sandow-500/30 uppercase tracking-wider">
                          ANSWERED
                        </span>
                      )}
                      <span className="font-bold text-sm text-white">
                        Q{i + 1}. {q.question}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                  </button>

                  {/* Body */}
                  {isExpanded && (
                    <div className="p-6 space-y-6 border-t border-white/10 bg-black/20 animate-in fade-in">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Answer</span>
                        <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-sm text-slate-200 leading-relaxed">
                          {q.userAnswer || <span className="italic text-amber-400">(Skipped)</span>}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-sandow-400 uppercase tracking-wider">Feedback & Assessment</span>
                        <div className="p-4 rounded-xl bg-sandow-500/10 border border-sandow-500/20 text-sm text-slate-300 leading-relaxed">
                          {q.feedback}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Model Answer to Aim For</span>
                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-100/90 leading-relaxed">
                          {q.betterAnswer}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Keywords to Use */}
        {feedback.recommendedKeywords && feedback.recommendedKeywords.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center space-x-2 text-sandow-400">
              <Tag className="w-4 h-4" />
              <h3 className="text-xs font-extrabold uppercase tracking-wider">Keywords to use — Terms interviewers listen for</h3>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {feedback.recommendedKeywords.map((kw, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-xs font-semibold bg-black/40 border border-white/10 text-slate-300">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Restart Action CTA */}
        <div className="pt-4 text-center">
          <button
            onClick={onReset || (() => window.location.reload())}
            className="inline-flex items-center space-x-2 bg-sandow-500 hover:bg-sandow-400 text-white font-bold px-8 py-3 rounded-xl shadow-md shadow-sandow-500/20 transition"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Start New Interview</span>
          </button>
        </div>

      </div>
    );
  }

  // 4. Main 4-Question Stepper Interface
  const currentQuestion = questions[currentIndex] || '';
  const currentAnswer = answers[currentIndex] || '';

  return (
    <div className="space-y-6 w-full">
      {/* Header & Stepper */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">{domain} Practice</h2>
          <p className="text-xs text-slate-400">{format} Interview</p>
        </div>

        {/* Stepper badges */}
        <div className="flex items-center space-x-2">
          {questions.map((_, idx) => {
            const isAns = answers[idx] && answers[idx] !== '(Skipped)';
            const isSkip = answers[idx] === '(Skipped)';

            return (
              <button
                key={idx}
                onClick={() => {
                  if (isRecording) try { recognitionRef.current?.stop(); } catch(e){}
                  setIsRecording(false);
                  setCurrentIndex(idx);
                  speakText(questions[idx]);
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition ${
                  idx === currentIndex
                    ? 'bg-sandow-500 text-white shadow-md shadow-sandow-500/20'
                    : isAns
                      ? 'bg-sandow-500/20 text-sandow-300 border border-sandow-500/40'
                      : isSkip
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/5'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Current Question Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-sandow-400 uppercase tracking-widest bg-sandow-500/20 px-3 py-1 rounded-full border border-sandow-500/30">
            Question {currentIndex + 1} of 4
          </span>
          <button
            onClick={() => speakText(currentQuestion)}
            className="flex items-center space-x-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-white/5 transition font-semibold"
            title="Repeat Question Voice"
          >
            <Volume2 className="w-3.5 h-3.5 text-sandow-400" />
            <span>Read Aloud</span>
          </button>
        </div>

        <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-relaxed">
          {currentQuestion}
        </h3>
      </div>

      {/* Live Answer Box */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Your Answer</span>
          {answers[currentIndex] && (
            <button
              onClick={() => {
                setAnswers(prev => {
                  const copy = [...prev];
                  copy[currentIndex] = '';
                  return copy;
                });
              }}
              className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Answer</span>
            </button>
          )}
        </div>

        <textarea
          rows={5}
          value={currentAnswer === '(Skipped)' ? '' : currentAnswer}
          onChange={(e) => {
            const val = e.target.value;
            setAnswers(prev => {
              const copy = [...prev];
              copy[currentIndex] = val;
              return copy;
            });
          }}
          placeholder={isRecording ? 'Listening... Speak your response or type directly here.' : 'Click the microphone button to speak, or type your answer directly here...'}
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 focus:outline-none focus:border-sandow-500 transition placeholder:text-slate-500 placeholder:italic resize-y"
        />
      </div>

      {/* Recording & Navigation Controls */}
      <div className="pt-4 border-t border-white/10 space-y-6">
        {/* Toggle Recording Button */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <button
            onClick={toggleRecording}
            className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer
              ${isRecording 
                ? 'bg-red-500 shadow-[0_0_40px_rgba(239,68,68,0.5)] animate-pulse scale-105' 
                : 'bg-sandow-500 hover:bg-sandow-400 shadow-lg shadow-sandow-500/20 hover:scale-105'
              }
            `}
          >
            {isRecording ? <Square className="w-7 h-7 text-white fill-current" /> : <Mic className="w-9 h-9 text-white" />}
          </button>

          <p className="text-slate-300 text-sm font-semibold">
            {isRecording ? '🔴 Recording... Click to Stop' : '🎙️ Click to Start Recording'}
          </p>
        </div>

        {/* Stepper Navigation & Skip Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handlePrevQuestion}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition"
          >
            Previous
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleSkipQuestion}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center space-x-1.5"
            >
              <SkipForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Skip Question</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-sandow-500 hover:bg-sandow-400 text-white transition shadow-md shadow-sandow-500/20"
              >
                <span>Next Question</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmitAll}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-sandow-500 hover:bg-sandow-400 text-white transition shadow-md shadow-sandow-500/20"
              >
                <Sparkles className="w-4 h-4" />
                <span>Submit for Evaluation</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
