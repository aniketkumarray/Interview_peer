# AI Mock Interviewer Design Spec

## Overview
A voice-to-voice AI Mock Interviewer that provides users with a realistic, low-friction practice environment using the free tier of the Gemini API and native browser Web Speech APIs. The session is strictly limited to exactly 4 questions, followed by question-by-question feedback.

## User Flow

### 1. Setup Phase (`/practice/ai` or similar entry point)
- **Configuration Form**: User selects:
  - **Interview Format**: (Behavioral, System Design, Coding, etc.)
  - **Domain/Role**: (Frontend, Backend, Product Manager, etc.)
- **Start Button**: "Start Mock Interview" initiates the browser microphone permissions flow.

### 2. Active Interview Phase
- **UI Element**: A pulsing audio wave or similar indicator for speaking state.
- **Push-to-Talk**: User holds a button (Spacebar or Mouse down) to record their answer. This prevents background noise or the AI's own voice from being accidentally transcribed.
- **Transcript View**: A live, scrolling text log of both the AI's questions and the user's answers for accessibility and review.
- **Question Limit**: The session is strictly limited to exactly **4 questions**.

### 3. Feedback Phase (Scorecard)
- After the user answers the 4th question, the interview concludes.
- The system requests a final evaluation from Gemini, providing the entire transcript.
- **Question-Wise Feedback**: The AI returns structured JSON containing:
  - Question 1: [The question asked]
  - User Answer: [The user's response]
  - Feedback: [Strengths and actionable areas for improvement]
  - Better Answer: [An example of an ideal response]
  *(Repeats for all 4 questions)*
- **Overall Score**: A summary metric out of 10.

## Technical Architecture

### 1. Browser Native Speech APIs (Client-Side)
- **Listening (Speech-to-Text)**: Use `window.SpeechRecognition` (or `webkitSpeechRecognition`). Triggered on "mousedown"/"keydown" and stopped on "mouseup"/"keyup". Transcribes user speech to text.
- **Speaking (Text-to-Speech)**: Use `window.speechSynthesis`. Converts the AI's text responses into natural-sounding voice output.

### 2. AI Brain (Server-Side / Server Actions)
- **Gemini API Integration**: Leverage Google's Gemini API (e.g., `gemini-1.5-flash` or `gemini-1.5-pro`) on the backend to keep API keys secure.
- **Prompt Engineering**:
  - *System Prompt*: Instructs the LLM to act as a professional interviewer for the selected domain/format, asking exactly one question at a time and waiting for the user's response.
  - *Feedback Prompt*: Instructs the LLM to output structured JSON matching the question-wise feedback requirements.

### 3. State Management
- **Transcript History**: Maintain an array of `Role` ("user" | "assistant") and `Content` strings in React state.
- **Turn Counter**: Integer state tracking how many questions have been asked (1 through 4).

## Constraints & Trade-offs
- **Speech Recognition Accuracy**: Browser native STT may struggle with heavy accents or complex technical jargon without custom vocabularies. However, it incurs zero cost compared to cloud STT APIs.
- **Browser Compatibility**: `SpeechRecognition` is fully supported in Chrome/Edge but may have limitations in Firefox or older Safari. We will include a graceful fallback to a text-only input if the API is unsupported.
- **API Limits**: Fits comfortably within the Gemini free tier (15 requests per minute). The 4-question limit ensures we stay well under any context window or RPM limits.

## Testing Strategy
- Ensure microphone permissions are handled gracefully (prompting the user and handling denials).
- Verify that `SpeechSynthesis` correctly reads the Gemini response and doesn't overlap with user input.
- Validate that exactly 4 questions are asked before triggering the feedback flow.
- Ensure the JSON feedback parses correctly and handles malformed LLM responses safely.
