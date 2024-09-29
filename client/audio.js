import * as Tone from 'tone';

// Instruments
export function createSynth(params) {
  return new Tone.Synth({
    oscillator: {
      type: params.synthType || 'sine',
      detune: params.detune || 0,
    },
    envelope: {
      attack: params.attack || 0.01,
      decay: params.decay || 0.1,
      sustain: params.sustain || 0.5,
      release: params.release || 1.0,
    },
  });
}

export function createFMSynth(params) {
  return new Tone.FMSynth({
    oscillator: {
      type: params.synthType || 'sine',
      detune: params.detune || 0,
    },
    modulationIndex: params.modulationIndex || 10,
    envelope: {
      attack: params.attack || 0.01,
      decay: params.decay || 0.1,
      sustain: params.sustain || 0.5,
      release: params.release || 1.0,
    },
    modulation: {
      type: params.synthType || 'sine',
    },
  });
}

export function createSampler(params) {
  return new Tone.Sampler({
    urls: { 
        '33': 'A1.mp3',
        '36': 'C2.mp3',
        '39': 'Ds2.mp3',
        '42': 'Fs2.mp3',
        '45': 'A2.mp3',
        '60': 'C4.mp3',
        '63': 'Ds4.mp3',
        '66': 'Fs4.mp3',
        '69': 'A4.mp3',
        '72': 'C5.mp3',
        '81': 'A5.mp3',
    },
    baseUrl: 'https://tonejs.github.io/audio/salamander/',
    release: params.release || 1,
    onload: params.onload,
  });
}

export function createMembraneSynth(params) {
    return new Tone.MembraneSynth({
      pitchDecay: params.pitchDecay || 0.05,
      octaves: params.octaves || 2.5,
      oscillator: {
        type: params.synthType || 'sine',
      },
      envelope: {
        attack: params.attack || 0.001,
        decay: params.decay || 0.4,
        sustain: params.sustain || 0.01,
        release: params.release || 1.4,
        attackCurve: 'exponential',
      },
    });
}

export function createMetalSynth(params) {
    return new Tone.MetalSynth({
      envelope: {
        attack: params.attack || 0.001,
        decay: params.decay || 1.4,
        release: params.release || 0.2,
      },
      harmonicity: params.harmonicity || 5.1,
      modulationIndex: params.modulationIndex || 32,
      resonance: params.resonance || 4000,
      octaves: params.octaves || 1.5,
    });
}

export function createPluckSynth(params) {
    return new Tone.PluckSynth({
      attackNoise: params.attackNoise || 1,
      dampening: params.dampening || 4000,
      resonance: params.resonance || 0.9,
    });
}

// Effects
export function createReverb(params) {
  return new Tone.Reverb({
    decay: params.reverbDecay || 2,
    wet: params.reverbWet || 0.5,
  });
}

export function createDelay(params) {
  return new Tone.FeedbackDelay({
    delayTime: params.delayTime || 0.25,
    feedback: params.feedback || 0.5,
    wet: params.delayWet || 0.5,
  });
}

export function createDistortion(params) {
  return new Tone.Distortion({
    distortion: params.distortionAmount || 0.4,
    wet: params.distortionWet || 0.5,
  });
}

export function createChorus(params) {
    return new Tone.Chorus({
      frequency: params.chorusFrequency || 1.5,
      delayTime: params.delayTime || 3.5,
      depth: params.chorusdepth || 0.7,
      feedback: params.feedback || 0.1,
      spread: params.spread || 180,
      wet: params.chorusWet || 0.5,
    }).start();
}

export function createTremolo(params) {
    return new Tone.Tremolo({
      frequency: params.tremoloFrequency || 10,
      depth: params.tremolodepth || 0.5,
      spread: params.spread || 180,
      wet: params.tremoloWet || 0.5,
    }).start();
}

export function createLowPassFilter(params, sweepTime) {
    const filter = new Tone.Filter({
      type: 'lowpass',
      frequency: 20000, // Start frequency fixed at 20000 Hz
      Q: params.Q || 1,
    });
  
    const targetFrequency = params.filterFrequency || 1000; 
    filter.frequency.rampTo(targetFrequency, sweepTime);
  
    return filter;
}
  
export function createPanner(params) {
    return new Tone.Panner(params.pan || 0);
}
