// === 8-bit Chiptune Urban Music Generator ===
const Music = {
    ctx: null,
    playing: false,
    masterGain: null,
    tempo: 140, // BPM
    step: 0,
    intervalId: null,

    init() {
        // Create on first user interaction (browser policy)
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.3;
        this.masterGain.connect(this.ctx.destination);
    },

    start() {
        this.init();
        if (this.playing) return;
        this.playing = true;
        this.step = 0;

        const stepTime = (60 / this.tempo) / 4 * 1000; // 16th notes
        this.intervalId = setInterval(() => this._tick(), stepTime);
    },

    stop() {
        this.playing = false;
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    },

    setVolume(v) {
        if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v));
    },

    // === MUSIC PATTERNS ===
    // Notes in Hz
    _n(note, octave) {
        const notes = { C: 0, Cs: 1, D: 2, Ds: 3, E: 4, F: 5, Fs: 6, G: 7, Gs: 8, A: 9, As: 10, B: 11 };
        return 440 * Math.pow(2, (notes[note] - 9) / 12 + (octave - 4));
    },

    // Bass line (dark urban groove)
    _bassPattern: [
        'E2','E2','_','E2', 'G2','_','A2','_',
        'E2','E2','_','E2', 'B2','_','A2','_',
        'C2','C2','_','C2', 'E2','_','G2','_',
        'D2','D2','_','D2', 'F2','_','E2','_',
    ],

    // Melody (catchy 8-bit urban)
    _melodyPattern: [
        'E4','_','G4','_', 'A4','_','B4','A4',
        'G4','_','E4','_', '_','_','D4','_',
        'E4','_','G4','_', 'A4','_','C5','B4',
        'A4','_','G4','_', '_','_','_','_',
        'C4','_','E4','_', 'G4','_','A4','G4',
        'E4','_','C4','_', '_','_','D4','_',
        'D4','_','F4','_', 'A4','_','G4','F4',
        'E4','_','_','_', '_','_','_','_',
    ],

    // Drums pattern
    _drumPattern: [
        'K','_','H','_', 'S','_','H','_',
        'K','_','H','K', 'S','_','H','_',
        'K','_','H','_', 'S','_','H','H',
        'K','K','H','_', 'S','_','H','_',
    ],

    // Arpeggio chords
    _chordPattern: [
        'E3','G3','B3','E3', 'G3','B3','E3','G3',
        'C3','E3','G3','C3', 'E3','G3','C3','E3',
        'A2','C3','E3','A2', 'C3','E3','A2','C3',
        'D3','F3','A3','D3', 'F3','A3','D3','F3',
    ],

    _parseNote(str) {
        if (!str || str === '_') return null;
        const match = str.match(/^([A-G]s?)(\d)$/);
        if (!match) return null;
        return this._n(match[1], parseInt(match[2]));
    },

    _tick() {
        if (!this.ctx || !this.playing) return;
        const t = this.ctx.currentTime;

        // Bass
        const bassIdx = this.step % this._bassPattern.length;
        const bassFreq = this._parseNote(this._bassPattern[bassIdx]);
        if (bassFreq) this._playSquare(bassFreq, t, 0.1, 0.15);

        // Melody (offset by 2 bars for variation)
        const melIdx = this.step % this._melodyPattern.length;
        const melFreq = this._parseNote(this._melodyPattern[melIdx]);
        if (melFreq) this._playPulse(melFreq, t, 0.08, 0.08);

        // Drums
        const drumIdx = this.step % this._drumPattern.length;
        const drum = this._drumPattern[drumIdx];
        if (drum === 'K') this._playKick(t);
        else if (drum === 'S') this._playSnare(t);
        else if (drum === 'H') this._playHihat(t);

        // Arpeggio (every other bar)
        if (Math.floor(this.step / 32) % 2 === 1) {
            const arpIdx = this.step % this._chordPattern.length;
            const arpFreq = this._parseNote(this._chordPattern[arpIdx]);
            if (arpFreq) this._playTriangle(arpFreq, t, 0.06, 0.05);
        }

        this.step++;
    },

    // === SYNTH VOICES ===
    _playSquare(freq, time, duration, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    },

    _playPulse(freq, time, duration, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        // Slight vibrato for expression
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.frequency.value = 5;
        lfoGain.gain.value = 3;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(time);
        lfo.stop(time + duration);

        gain.gain.setValueAtTime(vol, time);
        gain.gain.setValueAtTime(vol * 0.8, time + duration * 0.5);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    },

    _playTriangle(freq, time, duration, vol) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(vol, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + duration);
    },

    _playKick(time) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(time);
        osc.stop(time + 0.12);
    },

    _playSnare(time) {
        // Noise burst
        const bufferSize = this.ctx.sampleRate * 0.08;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
        // Bandpass for snare character
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 3000;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
        noise.stop(time + 0.08);
    },

    _playHihat(time) {
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.08, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 8000;
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        noise.start(time);
        noise.stop(time + 0.03);
    }
};
