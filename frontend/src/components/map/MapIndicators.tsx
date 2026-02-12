import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguageStore } from '../../store/languageStore';

interface MapIndicatorsProps {
    timeOfDay: string;
    displayName: string;
    isIdle: boolean;
    urgentEventsCount: number;
    isLoading: boolean;
}

export const MapIndicators: React.FC<MapIndicatorsProps> = ({
    timeOfDay,
    displayName,
    isIdle,
    urgentEventsCount,
    isLoading
}) => {
    const { t } = useLanguageStore();

    return (
        <>
            {/* TIME INDICATOR */}
            <motion.div
                key={timeOfDay}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="time-indicator"
            >
                <div
                    className="time-indicator-dot"
                    style={{
                        background: timeOfDay === 'NIGHT' ? '#00ff66' :
                            timeOfDay === 'GOLDEN' ? '#ffaa00' :
                                timeOfDay === 'SUNRISE' ? '#ff8866' : '#66aaff'
                    }}
                />
                <span>{t(displayName.toLowerCase()) || displayName}</span>
            </motion.div>

            {/* IDLE INDICATOR */}
            <AnimatePresence>
                {isIdle && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="idle-indicator"
                    >
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span>{t('exploration_mode')}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* URGENT EVENTS COUNTER */}
            <AnimatePresence>
                {urgentEventsCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-16 right-2 md:top-4 md:right-4 z-[1002] px-2 py-1 md:px-3 md:py-1.5 rounded-full bg-red-500/20 border border-red-500/40 backdrop-blur-sm"
                    >
                        <span className="text-[10px] md:text-xs font-black text-red-400 uppercase tracking-wider">
                            {urgentEventsCount} {t(urgentEventsCount > 1 ? 'urgent_events' : 'urgent_event')}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* LOADING INDICATOR */}
            <AnimatePresence>
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute top-20 md:top-4 left-1/2 -translate-x-1/2 z-[1002] px-4 py-2 rounded-2xl bg-primary/20 border border-primary/40 backdrop-blur-md flex items-center gap-3"
                    >
                        <span className="text-[10px] md:text-xs font-black text-primary uppercase tracking-widest whitespace-nowrap">{t('sync_radar')}</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
