'use server';

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

/**
 * Fetches 4 tailored interview questions at once based on format and domain
 */
export async function fetchInitialQuestions(
  domain: string,
  format: string
): Promise<string[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const prompt = `You are a top-tier technical interviewer. Generate exactly 4 distinct, realistic, high-quality interview questions for a ${format} interview in the ${domain} domain.
Return your response strictly as a JSON array of 4 strings. Keep each question concise and under 35 words.`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      }
    });

    const text = result.response.text();
    const questions: string[] = JSON.parse(text);

    if (!Array.isArray(questions) || questions.length < 4) {
      throw new Error('Failed to generate 4 valid questions.');
    }

    return questions.slice(0, 4);
  } catch (error: any) {
    console.error("Gemini API fetchInitialQuestions error:", error);
    throw new Error(error.message || "Failed to generate interview questions. Please try again.");
  }
}

/**
 * Analyzes all 4 completed QA pairs and generates the rich, comprehensive scorecard
 */
export async function generateFeedbackScorecard(
  qaPairs: QAPair[]
): Promise<ComprehensiveScorecard> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set in environment variables');
  }

  const prompt = `You are an expert executive interviewer evaluating a candidate's complete 4-question interview performance.
Analyze all 4 questions and answers: ${JSON.stringify(qaPairs)}

You MUST output your evaluation strictly as a raw JSON object matching this EXACT schema:
{
  "passed": true, // boolean (true if overallScore >= 6.0)
  "passMessage": "Congratulations — you cleared the AI Mock Interview!",
  "overallScore": 8.5, // float out of 10
  "criteria": {
    "overallValue": 8.5,
    "skippedCount": 0,
    "lowestValue": 7.0
  },
  "badges": ["Clear Communicator", "Confident Speaker", "On-Point Thinker", "Knowledge Ace", "Well Organized", "Smooth Talker", "Grammar Pro", "Interview Ready"],
  "metrics": {
    "clarity": 8.5, // float out of 10
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

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      }
    });

    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Gemini API generateFeedbackScorecard error:", error);
    throw new Error("Failed to generate comprehensive feedback evaluation.");
  }
}
