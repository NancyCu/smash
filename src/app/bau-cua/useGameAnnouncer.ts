
import { useCallback, useRef, useState, useEffect } from 'react';

// Map visible animal names or IDs to the filename convention
// Assets: {count}-{animal}.mp3 (e.g., 1-bau.mp3, 2-ga.mp3)
// Animals: bau, cua, tom, ca, nai, ga
// Input IDs might be 'deer', 'gourd', 'chicken', 'fish', 'crab', 'shrimp' OR 'nai', 'bau', 'ga'...
// Let's standardize the mapping based on the `ANIMALS` constant in `page.tsx`.

const ANIMAL_MAP: Record<string, string> = {
    'deer': 'nai',
    'gourd': 'bau',
    'chicken': 'ga',
    'fish': 'ca',
    'crab': 'cua',
    'shrimp': 'tom',
    // Handle case where input is already vietnamese or capitalized
    'nai': 'nai',
    'bau': 'bau',
    'ga': 'ga',
    'ca': 'ca',
    'cua': 'cua',
    'tom': 'tom'
};

export const useGameAnnouncer = () => {
    const [queue, setQueue] = useState<{ url: string; text: string }[]>([]);
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 means idle
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [activeBubble, setActiveBubble] = useState<{ id: number; text: string; user: string; isExiting: boolean } | null>(null);

    const clearBubble = useCallback(() => {
        setActiveBubble(null);
    }, []);

    // Initializer: Takes roll result -> Sets Queue and Starts
    const announceResult = useCallback((result: string[]) => {
        if (!result || result.length === 0) return;

        // 1. Aggregate counts
        const counts: Record<string, number> = {};
        result.forEach(id => {
            const key = ANIMAL_MAP[id.toLowerCase()] || id.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });

        // 2. Sort by count DESC
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        // 3. Map to Queue Items
        const VIET_NAMES: Record<string, string> = {
            'bau': 'Bầu', 'cua': 'Cua', 'tom': 'Tôm', 'ca': 'Cá', 'nai': 'Nai', 'ga': 'Gà'
        };
        const NUMBERS: Record<number, string> = { 1: 'Một', 2: 'Hai', 3: 'Ba' };

        const newItems = sorted.map(([animalKey, count]) => {
            const num = NUMBERS[count] || count.toString();
            const classifier = animalKey === 'bau' ? 'trái' : 'con';
            const name = VIET_NAMES[animalKey] || animalKey;

            return {
                url: `/sounds/${count}-${animalKey}.mp3`,
                text: `${num} ${classifier} ${name}`
            };
        });

        console.log('[Announcer] Starting Sequence:', newItems);
        setQueue(newItems);
        setCurrentIndex(0); // Start at 0
        setActiveBubble(null); // Clear any existing
    }, []);

    // Sequencer Effect
    useEffect(() => {
        // If index is invalid or queue empty, do nothing
        if (currentIndex < 0 || currentIndex >= queue.length) {
            return;
        }

        const currentItem = queue[currentIndex];

        // --- 1. SET BUBBLE (Enter) ---
        setActiveBubble({
            id: Date.now(),
            text: currentItem.text,
            user: 'Announcer',
            isExiting: false
        });

        // --- 2. PLAY AUDIO ---
        // Safety: Stop previous
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(currentItem.url);
        audio.playbackRate = 1.25; // Speed up speech
        audioRef.current = audio;

        // Handler for finishing this step
        const handleStepComplete = () => {
            // Trigger exit animation
            setActiveBubble(prev => prev ? { ...prev, isExiting: true } : null);

            // Wait for exit, then advance index
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 600); // Faster transition (was 1000)
        };

        audio.onended = handleStepComplete;
        audio.onerror = (e) => {
            console.error('[Announcer] Error playing:', currentItem.url, e);
            handleStepComplete(); // Skip if error
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => {
                console.warn('[Announcer] Playback blocked/interrupted:', e);
                // If blocked, we might want to auto-skip after a delay, or just stop?
                // For game continuity, skipping is better.
                setTimeout(handleStepComplete, 1500);
            });
        }

        return () => {
            // Cleanup: If effect re-runs (unlikely unless queue/index changes), stop audio?
            // Actually, we want it to finish. But strictly, effects should clean up.
            // If we unmount, stop audio.
            if (audioRef.current && !audioRef.current.ended) {
                // audioRef.current.pause(); // Optional: keeps playing in bg?
            }
        };

    }, [currentIndex, queue]);

    // Reset when queue finishes
    useEffect(() => {
        if (currentIndex >= queue.length && queue.length > 0) {
            console.log('[Announcer] Sequence Complete');
            setQueue([]);
            setCurrentIndex(-1);
            setActiveBubble(null);
        }
    }, [currentIndex, queue.length]);

    // Immediate Emote Trigger (Interrups/Overlays)
    const triggerEmote = useCallback((soundKey: string, user: string) => {
        // Stop any current sequencer to focus on the emote? 
        // Or just overwrite the bubble? 
        // Let's overwrite the bubble. If audio is playing, it keeps playing (funny chaos).
        // But we want the text to match the emote.

        const EMOTE_TEXT: Record<string, string> = {
            'troioi': 'Trời ơi!',
            'chetme': 'Chết mẹ!'
        };

        const text = EMOTE_TEXT[soundKey] || '...';

        setActiveBubble({
            id: Date.now(),
            text,
            user,
            isExiting: false
        });

        // Auto-dismiss emote bubble after 3s
        setTimeout(() => {
            setActiveBubble(prev => {
                // Only dismiss if it's still THIS emote (simple check by text, or just let it fly)
                // If the sequencer started something else, we don't want to kill it.
                // But for simplicity, we just trigger exit.
                return prev && prev.text === text ? { ...prev, isExiting: true } : prev;
            });
        }, 3000);

    }, []);

    return { announceResult, activeBubble, clearBubble, triggerEmote };
};
