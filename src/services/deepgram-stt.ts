/**
 * Deepgram Speech-to-Text Service
 * Real-time transcription of user speech during interviews
 */

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';
const STT_ENDPOINT = 'wss://api.deepgram.com/v1/listen';

export interface TranscriptResult {
    transcript: string;
    isFinal: boolean;
    confidence: number;
}

export interface STTOptions {
    model?: string;
    language?: string;
    punctuate?: boolean;
    interimResults?: boolean;
}

type TranscriptCallback = (result: TranscriptResult) => void;

/**
 * Deepgram Speech-to-Text client using WebSocket
 */
export class DeepgramSTT {
    private socket: WebSocket | null = null;
    private mediaRecorder: MediaRecorder | null = null;
    private onTranscriptCallback: TranscriptCallback | null = null;
    private onErrorCallback: ((error: Error) => void) | null = null;
    private isConnected = false;

    /**
     * Start transcription from a MediaStream (microphone)
     */
    async start(
        stream: MediaStream,
        options: STTOptions = {}
    ): Promise<void> {
        const {
            model = 'nova-2',
            language = 'en-US',
            punctuate = true,
            interimResults = true,
        } = options;

        // Build WebSocket URL with parameters
        const params = new URLSearchParams({
            model,
            language,
            punctuate: punctuate.toString(),
            interim_results: interimResults.toString(),
            encoding: 'linear16',
            sample_rate: '16000',
            channels: '1',
        });

        const wsUrl = `${STT_ENDPOINT}?${params.toString()}`;

        return new Promise((resolve, reject) => {
            this.socket = new WebSocket(wsUrl, ['token', DEEPGRAM_API_KEY]);

            this.socket.onopen = () => {
                this.isConnected = true;
                this.startRecording(stream);
                resolve();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.channel?.alternatives?.[0]) {
                        const alternative = data.channel.alternatives[0];
                        const result: TranscriptResult = {
                            transcript: alternative.transcript || '',
                            isFinal: data.is_final || false,
                            confidence: alternative.confidence || 0,
                        };
                        if (result.transcript && this.onTranscriptCallback) {
                            this.onTranscriptCallback(result);
                        }
                    }
                } catch (error) {
                    console.error('STT parse error:', error);
                }
            };

            this.socket.onerror = (event) => {
                const error = new Error('WebSocket error');
                this.onErrorCallback?.(error);
                reject(error);
            };

            this.socket.onclose = () => {
                this.isConnected = false;
                this.stopRecording();
            };
        });
    }

    /**
     * Stop transcription
     */
    stop(): void {
        this.stopRecording();
        if (this.socket) {
            // Send close frame
            if (this.isConnected) {
                this.socket.send(JSON.stringify({ type: 'CloseStream' }));
            }
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }

    /**
     * Set callback for transcript results
     */
    onTranscript(callback: TranscriptCallback): void {
        this.onTranscriptCallback = callback;
    }

    /**
     * Set callback for errors
     */
    onError(callback: (error: Error) => void): void {
        this.onErrorCallback = callback;
    }

    /**
     * Check if currently transcribing
     */
    get active(): boolean {
        return this.isConnected;
    }

    private startRecording(stream: MediaStream): void {
        // Create AudioContext for processing
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        processor.onaudioprocess = (event) => {
            if (this.socket?.readyState === WebSocket.OPEN) {
                const inputData = event.inputBuffer.getChannelData(0);
                // Convert Float32 to Int16
                const int16Data = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                }
                this.socket.send(int16Data.buffer);
            }
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

        // Store reference for cleanup
        this.mediaRecorder = {
            stop: () => {
                processor.disconnect();
                source.disconnect();
                audioContext.close();
            }
        } as unknown as MediaRecorder;
    }

    private stopRecording(): void {
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }
    }
}

/**
 * Create a new STT instance
 */
export function createSTT(): DeepgramSTT {
    return new DeepgramSTT();
}
