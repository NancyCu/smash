import { useCallback, useRef } from 'react';

// SOUND CONFIGURATION
const SOUNDS = {
    // Level 1: "Net Loss" (You won some back, but still lost money)
    MILD_LOSS: [
        '/sounds/chan-qua.m4a',      // "Chan qua"
    ],
    // Level 2: "Big Loss" (Lost everything or > $10)
    BIG_LOSS: [
        '/sounds/het-tien-cuoi-vo-roi.m4a',
        '/sounds/het-tien-roi.m4a',
        '/sounds/hong-het-tien-roi.m4a',
        '/sounds/shit.m4a',
        '/sounds/what-the-hell.m4a',
        '/sounds/xong-female-voice.m4a',
        '/sounds/xong-male-voice.m4a',
    ],
    // Level 3: "Streak" (Lost 2+ times in a row)
    STREAK_LOSS: [
        '/sounds/sao-thua-hoai-vay.m4a', // "Sao thua hoai vay"
        '/sounds/troi-oi-nhan-len.m4a',  // "Troi oi nhanh len"
    ]
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

    const playTaunt = useCallback((bet: number, win: number) => {
        if (bet === 0) return;

        // TOTAL LOSS (Lost everything)
        if (win === 0) {
            lossStreakRef.current += 1;

            // Priority 1: Streak (2+ losses in a row)
            if (lossStreakRef.current >= 2) {
                const idx = Math.floor(Math.random() * SOUNDS.STREAK_LOSS.length);
                playFile(SOUNDS.STREAK_LOSS[idx]);
                return;
            }

            // Priority 2: Big Bet Loss (>$10) OR just a normal total loss
            // "If we bet a lot of money and we lose" -> Let's say > $10 is "a lot" for now, or just play Big Loss always on total loss.
            if (bet >= 10 || true) { // Always play Big Loss on total loss for now (user requests: "lose one or two... losing streak... or bet a lot and lose")
                const idx = Math.floor(Math.random() * SOUNDS.BIG_LOSS.length);
                playFile(SOUNDS.BIG_LOSS[idx]);
            }
            return;
        }

        // NET LOSS (Won something, but less than bet)
        if (win < bet) {
            lossStreakRef.current = 0; // Reset streak? Or keep it? Users usually stick to "Total Loss" for streaks.

            // 50% chance to complain
            if (Math.random() > 0.5) {
                const idx = Math.floor(Math.random() * SOUNDS.MILD_LOSS.length);
                playFile(SOUNDS.MILD_LOSS[idx]);
            }
        } else {
            // WIN or BREAK EVEN
            lossStreakRef.current = 0;
        }
    }, [playFile]);

    return {
        playTaunt,
        playFile,
        availableSounds: [
            ...SOUNDS.MILD_LOSS,
            ...SOUNDS.BIG_LOSS,
            ...SOUNDS.STREAK_LOSS
        ]
    };
};
