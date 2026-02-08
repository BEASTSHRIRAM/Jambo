"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { X, Mic, MicOff, Video, VideoOff, AlertCircle, ChevronRight, Star, TrendingUp, Lightbulb, Target, Award } from "lucide-react";
import { useMediaStream } from "@/hooks/useMediaStream";
import { useInterview } from "@/hooks/useInterview";
import { formatTime } from "@/services/interview-questions";
import "./InterviewPopup.css";

/**
 * Zod schema for InterviewPopup props
 */
export const interviewPopupSchema = z.object({
    companyName: z.string().describe("Name of the company for the mock interview"),
    roleName: z.string().optional().describe("Job role/title for the interview"),
    onClose: z.function().optional().describe("Callback when popup is closed"),
});

export type InterviewPopupProps = z.infer<typeof interviewPopupSchema> & {
    onClose?: () => void;
};

/**
 * InterviewPopup Component - AI-powered mock interview with video
 * Features:
 * - 60 seconds per question
 * - Natural back-and-forth conversation (AI responds within 2s)
 * - Comprehensive feedback at the end
 */
export const InterviewPopup = React.forwardRef<HTMLDivElement, InterviewPopupProps>(
    ({ companyName, roleName, onClose }, ref) => {
        const videoRef = useRef<HTMLVideoElement>(null);

        // Internal visibility state for when onClose isn't provided
        const [isVisible, setIsVisible] = useState(true);

        // Media stream hook
        const {
            stream,
            videoEnabled,
            audioEnabled,
            error: mediaError,
            isLoading: mediaLoading,
            startMedia,
            stopMedia,
            toggleVideo,
            toggleAudio,
        } = useMediaStream();

        // Interview hook
        const {
            isActive,
            isComplete,
            currentQuestionIndex,
            timeRemaining,
            questions,
            aiSpeaking,
            questionTimeLeft,
            currentTranscript,
            conversation,
            feedback,
            isGeneratingFeedback,
            error: interviewError,
            startInterview,
            endInterview,
            nextQuestion,
            setMediaStream,
        } = useInterview();

        // Start media on mount
        useEffect(() => {
            startMedia();
            return () => {
                stopMedia();
            };
        }, [startMedia, stopMedia]);

        // Attach stream to video element
        useEffect(() => {
            if (videoRef.current && stream) {
                videoRef.current.srcObject = stream;
            }
        }, [stream]);

        // Pass stream to interview hook
        useEffect(() => {
            setMediaStream(stream);
        }, [stream, setMediaStream]);

        // Auto-start interview when media is ready
        useEffect(() => {
            if (stream && !isActive && !isComplete && !mediaError) {
                startInterview(companyName, roleName);
            }
        }, [stream, isActive, isComplete, mediaError, companyName, roleName, startInterview]);

        // Handle close
        const handleClose = useCallback(() => {
            endInterview();
            stopMedia();
            setIsVisible(false);
            onClose?.();
        }, [endInterview, stopMedia, onClose]);

        // Handle end call
        const handleEndCall = useCallback(() => {
            endInterview();
            stopMedia();
        }, [endInterview, stopMedia]);

        // Handle escape key
        useEffect(() => {
            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    handleClose();
                }
            };
            window.addEventListener("keydown", handleKeyDown);
            return () => window.removeEventListener("keydown", handleKeyDown);
        }, [handleClose]);

        // Don't render if not visible
        if (!isVisible) {
            return null;
        }

        const currentQuestion = questions[currentQuestionIndex];
        const error = mediaError || interviewError;

        // Render score stars
        const renderStars = (rating: number) => {
            const fullStars = Math.floor(rating / 2);
            const stars = [];
            for (let i = 0; i < 5; i++) {
                stars.push(
                    <Star
                        key={i}
                        size={20}
                        className={i < fullStars ? "feedback-star filled" : "feedback-star"}
                    />
                );
            }
            return stars;
        };

        return (
            <div ref={ref} className="interview-overlay" role="dialog" aria-modal="true">
                <div className={`interview-popup ${isComplete ? 'interview-complete' : ''}`}>
                    {/* Close button */}
                    <button
                        className="interview-close-btn"
                        onClick={handleClose}
                        aria-label="Close interview"
                    >
                        <X />
                    </button>

                    {error ? (
                        /* Error state */
                        <div className="interview-error">
                            <AlertCircle />
                            <h3>Unable to start interview</h3>
                            <p>{error}</p>
                            <button
                                className="interview-next-btn"
                                onClick={handleClose}
                                style={{ marginTop: 20 }}
                            >
                                Close
                            </button>
                        </div>
                    ) : isComplete ? (
                        /* Interview Complete - Show Feedback */
                        <div className="interview-feedback-container">
                            {isGeneratingFeedback ? (
                                <div className="feedback-loading">
                                    <div className="feedback-loading-spinner"></div>
                                    <h3>Analyzing your interview...</h3>
                                    <p>Generating comprehensive feedback</p>
                                </div>
                            ) : feedback ? (
                                <>
                                    <div className="feedback-header">
                                        <Award size={48} className="feedback-trophy" />
                                        <h2>Interview Complete!</h2>
                                        <p>Here's your detailed feedback</p>
                                    </div>

                                    {/* Overall Score */}
                                    <div className="feedback-score-section">
                                        <div className="feedback-score">
                                            <span className="score-number">{feedback.overallRating}</span>
                                            <span className="score-total">/10</span>
                                        </div>
                                        <div className="feedback-stars">
                                            {renderStars(feedback.overallRating)}
                                        </div>
                                        <p className="feedback-assessment">{feedback.overallAssessment}</p>
                                    </div>

                                    {/* Strengths */}
                                    <div className="feedback-section">
                                        <div className="feedback-section-header">
                                            <TrendingUp size={20} />
                                            <h3>💪 Strengths</h3>
                                        </div>
                                        <ul className="feedback-list strengths">
                                            {feedback.strengths.map((strength, i) => (
                                                <li key={i}>{strength}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Areas for Improvement */}
                                    <div className="feedback-section">
                                        <div className="feedback-section-header">
                                            <Target size={20} />
                                            <h3>📈 Areas for Improvement</h3>
                                        </div>
                                        <ul className="feedback-list improvements">
                                            {feedback.areasForImprovement.map((area, i) => (
                                                <li key={i}>{area}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Tips for Next Time */}
                                    <div className="feedback-section">
                                        <div className="feedback-section-header">
                                            <Lightbulb size={20} />
                                            <h3>💡 Tips for Next Time</h3>
                                        </div>
                                        <ul className="feedback-list tips">
                                            {feedback.tipsForNextTime.map((tip, i) => (
                                                <li key={i}>{tip}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Question-by-Question Feedback */}
                                    {feedback.questionFeedback && feedback.questionFeedback.length > 0 && (
                                        <div className="feedback-section questions-section">
                                            <div className="feedback-section-header">
                                                <h3>📝 Question-by-Question Feedback</h3>
                                            </div>
                                            <div className="question-feedback-list">
                                                {feedback.questionFeedback.map((qf, i) => (
                                                    <div key={i} className="question-feedback-item">
                                                        <div className="qf-question">
                                                            <span className="qf-number">Q{i + 1}</span>
                                                            {qf.question}
                                                        </div>
                                                        <div className="qf-response">
                                                            <strong>Your answer:</strong> {qf.userResponse}
                                                        </div>
                                                        <div className="qf-feedback">
                                                            <strong>Feedback:</strong> {qf.feedback}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button className="feedback-close-btn" onClick={handleClose}>
                                        Close Interview
                                    </button>
                                </>
                            ) : (
                                <div className="feedback-error">
                                    <p>Unable to generate feedback. Please try again.</p>
                                    <button className="interview-next-btn" onClick={handleClose}>
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Question display */}
                            {currentQuestion && (
                                <div className="interview-question-display">
                                    <div className="interview-question-count">
                                        Question {currentQuestionIndex + 1} of {questions.length}
                                        <span style={{ marginLeft: 16, opacity: 0.7 }}>
                                            ⏱️ {questionTimeLeft}s
                                        </span>
                                    </div>
                                    <div className="interview-question-text">
                                        {aiSpeaking ? "🎙️ " : ""}{currentQuestion.question}
                                    </div>
                                    {/* Question progress bar - 60 seconds */}
                                    <div style={{
                                        marginTop: 12,
                                        height: 4,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(questionTimeLeft / 60) * 100}%`,
                                            height: '100%',
                                            background: questionTimeLeft > 15 ? '#06b6d4' : questionTimeLeft > 5 ? '#f59e0b' : '#ef4444',
                                            transition: 'width 1s linear, background 0.3s',
                                        }} />
                                    </div>
                                    {/* Live transcript */}
                                    {currentTranscript && (
                                        <div style={{
                                            marginTop: 12,
                                            padding: '8px 12px',
                                            background: 'rgba(139, 92, 246, 0.15)',
                                            borderRadius: 8,
                                            fontSize: 13,
                                            color: 'rgba(255,255,255,0.8)',
                                            maxHeight: 60,
                                            overflow: 'hidden',
                                        }}>
                                            💬 {currentTranscript.trim()}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Video container */}
                            <div className="interview-video-container">
                                {/* AI Panel */}
                                <div className="interview-panel interview-ai-panel">
                                    <img
                                        src="/logo.png"
                                        alt="Jambo AI"
                                        className={`interview-ai-logo ${aiSpeaking ? "speaking" : ""}`}
                                    />
                                    <div className="interview-ai-label">Jambo AI Interviewer</div>
                                    <div className="interview-ai-status">
                                        {aiSpeaking ? (
                                            <>
                                                <span>Speaking</span>
                                                <div className="interview-speaking-indicator">
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                    <span></span>
                                                </div>
                                            </>
                                        ) : (
                                            <span>Listening...</span>
                                        )}
                                    </div>
                                </div>

                                {/* User Panel */}
                                <div className="interview-panel interview-user-panel">
                                    {mediaLoading ? (
                                        <div className="interview-user-placeholder">
                                            <Video />
                                            <span>Starting camera...</span>
                                        </div>
                                    ) : stream && videoEnabled ? (
                                        <video
                                            ref={videoRef}
                                            className="interview-user-video"
                                            autoPlay
                                            playsInline
                                            muted
                                        />
                                    ) : (
                                        <div className="interview-user-placeholder">
                                            <VideoOff />
                                            <span>Camera off</span>
                                        </div>
                                    )}

                                    {/* Audio indicator */}
                                    {audioEnabled && stream && (
                                        <div className="interview-audio-indicator">
                                            <Mic />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="interview-controls">
                                {/* Mic toggle */}
                                <button
                                    className={`interview-control-btn ${!audioEnabled ? "muted" : ""}`}
                                    onClick={toggleAudio}
                                    aria-label={audioEnabled ? "Mute microphone" : "Unmute microphone"}
                                >
                                    {audioEnabled ? <Mic /> : <MicOff />}
                                </button>

                                {/* Camera toggle */}
                                <button
                                    className={`interview-control-btn ${!videoEnabled ? "muted" : ""}`}
                                    onClick={toggleVideo}
                                    aria-label={videoEnabled ? "Turn off camera" : "Turn on camera"}
                                >
                                    {videoEnabled ? <Video /> : <VideoOff />}
                                </button>

                                {/* Timer */}
                                <div className="interview-timer">
                                    <div className="interview-timer-dot"></div>
                                    <span>{formatTime(timeRemaining)}</span>
                                </div>

                                {/* Next question button */}
                                <button
                                    className="interview-next-btn"
                                    onClick={nextQuestion}
                                    disabled={aiSpeaking}
                                >
                                    Next <ChevronRight size={16} />
                                </button>

                                {/* End call button */}
                                <button className="interview-end-btn" onClick={handleEndCall}>
                                    End Interview
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }
);

InterviewPopup.displayName = "InterviewPopup";

export default InterviewPopup;
