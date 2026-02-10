export const playTacticalSound = (type: 'CLAIM' | 'STATUS' | 'CLICK' | 'FOCUS' | 'BEEP') => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        if (type === 'CLAIM') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'STATUS') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.2);
        } else if (type === 'FOCUS') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(660, audioCtx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1320, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } else {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.1);
        }
    } catch (e) {
        console.warn('Audio feedback failed:', e);
    }
};
