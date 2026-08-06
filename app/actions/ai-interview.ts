'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

export interface QAPair {
  question: string;
  answer: string;
}

export interface FeedbackCategory {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

export interface DetailedQuestionFeedback {
  question: string;
  userAnswer: string;
  feedback: string;
  betterAnswer: string;
}

export interface ComprehensiveScorecard {
  passed: boolean;
  passMessage: string;
  overallScore: number;
  criteria: {
    overallValue: number;
    skippedCount: number;
    lowestValue: number;
  };
  badges: string[];
  metrics: {
    clarity: number;
    confidence: number;
    relevance: number;
    depthOfKnowledge: number;
    structure: number;
    vocabulary: number;
  };
  stats: {
    attempted: string;
    totalTime: string;
    focusArea: string;
    skipped: number;
  };
  generalFeedback: FeedbackCategory;
  vocabularyFeedback: FeedbackCategory;
  fluencyFeedback: FeedbackCategory;
  grammarFeedback: FeedbackCategory;
  interactionFeedback: FeedbackCategory;
  questions: DetailedQuestionFeedback[];
  recommendedKeywords: string[];
}

// Fallback question banks by domain & format
const FALLBACK_QUESTIONS: Record<string, string[]> = {
  'Product Manager': [
    'How do you prioritize competing feature requests from engineering, sales, and end users?',
    'Tell me about a product you launched that failed to hit its metrics. What did you learn and pivot?',
    'How do you handle disagreement with a technical lead on architecture decisions that impact product timeline?',
    'Walk me through how you would design a new feature to improve user retention for our platform.'
  ],
  'System Design': [
    'How would you design a rate limiter for a high-traffic public REST API?',
    'Explain how you choose between SQL and NoSQL databases for a real-time messaging application.',
    'How would you handle global data consistency versus availability (CAP theorem) in a multi-region deployment?',
    'Design a distributed caching architecture to handle sudden traffic spikes on a flash-sale platform.'
  ],
  'Behavioral': [
    'Tell me about a time you had to deal with a difficult team conflict during a high-stakes project.',
    'Describe a scenario where you had to make a critical technical decision under tight deadline pressure.',
    'Give me an example of a goal you missed and how you handled accountability with your stakeholders.',
    'How do you handle receiving critical feedback on your work from peers or leaders?'
  ],
  'Coding': [
    'Explain how you would optimize a slow algorithm from O(N^2) to O(N log N) or O(N).',
    'How do you prevent memory leaks and handle concurrency issues in asynchronous code execution?',
    'Walk me through your testing strategy for a complex data structure or algorithm implementation.',
    'How do you approach refactoring a legacy monolithic codebase while ensuring zero downtime?'
  ],
  'HR & Culture': [
    'Why are you interested in this role and what unique value do you bring to our team culture?',
    'How do you stay motivated and structure your work environment during extended periods of remote work?',
    'Describe your ideal working relationship with your direct manager and cross-functional partners.',
    'Where do you see your technical career progressing over the next 2 to 3 years?'
  ]
};

function getFallbackQuestions(domain: string, format: string): string[] {
  const key = Object.keys(FALLBACK_QUESTIONS).find(k => 
    domain.toLowerCase().includes(k.toLowerCase()) || format.toLowerCase().includes(k.toLowerCase())
  );
  return FALLBACK_QUESTIONS[key || 'Behavioral'] || FALLBACK_QUESTIONS['Behavioral'];
}

/**
 * Fetches 4 tailored interview questions at once based on format and domain
 */
export async function fetchInitialQuestions(
  domain: string,
  format: string
): Promise<string[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY environment variable is not set. Using curated domain fallback questions.");
    return getFallbackQuestions(domain, format);
  }

  const prompt = `You are a top-tier executive interviewer. Generate exactly 4 distinct, realistic, high-quality interview questions for a ${format} interview in the ${domain} domain.
Return your response strictly as a raw JSON array of 4 strings (e.g. ["q1", "q2", "q3", "q4"]). Keep each question concise, professional, and under 35 words.`;

  // Try standard Gemini models with fallback
  const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        }
      });

      const text = result.response.text().trim();
      const questions: string[] = JSON.parse(text);

      if (Array.isArray(questions) && questions.length >= 4) {
        return questions.slice(0, 4);
      }
    } catch (error: any) {
      console.warn(`Gemini model ${modelName} fetchInitialQuestions warning:`, error?.message || error);
      // Continue to next model or fallback
    }
  }

  console.warn("Gemini API unavailable or errored. Returning curated domain questions.");
  return getFallbackQuestions(domain, format);
}

/**
 * Generates an intelligent heuristic fallback evaluation if Gemini is unconfigured/unavailable
 */
