"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { TTSQueue } from '@/services/deepgram-tts';
import { DeepgramSTT, createSTT } from '@/services/deepgram-stt';
import {
    generateInterviewQuestions,
    INTERVIEW_DURATION,
    type InterviewQuestion,
} from '@/services/interview-questions';
import {
    generateInterviewerResponse,
    generateConversationalResponse,
    generateInterviewFeedback,
    type InterviewContext,
    type FeedbackContext,
} from '@/services/groq-interview';

// Time per question in seconds (60 seconds for natural conversation)
const QUESTION_DURATION = 60;
// Response delay - AI responds within 2 seconds of user speech
const AI_RESPONSE_DELAY = 2000;
// Minimum words before AI responds conversationally
const MIN_WORDS_FOR_RESPONSE = 5;

export interface ConversationTurn {
    speaker: 'ai' | 'user';
    text: string;
    timestamp: number;
}

export interface InterviewFeedback {
    overallRating: number;
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    tipsForNextTime: string[];
    questionFeedback: {
        question: string;
        userResponse: string;
        feedback: string;
    }[];
}

export interface InterviewState {
    isActive: boolean;
    isPaused: boolean;
    isComplete: boolean;
    currentQuestionIndex: number;
    timeRemaining: number;
    companyName: string;
    roleName: string;
    questions: InterviewQuestion[];
    currentTranscript: string;
    userResponses: { questionId: string; response: string }[];
    aiSpeaking: boolean;
    error: string | null;
    questionTimeLeft: number;
    conversation: ConversationTurn[];
    feedback: InterviewFeedback | null;
    isGeneratingFeedback: boolean;
}

export interface UseInterviewReturn extends InterviewState {
    startInterview: (companyName: string, roleName?: string) => Promise<void>;
    endInterview: () => void;
    pauseInterview: () => void;
    resumeInterview: () => void;
    nextQuestion: () => void;
    setMediaStream: (stream: MediaStream | null) => void;
}

/**
 * Hook for managing interview session with natural conversation flow
 * - 60 seconds per question
 * - AI responds within 2 seconds during conversation
 * - Comprehensive feedback at the end
 */
