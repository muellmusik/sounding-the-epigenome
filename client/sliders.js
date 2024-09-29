import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import noUiSlider from 'nouislider';
import { EJSON } from 'meteor/ejson';

// Session defaults
//Core-Envelope 
Session.setDefault('midinote', [60.0, 84.0]); // MIDI note range: 0-127
Session.setDefault('attack', [0.1, 2.0]); // Envelope attack: 0.01-10.0
Session.setDefault('decay', [0.1, 1.0]); // Envelope decay: 0.01-3.0
Session.setDefault('sustain', [0.2, 0.8]); // Envelope sustain: 0.1-1.0
Session.setDefault('detune', [0.0, 50.0]); // Detune in cents: 0-100
Session.setDefault('release', [0.1, 1.0]); // Envelope release: 0.1-4.0
Session.setDefault('duration', [0.5, 3.0]); // Duration in seconds: 0.1-10
// FMSynth
Session.setDefault('modulationIndex', [0, 100]); // modulation index: 0-100
// MembraneSynth 
Session.setDefault('pitchDecay', [0.1, 0.5]); // Pitch decay: 0.01-0.5
Session.setDefault('octaves', [1, 4]); // Octaves: 0.5-6
// MetalSynth 
//Session.setDefault('frequency', [500, 1000]); // Oscillator frequency: 50-5000 Hz
Session.setDefault('harmonicity', [1, 5]); //Harmonicity: 0.1-10
// PluckSynth parameters
Session.setDefault('resonance', [500, 5000]); // Resonance: 0-7000
Session.setDefault('attackNoise', [5, 10]); // Attack noise: 0-20 
Session.setDefault('dampening', [2000, 5000]); // Dampening: 0-7000 Hz 
// Reverb 
Session.setDefault('reverbDecay', [0.1, 5.0]); // Reverb decay: 0.1-10
Session.setDefault('reverbWet', [0.0, 1.0]); // Reverb wet/dry mix: 0-1
// Delay 
Session.setDefault('delayTime', [0.1, 0.5]); // Delay time: 0-1 seconds
Session.setDefault('feedback', [0.0, 0.8]); // Delay feedback: 0-1
Session.setDefault('delayWet', [0.0, 1.0]); // Delay wet/dry mix: 0-1
// Distortion 
Session.setDefault('distortionAmount', [0.0, 1.0]); // Distortion amount: 0-1
Session.setDefault('distortionWet', [0.0, 1.0]); // Distortion wet/dry mix: 0-1
// Chorus
Session.setDefault('chorusFrequency', [1, 3]); // Chorus frequency: 0.1-5 Hz
Session.setDefault('chorusdepth', [0.3, 0.7]); // Chorus Depth: 0-1 
Session.setDefault('chorusWet', [0.2, 0.8]); // Chorus wet/dry mix: 0-1
// Tremolo
Session.setDefault('tremoloFrequency', [5, 15]); // Tremolo frequency: 0.1-20 Hz
Session.setDefault('tremolodepth', [0.3, 0.7]); // Tremolo Depth: 0-1 
Session.setDefault('tremoloWet', [0.2, 0.8]); // Tremolo wet/dry mix: 0-1
// LowPass Filter
Session.setDefault('filterFrequency', [1000, 5000]); // LPF frequency: 20-20000 Hz
Session.setDefault('Q', [1, 10]); // LPF Q factor: 0.1-20
// Panner
Session.setDefault('pan', [-0.5, 0.5]); // Panner position: -1 (left) to 1 (right), default centered at 0

