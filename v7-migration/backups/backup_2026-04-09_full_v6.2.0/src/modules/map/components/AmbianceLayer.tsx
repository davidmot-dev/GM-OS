import { motion } from 'framer-motion';
import { useMapStore } from '../useMapStore';
import type { TimeOfDay } from '../types';

const AMBIANCE_CONFIG: Record<TimeOfDay, { backgroundColor: string; filter: string }> = {
    dawn: {
        backgroundColor: 'rgba(255, 158, 34, 0.15)',
        filter: 'sepia(0.2) saturate(1.2) brightness(1.05)'
    },
    day: {
        backgroundColor: 'rgba(255, 255, 255, 0)',
        filter: 'none'
    },
    overcast: {
        backgroundColor: 'rgba(160, 174, 192, 0.25)',
        filter: 'grayscale(0.3) brightness(0.9) contrast(0.9)'
    },
    dusk: {
        backgroundColor: 'rgba(145, 34, 255, 0.18)',
        filter: 'sepia(0.3) saturate(1.4) brightness(0.85) hue-rotate(-10deg)'
    },
    night: {
        backgroundColor: 'rgba(10, 11, 46, 0.55)',
        filter: 'brightness(0.7) contrast(1.2) saturate(0.8) hue-rotate(5deg)'
    }
};

interface AmbianceLayerProps {
    isProjectedView?: boolean;
}

export const AmbianceLayer: React.FC<AmbianceLayerProps> = ({ isProjectedView = false }) => {
    const timeOfDay = useMapStore(state => isProjectedView ? state.projectedTimeOfDay : state.timeOfDay);
    const isVisible = useMapStore(state => state.layerVisibility.ambiance);
    const config = AMBIANCE_CONFIG[timeOfDay || 'day'];

    if (!isVisible) return null;

    return (
        <div className="absolute inset-0 pointer-events-none z-[25]">
            <motion.div
                key={timeOfDay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0"
                style={{ 
                    backgroundColor: config.backgroundColor,
                    backdropFilter: config.filter,
                    WebkitBackdropFilter: config.filter,
                    mixBlendMode: 'multiply'
                }}
            />
            {/* Subtle Gradient for depth */}
            <div 
                className="absolute inset-0" 
                style={{ 
                    background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.1) 100%)',
                    mixBlendMode: 'overlay'
                }} 
            />
        </div>
    );
};
