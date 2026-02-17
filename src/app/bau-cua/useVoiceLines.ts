import { useCallback, useRef } from 'react';

// SOUND CONFIGURATION
const SOUNDS = {
    // Level 1: "Net Loss" (You won some back, but still lost money)
    MILD_LOSS: [
        '/sounds/sap-het-tien.mp3', // "Sap het tien roi"
        '/sounds/chan-qua.mp3',      // "Chan qua"
        '/sounds/nhanh-len.mp3',     // "Troi oi nhanh len"
    ],
    // Level 2: "Big Loss" (You lost everything you bet)
    BIG_LOSS: [
        '/sounds/het-tien.mp3',      // "Het tien cuoi vo roi"
        '/sounds/ban-mau.mp3',       // "Toi gio di ban mau roi"
        '/sounds/chet-me.mp3',       // "Chet me xong tui roi"
        '/sounds/aiya.mp3',          // "Aiya troi oi"
    ],
    // Level 3: "Streak" (Lost 2+ times in a row)
    STREAK_LOSS: [
        '/sounds/thua-roi.mp3',      // "Thua roi ha"
        '/sounds/den-qua.mp3',       // "Den qua di"
        '/sounds/con-cai-nit.mp3'    // "Con cai nit"
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
        audio.play().catch(e => console.warn("Audio play error (interaction needed?):", e));
    }, []);

    const playTaunt = useCallback((bet: number, win: number) => {
        // 1. If user didn't bet, do nothing
        if (bet === 0) return;

        // 2. Logic for "Big Loss" (Lost everything)
        if (win === 0) {
            lossStreakRef.current += 1;

            // Check Streak first
            if (lossStreakRef.current >= 2) {
                // Play Streak Sound
                const idx = Math.floor(Math.random() * SOUNDS.STREAK_LOSS.length);
                playFile(SOUNDS.STREAK_LOSS[idx]);
            } else {
                // Play Big Loss Sound
                const idx = Math.floor(Math.random() * SOUNDS.BIG_LOSS.length);
                playFile(SOUNDS.BIG_LOSS[idx]);
            }
            return;
        }

        // 3. Logic for "Net Loss" (Won less than bet)
        if (win < bet) {
            // Reset streak on any win (even partial)? Or keep it?
            // Usually streak implies "Total Loss Streak". Let's reset if they get ANY money back.
            lossStreakRef.current = 0;

            // 70% chance to play sound (don't spam every single time)
            if (Math.random() > 0.3) {
                const idx = Math.floor(Math.random() * SOUNDS.MILD_LOSS.length);
                playFile(SOUNDS.MILD_LOSS[idx]);
            }
        } else {
            // Winner or Break Even
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