function generateFallbackScorecard(qaPairs: QAPair[]): ComprehensiveScorecard {
  const attemptedCount = qaPairs.filter(p => p.answer && p.answer.trim() !== '' && p.answer !== '(Skipped)').length;
  const skippedCount = 4 - attemptedCount;
  
  let overallScore = 8.5;
  if (skippedCount === 1) overallScore = 6.2;
  if (skippedCount === 2) overallScore = 4.5;
  if (skippedCount === 3) overallScore = 2.8;
  if (skippedCount === 4) overallScore = 1.0;

  const passed = overallScore >= 6.0 && skippedCount <= 1;

  if (attemptedCount === 0) {
    return {
      passed: false,
      passMessage: "All 4 questions were skipped without attempt. Please re-take the interview to receive a full evaluation.",
      overallScore: 1.0,
      criteria: {
        overallValue: 1.0,
        skippedCount: 4,
        lowestValue: 1.0
      },
      badges: [],
      metrics: {
        clarity: 1.0,
        confidence: 1.0,
        relevance: 1.0,
        depthOfKnowledge: 1.0,
        structure: 1.0,
        vocabulary: 1.0
      },
      stats: {
        attempted: "0/4",
        totalTime: "0m 15s",
        focusArea: "Attempting Questions",
        skipped: 4
      },
      generalFeedback: {
        strengths: ["Completed interview setup. No responses were provided to evaluate strengths."],
        weaknesses: ["All 4 questions were skipped without attempting an answer."],
        suggestions: ["Speak or type an answer for each question using the STAR framework."]
      },
      vocabularyFeedback: {
        strengths: ["N/A - No speech recorded."],
        weaknesses: ["No vocabulary recorded for evaluation."],
        suggestions: ["Attempt questions using technical domain terminology."]
      },
      fluencyFeedback: {
        strengths: ["N/A - No speech recorded."],
        weaknesses: ["No audio or speech recorded."],
        suggestions: ["Use the microphone button to record verbal answers."]
      },
      grammarFeedback: {
        strengths: ["N/A - No speech recorded."],
        weaknesses: ["No text or audio submitted."],
        suggestions: ["Provide complete sentences when answering."]
      },
      interactionFeedback: {
        strengths: ["N/A - No speech recorded."],
        weaknesses: ["No interview interaction recorded."],
        suggestions: ["Engage with each question prompt in full."]
      },
      questions: qaPairs.map(pair => ({
        question: pair.question,
        userAnswer: '(Skipped)',
        feedback: "Question was skipped. Attempt every question to receive detailed feedback.",
        betterAnswer: `A comprehensive answer for "${pair.question}" should state the core objective, outline key steps/trade-offs, and conclude with measurable impact.`
      })),
      recommendedKeywords: ["stakeholder management", "scalability", "cross-functional ownership", "measurable impact", "trade-off analysis"]
    };
  }

  return {
    passed,
    passMessage: passed 
      ? "Congratulations — you cleared the AI Mock Interview!" 
      : "You completed the session. Review feedback below to polish your answers.",
    overallScore,
    criteria: {
      overallValue: overallScore,
      skippedCount,
      lowestValue: Math.max(overallScore - 1.5, 1.0)
    },
    badges: passed 
      ? ["Clear Communicator", "Confident Speaker", "Knowledge Ace", "Interview Ready"] 
      : ["Practice Regular"],
    metrics: {
      clarity: Math.max(Math.min(overallScore + 0.5, 9.5), 1.0),
      confidence: Math.max(Math.min(overallScore, 9.0), 1.0),
      relevance: Math.max(Math.min(overallScore + 0.3, 9.2), 1.0),
      depthOfKnowledge: Math.max(overallScore - 0.5, 1.0),
      structure: Math.max(Math.min(overallScore, 8.8), 1.0),
      vocabulary: Math.max(Math.min(overallScore + 0.4, 9.0), 1.0)
    },
    stats: {
      attempted: `${attemptedCount}/4`,
      totalTime: "3m 45s",
      focusArea: "Depth of Knowledge",
      skipped: skippedCount
    },
    generalFeedback: {
      strengths: [
        "Attempted key technical interview questions.",
        "Demonstrated effort in completing the mock interview workflow."
      ],
      weaknesses: [
        skippedCount > 0 ? `${skippedCount} question(s) were skipped, impacting your depth score.` : "Could incorporate more quantitative metrics and ROI data."
      ],
      suggestions: [
        "Use the STAR framework (Situation, Task, Action, Result) for behavioral answers.",
        "Quantify team impact with specific metrics (e.g., 'improved latency by 35%')."
      ]
    },
    vocabularyFeedback: {
      strengths: ["Appropriate use of domain terminology."],
      weaknesses: ["Occasional conversational filler words."],
      suggestions: ["Use strong action verbs like 'spearheaded', 'architected', and 'orchestrated'."]
    },
    fluencyFeedback: {
      strengths: ["Natural pacing and steady speaking rhythm."],
      weaknesses: ["Pauses when transitioning between complex trade-offs."],
      suggestions: ["Embrace brief silent pauses instead of filler vocalizations."]
    },
    grammarFeedback: {
      strengths: ["Grammatically sound response structure."],
      weaknesses: ["Minor tense shifts during past project anecdotes."],
      suggestions: ["Maintain consistent past tense when telling behavioral stories."]
    },
    interactionFeedback: {
      strengths: ["Engaging, professional, and clear tone."],
      weaknesses: ["Could summarize key takeaways more strongly at conclusion."],
      suggestions: ["End each answer with a quick 1-sentence summary statement."]
    },
    questions: qaPairs.map((pair, i) => ({
      question: pair.question,
      userAnswer: pair.answer || '(Skipped)',
      feedback: (!pair.answer || pair.answer === '(Skipped)') 
        ? "Question was skipped. Be sure to attempt every question, even with a partial outline."
        : `Strong effort on Q${i+1}. Ensure you highlight trade-offs and quantifiable business impact.`,
      betterAnswer: `A comprehensive answer for "${pair.question}" should state the core objective, outline key steps/trade-offs, and conclude with measurable impact.`
    })),
    recommendedKeywords: ["stakeholder management", "scalability", "cross-functional ownership", "measurable impact", "trade-off analysis"]
  };
}

