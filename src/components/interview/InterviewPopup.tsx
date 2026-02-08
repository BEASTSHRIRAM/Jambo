"use client";

import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { z } from "zod";
import { X, Mic, MicOff, Video, VideoOff, AlertCircle, ChevronRight } from "lucide-react";
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
            currentQuestionIndex,
            timeRemaining,
            questions,
            aiSpeaking,
            questionTimeLeft,
            currentTranscript,
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
            if (stream && !isActive && !mediaError) {
                startInterview(companyName, roleName);
            }
        }, [stream, isActive, mediaError, companyName, roleName, startInterview]);

        // Handle close
        const handleClose = useCallback(() => {
            endInterview();
            stopMedia();
            setIsVisible(false); // Hide the popup
            onClose?.();
        }, [endInterview, stopMedia, onClose]);

        // Handle end call
        const handleEndCall = useCallback(() => {
            endInterview();
            stopMedia();
            setIsVisible(false); // Hide the popup
            onClose?.();
        }, [endInterview, stopMedia, onClose]);

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

        return (
            <div ref={ref} className="interview-overlay" role="dialog" aria-modal="true">
                <div className="interview-popup">
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
                                    {/* Question progress bar */}
                                    <div style={{
                                        marginTop: 12,
                                        height: 4,
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: 2,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(questionTimeLeft / 50) * 100}%`,
                                            height: '100%',
                                            background: questionTimeLeft > 10 ? '#06b6d4' : '#ef4444',
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
                                    End call
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
