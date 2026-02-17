import React, { useEffect, useMemo } from 'react';

interface AnnouncerBubbleProps {
    text: string;
    userName?: string;
    isExiting?: boolean;
    onComplete?: () => void;
}

export const AnnouncerBubble: React.FC<AnnouncerBubbleProps> = ({
    text,
    userName = 'Game',
    isExiting = false,
    onComplete
}) => {
    // Generate valid valid random HSL color from userName
    const bubbleStyle = useMemo(() => {
        let hash = 0;
        for (let i = 0; i < userName.length; i++) {
            hash = userName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const h = Math.abs(hash % 360);
        return {
            background: `linear-gradient(135deg, hsla(${h}, 70%, 50%, 0.1), hsla(${h}, 70%, 20%, 0.4))`,
            borderColor: `hsla(${h}, 70%, 80%, 0.3)`,
            boxShadow: `0 8px 32px 0 rgba(0, 0, 0, 0.37), inset 0 0 10px hsla(${h}, 70%, 50%, 0.1)`
        };
    }, [userName]);

    // Truncate text if too long
    const displayText = useMemo(() => {
        const words = text.split(' ');
        if (words.length > 5) {
            return words.slice(0, 5).join(' ') + '...';
        }
        return text;
    }, [text]);

    // Cleanup when exit animation ends
    const handleAnimationEnd = () => {
        if (isExiting && onComplete) {
            onComplete();
        }
    };

    return (
        <div
            className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none 
                ${isExiting ? 'animate-float-fade-fast' : 'animate-in zoom-in slide-in-from-bottom-4 duration-500'}`}
            onAnimationEnd={handleAnimationEnd}
        >
            <div
                className="relative backdrop-blur-xl border rounded-2xl px-6 py-4 min-w-[280px] text-center flex flex-col items-center gap-1 transition-all duration-300"
                style={bubbleStyle}
            >
                {/* User Badge */}
                <div
                    className="absolute -top-3 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-black/60 border border-white/20 text-white shadow-sm"
                >
                    {userName}
                </div>

                {/* Main Text */}
                <div className="text-xl md:text-2xl font-bold text-white drop-shadow-md leading-tight">
                    {displayText}
                </div>

                {/* Shine effect */}
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-2xl pointer-events-none" />
            </div>
        </div>
    );
};
