"use client";

import { useState, useEffect, useCallback, useRef } from 'react';

export interface MediaStreamState {
    stream: MediaStream | null;
    videoEnabled: boolean;
    audioEnabled: boolean;
    error: string | null;
    isLoading: boolean;
}

export interface UseMediaStreamReturn extends MediaStreamState {
    startMedia: () => Promise<void>;
    stopMedia: () => void;
    toggleVideo: () => void;
    toggleAudio: () => void;
}

/**
 * Hook for managing camera and microphone access
 */
export function useMediaStream(): UseMediaStreamReturn {
    const [state, setState] = useState<MediaStreamState>({
        stream: null,
        videoEnabled: true,
        audioEnabled: true,
        error: null,
        isLoading: false,
    });

    const streamRef = useRef<MediaStream | null>(null);

    const startMedia = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            streamRef.current = stream;
            setState({
                stream,
                videoEnabled: true,
                audioEnabled: true,
                error: null,
                isLoading: false,
            });
        } catch (error) {
            let errorMessage = 'Failed to access camera/microphone';

            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    errorMessage = 'Camera/microphone access denied. Please allow access in your browser settings.';
                } else if (error.name === 'NotFoundError') {
                    errorMessage = 'No camera or microphone found. Please connect a device.';
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Camera or microphone is already in use by another application.';
                }
            }

            setState(prev => ({
                ...prev,
                error: errorMessage,
                isLoading: false,
            }));
        }
    }, []);

    const stopMedia = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setState({
            stream: null,
            videoEnabled: true,
            audioEnabled: true,
            error: null,
            isLoading: false,
        });
    }, []);

    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setState(prev => ({ ...prev, videoEnabled: videoTrack.enabled }));
            }
        }
    }, []);

    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setState(prev => ({ ...prev, audioEnabled: audioTrack.enabled }));
            }
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return {
        ...state,
        startMedia,
        stopMedia,
        toggleVideo,
        toggleAudio,
    };
}
