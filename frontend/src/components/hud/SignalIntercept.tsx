import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketService } from '../../api/socket';
import { playTacticalSound } from '../../utils/tacticalSound';

interface Signal {
    id: string;
    type: 'COMMERCE' | 'SECURITY' | 'SOCIAL' | 'LOGISTICS';
    text: string;
    timestamp: number;
    decoded: boolean;
}

const DECODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@&%';

export const SignalIntercept: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [currentSignal, setCurrentSignal] = useState<Signal | null>(null);
    const [displayText, setDisplayText] = useState('');
    const processingRef = useRef(false);

    // 1. Listen for System Events
    useEffect(() => {
        const handleNewOrder = (data: any) => {
            addSignal({
                id: `ord-${Date.now()}`,
                type: 'COMMERCE',
                text: `NEW ORDER DETECTED: ${data.total} CRC // ${data.merchantName?.toUpperCase() || 'UNKNOWN'}`,
                timestamp: Date.now(),
                decoded: false
            });
        };

        const handleMission = (data: any) => {
            addSignal({
                id: `mis-${Date.now()}`,
                type: 'LOGISTICS',
                text: `LOGISTICS REQUEST: ${data.distance}KM // PRIORITY ${data.priority || 'NORMAL'}`,
                timestamp: Date.now(),
                decoded: false
            });
        };

        const handleEmergency = (data: any) => {
            addSignal({
                id: `emg-${Date.now()}`,
                type: 'SECURITY',
                text: `ALERT: ${data.title.toUpperCase()} // ${data.message.toUpperCase()}`,
                timestamp: Date.now(),
                decoded: false
            });
        };

        // Simulating intercept for dev/demo if needed
        // const output = setInterval(() => {
        //    if (Math.random() > 0.8) {
        //        handleNewOrder({ total: Math.floor(Math.random() * 10000), merchantName: 'Test Merchant' });
        //    }
        // }, 10000);

        socketService.onNewOrder(handleNewOrder);
        socketService.onMissionAvailable(handleMission);
        socketService.onEmergencyAlert(handleEmergency);

        socketService.onSignalIntercept && socketService.onSignalIntercept((signal) => {
            addSignal({ ...signal, decoded: false });
        });

        return () => {
            // clearInterval(output);
            // Cleanup listeners if socketService supported .off (it mimics EventEmitter so strictly speaking we should, 
            // but for this singleton service we might just rely on component unmount logic if implemented)
        };
    }, []);

    const addSignal = (signal: Signal) => {
        setSignals(prev => [signal, ...prev].slice(0, 5)); // Keep last 5
        if (!processingRef.current) {
            processNextSignal(signal);
        }
    };

    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const processNextSignal = async (signal: Signal) => {
        processingRef.current = true;
        setCurrentSignal(signal);
        playTacticalSound('BEEP');

        let iterations = 0;
        const originalText = signal.text;

        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            setDisplayText(originalText.split('').map((_, index) => {
                if (index < iterations) return originalText[index];
                return DECODE_CHARS[Math.floor(Math.random() * DECODE_CHARS.length)];
            }).join(''));

            iterations += 1 / 2;

            if (iterations >= originalText.length) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                setDisplayText(originalText);
                setTimeout(() => {
                    setCurrentSignal(null);
                    processingRef.current = false;
                }, 3000);
            }
        }, 30);
    };

    // Color mapping
    const getColor = (type: string) => {
        switch (type) {
            case 'COMMERCE': return '#00ff66'; // Green
            case 'SECURITY': return '#ff0055'; // Red
            case 'LOGISTICS': return '#00ecff'; // Cyan
            default: return '#ffffff';
        }
    };

    return (
        <div className="absolute top-24 right-4 z-[1000] flex flex-col items-end pointer-events-none">
            <AnimatePresence>
                {currentSignal && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="mb-2 p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg shadow-lg max-w-xs"
                        style={{ borderLeft: `3px solid ${getColor(currentSignal.type)}` }}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getColor(currentSignal.type) }} />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">
                                SIGNAL INTERCEPT // {currentSignal.type}
                            </span>
                        </div>
                        <div className="font-mono text-xs text-white/90 leading-tight break-words">
                            {displayText}
                        </div>

                        {/* Audio Waveform Viz (Static CSS animation) */}
                        <div className="flex gap-0.5 mt-2 h-3 items-end opacity-50">
                            {[...Array(10)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-current animate-pulse"
                                    style={{
                                        height: `${Math.random() * 100}%`,
                                        backgroundColor: getColor(currentSignal.type),
                                        animationDelay: `${i * 0.05}s`
                                    }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History Feed (Small) */}
            <div className="flex flex-col gap-1 items-end opacity-40">
                {signals.slice(1, 4).map(s => (
                    <div key={s.id} className="text-[9px] font-mono text-white/70">
                        Isolate {s.id.split('-')[1].slice(-4)} // {s.type}
                    </div>
                ))}
            </div>
        </div>
    );
};
