import React, { useEffect, useRef } from 'react';
import { musicEngine } from '../MusicEngine';

/**
 * AudioRouter is a global component mounted in App.tsx.
 * Its unique role is to host the invisible <audio> element that bridges 
 * the Web Audio context stream to the speakers. 
 * This ensures music continues to play even when the Music module is unmounted.
 */
const AudioRouter: React.FC = () => {
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const initAudio = async () => {
            if (audioRef.current) {
                // Attach the stream from the engine to the audio element
                const stream = musicEngine.getStream();
                audioRef.current.srcObject = stream;

                try {
                    // Browser requires play() after setting srcObject
                    await audioRef.current.play();
                    console.log("[AudioRouter] Audio stream routed and playing.");
                } catch (err) {
                    // This usually happens if there's no user interaction yet.
                    // MusicEngine handles resume() on interactions, so this is just a fallback.
                    console.warn("[AudioRouter] Auto-play blocked by browser. Awaiting user interaction.", err);
                }
            }
        };

        initAudio();

        // Optional: Handle sinkId changes here if needed for multi-output
    }, []);

    return (
        <audio
            ref={audioRef}
            className="sr-only"
            aria-hidden="true"
            id="global-music-audio"
        />
    );
};

export default AudioRouter;
