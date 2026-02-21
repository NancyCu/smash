import { useCallback, useRef } from 'react';

// SOUND CONFIGURATION
// SOUND CONFIGURATION
const SOUNDS = {
    // Level 1: "Net Loss" (You won some back, but still lost money)
    MILD_LOSS: [
        { path: '/sounds/chan-qua.m4a', text: 'Chán quá...' },
    ],
    // Level 2: "Big Loss" (Lost everything or > $10)
    BIG_LOSS: [
        { path: '/sounds/het-tien-cuoi-vo-roi.m4a', text: 'Hết tiền cưới vợ rồi!' },
        { path: '/sounds/het-tien-roi.m4a', text: 'Hết tiền rồi...' },
        { path: '/sounds/hong-het-tien-roi.m4a', text: 'Hông hết tiền rồi!' },
        { path: '/sounds/shit.m4a', text: 'Shit!' },
        { path: '/sounds/what-the-hell.m4a', text: 'What the hell?' },
        { path: '/sounds/xong-female-voice.m4a', text: 'Xong!' },
        { path: '/sounds/xong-male-voice.m4a', text: 'Xong phim!' },
    ],
    // Level 3: "Streak" (Lost 2+ times in a row)
    STREAK_LOSS: [
        { path: '/sounds/sao-thua-hoai-vay.m4a', text: 'Sao thua hoài vậy??' },
        { path: '/sounds/troi-oi-nhan-len.m4a', text: 'Trời ơi nhanh lên!' },
    ]
};

export const ANIMAL_SOUND_MAP: Record<string, string> = {
    'deer': '/sounds/nai.mp3',
    'gourd': '/sounds/bau.mp3',
    'chicken': '/sounds/ga.mp3',
    'fish': '/sounds/ca.mp3',
    'crab': '/sounds/cua.mp3',
    'shrimp': '/sounds/tom.mp3',
    'nai': '/sounds/nai.mp3',
    'bau': '/sounds/bau.mp3',
    'ga': '/sounds/ga.mp3',
    'ca': '/sounds/ca.mp3',
    'cua': '/sounds/cua.mp3',
    'tom': '/sounds/tom.mp3'
};

export const useVoiceLines = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Track consecutive ZERO return losses
    const lossStreakRef = useRef(0);

    const playFile = useCallback((path: string) => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        const audio = new Audio(path);
        audioRef.current = audio;
        console.log(`[Audio] Playing: ${path}`);
        audio.play().catch(e => console.warn("Audio play error (interaction needed?):", e));
    }, []);

    const playSequence = useCallback((paths: string[], overlapMs = 600) => {
        if (!paths || paths.length === 0) return;

        let currentIndex = 0;

        const playNext = () => {
            if (currentIndex >= paths.length) return;

            const audio = new Audio(paths[currentIndex]);

            // Only set audioRef for the first one so we don't accidentally pause the sequence if called again
            if (currentIndex === 0) {
                if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current.currentTime = 0;
                }
                audioRef.current = audio;
            }

            console.log(`[Audio Sequence ${currentIndex + 1}/${paths.length}]: ${paths[currentIndex]}`);

            audio.onloadedmetadata = () => {
                if (currentIndex < paths.length - 1) {
                    // Start the next audio BEFORE this one finishes (overlap)
                    const durationMs = audio.duration * 1000;
                    const triggerTimeMs = Math.max(0, durationMs - overlapMs);

                    setTimeout(() => {
                        currentIndex++;
                        playNext();
                    }, triggerTimeMs);
                }
            };

            audio.play().catch(e => console.warn("Audio sequence play error:", e));
        };

        playNext();
    }, []);

    const playTaunt = useCallback((bet: number, win: number, onPlay?: (text: string) => void) => {
        if (bet === 0) return;

        let selectedSound: { path: string, text: string } | null = null;

        // TOTAL LOSS (Lost everything)
        if (win === 0) {
            lossStreakRef.current += 1;

            // Priority 1: Streak (2+ losses in a row)
            if (lossStreakRef.current >= 2) {
                const idx = Math.floor(Math.random() * SOUNDS.STREAK_LOSS.length);
                selectedSound = SOUNDS.STREAK_LOSS[idx];
            }
            // Priority 2: Big Bet Loss (>$10) OR just a normal total loss
            else {
                const idx = Math.floor(Math.random() * SOUNDS.BIG_LOSS.length);
                selectedSound = SOUNDS.BIG_LOSS[idx];
            }
        }
        else if (win < bet) {
            // NET LOSS (Won something, but less than bet)
            lossStreakRef.current = 0;

            // 50% chance to complain
            if (Math.random() > 0.5) {
                const idx = Math.floor(Math.random() * SOUNDS.MILD_LOSS.length);
                selectedSound = SOUNDS.MILD_LOSS[idx];
            }
        } else {
            // WIN or BREAK EVEN
            lossStreakRef.current = 0;
        }

        if (selectedSound) {
            playFile(selectedSound.path);
            if (onPlay) onPlay(selectedSound.text);
        }

    }, [playFile]);

    return {
        playTaunt,
        playFile,
        playSequence,
        availableSounds: [
            ...SOUNDS.MILD_LOSS.map(s => s.path),
            ...SOUNDS.BIG_LOSS.map(s => s.path),
            ...SOUNDS.STREAK_LOSS.map(s => s.path)
        ]
    };
};
