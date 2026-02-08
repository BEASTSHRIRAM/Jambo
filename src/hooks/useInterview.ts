"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { TTSQueue } from '@/services/deepgram-tts';
import { DeepgramSTT, createSTT } from '@/services/deepgram-stt';
import {
    generateInterviewQuestions,
    INTERVIEW_DURATION,
    type InterviewQuestion,
} from '@/services/interview-questions';
import { generateInterviewerResponse, type InterviewContext } from '@/services/groq-interview';

// Time per question in seconds (50 seconds to allow for transition)
const QUESTION_DURATION = 50;
// Silence threshold to detect user finished speaking (3 seconds)
const SILENCE_THRESHOLD = 3000;

export interface InterviewState {
    isActive: boolean;
    isPaused: boolean;
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
 * Hook for managing interview session with AI responses via Groq
 */
export function useInterview(): UseInterviewReturn {
    const [state, setState] = useState<InterviewState>({
        isActive: false,
        isPaused: false,
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
    });

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const ttsQueueRef = useRef<TTSQueue | null>(null);
    const sttRef = useRef<DeepgramSTT | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasSpokenRef = useRef<boolean>(false);
    const isAdvancingRef = useRef<boolean>(false);
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
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }
            },
            onEnd: () => {
                setState(prev => ({ ...prev, aiSpeaking: false }));
                resetQuestionTimer();
                hasSpokenRef.current = false;
            },
        });

        return () => {
            ttsQueueRef.current?.clear();
        };
    }, []);

    // Question auto-advance timer
    const resetQuestionTimer = useCallback(() => {
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
            advanceToNextQuestion();
        }
    }, [state.questionTimeLeft, state.isActive, state.aiSpeaking]);

    // Silence detection - if user stops speaking for 3 seconds
    const startSilenceDetection = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
        }

        silenceTimerRef.current = setTimeout(() => {
            const currentState = stateRef.current;
            if (hasSpokenRef.current && !currentState.aiSpeaking && currentState.currentTranscript.trim().length > 10) {
                advanceToNextQuestion();
            }
        }, SILENCE_THRESHOLD);
    }, []);

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

    // Handle interview end when timer reaches 0
    useEffect(() => {
        if (state.isActive && state.timeRemaining === 0) {
            endInterviewInternal();
        }
    }, [state.timeRemaining, state.isActive]);

    const endInterviewInternal = useCallback(() => {
        if (sttRef.current) {
            sttRef.current.stop();
        }
        ttsQueueRef.current?.clear();
        if (timerRef.current) clearInterval(timerRef.current);
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        setState(prev => ({
            ...prev,
            isActive: false,
            isPaused: false,
            aiSpeaking: false,
        }));
    }, []);

    /**
     * Advance to next question with AI response
     */
    const advanceToNextQuestion = useCallback(async () => {
        const currentState = stateRef.current;

        if (isAdvancingRef.current && currentState.questionTimeLeft > 0) {
            return;
        }

        isAdvancingRef.current = true;

        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
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

        // Check if interview is over
        if (nextIndex >= currentState.questions.length) {
            ttsQueueRef.current?.add("That concludes our mock interview. Thank you for practicing with me today! You did great!");
            setState(prev => ({ ...prev, isActive: false, currentTranscript: '' }));
            isAdvancingRef.current = false;
            return;
        }

        // Generate AI response to user's answer using Groq
        let aiResponse = "Good answer.";

        if (userTranscript.length > 5) {
            try {
                const context: InterviewContext = {
                    companyName: currentState.companyName,
                    roleName: currentState.roleName,
                    currentQuestion: currentQuestion?.question || '',
                    questionType: currentQuestion?.type || 'behavioral',
                    userResponse: userTranscript,
                    questionNumber: currentState.currentQuestionIndex + 1,
                    totalQuestions: currentState.questions.length,
                };

                aiResponse = await generateInterviewerResponse(context);
            } catch (error) {
                console.error('Failed to get AI response:', error);
                aiResponse = "Thank you for that response.";
            }
        } else {
            aiResponse = "Let's move on to the next question.";
        }

        // Get next question
        const nextQuestion = currentState.questions[nextIndex];

        // Speak AI response + next question
        const fullResponse = `${aiResponse} Next question. ${nextQuestion.question}`;
        ttsQueueRef.current?.add(fullResponse);

        // Update state for next question
        setState(prev => ({
            ...prev,
            currentQuestionIndex: nextIndex,
            currentTranscript: '',
            questionTimeLeft: QUESTION_DURATION,
        }));

        hasSpokenRef.current = false;

        setTimeout(() => {
            isAdvancingRef.current = false;
        }, 500);
    }, []);

    const setMediaStream = useCallback((stream: MediaStream | null) => {
        mediaStreamRef.current = stream;
    }, []);

    const startInterview = useCallback(async (companyName: string, roleName?: string) => {
        const role = roleName || 'Software Engineer';
        const questions = generateInterviewQuestions(companyName, role);

        isAdvancingRef.current = false;
        hasSpokenRef.current = false;

        setState({
            isActive: true,
            isPaused: false,
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
        });

        // Start STT
        if (mediaStreamRef.current) {
            try {
                sttRef.current = createSTT();
                sttRef.current.onTranscript((result) => {
                    hasSpokenRef.current = true;

                    if (result.isFinal) {
                        setState(prev => ({
                            ...prev,
                            currentTranscript: prev.currentTranscript + ' ' + result.transcript,
                        }));
                        startSilenceDetection();
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

        // Ask first question
        if (questions.length > 0) {
            const intro = `Welcome! I'm your AI interviewer for the ${role} position at ${companyName}. Let's begin. ${questions[0].question}`;
            await ttsQueueRef.current?.add(intro);
        }
    }, [startSilenceDetection]);

    const endInterview = useCallback(() => {
        endInterviewInternal();
        ttsQueueRef.current?.add("Thank you for practicing with me today. Good luck with your interview!");
    }, [endInterviewInternal]);

    const pauseInterview = useCallback(() => {
        setState(prev => ({ ...prev, isPaused: true }));
        sttRef.current?.stop();
        if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    }, []);

    const resumeInterview = useCallback(async () => {
        setState(prev => ({ ...prev, isPaused: false }));
        resetQuestionTimer();

        if (mediaStreamRef.current && sttRef.current) {
            try {
                await sttRef.current.start(mediaStreamRef.current);
            } catch (error) {
                console.error('STT resume error:', error);
            }
        }
    }, [resetQuestionTimer]);

    const nextQuestion = useCallback(() => {
        advanceToNextQuestion();
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
