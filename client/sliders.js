import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import noUiSlider from 'nouislider';
import { EJSON } from 'meteor/ejson';
import i18next from 'i18next';

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
Session.setDefault('chorusDelay', [0.02, 1.0]); // Chorus deay time: 0 - 2 s
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
    const sliderElements = [];
    let previousListParams = [];

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      input[type="number"]::-webkit-inner-spin-button,
      input[type="number"]::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      input[type="number"] {
        -moz-appearance: textfield;
        appearance: textfield;
      }
    `;
    document.head.appendChild(styleTag);
  
    instance.autorun(function () {
      const listParamsData = instance.listParams.get();

      if (EJSON.equals(listParamsData, previousListParams)) {
        // listParams hasn't changed, no need to rebuild the sliders
        return;
      }

      previousListParams = listParamsData.slice();

      const listParams = listParamsData.map((param) => {
        return {
          key: param,
          label: i18next.t(`parameterLabels.${param}`),
        };
      });
  
      // Clear existing sliders
      const slidersContainer = document.getElementById('ranges-table');
      if (slidersContainer) {

        sliderElements.forEach((sliderElement) => {
          if (sliderElement.noUiSlider) {
            sliderElement.noUiSlider.destroy();
          }
        });

        sliderElements.length = 0;

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
          chorusDelay: { step: 0.01, min: 0.0, max: 2. }, 
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

        // Rebuild the sliders table based on listParams
        slidersContainer.innerHTML = `
          <thead class="thead-light">
            <tr class="text-center">
              ${listParams.map(param => `<th class="text-light">${param.label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr class="text-center">
              ${listParams.map((param) => {
                const { step, min, max } = sliderSettings[param.key] || defaultSettings;
                return `
                <td>
                  <input
                    type="number"
                    id="${param.key}-low"
                    class="form-control form-control-sm text-light"
                    style="background:transparent;border:none;width:4em;max-width:100%;display:block;margin:0 auto;text-align:center;"
                    role="spinbutton"
                    min="${min}" max="${max}" step="${step}"
                    aria-valuemin="${min}" aria-valuemax="${max}"
                    aria-label="${param.label} lower limit. Range: ${min} to ${max}"
                  />
                </td>
              `;
            }).join('')}
            </tr>
            <tr class="text-center" aria-hidden="true">
              ${listParams.map(param => `<td><div id="${param.key}" class="rangeslider"></div></td>`).join('')}
            </tr>
            <tr class="text-center">
              ${listParams.map((param) => {
                const { step, min, max } = sliderSettings[param.key] || defaultSettings;
                return `
                <td>
                  <input
                    type="number"
                    id="${param.key}-high"
                    class="form-control form-control-sm text-light"
                    style="background:transparent;border:none;width:4em;max-width:100%;display:block;margin:0 auto;text-align:center;"
                    role="spinbutton"
                    min="${min}" max="${max}" step="${step}"
                    aria-valuemin="${min}" aria-valuemax="${max}"
                    aria-label="${param.label} upper limit. Range: ${min} to ${max}"
                  />
                </td>
              `;
            }).join('')}
            </tr>
          </tbody>
        `;

        listParams.forEach((param, idx) => {

          const key = param.key;
          // Get the settings for the current parameter, or use default settings
          const { step, min, max } = sliderSettings[key] || defaultSettings;
  
          const initialValues = Session.get(key) || [min, max];
  
          const sliderElement = document.getElementById(key);
  
          if (sliderElement) {

            if (sliderElement.noUiSlider) {
              sliderElement.noUiSlider.destroy();
            }

            noUiSlider.create(sliderElement, {
              start: initialValues,
              orientation: 'vertical',
              connect: true,
              handles: 2,
              handleAttributes: [
                { 'aria-label': param.label + ' lower limit' },
                { 'aria-label': param.label + ' upper limit' },
              ],
              step: step,
              range: {
                min: min,
                max: max,
              },
            });

            sliderElement.querySelectorAll('.noUi-handle').forEach(h => {
            h.setAttribute('tabindex', '-1');
            });

            const lowInput  = document.getElementById(`${param.key}-low`);
            const highInput = document.getElementById(`${param.key}-high`);

            lowInput.value  = initialValues[0].toFixed(2);
            highInput.value = initialValues[1].toFixed(2);

            sliderElements.push(sliderElement);
  
            sliderElement.noUiSlider.on('slide', (values) => {
              Session.set(key, [parseFloat(values[0]), parseFloat(values[1])]);
              lowInput.value  = parseFloat(values[0]).toFixed(2);
              highInput.value = parseFloat(values[1]).toFixed(2);
            });
            sliderElement.noUiSlider.on('change', (values) => {
              Session.set(key, [parseFloat(values[0]), parseFloat(values[1])]);
            });

            lowInput.addEventListener('change', () => {

              let lo = parseFloat(lowInput.value) || 0;
              let hi = parseFloat(highInput.value) || lo;

              lo = Math.max(min, Math.min(lo, max));
              hi = Math.max(min, Math.min(hi, max));

              if (lo > hi) {
                hi = lo;
              }

              lowInput.value  = lo.toFixed(2);
              highInput.value = hi.toFixed(2);

              sliderElement.noUiSlider.set([ lo, hi ]);
              Session.set(key, [ lo, hi ]);
            });

            highInput.addEventListener('change', () => {

              let lo = parseFloat(lowInput.value) || 0;
              let hi = parseFloat(highInput.value) || 0;

              lo = Math.max(min, Math.min(lo, max));
              hi = Math.max(min, Math.min(hi, max));

              if (hi < lo) {
                lo = hi;
              }

              lowInput.value  = lo.toFixed(2);
              highInput.value = hi.toFixed(2);

              sliderElement.noUiSlider.set([ lo, hi ]);
              Session.set(key, [ lo, hi ]);
            });
          }
        });
          Meteor.defer(() => {
            // 1) figure out the last positive tabindex in the page
            const positive = Array.from(document.querySelectorAll('[tabindex]'))
              .map(el => el.tabIndex)
              .filter(n => n > 0);
            const baseTab = positive.length ? Math.max(...positive) : 0;

            // 2) give mapping-table radios the first new slot (baseTab+1)
            const mappingRadios = document.querySelectorAll(
              '#matrix-table input[type="radio"]'
            );
            mappingRadios.forEach(radio => {
              radio.tabIndex = baseTab + 1;
            });

            // 3) then assign your range inputs starting at baseTab+2,
            //    interleaving low/high per column
            let t = baseTab + 2;
            listParams.forEach(param => {
              const low  = document.getElementById(`${param.key}-low`);
              const high = document.getElementById(`${param.key}-high`);
              if (low)  low.tabIndex  = t++;
              if (high) high.tabIndex = t++;
            });
          });
      }
    });

    // Re-run when language changes to update labels

    instance.autorun(function () {
      Session.get('currentLanguage'); 

      
      const listParamsData = instance.listParams.get();
      const listParams = listParamsData.map((param) => {
        return {
          key: param,
          label: i18next.t(`parameterLabels.${param}`),
        };
      });

      
      const slidersContainer = document.getElementById('ranges-table');
      if (slidersContainer) {
        
        const headerRow = slidersContainer.querySelector('thead tr');
        if (headerRow) {
          headerRow.innerHTML = listParams.map((param) => `<th class="text-light">${param.label}</th>`).join('');
        }
      }
    });
  });