export function useInterview(): UseInterviewReturn {
    const [state, setState] = useState<InterviewState>({
        isActive: false,
        isPaused: false,
        isComplete: false,
        currentQuestionIndex: 0,
        timeRemaining: INTERVIEW_DURATION,
        companyName: '',
        roleName: '',
        questions: [],
        currentTranscript: '',
        userResponses: [],
        aiSpeaking: false,
        error: null,
        questionTimeLeft: QUESTION_DURATION,
        conversation: [],
        feedback: null,
        isGeneratingFeedback: false,
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const ttsQueueRef = useRef<TTSQueue | null>(null);
    const sttRef = useRef<DeepgramSTT | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const responseTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isAdvancingRef = useRef<boolean>(false);
    const hasRespondedToCurrentSpeechRef = useRef<boolean>(false);
    const lastTranscriptRef = useRef<string>('');
    const stateRef = useRef(state);

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    // Initialize TTS queue
    useEffect(() => {
        ttsQueueRef.current = new TTSQueue({
            onStart: () => {
                setState(prev => ({ ...prev, aiSpeaking: true }));
                // Stop response timer when AI is speaking
                if (responseTimerRef.current) {
                    clearTimeout(responseTimerRef.current);
                }
            },
            onEnd: () => {
                setState(prev => ({ ...prev, aiSpeaking: false }));
                hasRespondedToCurrentSpeechRef.current = false;
            },
        });

        return () => {
            ttsQueueRef.current?.clear();
        };
    }, []);

    // Question countdown timer
    const startQuestionTimer = useCallback(() => {
        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
        }

        setState(prev => ({ ...prev, questionTimeLeft: QUESTION_DURATION }));

        questionTimerRef.current = setInterval(() => {
            setState(prev => {
                if (prev.questionTimeLeft <= 1) {
                    return { ...prev, questionTimeLeft: 0 };
                }
                return { ...prev, questionTimeLeft: prev.questionTimeLeft - 1 };
            });
        }, 1000);
    }, []);

    // Auto-advance when question time runs out
    useEffect(() => {
        if (state.isActive && !state.aiSpeaking && state.questionTimeLeft === 0 && !isAdvancingRef.current) {
            isAdvancingRef.current = true;
            advanceToNextQuestion(true); // true = time ran out
        }
    }, [state.questionTimeLeft, state.isActive, state.aiSpeaking]);

    // Main interview timer
    useEffect(() => {
        if (state.isActive && !state.isPaused && state.timeRemaining > 0) {
            timerRef.current = setInterval(() => {
                setState(prev => {
                    if (prev.timeRemaining <= 1) {
                        return { ...prev, timeRemaining: 0, isActive: false };
                    }
                    return { ...prev, timeRemaining: prev.timeRemaining - 1 };
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [state.isActive, state.isPaused, state.timeRemaining]);

    // Handle interview end when overall timer reaches 0
    useEffect(() => {
        if (state.isActive && state.timeRemaining === 0) {
            finishInterview();
        }
    }, [state.timeRemaining, state.isActive]);

    /**
     * Generate conversational AI response within 2 seconds of user speech
     */
    const generateConversationalReply = useCallback(async (userSpeech: string) => {
        const currentState = stateRef.current;

        if (currentState.aiSpeaking || hasRespondedToCurrentSpeechRef.current) {
            return;
        }

        const currentQuestion = currentState.questions[currentState.currentQuestionIndex];
        if (!currentQuestion) return;

        hasRespondedToCurrentSpeechRef.current = true;

        try {
            const response = await generateConversationalResponse({
                companyName: currentState.companyName,
                roleName: currentState.roleName,
                currentQuestion: currentQuestion.question,
                questionType: currentQuestion.type,
                userResponse: userSpeech,
                questionNumber: currentState.currentQuestionIndex + 1,
                totalQuestions: currentState.questions.length,
            });

            // Add to conversation history
            setState(prev => ({
                ...prev,
                conversation: [
                    ...prev.conversation,
                    { speaker: 'user', text: userSpeech, timestamp: Date.now() },
                    { speaker: 'ai', text: response, timestamp: Date.now() },
                ],
            }));

            // Speak the response
            ttsQueueRef.current?.add(response);
        } catch (error) {
            console.error('Failed to generate conversational response:', error);
        }
    }, []);

    /**
     * Handle user speech - trigger AI response after brief pause
     */
    const handleUserSpeech = useCallback((transcript: string) => {
        const currentState = stateRef.current;

        // Don't respond if AI is speaking or interview is paused
        if (currentState.aiSpeaking || currentState.isPaused) {
            return;
        }

        // Count words in the new transcript
        const wordCount = transcript.trim().split(/\s+/).length;

        // Only respond if user has said enough
        if (wordCount >= MIN_WORDS_FOR_RESPONSE && !hasRespondedToCurrentSpeechRef.current) {
            // Clear any existing response timer
            if (responseTimerRef.current) {
                clearTimeout(responseTimerRef.current);
            }

            // Set timer to respond in 2 seconds
            responseTimerRef.current = setTimeout(() => {
                generateConversationalReply(transcript);
            }, AI_RESPONSE_DELAY);
        }
    }, [generateConversationalReply]);

    /**
     * Advance to next question
     */
    const advanceToNextQuestion = useCallback(async (timeRanOut: boolean = false) => {
        const currentState = stateRef.current;

        if (questionTimerRef.current) {
            clearInterval(questionTimerRef.current);
        }
        if (responseTimerRef.current) {
            clearTimeout(responseTimerRef.current);
        }

        const currentQuestion = currentState.questions[currentState.currentQuestionIndex];
        const nextIndex = currentState.currentQuestionIndex + 1;
        const userTranscript = currentState.currentTranscript.trim();

        // Save the response
        setState(prev => ({
            ...prev,
            userResponses: [
                ...prev.userResponses,
                { questionId: currentQuestion?.id || '', response: userTranscript }
            ],
        }));

        // Check if interview is complete
        if (nextIndex >= currentState.questions.length) {
            finishInterview();
            return;
        }

        // Transition message
        let transitionMessage = timeRanOut
            ? "Alright, let's move on to the next question."
            : "Great, let's continue.";

        // Get next question
        const nextQuestion = currentState.questions[nextIndex];
        const fullMessage = `${transitionMessage} ${nextQuestion.question}`;

        ttsQueueRef.current?.add(fullMessage);

        // Update state for next question
        setState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            currentTranscript: '',
            questionTimeLeft: QUESTION_DURATION,
            conversation: [
                ...prev.conversation,
                { speaker: 'ai', text: nextQuestion.question, timestamp: Date.now() },
            ],
        }));

        hasRespondedToCurrentSpeechRef.current = false;
        lastTranscriptRef.current = '';

        // Start the timer for the new question after TTS finishes
        setTimeout(() => {
            isAdvancingRef.current = false;
            startQuestionTimer();
        }, 1000);
    }, [startQuestionTimer]);

    /**
     * Finish interview and generate comprehensive feedback
     */
    const finishInterview = useCallback(async () => {
        const currentState = stateRef.current;

        // Stop all timers and services
        if (sttRef.current) {
            sttRef.current.stop();
        }
        ttsQueueRef.current?.clear();
        if (timerRef.current) clearInterval(timerRef.current);
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        if (responseTimerRef.current) clearTimeout(responseTimerRef.current);

        setState(prev => ({
            ...prev,
            isActive: false,
            isComplete: true,
            aiSpeaking: false,
            isGeneratingFeedback: true,
        }));

        // Speak conclusion
        ttsQueueRef.current?.add("That concludes our interview. Let me prepare your feedback...");

        // Generate comprehensive feedback
        try {
            const feedbackContext: FeedbackContext = {
                companyName: currentState.companyName,
                roleName: currentState.roleName,
                questions: currentState.questions.map(q => q.question),
                responses: currentState.userResponses.map(r => r.response),
                conversation: currentState.conversation,
            };

            const feedback = await generateInterviewFeedback(feedbackContext);

            setState(prev => ({
                ...prev,
                feedback,
                isGeneratingFeedback: false,
            }));
        } catch (error) {
            console.error('Failed to generate feedback:', error);
            setState(prev => ({
                ...prev,
                isGeneratingFeedback: false,
                error: 'Failed to generate feedback',
            }));
        }
    }, []);

    const setMediaStream = useCallback((stream: MediaStream | null) => {
        mediaStreamRef.current = stream;
    }, []);

    const startInterview = useCallback(async (companyName: string, roleName?: string) => {
        const role = roleName || 'Software Engineer';
        const questions = generateInterviewQuestions(companyName, role);

        isAdvancingRef.current = false;
        hasRespondedToCurrentSpeechRef.current = false;
        lastTranscriptRef.current = '';

        setState({
            isActive: true,
            isPaused: false,
            isComplete: false,
            currentQuestionIndex: 0,
            timeRemaining: INTERVIEW_DURATION,
            companyName,
            roleName: role,
            questions,
            currentTranscript: '',
            userResponses: [],
            aiSpeaking: false,
            error: null,
            questionTimeLeft: QUESTION_DURATION,
            conversation: [],
            feedback: null,
            isGeneratingFeedback: false,
        });

        // Start STT
        if (mediaStreamRef.current) {
            try {
                sttRef.current = createSTT();
                sttRef.current.onTranscript((result) => {
                    if (result.isFinal) {
                        setState(prev => ({
                            ...prev,
                            currentTranscript: prev.currentTranscript + ' ' + result.transcript,
                        }));
                        // Trigger conversational response
                        const fullTranscript = stateRef.current.currentTranscript + ' ' + result.transcript;
                        handleUserSpeech(fullTranscript.trim());
                    }
                });
                sttRef.current.onError((error) => {
                    console.error('STT error:', error);
                });
                await sttRef.current.start(mediaStreamRef.current);
            } catch (error) {
                console.error('STT start error:', error);
            }
        }

        // Ask first question with intro
        if (questions.length > 0) {
            const intro = `Welcome! I'm your AI interviewer for the ${role} position at ${companyName}. We'll have about 60 seconds per question, so take your time to answer. Let's begin. ${questions[0].question}`;
            await ttsQueueRef.current?.add(intro);

            // Add to conversation
            setState(prev => ({
                ...prev,
                conversation: [
                    { speaker: 'ai', text: intro, timestamp: Date.now() },
                ],
            }));

            // Start the question timer after TTS finishes
            setTimeout(() => {
                startQuestionTimer();
            }, 500);
        }
    }, [handleUserSpeech, startQuestionTimer]);

    const endInterview = useCallback(() => {
        finishInterview();
    }, [finishInterview]);

    const pauseInterview = useCallback(() => {
        setState(prev => ({ ...prev, isPaused: true }));
        sttRef.current?.stop();
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        if (responseTimerRef.current) clearTimeout(responseTimerRef.current);
    }, []);

    const resumeInterview = useCallback(async () => {
        setState(prev => ({ ...prev, isPaused: false }));
        startQuestionTimer();

        if (mediaStreamRef.current && sttRef.current) {
            try {
                await sttRef.current.start(mediaStreamRef.current);
            } catch (error) {
                console.error('STT resume error:', error);
            }
        }
    }, [startQuestionTimer]);

    const nextQuestion = useCallback(() => {
        if (!isAdvancingRef.current) {
            isAdvancingRef.current = true;
            advanceToNextQuestion(false);
        }
    }, [advanceToNextQuestion]);

    return {
        ...state,
        startInterview,
        endInterview,
        pauseInterview,
        resumeInterview,
        nextQuestion,
        setMediaStream,
    };
}
