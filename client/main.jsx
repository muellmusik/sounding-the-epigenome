import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';
import i18next from 'i18next';
import './i18n.js';

import specs from '../imports/specs/specs.js';
import data from '../imports/data/data.js'
import specs1 from '../imports/specs/specs1.js';
import data1 from '../imports/data/data1.js'

import 'bootstrap';
import 'bootswatch/dist/solar/bootstrap.css';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

import TomSelect from 'tom-select';
import './tom-select.css';

import * as noUiSlider from 'nouislider';
import './nouislider.css';

import Tone from "tone";

import './main.html';
import './sliders.js';
import * as Audio from './audio.js';

Template.registerHelper('t', function (key, options) {
  Session.get('currentLanguage'); // Reactive dependency
  return i18next.t(key, options.hash);
});

// Reactive variables to hold state
const fileContent = new ReactiveVar('');
const dictionary = new ReactiveVar([]);
const showOutput = new ReactiveVar(false);
const datadict = new ReactiveVar({});
let sliderInstance;
const scales = {
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  'Ionian': [0, 2, 4, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Aeolian': [0, 2, 3, 5, 7, 8, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
};

const datasets = {
  'Dataset 1': { data: data, specs: specs },
  'Dataset 2': { data: data1, specs: specs1 },
  'User Uploaded Data': { data: null, specs: null },
  // Add additional datasets as needed
};

const datasetNames = Object.keys(datasets);

if (Meteor.isClient) {

  Template.StEg_app.onCreated(function () {

    i18next.changeLanguage('en');
    Session.set('currentLanguage', 'en');

    this.selectedDataset = new ReactiveVar('Dataset 1'); // Default dataset

    this.columnOptions = new ReactiveVar([]);
    this.numericColumns = new ReactiveVar([]);

    this.specs = specs;

    this.listParams = new ReactiveVar(['midinote','duration','attack','decay','sustain','release','detune',]);

    this.selectedScale = new ReactiveVar('Chromatic');

    this.parsedata = new ReactiveVar({});
    const initialParsedData = {};

    Object.keys(data).forEach((key, index) => {
      initialParsedData[index.toString()] = data[key];
    });
    this.parsedata.set(initialParsedData);

    const defaultRowName = Object.keys(this.parsedata.get())[0];
    this.activeRowName   = new ReactiveVar( defaultRowName );
    this.activeRow       = new ReactiveVar(this.parsedata.get()[defaultRowName]);
    this.numRows         = new ReactiveVar(1);

    this.loopPlayback = new ReactiveVar(false);  // Default state is looping off
    this.tempo = new ReactiveVar(60);  // Default tempo
    
    this.allSynths = [];
    this.stopLoopFunction = null;  // Keep track of looping state

    this.playbackStates = {};

    this.chordmode = true;
    this.storedSonifications = {};
    this.storeIndex = 0;
    this.synthType = new ReactiveVar('sine');

    this.instrumentType = new ReactiveVar('Synth');
    this.selectedEffects = new ReactiveVar([]);
    this.storedPresetCount = 0;

    this.isRecording = new ReactiveVar(false);
    this.masterRecorder = null;

    this.isStoringPreset = new ReactiveVar(false);

    this.autorun(() => {
      // this will rerun each time its dependencies are changed (the ReactiveVar)
      const RowName   = this.activeRowName.get();
      const linkedRow = this.parsedata.get()[ RowName ];
      this.activeRow.set( linkedRow );
      const numRows = this.numRows.get(); // Add numRows dependency for no. of consecutive rows
      const loopEnabled = this.loopPlayback.get();

      // Update the button's class and text based on the loop state
      const loopButton = document.getElementById('loopButton');
      if (loopButton)
      {
        if (loopEnabled) {
          if (loopButton.classList.contains('btn-warning')) {
            loopButton.classList.remove('btn-warning');
          }
          if (!loopButton.classList.contains('btn-success')) {
            loopButton.classList.add('btn-success');
          }
          loopButton.innerHTML = '<i class="fa fa-repeat"></i>';
        } 
        else {
          if (loopButton.classList.contains('btn-success')) {
            loopButton.classList.remove('btn-success');
          }
          if (!loopButton.classList.contains('btn-warning')) {
            loopButton.classList.add('btn-warning');
          }
          loopButton.innerHTML = '<i class="fa fa-repeat"></i>';
    
        }
      }
    });
  });

  Template.StEg_app.onRendered(function () {

    const instance = this;

    instance.instrumentOptions = [
      { value: 'Synth', translationKey: 'Oscillator' },
      { value: 'FMSynth', translationKey: 'FM-Synth' },
      { value: 'MembraneSynth', translationKey: 'Membrane-Synth' },
      { value: 'MetalSynth', translationKey: 'Metal-Synth' },
      { value: 'PluckSynth', translationKey: 'Pluck-Synth' },
      { value: 'Sampler', translationKey: 'Piano' },
    ];

    instance.instrumentSelectInstance = new TomSelect('#instrument-select', {
      options: instance.instrumentOptions,
      valueField: 'value',
      render: {
        option: function (data, escape) {
          const label = i18next.t('instrumentOptions.' + data.translationKey);
          return '<div>' + escape(label) + '</div>';
        },
        item: function (data, escape) {
          const label = i18next.t('instrumentOptions.' + data.translationKey);
          return '<div role="option" aria-label = "Instrument: '+escape(label)+'">' + escape(label) + '</div>';
        },
      },
      onInitialize: function() {
          const input = this.control_input;
          const dropdown = this.dropdown;
          input.tabIndex = 19;
          input.setAttribute('role', 'combobox');
          input.setAttribute('aria-autocomplete', 'list');
          input.setAttribute('aria-haspopup', 'listbox');
          input.setAttribute('aria-expanded', 'false');
          input.setAttribute('aria-controls', dropdown.id);
          dropdown.setAttribute('role', 'listbox');
          const currentKey = this.getValue();  
          const currentLabel = i18next.t('instrumentOptions.' + currentKey);
          input.setAttribute('aria-label', 'Instrument: ' + currentLabel);
        },
        onDropdownOpen: function() {
          this.control_input.setAttribute('aria-expanded', 'true');
          this.dropdown.querySelectorAll('[data-selectable]').forEach(opt => {
            const text = opt.textContent.trim();
            opt.setAttribute('role', 'option');
            opt.setAttribute('aria-label', `Instrument: ${text}`);
          });
        },
        onDropdownClose: function() {
          this.control_input.setAttribute('aria-expanded', 'false');
        },
    });

    const selectedInstrument = instance.instrumentType.get() || 'Synth';
    instance.instrumentSelectInstance.setValue(selectedInstrument);

    instance.effectsOptions = [
      { value: 'Reverb' },
      { value: 'Delay' },
      { value: 'Distortion' },
      { value: 'Chorus' },
      { value: 'Tremolo' },
      { value: 'LowPassFilter' },
      { value: 'Panner' },
    ];

    instance.effectsSelectInstance = new TomSelect('#effects-select', {
      plugins: ['remove_button', 'clear_button'],
      hideSelected: false,
      hidePlaceholder: true,
      options: instance.effectsOptions,
      placeholder: i18next.t('selectEffectsPlaceholder'),
      render: {
        option: function (data, escape) {
          const label = i18next.t('effectOptions.' + data.value);
          return '<div>' + escape(label) + '</div>';
        },
        item: function (data, escape) {
          const label = i18next.t('effectOptions.' + data.value);
          return '<div>' + escape(label) + '</div>';
        },
      },
      onInitialize: function() {
          const input = this.control_input;
          const dropdown = this.dropdown;
          input.tabIndex = 21;
          input.setAttribute('role', 'combobox');
          input.setAttribute('aria-autocomplete', 'list');
          input.setAttribute('aria-haspopup', 'listbox');
          input.setAttribute('aria-expanded', 'false');
          input.setAttribute('aria-controls', dropdown.id);
          dropdown.setAttribute('role', 'listbox');
          dropdown.querySelectorAll('[data-selectable]').forEach(opt => {
            opt.setAttribute('role', 'option')
          });

          const values = this.getValue() || [];
          if (values.length === 0) {
            input.setAttribute('aria-label', 'Effects: no effects selected');
          } else {
            const labels = values
              .map(v => i18next.t('effectOptions.' + v))
              .join(', ');
            input.setAttribute('aria-label', 'Effects: ' + labels);
          }

          document.getElementById('effectsStatus').textContent = 'Effects: no effects selected';
        },
        onDropdownOpen: function() {
          this.control_input.setAttribute('aria-expanded', 'true');
        },
        onDropdownClose: function() {
          this.control_input.setAttribute('aria-expanded', 'false');
        },
        onChange: function(values) {
          const status = document.getElementById('effectsStatus');
              const input = this.control_input;
              if (values.length === 0) {
                status.textContent = 'Effects: no effects selected';
                input.setAttribute('aria-label', 'Effects: no effects selected');
              } else {
                const labels = values
                  .map(v => i18next.t('effectOptions.' + v))
                  .join(', ');
                status.textContent = 'Effects: ' + labels;
                input.setAttribute('aria-label', 'Effects: ' + labels);
              }
        }
    });

    const selectedEffects = instance.selectedEffects.get() || [];
    instance.effectsSelectInstance.setValue(selectedEffects);

    instance.scaleOptions = [
      { value: 'Chromatic' },
      { value: 'Ionian' },
      { value: 'Dorian' },
      { value: 'Phrygian' },
      { value: 'Lydian' },
      { value: 'Mixolydian' },
      { value: 'Aeolian' },
      { value: 'Locrian' },
    ];
    
    instance.scaleSelectInstance = new TomSelect('#scale-select', {
      options: instance.scaleOptions,
      valueField: 'value',
      placeholder: i18next.t('selectScalePlaceholder'),
      render: {
        option: function (data, escape) {
          const label = i18next.t('scaleOptions.' + data.value);
          return '<div>' + escape(label) + '</div>';
        },
        item: function (data, escape) {
          const label = i18next.t('scaleOptions.' + data.value);
          return '<div role="option" aria-label="Scale / Mode: '+escape(label)+'">'+ escape(label) + '</div>';
        },
      },
      onInitialize: function() {
      const input = this.control_input;
      const dropdown = this.dropdown;
      input.tabIndex = 16;
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-haspopup', 'listbox');
      input.setAttribute('aria-expanded', 'false');
      input.setAttribute('aria-controls', dropdown.id);
      dropdown.setAttribute('role', 'listbox');
      },
      onDropdownOpen: function() {
        this.control_input.setAttribute('aria-expanded', 'true');
        this.dropdown
      .querySelectorAll('[data-selectable]')
      .forEach(opt => {
        const text = opt.textContent.trim();
        opt.setAttribute('role', 'option');
        opt.setAttribute('aria-label', `Scale / Mode: ${text}`);
      });
      },
      onDropdownClose: function() {
        this.control_input.setAttribute('aria-expanded', 'false');
      }
    });

    const selectedScale = instance.selectedScale.get() || 'Chromatic';
    instance.scaleSelectInstance.setValue(selectedScale);

    const currentLanguage = i18next.language || 'en';
    if (currentLanguage === 'en') {
      $('#lang-en').removeClass('btn-light').addClass('btn-warning');
      $('#lang-es').removeClass('btn-warning').addClass('btn-light');
    } else {
      $('#lang-es').removeClass('btn-light').addClass('btn-warning');
      $('#lang-en').removeClass('btn-warning').addClass('btn-light');
    }

    this.autorun(() => {
      Session.get('currentLanguage'); // Reactive dependency
      // Update instrument-select options

      const selectedInstrument = instance.instrumentSelectInstance.getValue();
      const selectedEffects = instance.effectsSelectInstance.getValue() || [];
      const selectedScale = instance.scaleSelectInstance.getValue() || 'Chromatic';

      instance.effectsSelectInstance.settings.placeholder = i18next.t('selectEffectsPlaceholder');
      instance.effectsSelectInstance.control_input.setAttribute('placeholder', i18next.t('selectEffectsPlaceholder'));

      instance.instrumentSelectInstance.clearCache();
      instance.instrumentSelectInstance.refreshOptions(false);
      instance.instrumentSelectInstance.refreshItems();

      instance.effectsSelectInstance.clearCache();
      instance.effectsSelectInstance.refreshOptions(false);
      instance.effectsSelectInstance.refreshItems();

      instance.scaleSelectInstance.clearCache();
      instance.scaleSelectInstance.refreshOptions(false);
      instance.scaleSelectInstance.refreshItems();

      instance.instrumentSelectInstance.clear(true);
      instance.instrumentSelectInstance.addItem(selectedInstrument);
     
      instance.effectsSelectInstance.clear(false);
      // selectedEffects.forEach(effect => {
      //   instance.effectsSelectInstance.addItem(effect);
      // });

      instance.scaleSelectInstance.clear(true);
      instance.scaleSelectInstance.addItem(selectedScale);
    });

    //Keyboard-preset mapping

    $(document).on('keydown', function (event) {
      if ($(event.target).is('input, textarea')) {
        return; // Don't intercept key presses in input fields
      }
      const key = event.key;
      switch (key) {
        case '1':
          triggerPreset(1);
          break;
        case '2':
          triggerPreset(2);
          break;
        case '3':
          triggerPreset(3);
          break;
        case '4':
          triggerPreset(4);
          break;
        case '5':
          triggerPreset(5);
          break;
        case '6':
          triggerPreset(6);
          break;
        case '7':
          triggerPreset(7);
          break;
        case '8':
          triggerPreset(8);
          break;
        case '9':
          triggerPreset(9);
          break;
        default:
          // Do nothing
          break;
      }
    });

    function selectLastRadioButtons() {
      const radioGroups = new Set();
      instance.$('input[type="radio"][data-type="matrixbutton"]').each(function () {
        radioGroups.add($(this).attr('name'));
      });
  
      
      radioGroups.forEach((groupName) => {
        const radios = instance.$(`input[name="${groupName}"]`);
        radios.prop('checked', false);
        const choice = Math.floor(Math.random() * radios.length); 
        $(radios[choice]).prop('checked', true);
      });
    }

    selectLastRadioButtons();

    this.autorun(() => {
      instance.parsedata.get();
      instance.listParams.get();
      Meteor.defer(() => {
        selectLastRadioButtons();
      });
    });

  });

  Template.OscillatorTypeSelect.onRendered(function () {
    const instance = this;
  
    instance.synthTypeOptions = [
      { value: 'sine' },
      { value: 'square' },
      { value: 'triangle' },
      { value: 'sawtooth' },
    ];

    instance.synthTypeSelectInstance = new TomSelect('#synthtype-select', {
      options: instance.synthTypeOptions,
      valueField: 'value',
      render: {
        option: function (data, escape) {
          const label = i18next.t('synthTypeOptions.' + data.value);
          return '<div>' + escape(label) + '</div>';
        },
        item: function (data, escape) {
          const label = i18next.t('synthTypeOptions.' + data.value);
          return '<div role="option" aria-label="Oscillator Type: ' + escape(label) + '">'+ escape(label) + '</div>';
        },
      },

      onInitialize: function() {
        const input = this.control_input;
        const dropdown = this.dropdown;
        input.tabIndex = 20;
        input.setAttribute('role', 'combobox');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-haspopup', 'listbox');
        input.setAttribute('aria-expanded', 'false');
        input.setAttribute('aria-controls', dropdown.id);
        dropdown.setAttribute('role', 'listbox');
      },
      onDropdownOpen: function() {
        this.control_input.setAttribute('aria-expanded', 'true');
        this.dropdown
        .querySelectorAll('[data-selectable]')
        .forEach(opt => {
          const text = opt.textContent.trim();
          opt.setAttribute('role', 'option');
          opt.setAttribute('aria-label', `Oscillator Type: ${text}`);
        });
      },
      onDropdownClose: function() {
        this.control_input.setAttribute('aria-expanded', 'false');
      }
    });

    let selectedSynthType = 'sine';

    if (instance.data && instance.data.synthType) {
      selectedSynthType = instance.data.synthType.get();
    }

    instance.synthTypeSelectInstance.setValue(selectedSynthType);

    this.autorun(() => {
      Session.get('currentLanguage'); // Reactive dependency
      instance.synthTypeSelectInstance.clearCache();
      instance.synthTypeSelectInstance.refreshOptions(false);
      instance.synthTypeSelectInstance.refreshItems();

      const selectedSynthType = instance.synthTypeSelectInstance.getValue();
      instance.synthTypeSelectInstance.clear(true);
      instance.synthTypeSelectInstance.addItem(selectedSynthType);
    });
  });

  Template.StEg_app.helpers({

    datasets: function () {
      return datasetNames;
    },

    isSelectedDataset: function (datasetName) {
      return Template.instance().selectedDataset.get() === datasetName ? 'selected' : '';
    },

    columnOptions() {
      return Template.instance().columnOptions.get();
    },
    dictionary() {
      return dictionary.get();
    },
    showOutput() {
      return showOutput.get();
    },
    listParams: function () {
      Session.get('currentLanguage');
      const params = Template.instance().listParams.get();
      return params.map(param => {
        return {
          key: param,
          label: i18next.t(`parameterLabels.${param}`)
        };
      });
    },

    synthTypes: () => Template.instance().synthTypes,
    
    synthType() {
      return Template.instance().synthType;
    },

    getTempo:() => {
      return Template.instance().tempo.get();
    },
    isLooping:() => {
      return Template.instance().loopPlayback.get();
    },
    isOscillatorRelevant() {
      const instrumentType = Template.instance().instrumentType.get();
      return ["Synth", "FMSynth", "MembraneSynth"].includes(instrumentType);
    },

    getSonificationData: function() {
      
      const allData = Template.instance().parsedata.get();
      const numRows = Template.instance().numRows.get();
      const activeRowName = Template.instance().activeRowName.get();
      const rowKeys = Object.keys(allData);
      const activeRowIndex = rowKeys.indexOf(activeRowName);

      let sonificationData = [];

      for (let i = 0; i < numRows; i++) {
        const rowIndex = activeRowIndex + i;
        if (rowIndex >= rowKeys.length) break;  // Prevent going out of bounds
        
        const currentRowKey = rowKeys[rowIndex];
        const currentRow = allData[currentRowKey];

        let rowData = {
          Row: currentRowKey,
          Data: []
        };
        
        for (let key in currentRow) {
            if (currentRow.hasOwnProperty(key)) {
                const value = currentRow[key];

                // Check if the value is a number (excluding NaN and Infinity)
                if (typeof value === 'number' && isFinite(value)) {
                    rowData.Data.push({
                        type: key,
                        data: value
                    });
                }
            }
        }
        sonificationData.push(rowData);
    }
      return sonificationData;
    },

    makeKeyValueArray: function(type,data) {
      return [{ [type]: data }];
    },

    getAllFields: function(dataObject) {
      let fields = [];

      Object.keys(dataObject).forEach( function(theKey) {
        fields.push({label: theKey, value: dataObject[theKey] });
      });

      return fields;
    },


    allRows: function () {
      
      const data = Template.instance().parsedata.get();
      const DataArr = [];

      for (let Row in data) {
          DataArr.push({
              name  : Row,
          });
      }

      return DataArr;
    },

    maxnumRows: function() {
      const allData = Template.instance().parsedata.get();
      const rowKeys = Object.keys(allData);
      const activeRowName = Template.instance().activeRowName.get();
      const activeRowIndex = rowKeys.indexOf(activeRowName);
      const maxnumrows = (rowKeys.length - activeRowIndex);
      return maxnumrows;
    },

    incremented(index) { return (index + 1)},

    isStoringPreset: function() {
      return Template.instance().isStoringPreset.get();
    },

    scales() {
      return [
        { value: 'Chromatic' },
        { value: 'Ionian' },
        { value: 'Dorian' },
        { value: 'Phrygian' },
        { value: 'Lydian' },
        { value: 'Mixolydian' },
        { value: 'Aeolian' },
        { value: 'Locrian' },
      ];
    },

    selectedScale() {
      return Template.instance().selectedScale.get();
    },

    translatedDatasetName: function(dataset) {
      Session.get('currentLanguage');
      return i18next.t('datasetOptions.' + dataset);
    },

  });

  Template.StEg_app.events({

    'change #dataset-select'(event, instance) {

      const selectedValue = event.target.value;
      instance.selectedDataset.set(selectedValue);

      if (selectedValue === 'User Uploaded Data') {
        if (!datasets['User Uploaded Data'].data || !datasets['User Uploaded Data'].specs) {
          
          alert(i18next.t('noUserUploadedDataAlert'));
          const firstDataset = datasetNames[0];
          instance.selectedDataset.set(firstDataset);
          event.target.value = firstDataset;
          event.target.dispatchEvent(new Event('change'));

          return;
        }
      }
      else {
        instance.selectedDataset.set(selectedValue);
      }
      
      const selectedData = datasets[selectedValue].data;
      const selectedSpecs = datasets[selectedValue].specs;

      instance.parsedata.set({ ...selectedData });

      
      const defaultRowName = Object.keys(selectedData)[0];
      instance.activeRowName.set(defaultRowName);
      instance.activeRow.set(selectedData[defaultRowName]);

      instance.specs = selectedSpecs || {};
      
      showOutput.set(true);
    },

    'click #learn-more-button'(event, instance) {
      const currentLanguage = i18next.language || 'en';
      let url;
      if (currentLanguage === 'es') {
        url = './Support_website/StEg_support_website_es.html';
      } else {
        url = './Support_website/StEg_support_website_en.html';
      }
      window.open(url, '_blank'); // Open in a new tab
    },
    
    'change #fileInput'(event, instance) {
      const file = event.target.files[0];
      if (file) {

        if (sliderInstance) {
          sliderInstance.destroy();
          sliderInstance = null;
        }

        const slhd = document.getElementById('selhdrs'); slhd.checked=false; slhd.dispatchEvent(new Event('change'));  
        const chkall = document.getElementById('checkall'); chkall.checked = false; chkall.dispatchEvent(new Event('change'));
        
        const reader = new FileReader();
        reader.onload = function (e) {
          fileContent.set(e.target.result);
          instance.columnOptions.set(parseColumns(e.target.result));
          const rows = (e.target.result).trim().split('\n');
          const maxRow = rows.length;

          const rowRangeContainer = document.getElementById('rowRangeContainer');
          rowRangeContainer.style.display = 'block';

          const startRowInput = document.getElementById('startRowInput');
          const endRowInput = document.getElementById('endRowInput');

          startRowInput.setAttribute('max', maxRow);
          startRowInput.setAttribute('aria-valuemin', '1');
          startRowInput.setAttribute('aria-valuemax', String(maxRow));
          startRowInput.setAttribute('aria-label', 'Set start row number. Range: 1 to' + String(maxRow));

          endRowInput.setAttribute('max', maxRow);
          endRowInput.setAttribute('aria-valuemin', '1');
          endRowInput.setAttribute('aria-valuemax', String(maxRow));
          endRowInput.setAttribute('aria-label', 'Set end row number. Range: 1 to' + String(maxRow));

          const slider = document.getElementById('slider');
          sliderInstance = noUiSlider.create(slider, {
            start: [1, rows.length],
            connect: true,
            handles: 2,
            handleAttributes: [
              { 'tabindex': -1 },
              { 'tabindex': -1 },
            ],
            range: {
              'min': 1,
              'max': rows.length
            },
            step: 1
          });

          // Sync the slider with the text inputs


          sliderInstance.on('update', function (values) {
            startRowInput.value = Math.round(values[0]);
            endRowInput.value = Math.round(values[1]);
          });

          // Update slider when text inputs change
          startRowInput.addEventListener('change', function () {
            const startValue = parseInt(this.value, 10);
            const endValue = parseInt(endRowInput.value, 10);
            sliderInstance.set([startValue, endValue]);
          });

          endRowInput.addEventListener('change', function () {
            const endValue = parseInt(this.value, 10);
            const startValue = parseInt(startRowInput.value, 10);
            sliderInstance.set([startValue, endValue]);
          });
        
          const colModal = new bootstrap.Modal('#colselect');
          colModal.show();
        };
        reader.readAsText(file);
      }
    },

    'click #lang-en, click #lang-es'(event) {
        const selectedLanguage = event.currentTarget.getAttribute('data-lang');
        i18next.changeLanguage(selectedLanguage, (err, t) => {
          if (err) return console.error('Error changing language', err);
          Session.set('currentLanguage', selectedLanguage);
          // Update button classes
          if (selectedLanguage === 'en') {
            $('#lang-en').removeClass('btn-light').addClass('btn-warning');
            $('#lang-es').removeClass('btn-warning').addClass('btn-light');
          } else {
            $('#lang-es').removeClass('btn-light').addClass('btn-warning');
            $('#lang-en').removeClass('btn-warning').addClass('btn-light');
          }
        });
      },

    'change #checkall'(event) {
      const checkboxes = document.getElementsByName('columnchecks');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = event.target.checked;
      });
    },
    'change #selhdrs'(event) {
      const useHeaders = event.target.checked;
      document.getElementById('keysInput').disabled = useHeaders;
    },
    'click #parse'(event, instance) {
      createDictionary(instance);
    },
    'click #reset'() {
      showOutput.set(false);
      dictionary.set([]);
      document.getElementById('fileInput').value = '';
      if (sliderInstance) {
        sliderInstance.destroy();
        sliderInstance = null;
      }
      const slhd = document.getElementById('selhdrs'); slhd.checked=false; slhd.dispatchEvent(new Event('change'));
      const chkall = document.getElementById('checkall'); chkall.checked = false; chkall.dispatchEvent(new Event('change'));
    },
    'click #submitInminInmax'(event, instance) {
      // Get user input for inmin and inmax values
      const form = document.getElementById('inminInmaxForm');
      const numericColumns = instance.numericColumns.get();
      const mappingFunctions = {};

      numericColumns.forEach((column) => {
        const inminInput = document.getElementById(`inmin-${column}`);
        const inmaxInput = document.getElementById(`inmax-${column}`);
        const inmin = parseFloat(inminInput.value);
        const inmax = parseFloat(inmaxInput.value);
        mappingFunctions[column] = { inmin, inmax };
      });

      for (const key in mappingFunctions) {
        const { inmin, inmax } = mappingFunctions[key];
        specs[key] = ((inmin, inmax) => {
          return function (val, outmin, outmax) {
            return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
          };
        })(inmin, inmax);
      }

      datasets['User Uploaded Data'].specs = { ...specs };
      instance.specs = datasets['User Uploaded Data'].specs;
      instance.selectedDataset.set('User Uploaded Data');
      
      const modal = bootstrap.Modal.getInstance(document.getElementById('inminInmaxModal'));
      modal.hide();

      // Show output (assuming dictionary has been updated)
      showOutput.set(true);
    },

    'change #row-select'( event, instance ) {
      const selectedElem = event.currentTarget.selectedOptions[ 0 ];
      instance.activeRowName.set( selectedElem.value );
    },

    'change #num-rows-select'(event, instance) {
      const selectedElem = parseInt(event.currentTarget.value, 10);
      instance.numRows.set(selectedElem);
    },

    'change #synthtype-select'( event, instance ) {
      const selectedElem = event.currentTarget.selectedOptions[ 0 ];
      instance.synthType.set(selectedElem.value); 
    },

    'change #tempoInput'(event, instance) {
      const tempo = parseInt(event.currentTarget.value, 10);
      instance.tempo.set(tempo);
    },

    'change #instrument-select'(event, instance) {
      const selectedInstrument = event.target.value;
      instance.instrumentType.set(selectedInstrument);
      updateListParams(instance);
    },

    'change #effects-select'(event, instance) {
      const selectedOptions = event.target.selectedOptions;
      const selectedEffects = Array.from(selectedOptions).map((option) => option.value);
      instance.selectedEffects.set(selectedEffects);
      updateListParams(instance);
    },

      'change #scale-select'(event, instance) {
      const selectedScale = event.target.value;
      instance.selectedScale.set(selectedScale);
    },

    'click .play': function(event, instance) {
      var synthParameters = getSynthParamsFromGui(instance);
      var chordMode;

      if ($("#chord").prop("checked")) {
        chordMode = true;
        } 
      else {
        chordMode = false;
      }

      var loopEnabled = instance.loopPlayback.get();

      if (loopEnabled){
        instance.stopLoopFunction = playSynths(synthParameters, chordMode, loopEnabled, instance);
      }

      else {
        playSynths(synthParameters, chordMode, loopEnabled, instance);
      }
    },

    'click .store': async function(event, instance) {

      if (instance.isStoringPreset.get()) {
        console.warn("A preset is already being stored. Please wait until it's finished.");
        return;
      }

      instance.isStoringPreset.set(true);

      $('.store').prop('disabled', true);
      $('.remove').prop('disabled', true);

      try {
        var synthParameters = getSynthParamsFromGui(instance);
        var chordMode = $("#chord").prop("checked");
        var loopEnabled = instance.loopPlayback.get();
        
        var storedParams = {};

        storedParams["synthParams"] = synthParameters;
        storedParams["chordmode"] = chordMode;
        storedParams["loopEnabled"] = loopEnabled;

        var storeButton = instance.find('[data-playind=' + instance.storeIndex + ']');
        $(storeButton).attr('class', "btn btn-primary btn-lg");

        const audioBuffer = await recordToPreset(synthParameters, chordMode, instance);
        storedParams["audioBuffer"] = audioBuffer;

        // Store the preset
        if (instance.storedSonifications[instance.storeIndex]) {
          delete instance.storedSonifications[instance.storeIndex];
        } else {
          instance.storedPresetCount++;
        }

        instance.storedSonifications[instance.storeIndex] = storedParams;

        $(storeButton).attr('class', "btn btn-warning btn-lg");
        instance.storeIndex = (instance.storeIndex + 1)%9;

      } catch (error) {
        console.error("Error recording preset output:", error);
      } finally {
        $('.store').prop('disabled', false);
        $('.remove').prop('disabled', false);
        instance.isStoringPreset.set(false);
      }
    },

    'click .remove': function(event, instance) {
      
      var lastStoredIndex = (instance.storeIndex - 1 + 9) % 9;
      
      if (instance.storedSonifications[lastStoredIndex]) {

        // If playback is ongoing for this preset, stop it
        if (instance.playbackStates && instance.playbackStates[lastStoredIndex]) {
          instance.playbackStates[lastStoredIndex].stop();
          delete instance.playbackStates[lastStoredIndex];
        }
        
        delete instance.storedSonifications[lastStoredIndex];
  
        // Update the preset button UI to 'btn-secondary' (idle/empty state)
        var playButton = instance.find(`[data-playind='${lastStoredIndex}']`);
        if (playButton) {
          $(playButton).attr('class', "btn btn-secondary btn-lg");
        }

        // Decrement storeIndex to point to the previous slot
        instance.storeIndex = lastStoredIndex;

        // Decrement the counter
        instance.storedPresetCount--;

        // Reset storeIndex if all presets are removed
        if (instance.storedPresetCount <= 0) {
          instance.storedPresetCount = 0;
          instance.storeIndex = 0;
        }
      }
    },
    
    'click .stop': function(event, instance) {

      if (instance.playbackStates) {
        for (var ind in instance.playbackStates) {
          if (instance.playbackStates.hasOwnProperty(ind)) {
            // Call the stop function to stop the looping playback
            instance.playbackStates[ind].stop();
            // Update the button class to 'btn-warning' (stored and off)
            var playButton = instance.find(`[data-playind='${ind}']`);
            if (playButton) {
              $(playButton).attr('class', "btn btn-warning btn-lg");
            }
          }
        }
        // Clear the playbackStates object
        instance.playbackStates = {};
      }

      if (instance.stopLoopFunction) {
        instance.stopLoopFunction(); // Stop the loop if it's running
        instance.stopLoopFunction = null;
      }

      let allsynths = instance.allSynths;
     
      allsynths.forEach(synthArray => {
        synthArray.forEach(synthData => {
          const synth = synthData[0];
          const effectsChain = synthData[4];
          disposeSynthAndEffects(synth, effectsChain);
        });
      });
      // Clear the array after stopping and disposing
      instance.allSynths = [];
    },

    'click #loopButton'(event, instance) {

      const currentLoopState = instance.loopPlayback.get();
      const newState = !currentLoopState;     
      instance.loopPlayback.set(newState);

      const btn = document.getElementById('loopButton');
      btn.setAttribute('aria-pressed', newState.toString());
      btn.setAttribute('aria-label', newState ? 'Looping on' : 'Looping off');
      const status = document.getElementById('loopStatus');
      status.textContent = newState ? 'Looping on' : 'Looping off';

      let allsynths = instance.allSynths;

      if (currentLoopState){

        if (instance.stopLoopFunction) {
          instance.stopLoopFunction(); // Stop the loop when toggled off
          //instance.stopLoopFunction = null;
        }
      }
      
      setTimeout(() => {
        const loopButton = document.getElementById('loopButton');
        if (loopButton) {
          if (!currentLoopState) {
           
            if (loopButton.classList.contains('btn-warning')) {
              loopButton.classList.remove('btn-warning');
            }
            loopButton.classList.add('btn-success');
            loopButton.innerHTML = '<i class="fa fa-repeat"></i>';
          } else {
           
            if (loopButton.classList.contains('btn-success')) {
              loopButton.classList.remove('btn-success');
            }
            loopButton.classList.add('btn-warning');
            loopButton.innerHTML = '<i class="fa fa-repeat"></i>';
          }
        }
      }, 200); 
    },

    'click .record': async function (event, instance) {
      const isRecording = instance.isRecording.get();

      if (!isRecording) {
        
        instance.isRecording.set(true);
        
        //UI Feedback Recording ON
        $(event.currentTarget).removeClass('btn-warning').addClass('btn-danger');
        
        instance.masterRecorder = new Tone.Recorder();

        // Connect the recorder to the master output
        Tone.getDestination().connect(instance.masterRecorder);

        // Start the recorder
        instance.masterRecorder.start();
        
        console.log('Recording started');
      } else {
        
        const recording = await instance.masterRecorder.stop();
        Tone.getDestination().disconnect(instance.masterRecorder);
        const arrayBuffer = await recording.arrayBuffer();
        const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer);
        const wavBuffer = audioBufferToWav(audioBuffer);
        
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });

        // Create a URL for the Blob and trigger download
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'StEg_app_recording.wav';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        // Clean up
        instance.masterRecorder.dispose();
        instance.masterRecorder = null;
        instance.isRecording.set(false);

        // UI feedback recording OFF
        $(event.currentTarget).removeClass('btn-danger').addClass('btn-warning');

        // Indicate that recording has stopped
        console.log('Recording stopped');
      }
    },

    "click [data-type='playbutton']": async function(event, instance) {
      var ind = Number($(event.target).attr("data-playind"));
      var playButton = event.target;
      var storedParams = instance.storedSonifications[ind];
    
      if (typeof storedParams !== 'undefined') {
        var loopEnabled = storedParams["loopEnabled"];
        var audioBuffer = storedParams["audioBuffer"];
    
        if (!instance.playbackStates) {
          instance.playbackStates = {};
        }
        // If loopEnabled is true, implement toggle behavior
        if (loopEnabled) {
    
          if (instance.playbackStates[ind]) {
            // Stop the playback
            const playbackState = instance.playbackStates[ind];
            playbackState.stop();
            delete instance.playbackStates[ind];
            $(playButton).attr('class', "btn btn-warning btn-lg");
          } else {

            startCrossfadeLoop(audioBuffer, ind, playButton, instance);

          }
        } else {
          // Looping is disabled, implement trigger behavior

          const player = new Tone.Player({
            url: audioBuffer,
            loop: false,
            autostart: false,
            fadeIn: 0.05,
            fadeOut: 0.05,
          }).toDestination();

          player.start();
          $(playButton).attr('class', "btn btn-success btn-lg");
    
          // Reset the button after playback
          player.onstop = () => {
            $(playButton).attr('class', "btn btn-warning btn-lg");
            delete instance.playbackStates[ind];
          };
    
          // Store the player in playbackStates to manage it if needed
          instance.playbackStates[ind] = {
            player,
            stop: function () {
              player.stop();
              player.dispose();
            },
          };
          
          setTimeout(() => {
            player.stop();
          }, audioBuffer.duration * 1000);
        }
      }
    }
  });

  // Helper functions

  function updateListParams(instance) {
    let params = ['midinote', 'duration']; // Always include these

    const instrumentType = instance.instrumentType.get();
    const selectedEffects = instance.selectedEffects.get();

    if (instrumentType === 'Synth' || instrumentType === 'FMSynth') {
      params.push('attack', 'decay', 'sustain', 'release', 'detune');
      if (instrumentType === 'FMSynth') {
        params.push('modulationIndex');
      }
    }
    else if (instrumentType === 'MembraneSynth') {
      params.push('attack', 'decay', 'sustain', 'release', 'pitchDecay', 'octaves');
    }
    else if (instrumentType === 'MetalSynth') {
      params.push('attack', 'decay', 'release', 'harmonicity', 'modulationIndex', 'resonance', 'octaves', );
    }
    else if (instrumentType === 'PluckSynth') {
      params.push('attackNoise', 'dampening', 'sustain');
    }
    if (instrumentType === 'Sampler') {
      params.push('release');
    }

    for (const effect of selectedEffects) {
      if (effect === 'Reverb') {
        params.push('reverbDecay', 'reverbWet');
      } else if (effect === 'Delay') {
        params.push('delayTime', 'feedback', 'delayWet');
      } else if (effect === 'Distortion') {
        params.push('distortionAmount', 'distortionWet');
      }
        else if (effect === 'Chorus') {
        params.push('chorusFrequency', 'chorusDelay', 'chorusdepth', 'chorusWet');
      } else if (effect === 'Tremolo') {
        params.push('tremoloFrequency', 'tremolodepth', 'tremoloWet');
      } else if (effect === 'LowPassFilter') {
        params.push('filterFrequency', 'Q');
      } else if (effect === 'Panner') {
        params.push('pan');
      }
    }

    instance.listParams.set(params);
  }

  function getSynthParamsFromGui(instance){

    var rbs = instance.findAll('input[type=radio]:checked');
    var checked = rbs.filter(function(rb) { return $(rb).attr('data-type') == "matrixbutton"});
    var synthParameters = {};
    const allData = instance.parsedata.get();
    const numRows = instance.numRows.get();
    const rowKeys = Object.keys(allData);
    const activeRowName = instance.activeRowName.get();
    const activeRowIndex = rowKeys.indexOf(activeRowName);

    var mappingInfo = []; //to store the current mapping

    // scan radio button matrix for current mapping

    for ( var c in checked ) {
      var element = $(checked[c]).attr('data-element');
      if(typeof synthParameters[element] == 'undefined') {
        synthParameters[element] = {};
      }
      var par = $(checked[c]).attr('data-field');
      var datakey = $(checked[c]).attr('data-key');
      var fieldValue = $(checked[c]).attr('value');

      mappingInfo.push({ par, datakey, fieldValue });

      synthParameters[element][par] = instance.specs[datakey](fieldValue, Number(Session.get(par)[0]), Number(Session.get(par)[1]));

      if (par === 'midinote') {
        const selectedScale = instance.selectedScale.get();
        synthParameters[element][par] = adjustMidiNoteToScale(synthParameters[element][par], selectedScale);
      }

    }

    // apply current mapping to the rest of the consecutive rows:

    for (let i = 1; i < numRows; i++) {
      const rowIndex = activeRowIndex + i;
      if (rowIndex >= rowKeys.length) break;
      let currentElement = rowIndex.toString();
      if (typeof synthParameters[currentElement] == 'undefined') {
        synthParameters[currentElement] = {};
      }

      mappingInfo.forEach(({ par, datakey }) => {
        const currentRowKey = rowKeys[rowIndex];
        const currentRowData = allData[currentRowKey];  
        const dataValue = currentRowData[datakey]; 
  
        synthParameters[currentElement][par] = instance.specs[datakey](dataValue, Number(Session.get(par)[0]), Number(Session.get(par)[1]));

        if (par === 'midinote') {
          const selectedScale = instance.selectedScale.get();
          synthParameters[currentElement][par] = adjustMidiNoteToScale(synthParameters[currentElement][par], selectedScale);
        }
      });
    }

    const instrumentType = instance.instrumentType.get();
    const selectedEffects = instance.selectedEffects.get();
    const synthType = instance.synthType.get();

    for (let key in synthParameters) {
      synthParameters[key].instrumentType = instrumentType;
      synthParameters[key].selectedEffects = selectedEffects;
      synthParameters[key].synthType = synthType;
    }

    return synthParameters;
    
  }

  function playSynths(synthParameters, chordMode, loop = false, instance) {

    var synthArray = [];
    var loopInterval;
    var maxDur = 0.0;

    const tempo = instance.tempo.get();
    const qnDuration = 60 / tempo;

    var instrumentsToLoad = 0;
    var instrumentsLoaded = 0;

    function onInstrumentLoaded() {
      instrumentsLoaded++;
      if (instrumentsLoaded === instrumentsToLoad) {
        // All instruments are loaded, start playback
        playSynthArray();
  
        // Loop playback if loop is enabled
        if (loop) {
          loopInterval = setInterval(playSynthArray, maxDur * 1000);
        }
      }
    }
  
    function playSynthArray() {
      var when = Tone.now();
     
      var start = when;
      maxDur = 0.0;
      
      for (var s in synthArray) {
        var synth = synthArray[s][0];
        var dur = synthArray[s][1] * qnDuration;
        var note = synthArray[s][2];
        var effectsChain = synthArray[s][4]; // Access effectsChain
        var params = synthArray[s][5];

        if (effectsChain) {
          for (let effect of effectsChain) {
            if (effect instanceof Tone.Filter && effect.type === 'lowpass') {
              effect.frequency.setValueAtTime(20000, when);
              effect.frequency.rampTo(params.filterFrequency || 1000, dur, when);
            }
          }
        }

        synth.triggerAttackRelease(note, dur, when);
        synthArray[s][6] = when;
        if (!chordMode) { when = when + dur; }
        if (dur > maxDur) { maxDur = dur; }
      }
      
      if ((when - start) > maxDur) { maxDur = when - start; }

      for (var s in synthArray) {
        synthArray[s][3] = maxDur;
      }

      if (!loop){
        setTimeout(function() {
          console.log("disposing synths and effects");
          for (var s in synthArray) {
            const synth = synthArray[s][0];
            const effectsChain = synthArray[s][4];
            disposeSynthAndEffects(synth, effectsChain);
          }
          synthArray.length = 0;
        }, maxDur * 1500 + 1000);  // a little extra just in case
      }
    }
  
    for (var element in synthParameters) {
      
      var params = synthParameters[element];

      // Create the instrument based on the selected instrument type
      var instrument;
      var onload = onInstrumentLoaded;
      if (params.instrumentType === 'Sampler') {
        instrumentsToLoad++;
        params.onload = onload;
        instrument = Audio.createSampler(params);
      } else if (params.instrumentType === 'Synth') {
        instrument = Audio.createSynth(params);
      } else if (params.instrumentType === 'FMSynth') {
        instrument = Audio.createFMSynth(params);
      } else if (params.instrumentType === 'MembraneSynth') {
        instrument = Audio.createMembraneSynth(params);
      } else if (params.instrumentType === 'MetalSynth') {
        instrument = Audio.createMetalSynth(params);
      } else if (params.instrumentType === 'PluckSynth') {
        instrument = Audio.createPluckSynth(params);
      } else {
        instrument = Audio.createSynth(params); // Default to Synth
      }

      // Create the effects and chain them
      let effectsChain = [];
      for (let effectName of params.selectedEffects) {
        let effect;
        if (effectName === 'Reverb') {
          effect = Audio.createReverb(params);
        } else if (effectName === 'Delay') {
          effect = Audio.createDelay(params);
        } else if (effectName === 'Distortion') {
          effect = Audio.createDistortion(params);
        } else if (effectName === 'Chorus') {
          effect = Audio.createChorus(params);
        } else if (effectName === 'Tremolo') {
          effect = Audio.createTremolo(params);
        } else if (effectName === 'LowPassFilter') {
          // Pass sweepTime as the duration of the note
          effect = Audio.createLowPassFilter(params, Number(params['duration']));
        } else if (effectName === 'Panner') {
          effect = Audio.createPanner(params);
        }
        if (effect) {
          effectsChain.push(effect);
        }
      }

      if (effectsChain.length > 0) {
        instrument.chain(...effectsChain, Tone.getDestination());
      } else {
        instrument.toDestination();
      }

      synthArray.push([instrument, Number(params["duration"]), Tone.Frequency(Number(params["midinote"]), "midi").toFrequency(),0, effectsChain, params,0]);

      if(params.instrumentType !== 'Sampler') {
        instrumentsLoaded++;
      }
    }
  
    if (instrumentsLoaded === Object.keys(synthParameters).length) {
      playSynthArray();
  
      // Loop playback if loop is enabled
      if (loop) {
        loopInterval = setInterval(playSynthArray, maxDur * 1000);
      }
    }
    
    instance.allSynths.push(synthArray);
  
    return function stopLoop() {
      if (loopInterval) {
        clearInterval(loopInterval);
      }

      for (var s in synthArray) {
        const synth = synthArray[s][0];
        synth.triggerRelease();  // Release the note before disposal
      }
        for (var s in synthArray) {
          const synth = synthArray[s][0];
          const effectsChain = synthArray[s][4];
          disposeSynthAndEffects(synth, effectsChain);
        }
        // Clear the synthArray to remove references
        synthArray.length = 0;
        // Remove this synthArray from instance.allSynths
        const index = instance.allSynths.indexOf(synthArray);
        if (index > -1) {
          instance.allSynths.splice(index, 1);
        }
    };
  }

  function disposeSynthAndEffects(synth, effectsChain) {
    synth.triggerRelease();  // Release the note
    try {
      if (!synth._disposed) {
        synth.disconnect();
        synth.dispose();
        synth._disposed = true;
      }
    } catch (e) {
      console.error("Error disposing synth:", e);
    }
    if (effectsChain && effectsChain.length > 0) {
      effectsChain.forEach(effect => {
        try {
          if (!effect._disposed) {
            effect.disconnect();
            effect.dispose();
            effect._disposed = true;
          }
        } catch (e) {
          console.error("Error disposing effect:", e);
        }
      });
    }
  }

  async function recordToPreset(synthParameters, chordMode, instance) {
      try {
        // Create a new Tone.Recorder
        const recorder = new Tone.Recorder({ channels: 2});
  
        // Create a synth array to hold the synths and effects
        var synthArray = [];
        var maxDur = 0.0;
  
        const tempo = instance.tempo.get();
        const qnDuration = 60 / tempo;

        let instrumentsLoadedPromises = [];
  
        // Create instruments and effects
        for (var element in synthParameters) {
  
          var params = synthParameters[element];
  
          // Create the instrument based on the selected instrument type
          var instrument;

          if (params.instrumentType === 'Sampler') {
            let instrumentLoadedPromise = new Promise((resolve, reject) => {
              params.onload = () => {
                resolve();
              };
            });
            instrumentsLoadedPromises.push(instrumentLoadedPromise);
            instrument = Audio.createSampler(params);
          } else if (params.instrumentType === 'Synth') {
            instrument = Audio.createSynth(params);
          } else if (params.instrumentType === 'FMSynth') {
            instrument = Audio.createFMSynth(params);
          } else if (params.instrumentType === 'MembraneSynth') {
            instrument = Audio.createMembraneSynth(params);
          } else if (params.instrumentType === 'MetalSynth') {
            instrument = Audio.createMetalSynth(params);
          } else if (params.instrumentType === 'PluckSynth') {
            instrument = Audio.createPluckSynth(params);
          } else {
            instrument = Audio.createSynth(params); // Default to Synth
          }
  
          // Create the effects and chain them
          let effectsChain = [];
          for (let effectName of params.selectedEffects) {
            let effect;
            if (effectName === 'Reverb') {
              effect = Audio.createReverb(params);
            } else if (effectName === 'Delay') {
              effect = Audio.createDelay(params);
            } else if (effectName === 'Distortion') {
              effect = Audio.createDistortion(params);
            } else if (effectName === 'Chorus') {
              effect = Audio.createChorus(params);
            } else if (effectName === 'Tremolo') {
              effect = Audio.createTremolo(params);
            } else if (effectName === 'LowPassFilter') {
              effect = Audio.createLowPassFilter(params, Number(params['duration']));
            } else if (effectName === 'Panner') {
              effect = Audio.createPanner(params);
            }
            if (effect) {
              effectsChain.push(effect);
            }
          }

          let outputNode = new Tone.Gain();
  
          // Connect the instrument and effects chain to the recorder
          if (effectsChain.length > 0) {
            instrument.chain(...effectsChain, outputNode);
          } else {
            instrument.connect(outputNode);
          }

          outputNode.connect(recorder);
          outputNode.connect(Tone.getDestination());
  
  
          synthArray.push([
            instrument,                                      // Synth/instrument instance
            Number(params["duration"]),                      // Duration
            Tone.Frequency(Number(params["midinote"]), "midi").toFrequency(), // Frequency
            0,                                               // Placeholder for maxDur
            effectsChain,                                    // Effects chain
            params,                                          // Parameters
            0,                                               // startTime
            outputNode                                       // Output node
          ]);
  
          var dur = Number(params["duration"]) * qnDuration;
          if (dur > maxDur) {
            maxDur = dur;
          }
        }

        // If there are instruments to load, wait for them to finish loading
        if (instrumentsLoadedPromises.length > 0) {
          await Promise.all(instrumentsLoadedPromises);
        }
  
        // Start the recorder
        recorder.start();
  
        // Play the synths
        var when = Tone.now();
        var start = when;
  
        for (var s in synthArray) {
          var synth = synthArray[s][0];
          var dur = synthArray[s][1] * qnDuration;
          var note = synthArray[s][2];
          var effectsChain = synthArray[s][4];
          var params = synthArray[s][5];

          if (effectsChain) {
            for (let effect of effectsChain) {
              if (effect instanceof Tone.Filter && effect.type === 'lowpass') {
                effect.frequency.setValueAtTime(20000, when);
                effect.frequency.rampTo(params.filterFrequency || 1000, dur, when);
              }
            }
          }
  
          synth.triggerAttackRelease(note, dur, when);
  
          // Update maxDur if in sequence mode
          if (!chordMode) {
            when += dur;
            if ((when - start) > maxDur) {
              maxDur = when - start;
            }
          }
        }

  
        // Wait for the duration
        await delay(maxDur);
  
        // Stop the recorder and get the recorded audio
        const recording = await recorder.stop();

        recorder.dispose();
  
        // Dispose of synths and effects
        for (var s in synthArray) {
          const synth = synthArray[s][0];
          const effectsChain = synthArray[s][4];
          const outputNode = synthArray[s][7];
          disposeSynthAndEffects(synth, effectsChain);
          if (outputNode && !outputNode._disposed) {
            outputNode.dispose();
            outputNode._disposed = true;
          }
        }

        const arrayBuffer = await recording.arrayBuffer();
        const audioBuffer = await Tone.getContext().rawContext.decodeAudioData(arrayBuffer);
        const toneAudioBuffer = new Tone.ToneAudioBuffer(audioBuffer);

        return toneAudioBuffer;
      } catch (error) {
        throw error;
      }
  }

  function delay(duration) {
    return new Promise(resolve => setTimeout(resolve, (duration * 1200) + 200));
  }

  function startCrossfadeLoop(audioBuffer, ind, playButton, instance) {
     
    const loopDuration = audioBuffer.duration;
    const maxdur = ((audioBuffer.duration)-0.2)/1.2;
    const crossfadeTime = loopDuration-maxdur;
  
    const playerA = new Tone.Player({
      url: audioBuffer,
    });
  
    const playerB = new Tone.Player({
      url: audioBuffer,
    });
  
    const crossFade = new Tone.CrossFade().toDestination();
  
    playerA.connect(crossFade.a);
    playerB.connect(crossFade.b);

    const transport = Tone.getTransport();

    if (transport.state !== 'started') {
      transport.start();
    }
  
    let isPlayerAActive = true;
    let nextStartTime = transport.seconds + loopDuration - crossfadeTime;
  
    const now = transport.seconds;
    playerA.start(now);
  

    crossFade.fade.setValueAtTime(0, now); 

    const scheduledEventIDs = [];
  
    function scheduleNextPlayback(time) {
      const currentPlayer = isPlayerAActive ? playerA : playerB;
      const nextPlayer = isPlayerAActive ? playerB : playerA;
  
      nextPlayer.start(time);
  
      crossFade.fade.setValueAtTime(isPlayerAActive ? 0 : 1, time);
      crossFade.fade.linearRampToValueAtTime(isPlayerAActive ? 1 : 0, time + crossfadeTime);
  
      isPlayerAActive = !isPlayerAActive;
      nextStartTime += loopDuration - crossfadeTime;
  
      const eventID = transport.scheduleOnce(scheduleNextPlayback, nextStartTime);
      scheduledEventIDs.push(eventID);
    }
  
    const firstEventID = transport.scheduleOnce(scheduleNextPlayback, nextStartTime);
    scheduledEventIDs.push(firstEventID);
  
    instance.playbackStates[ind] = {
      playerA,
      playerB,
      crossFade,
      transport,
      scheduledEventIDs,
      stop: function () {
        
        playerA.stop();
        playerA.dispose();
        playerB.stop();
        playerB.dispose();
        crossFade.dispose();

        scheduledEventIDs.forEach(id => transport.clear(id));

        this.playerA = null;
        this.playerB = null;
        this.crossFade = null;
        this.scheduledEventIDs = null;
        
      },
    };
    $(playButton).attr('class', "btn btn-success btn-lg");
  }

  function audioBufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels,
          length = buffer.length * numOfChan * 2 + 44,
          bufferArray = new ArrayBuffer(length),
          view = new DataView(bufferArray),
          channels = [],
          sampleRate = buffer.sampleRate,
          bitsPerSample = 16;
    let offset = 0;
    let pos = 0;
  
    // Write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"
  
    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * numOfChan * bitsPerSample / 8);
    setUint16(numOfChan * bitsPerSample / 8);
    setUint16(bitsPerSample);
  
    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length
  
    // Write interleaved data
    for(let i = 0; i < buffer.numberOfChannels; i++)
      channels.push(buffer.getChannelData(i));
  
    while(pos < length) {
      for(let i = 0; i < numOfChan; i++) {         // interleave channels
        let sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
        sample = (sample < 0 ? sample * 0x8000 : sample * 0x7FFF)|0; // scale to 16-bit signed int
        view.setInt16(pos, sample, true);          // write 16-bit sample
        pos += 2;
      }
      offset++;                                    // next source sample
    }
  
    return bufferArray;
  
    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
  
    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
  }

  function adjustMidiNoteToScale(midiNote, scaleName) {
    if (scaleName === 'Chromatic') {
      return midiNote; // No adjustment needed
    }
  
    const scaleIntervals = scales[scaleName];
    if (!scaleIntervals) {
      return midiNote; // Default to no adjustment if scale not found
    }
  
    const noteNumberInOctave = midiNote % 12;
    const octave = Math.floor(midiNote / 12);
    let closestInterval = scaleIntervals[0];
    let minDistance = Math.abs(noteNumberInOctave - scaleIntervals[0]);
  
    for (let i = 1; i < scaleIntervals.length; i++) {
      const distance = Math.abs(noteNumberInOctave - scaleIntervals[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestInterval = scaleIntervals[i];
      }
    }
  
    const adjustedNoteInOctave = closestInterval;
    const adjustedMidiNote = (octave * 12) + adjustedNoteInOctave;
  
    return adjustedMidiNote;
  }

  function parseColumns(content) {
    const separator = content.includes('\t') ? '\t' : ',';
    const firstRow = content.trim().split('\n')[0];
    return firstRow.split(separator);
  }

  function detectType(value) {
    if (!isNaN(value) && Number.isInteger(parseFloat(value))) {
      return parseInt(value, 10);
    }
    if (!isNaN(value) && !Number.isNaN(parseFloat(value))) {
      return parseFloat(value);
    }
    return value;
  }

  function createDictionary(instance) {
    const useHeaders = document.getElementById('selhdrs').checked;
    const separator = fileContent.get().includes('\t') ? '\t' : ','; // Detect CSV or TSV
    const rows = fileContent.get().trim().split('\n');
    const selectedColumns = [];
    
    const columnChecks = document.querySelectorAll('#columnsForm input[type=checkbox]:checked');
    columnChecks.forEach((checkbox) => {
      selectedColumns.push(parseInt(checkbox.value));
    });

    let keys = [];
    if (useHeaders) {
      const headerRow = parseCSVRow(rows[0], separator);
      keys = selectedColumns.map((index) => headerRow[index]);
    } else {
      keys = document.getElementById('keysInput').value.split(',').map((key) => key.trim());
    }

    const slider = document.getElementById('slider');
    const [startRow, endRow] = sliderInstance.get().map(Number);

    const newDictionary = {};
    let rowIndex = startRow - 1;

    const numericColumnRanges = {}; // min/max values for numeric columns

    let dataRows = rows.slice(useHeaders ? 1 : 0);
    dataRows = dataRows.slice(startRow - 1, endRow);

    dataRows.forEach((row, i) => {
      const values = parseCSVRow(row, separator);
      let entry = {};

      keys.forEach((key, index) => {
        if (index < selectedColumns.length) {
            const columnIndex = selectedColumns[index];
            const valueStr = values[columnIndex];

            if (valueStr !== undefined) {
              let value = detectType(valueStr.trim());
              entry[key] = value;
    
              // Check if this is a numeric column and calculate min/max
              if (typeof value === 'number') {
                if (!numericColumnRanges[key]) {
                  numericColumnRanges[key] = { min: value, max: value };
                } else {
                  numericColumnRanges[key].min = Math.min(numericColumnRanges[key].min, value);
                  numericColumnRanges[key].max = Math.max(numericColumnRanges[key].max, value);
                }
              }
            } else {
              
              entry[key] = null;
            }
        }
      });

      const currentRowIndex = startRow + i;
      const rowName = (currentRowIndex).toString(); // Use row number as key
      newDictionary[rowName] = entry;
    });

    dictionary.set(EJSON.stringify(newDictionary, { indent: true }));
    showOutput.set(true);
    

    instance.numericColumns.set(Object.keys(numericColumnRanges));

    // Show inmin/inmax modal if there are numeric columns
    if (Object.keys(numericColumnRanges).length > 0) {
      populateInminInmaxForm(numericColumnRanges); // Pass min/max ranges
      const inminInmaxModal = new bootstrap.Modal('#inminInmaxModal');
      inminInmaxModal.show();
    }

    // Overwrite parsedata with the new data
    instance.parsedata.set(newDictionary);

    datasets['User Uploaded Data'].data = instance.parsedata.get();

    instance.selectedDataset.set('User Uploaded Data');

    const defaultRowName = Object.keys(instance.parsedata.get())[0];
    instance.activeRowName.set(defaultRowName);
    instance.activeRow.set(instance.parsedata.get()[defaultRowName]);

    datadict.set(newDictionary);

  }

  function populateInminInmaxForm(numericColumnRanges) {
    
    const form = document.getElementById('inminInmaxForm');
    form.innerHTML = '<div class="row text-center mb-1"> <div class="col-3 mb-1 offset-md-5 text-light " aria-hidden="true"><b>Min:</b></div> <div class="col-3 mb-1 text-light" aria-hidden="true"><b>Max:</b></div></div>'; // Clear any existing content

    Object.keys(numericColumnRanges).forEach((key) => {
      const minValue = numericColumnRanges[key].min;
      const maxValue = numericColumnRanges[key].max;

      form.innerHTML += `
      <div class="row text-center py-1 mb-1">
        <div class="col-5 p-1 text-light" aria-hidden="true">
          <b>${key}</b>
        </div>  
        <div class="col-3">
          <input type="number" class="form-control form-control-sm bg-light" id="inmin-${key}" value="${minValue}" aria-label="Set custom minimum range value for ${key}. Imported Range is ${minValue} to ${maxValue}">
        </div>
        <div class="col-3">
          <input type="number" class="form-control form-control-sm bg-light" id="inmax-${key}" value="${maxValue}" aria-label="Set custom maximum range value for ${key}. Imported Range is ${minValue} to ${maxValue}">
        </div>
      </div>
      `;
    });
  }

  function parseCSVRow(row, separator) {
    const regex = new RegExp(
      `(?:^|${separator})(\"(?:[^\"]+|\"\")*\"|[^${separator}]*)`,
      'g'
    );
    const result = [];
    let match;

    while ((match = regex.exec(row)) !== null) {
      let value = match[1] || '';
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      result.push(value);
    }

    return result;
  }

  function triggerPreset(presetNumber) {
    var buttonId = 'cell' + presetNumber;
    var buttonElement = document.getElementById(buttonId);
  
    if (buttonElement) {
      var event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      buttonElement.dispatchEvent(event);
    }
  }
  
  Template.StEg_app.onDestroyed(function () {
    $(document).off('keydown');
  });
  
}

