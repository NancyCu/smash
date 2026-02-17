
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
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [activeBubble, setActiveBubble] = useState<{ id: number; text: string; user: string; isExiting: boolean } | null>(null);

    const clearBubble = useCallback(() => {
        setActiveBubble(null);
    }, []);

    // Initializer: Takes roll result -> Queues Audio + Text items
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

        // 3. Map to Queue Items (Audio + Transcript)
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

        console.log('[Announcer] Queueing:', newItems);
        setQueue(newItems);

    }, []);

    // Sequencer: Plays the queue
    const playNext = useCallback(() => {
        if (queue.length === 0) {
            setIsPlaying(false);
            return;
        }

        const currentItem = queue[0];
        const remaining = queue.slice(1);

        setIsPlaying(true);

        // --- 1. SET BUBBLE (Enter) ---
        setActiveBubble({
            id: Date.now(),
            text: currentItem.text,
            user: 'Announcer',
            isExiting: false
        });

        // --- 2. PLAY AUDIO ---
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(currentItem.url);
        audioRef.current = audio;

        // On End: Trigger Bubble Exit -> Wait -> Play Next
        audio.onended = () => {
            // Trigger exit animation
            setActiveBubble(prev => prev ? { ...prev, isExiting: true } : null);

            // Wait for exit animation (approx 0.5s - 1s) before processing next
            // fast float fade is 1.5s but we can be snappier
            setTimeout(() => {
                setQueue(remaining);
                setIsPlaying(false); // loop will pick up next
            }, 1000);
        };

        audio.onerror = (e) => {
            console.error('[Announcer] Error playing:', currentItem.url, e);
            setQueue(remaining);
            setIsPlaying(false);
        };

        audio.play().catch(e => {
            console.warn('[Announcer] Playback interrupted:', e);
            setQueue(remaining);
            setIsPlaying(false);
        });

    }, [queue]);

    useEffect(() => {
        if (queue.length > 0 && !isPlaying) {
            const timer = setTimeout(() => {
                playNext();
            }, 100); // slight buffer
            return () => clearTimeout(timer);
        }
    }, [queue, isPlaying, playNext]);

    return { announceResult, activeBubble, clearBubble };
};
