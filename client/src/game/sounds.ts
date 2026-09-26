class SoundManager {
  private ctx: AudioContext | null = null;
  private enabled: boolean = true;
  
  init() { 
    if (!this.ctx) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported');
        this.enabled = false;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() { 
    this.enabled = !this.enabled; 
    return this.enabled;
  }
  
  isEnabled() { return this.enabled; }
  
  private playTone(freq: number, type: OscillatorType, duration: number, vol = 0.1) {
    if (!this.enabled || !this.ctx) return;
    
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gainNode.gain.setValueAtTime(vol, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playCorrect() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(660, 'sine', 0.1, 0.1);
    setTimeout(() => this.playTone(880, 'sine', 0.15, 0.1), 50);
  }

  playError() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(200, 'sawtooth', 0.2, 0.1);
    setTimeout(() => this.playTone(150, 'sawtooth', 0.3, 0.1), 100);
  }

  playCombo() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(440, 'square', 0.1, 0.05);
    setTimeout(() => this.playTone(554, 'square', 0.1, 0.05), 50);
    setTimeout(() => this.playTone(659, 'square', 0.1, 0.05), 100);
    setTimeout(() => this.playTone(880, 'square', 0.2, 0.05), 150);
  }

  playStart() {
    if (!this.enabled || !this.ctx) return;
    for(let i=0; i<5; i++) {
      setTimeout(() => this.playTone(220 + (i*110), 'sine', 0.1, 0.1), i*50);
    }
  }

  playFinish() {
    if (!this.enabled || !this.ctx) return;
    this.playTone(523.25, 'sine', 0.2, 0.1);
    setTimeout(() => this.playTone(659.25, 'sine', 0.2, 0.1), 200);
    setTimeout(() => this.playTone(783.99, 'sine', 0.4, 0.1), 400);
    setTimeout(() => this.playTone(1046.50, 'sine', 0.6, 0.1), 600);
  }

  playNewRecord() {
    if (!this.enabled || !this.ctx) return;
    // Epic fanfare
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 'square', 0.15, 0.1), i * 150);
    });
    setTimeout(() => {
      this.playTone(1046.50, 'square', 0.8, 0.15);
      this.playTone(1318.51, 'sine', 0.8, 0.1);
    }, 600);
  }

  playTap() {
    this.playTone(800, 'sine', 0.05, 0.05);
  }
}

export const soundManager = new SoundManager();