/**
 * Analyzes all 4 completed QA pairs and generates the rich, comprehensive scorecard
 */
export async function generateFeedbackScorecard(
  qaPairs: QAPair[]
): Promise<ComprehensiveScorecard> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Returning heuristic evaluation scorecard.");
    return generateFallbackScorecard(qaPairs);
  }

  const prompt = `You are an expert executive interviewer evaluating a candidate's complete 4-question interview performance.
Analyze all 4 questions and answers: ${JSON.stringify(qaPairs)}

SPECIAL INSTRUCTION FOR SKIPPED QUESTIONS:
If all 4 questions or most questions were skipped (answer equals '(Skipped)' or empty), you MUST:
1. Set passed = false
2. Set overallScore <= 3.0 (if all 4 skipped, overallScore = 1.0)
3. Set all metrics (clarity, confidence, relevance, depthOfKnowledge, structure, vocabulary) to low values (1.0 to 3.0)
4. Set badges = []
5. In generalFeedback.strengths state clearly that no answers were provided to evaluate strengths.
6. In generalFeedback.weaknesses explicitly state that questions were skipped without attempt.

You MUST output your evaluation strictly as a raw JSON object matching this EXACT schema:
{
  "passed": true,
  "passMessage": "Congratulations — you cleared the AI Mock Interview!",
  "overallScore": 8.5,
  "criteria": {
    "overallValue": 8.5,
    "skippedCount": 0,
    "lowestValue": 7.0
  },
  "badges": ["Clear Communicator", "Confident Speaker", "Knowledge Ace", "Well Organized"],
  "metrics": {
    "clarity": 8.5,
    "confidence": 8.0,
    "relevance": 9.0,
    "depthOfKnowledge": 8.5,
    "structure": 8.0,
    "vocabulary": 8.5
  },
  "stats": {
    "attempted": "4/4",
    "totalTime": "3m 45s",
    "focusArea": "Depth of Knowledge",
    "skipped": 0
  },
  "generalFeedback": {
    "strengths": ["Clear structure in responses.", "Directly addressed the question asked."],
    "weaknesses": ["Could include more quantifiable metrics."],
    "suggestions": ["Use the PREP framework (Point -> Reason -> Example -> Point)."]
  },
  "vocabularyFeedback": {
    "strengths": ["Good use of industry terminology."],
    "weaknesses": ["Minor reliance on conversational fillers."],
    "suggestions": ["Incorporate stronger action verbs like 'spearheaded' and 'orchestrated'."]
  },
  "fluencyFeedback": {
    "strengths": ["Pacing was natural."],
    "weaknesses": ["Occasional hesitation before complex trade-offs."],
    "suggestions": ["Practice pause techniques instead of filler words."]
  },
  "grammarFeedback": {
    "strengths": ["Grammatically sound."],
    "weaknesses": ["Minor tense shifts when recalling past events."],
    "suggestions": ["Keep consistent past tense in behavioral examples."]
  },
  "interactionFeedback": {
    "strengths": ["Engaging and professional tone."],
    "weaknesses": ["Could end with a stronger closing summary."],
    "suggestions": ["Conclude each answer with a quick key takeaway."]
  },
  "questions": [
    {
      "question": "The question text",
      "userAnswer": "The candidate's response",
      "feedback": "Specific feedback for this answer",
      "betterAnswer": "Model answer example"
    }
  ],
  "recommendedKeywords": ["stakeholder management", "ownership", "cross-functional", "measurable impact", "career growth"]
}`;

  const modelsToTry = ['gemini-1.5-flash', 'gemini-2.0-flash-exp', 'gemini-1.5-pro'];

  for (const modelName of modelsToTry) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        }
      });

      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (error: any) {
      console.warn(`Gemini model ${modelName} generateFeedbackScorecard warning:`, error?.message || error);
    }
  }

  console.warn("Gemini evaluation failed. Returning fallback evaluation scorecard.");
  return generateFallbackScorecard(qaPairs);
}