Template.StEg_app.onRendered(function () {
    const instance = this;
    let previousListParams = [];
  
    instance.autorun(function () {
      const listParams = instance.listParams.get();

      if (EJSON.equals(listParams, previousListParams)) {
        // listParams hasn't changed, no need to rebuild the sliders
        return;
      }

      previousListParams = listParams.slice();
  
      // Clear existing sliders
      const slidersContainer = document.getElementById('ranges-table');
      if (slidersContainer) {
        // Rebuild the sliders table based on listParams
        slidersContainer.innerHTML = `
          <thead class="thead-light">
            <tr class="text-center">
              ${listParams.map((param) => `<th class="text-light">${param}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="text-center">
              ${listParams.map((param) => `<td><span id="${param}-low" class="text-light"></span></td>`).join('')}
            </tr>
            <tr class="text-center">
              ${listParams.map((param) => `<td><div id="${param}" class="rangeslider"></div></td>`).join('')}
            </tr>
            <tr class="text-center">
              ${listParams.map((param) => `<td><span id="${param}-high" class="text-light"></span></td>`).join('')}
            </tr>
          </tbody>
        `;
  
        // Define slider settings for each parameter here:
        const sliderSettings = {
          // Instrument parameters
          midinote: { step: 0.1, min: 0, max: 127 },
          duration: { step: 0.01, min: 0.1, max: 10 },
          detune: { step: 1, min: 0, max: 100 },
          modulationIndex: { step: 0.1, min: 0, max: 100 },
          attack: { step: 0.01, min: 0.01, max: 10.0 },
          decay: { step: 0.01, min: 0.01, max: 3.0 },
          sustain: { step: 0.01, min: 0.1, max: 1.0 },
          release: { step: 0.01, min: 0.1, max: 4.0 },
          pitchDecay: { step: 0.01, min: 0.01, max: 0.5 }, 
          octaves: { step: 0.1, min: 0.5, max: 8 }, 
          harmonicity: { step: 0.1, min: 0.1, max: 10 }, 
          resonance: { step: 1, min: 0, max: 7000 }, 
          attackNoise: { step: 0.1, min: 0, max: 20 }, 
          dampening: { step: 1, min: 0, max: 7000 }, 
          // Effect parameters
          reverbDecay: { step: 0.1, min: 0.1, max: 10 },
          reverbWet: { step: 0.01, min: 0, max: 1 },
          delayTime: { step: 0.01, min: 0, max: 1 },
          feedback: { step: 0.01, min: 0, max: 1 },
          delayWet: { step: 0.01, min: 0, max: 1 },
          distortionAmount: { step: 0.01, min: 0, max: 1 },
          distortionWet: { step: 0.01, min: 0, max: 1 },
          chorusFrequency: { step: 0.1, min: 0.1, max: 5 }, 
          chorusdepth: { step: 0.01, min: 0, max: 1 }, 
          chorusWet: { step: 0.01, min: 0, max: 1 }, 
          tremoloFrequency: { step: 0.1, min: 0.1, max: 20 }, 
          tremolodepth: { step: 0.01, min: 0, max: 1 }, 
          tremoloWet: { step: 0.01, min: 0, max: 1 }, 
          filterFrequency: { step: 1, min: 20, max: 20000 }, 
          Q: { step: 0.1, min: 0.1, max: 20 }, 
          pan: { step: 0.01, min: -1, max: 1 }, 
          // Add other parameters as needed
        };
  
        // Default settings for parameters not explicitly defined
        const defaultSettings = { step: 0.01, min: 0, max: 1 };
  
        listParams.forEach((param) => {
          // Get the settings for the current parameter, or use default settings
          const { step, min, max } = sliderSettings[param] || defaultSettings;
  
          const initialValues = Session.get(param) || [min, max];
  
          const sliderElement = document.getElementById(param);
          const lowSpan = document.getElementById(`${param}-low`);
          const highSpan = document.getElementById(`${param}-high`);
  
          if (sliderElement) {
            noUiSlider.create(sliderElement, {
              start: initialValues,
              orientation: 'vertical',
              connect: true,
              handles: 2,
              step: step,
              range: {
                min: min,
                max: max,
              },
            });

            // Set initial values of spans
            lowSpan.textContent = parseFloat(initialValues[0]).toFixed(2);
            highSpan.textContent = parseFloat(initialValues[1]).toFixed(2);
  
            sliderElement.noUiSlider.on('slide', (values) => {
              Session.set(param, [parseFloat(values[0]), parseFloat(values[1])]);
              lowSpan.textContent = parseFloat(values[0]).toFixed(2);
              highSpan.textContent = parseFloat(values[1]).toFixed(2);
            });
  
            sliderElement.noUiSlider.on('change', (values) => {
              Session.set(param, [parseFloat(values[0]), parseFloat(values[1])]);
            });
          }
        });
      }
    });
  });