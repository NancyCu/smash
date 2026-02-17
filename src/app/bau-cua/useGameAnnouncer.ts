
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
    const [audioQueue, setAudioQueue] = useState<string[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initializer: Takes roll result (e.g. ['deer', 'deer', 'crab']) -> Queues audio
    const announceResult = useCallback((result: string[]) => {
        if (!result || result.length === 0) return;

        // 1. Aggregate counts
        const counts: Record<string, number> = {};
        result.forEach(id => {
            const key = ANIMAL_MAP[id.toLowerCase()] || id.toLowerCase();
            counts[key] = (counts[key] || 0) + 1;
        });

        // 2. Sort by count DESC (e.g. 2 Deer, 1 Crab -> Deer first)
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

        // 3. Map to file paths
        const queue = sorted.map(([animal, count]) => `/sounds/${count}-${animal}.mp3`);

        console.log('[Announcer] Queueing:', queue);
        setAudioQueue(queue);
    }, []);

    // Sequencer: Plays the queue
    useEffect(() => {
        if (audioQueue.length > 0 && !isPlaying) {
            playNext();
        }
    }, [audioQueue, isPlaying]);

    const playNext = useCallback(() => {
        if (audioQueue.length === 0) {
            setIsPlaying(false);
            return;
        }

        const nextFile = audioQueue[0];
        const remaining = audioQueue.slice(1);

        setIsPlaying(true);

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        const audio = new Audio(nextFile);
        audioRef.current = audio;

        audio.onended = () => {
            setAudioQueue(remaining); // Trigger effect to play next
            setIsPlaying(false); // Briefly false, effect will catch remainder
        };

        audio.onerror = (e) => {
            console.error('[Announcer] Error playing:', nextFile, e);
            setAudioQueue(remaining);
            setIsPlaying(false);
        };

        audio.play().catch(e => {
            console.warn('[Announcer] Playback interrupted:', e);
            setAudioQueue(remaining);
            setIsPlaying(false);
        });

    }, [audioQueue]);

    return { announceResult };
};
