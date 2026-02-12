export const playTacticalSound = (type: 'CLAIM' | 'STATUS' | 'CLICK' | 'FOCUS' | 'BEEP' | 'ALERT' | 'OFFLINE' | 'ONLINE' | 'SUCCESS') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        const now = audioCtx.currentTime;

        switch (type) {
            case 'CLAIM':
            case 'SUCCESS':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, now);
                oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                oscillator.start(now);
                oscillator.stop(now + 0.5);
                break;
            case 'STATUS':
            case 'ONLINE':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.setValueAtTime(880, now + 0.1);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
            case 'OFFLINE':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(880, now);
                oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.3);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
            case 'FOCUS':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(660, now);
                oscillator.frequency.exponentialRampToValueAtTime(1320, now + 0.3);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                oscillator.start(now);
                oscillator.stop(now + 0.3);
                break;
            case 'ALERT':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(800, now);
                oscillator.frequency.linearRampToValueAtTime(800, now + 0.1);
                oscillator.frequency.linearRampToValueAtTime(1200, now + 0.11);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.4);
                oscillator.start(now);
                oscillator.stop(now + 0.4);
                break;
            default: // CLICK, BEEP
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(1000, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                oscillator.start(now);
                oscillator.stop(now + 0.1);
                break;
        }
    } catch (e) {
        console.warn('Audio feedback failed:', e);
    }
};
