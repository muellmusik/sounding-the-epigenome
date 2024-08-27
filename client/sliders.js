import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import noUiSlider from 'nouislider';

Template.StEg_app.onRendered(function () {

    const sliders = [ //we can add sliders here:
        { id: '#duration', sessionKey: 'duration', step: 0.01, min: 0.1, max: 10.0 },
        { id: '#midinote', sessionKey: 'midinote', step: 0.1, min: 0.0, max: 127.0 },
        { id: '#release', sessionKey: 'release', step: 0.01, min: 0.1, max: 4.0 },
        { id: '#detune', sessionKey: 'detune', step: 1, min: 0, max: 100 },
        { id: '#attack', sessionKey: 'attack', step: 0.01, min: 0.01, max: 10.0 },
        { id: '#decay', sessionKey: 'decay', step: 0.01, min: 0.01, max: 3.0 },
        { id: '#sustain', sessionKey: 'sustain', step: 0.01, min: 0.1, max: 1.0 }
    ];

    sliders.forEach(slider => {
        const initialValues = Session.get(slider.sessionKey);

        $(`${slider.id}-low`).text(initialValues[0]);
        $(`${slider.id}-high`).text(initialValues[1]);

        // Get the slider element
        const sliderElement = this.$(slider.id)[0];
        
        if (sliderElement) {
            // Create the slider
            noUiSlider.create(sliderElement, {
                start: initialValues,
                orientation: 'vertical',
                connect: true,
                handles: 2,
                step: slider.step,
                margin: 0.1,
                range: {
                    min: slider.min,
                    max: slider.max
                }
            });

            // event listeners
            sliderElement.noUiSlider.on('slide', (values) => {
                Session.set(slider.sessionKey, [values[0], values[1]]);
                $(`${slider.id}-low`).text(values[0]);
                $(`${slider.id}-high`).text(values[1]);
            });

            sliderElement.noUiSlider.on('change', (values) => {
                Session.set(slider.sessionKey, [values[0], values[1]]);
            });
        } else {
            console.error(`Slider element not found for selector: ${slider.id}`);
        }
    });
});
