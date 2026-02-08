/**
 * Deepgram Text-to-Speech Service
 * Converts AI interview questions to spoken audio
 */

const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY || '';
const TTS_ENDPOINT = 'https://api.deepgram.com/v1/speak';

export interface TTSOptions {
    model?: string;
    voice?: string;
}

/**
 * Convert text to speech using Deepgram TTS API
 * Returns an audio blob that can be played
 */
export async function speakText(
    text: string,
    options: TTSOptions = {}
): Promise<Blob> {
    const { model = 'aura-asteria-en' } = options;

    const response = await fetch(`${TTS_ENDPOINT}?model=${model}`, {
        method: 'POST',
        headers: {
            'Authorization': `Token ${DEEPGRAM_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Deepgram TTS error:', error);
        throw new Error(`TTS failed: ${response.status}`);
    }

    return response.blob();
}

/**
 * Play audio blob through Web Audio API
 */
export async function playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onended = () => {
            URL.revokeObjectURL(audio.src);
            resolve();
        };
        audio.onerror = () => {
            URL.revokeObjectURL(audio.src);
            reject(new Error('Audio playback failed'));
        };
        audio.play().catch(reject);
    });
}

/**
 * Speak text and play it immediately
 */
export async function speakAndPlay(
    text: string,
    options: TTSOptions = {}
): Promise<void> {
    const audioBlob = await speakText(text, options);
    await playAudioBlob(audioBlob);
}

/**
 * Create a TTS audio queue for sequential playback
 */
export class TTSQueue {
    private queue: string[] = [];
    private isPlaying = false;
    private onStartCallback?: () => void;
    private onEndCallback?: () => void;

    constructor(options?: { onStart?: () => void; onEnd?: () => void }) {
        this.onStartCallback = options?.onStart;
        this.onEndCallback = options?.onEnd;
    }

    async add(text: string): Promise<void> {
        this.queue.push(text);
        if (!this.isPlaying) {
            await this.processQueue();
        }
    }

    private async processQueue(): Promise<void> {
        if (this.queue.length === 0) {
            return;
        }

        this.isPlaying = true;
        this.onStartCallback?.();

        while (this.queue.length > 0) {
            const text = this.queue.shift()!;
            try {
                await speakAndPlay(text);
            } catch (error) {
                console.error('TTS queue error:', error);
            }
        }

        this.isPlaying = false;
        this.onEndCallback?.();
    }

    clear(): void {
        this.queue = [];
    }

    get speaking(): boolean {
        return this.isPlaying;
    }
}
