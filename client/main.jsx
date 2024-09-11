import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { EJSON } from 'meteor/ejson';

import specs from '../imports/specs/specs.js';
import data from '../imports/data/data.js'

import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

import * as noUiSlider from 'nouislider';
import 'nouislider/dist/nouislider.css';

import Tone from "tone";

import './main.html';
import './sliders.js';

Session.setDefault('midinote', [60.0, 84.0]);
Session.setDefault('attack', [0.1, 2.0]);
Session.setDefault('decay', [0.1, 1.0]);
Session.setDefault('sustain', [0.2, 0.8]);
Session.setDefault('detune', [0.0, 50.0]);
Session.setDefault('release', [0.1, 1.0]);
Session.setDefault('duration', [0.5, 3.0]);

// Reactive variables to hold state
const fileContent = new ReactiveVar('');
const dictionary = new ReactiveVar([]);
const showOutput = new ReactiveVar(false);
const datadict = new ReactiveVar([]);
let sliderInstance;

if (Meteor.isClient) {

  Template.StEg_app.onCreated(function () {

    this.columnOptions = new ReactiveVar([]);
    this.numericColumns = new ReactiveVar([]);

    this.listParams = [
      'attack',    'decay',       'sustain',
      'release',   'detune',      'midinote',  'duration'
    ];

    this.synthTypes = ['sine', 'square', 'triangle', 'sawtooth'];

    this.parsedata = data;

    const defaultRowName = Object.keys( this.parsedata )[ 0 ];
    this.activeRowName   = new ReactiveVar( defaultRowName );
    this.activeRow       = new ReactiveVar();
    this.numRows         = new ReactiveVar(1);

    this.loopPlayback = new ReactiveVar(false);  // Default state is looping off
    this.tempo = new ReactiveVar(60);  // Default tempo
    // this.synthArray = [];  // To store the synths
    this.allSynths = [];
    this.stopLoopFunction = null;  // Keep track of Transport state

    this.autorun(() => {
      // this will rerun each time its dependencies are changed (the ReactiveVar)
      const RowName   = this.activeRowName.get();
      const linkedRow = this.parsedata[ RowName ];
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

    this.state = {};

    this.chordmode = true;
    this.storedSonifications = [];
    this.storeIndex = 0;
    this.synthType = 'sine';


  });

  Template.StEg_app.helpers({
    columnOptions() {
      return Template.instance().columnOptions.get();
    },
    dictionary() {
      return dictionary.get();
    },
    showOutput() {
      return showOutput.get();
    },
    listParams: () => Template.instance().listParams,

    synthTypes: () => Template.instance().synthTypes,

    getTempo:() => {
      return Template.instance().tempo.get();
    },
    isLooping:() => {
      return Template.instance().loopPlayback.get();
    },

    getSonificationData: function() {
      
      const activeRow = Template.instance().activeRow.get();
      const allData = Template.instance().parsedata;
      const numRows = Template.instance().numRows.get();
      let sonificationData = [];
      const startIndex = allData.indexOf(activeRow);
      console.log('Active Row:',startIndex);
      console.log('Total Rows:',allData.length);
      console.log('No. of Consecutive Rows:',numRows);

    
      for (let i = 0; i < numRows; i++) {
        const rowIndex = startIndex + i;
        if (rowIndex >= allData.length) break;  // Prevent going out of bounds
        const currentRow = allData[rowIndex];

        let rowData = {
          Row: rowIndex,
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
      console.log('sonificationData:',sonificationData);
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
      const DataArr = [];

      for (let Row in data) {
          DataArr.push({
              name  : Row,
          });
      }

      return DataArr;
    },

    maxnumRows: function() {
      const allData = Template.instance().parsedata;
      const activeRowIndex = allData.indexOf(Template.instance().activeRow.get());
      const maxnumrows = (allData.length - 1) - activeRowIndex;
      return maxnumrows;
    },

    incremented(index) { return (index + 1)},

  });

  Template.StEg_app.events({
    'change #fileInput'(event, instance) {
      const file = event.target.files[0];
      if (file) {

        if (sliderInstance) {
          sliderInstance.destroy();
          sliderInstance = null; // Clear the reference
        }

        const slhd = document.getElementById('selhdrs'); slhd.checked=false; slhd.dispatchEvent(new Event('change'));  
        const chkall = document.getElementById('checkall'); chkall.checked = false; chkall.dispatchEvent(new Event('change'));
        
        const reader = new FileReader();
        reader.onload = function (e) {
          fileContent.set(e.target.result);
          instance.columnOptions.set(parseColumns(e.target.result));
          const rows = (e.target.result).trim().split('\n');

          const rowRangeContainer = document.getElementById('rowRangeContainer');
          rowRangeContainer.style.display = 'block';

          const slider = document.getElementById('slider');
          sliderInstance = noUiSlider.create(slider, {
            start: [1, rows.length],
            connect: true,
            range: {
              'min': 1,
              'max': rows.length
            },
            step: 1
          });

          // Sync the slider with the text inputs
          const startRowInput = document.getElementById('startRowInput');
          const endRowInput = document.getElementById('endRowInput');

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
        const inmin = parseFloat(form.querySelector(`#inmin-${column}`).value);
        const inmax = parseFloat(form.querySelector(`#inmax-${column}`).value);
        mappingFunctions[column] = { inmin, inmax };
      });

      // Save the mapping functions
      saveMappingFunctions(mappingFunctions);
      // export to Data.js File
      exportToJSFile(datadict.get());
      
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
      instance.synthType = selectedElem.value;
    },

    'change #tempoInput'(event, instance) {
      const tempo = parseInt(event.currentTarget.value, 10);
      instance.tempo.set(tempo);
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
        instance.stopLoopFunction = playSynths(synthParameters, instance.synthType, chordMode, loopEnabled, instance);
      }

      else {
        playSynths(synthParameters, instance.synthType, chordMode, loopEnabled, instance);
      }
    },

    'click .store': function(event, instance) {
      var synthParameters = getSynthParamsFromGui(instance);
      if ($("#chord").prop("checked")) {
        instance.chordmode = true;
      } 
      else {
        instance.chordmode = false;
      }
      
      var storedParams = {};

      storedParams["synthParams"] = synthParameters;
      storedParams["chordmode"] = instance.chordmode;
      storedParams["synthtype"] = instance.synthType;
      console.log(`storedparams`, storedParams);
      
      var storeButton = instance.find('[data-playind=' + instance.storeIndex + ']');
      
      $(storeButton).attr('class', "btn btn-success");
      setTimeout(function() {$(storeButton).attr('class', "btn btn-secondary btn-lg");}, 250);
      setTimeout(function() {$(storeButton).attr('class', "btn btn-success btn-lg");}, 500);
      instance.storedSonifications[instance.storeIndex] = storedParams;
      instance.storeIndex = (instance.storeIndex + 1)%9;
    },
    
    'click .stop': function(event, instance) {
      if (instance.stopLoopFunction) {
        instance.stopLoopFunction(); // Stop the loop if it's running
      }

      let allsynths = instance.allSynths;
      // Stop all playing synths
      allsynths.forEach(synthArray => {
        for (var s in synthArray) {
        const synth = synthArray[s][0];
        synth.triggerRelease();  // Release the note before disposal
        setTimeout(function () {
          synth.dispose();
        }, synthArray[s][3]*1000+200);    
      }
      });

      // Clear the array after stopping
      instance.allSynths = [];
    },

    'click #loopButton'(event, instance) {

      const currentLoopState = instance.loopPlayback.get();
      instance.loopPlayback.set(!currentLoopState);
      let allsynths = instance.allSynths;

      if (currentLoopState){

        if (instance.stopLoopFunction) {
          instance.stopLoopFunction(); // Stop the loop when toggled off
        }

        allsynths.forEach(synthArray => {
          for (var s in synthArray) {
          const synth = synthArray[s][0];
          synth.triggerRelease();
          setTimeout(function () {
            synth.dispose();
          }, synthArray[s][3]*1000+200);
         }
        })
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

    "click [data-type='playbutton']": ( (event, instance) => {
      var ind = Number($(event.target).attr("data-playind"));

      console.log(event);
      var storedParams = instance.storedSonifications[ind];
      if(typeof storedParams != 'undefined') {
        var synthParameters = storedParams["synthParams"];
        var chordMode = storedParams["chordmode"];
        var synthType = storedParams["synthtype"];

        console.log(`synthType `, synthType);

        instance.synthArray = playSynths(synthParameters, synthType, chordMode);
      }
    })

  });

  // Helper functions

  function getSynthParamsFromGui(instance){

    var rbs = instance.findAll('input[type=radio]:checked');
    var checked = rbs.filter(function(rb) { return $(rb).attr('data-type') == "matrixbutton"})
    var synthParameters = {};
    const allData = instance.parsedata;
    const numRows = instance.numRows.get();
    const activeRowIndex = allData.indexOf(instance.activeRow.get());

    var mappingInfo = []; //to store the current mapping

    // scan radio button matrix for current mapping

    for ( var c in checked ) {
      var element = $(checked[c]).attr('data-element');
      if(typeof synthParameters[element] == 'undefined') {
        synthParameters[element] = {};
      }
      var par = $(checked[c]).attr('class');
      var datakey = $(checked[c]).attr('data-key');
      var fieldValue = $(checked[c]).attr('value');

      mappingInfo.push({ par, datakey, fieldValue });

      synthParameters[element][par] = specs[datakey](fieldValue, Number(Session.get(par)[0]), Number(Session.get(par)[1]));

    }

    // apply current mapping to the rest of the consecutive rows:

    for (let i = 1; i < numRows; i++) {
      const rowIndex = activeRowIndex + i;
      if (rowIndex >= allData.length) break;
      let currentElement = rowIndex.toString();
      if (typeof synthParameters[currentElement] == 'undefined') {
        synthParameters[currentElement] = {};
      }

      mappingInfo.forEach(({ par, datakey }) => {
        const currentRowData = allData[rowIndex];  
        const dataValue = currentRowData[datakey]; 
  
        synthParameters[currentElement][par] = specs[datakey](dataValue, Number(Session.get(par)[0]), Number(Session.get(par)[1]));
      });
    }

    return synthParameters;
    
  }

  function playSynths(synthParameters, synthType, chordMode, loop = false, instance) {

    var synthArray = [];
    var loopInterval;
    var maxDur = 0.0;
  
    console.log('synthParameters:', synthParameters);

    const tempo = instance.tempo.get();
    const qnDuration = 60 / tempo;
  
    function playSynthArray() {
      var when = Tone.now();
     
      var start = when;
      
      for (var s in synthArray) {
        var synth = synthArray[s][0];
        var dur = synthArray[s][1] * qnDuration;
        var note = synthArray[s][2];
        synth.triggerAttackRelease(note, dur, when);
        if (!chordMode) { when = when + dur; }
        if (dur > maxDur) { maxDur = dur; }
      }
      
      if ((when - start) > maxDur) { maxDur = when - start; }

      if (!loop){
        setTimeout(function() {
          console.log("disposing");
          for (var s in synthArray) { synthArray[s][0].dispose(); }
        }, maxDur * 1500 + 1000);  // a little extra just in case
      }
    }
  
    for (var element in synthParameters) {
      var params = synthParameters[element];
      var synth = new Tone.Synth({
        "oscillator": {
          "type": synthType,
          "detune": Number(params["detune"]),
          "frequency": Tone.Frequency(Number(params["midinote"]), "midi").toFrequency()
        },
        "envelope": {
          "attack": Number(params["attack"]),
          "decay": Number(params["decay"]),
          "sustain": Number(params["sustain"]),
          "release": Number(params["release"])
        }
      }).toDestination();
  
      synthArray.push([synth, Number(params["duration"]), Tone.Frequency(Number(params["midinote"]), "midi").toFrequency(),maxDur]);
    }

    instance.allSynths.push(synthArray);
  
    // Start initial playback
    playSynthArray();
  
    // Loop playback if loop is enabled
    if (loop) {
      loopInterval = setInterval(playSynthArray, maxDur * 1000); // Repeat after max duration
    }
  
    return function stopLoop() {
      if (loopInterval) {
        clearInterval(loopInterval);
      }
    };
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

    // Get the selected range of rows
    const slider = document.getElementById('slider');
    const [startRow, endRow] = sliderInstance.get().map(Number);

    const newDictionary = [];
    const numericColumnRanges = {}; // min/max values for numeric columns

    rows.slice(useHeaders ? 1 : 0).slice(startRow - 1, endRow).forEach((row, rowIndex) => {
      const values = parseCSVRow(row, separator);
      let entry = {};

      keys.forEach((key, index) => {
        if (index < selectedColumns.length) {
            let value = detectType(values[selectedColumns[index]].trim());
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
        }
      });

      newDictionary.push(entry);
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

    // set datadict ReactiveVar for export

    datadict.set(newDictionary);

  }

  function populateInminInmaxForm(numericColumnRanges) {
    
    const form = document.getElementById('inminInmaxForm');
    form.innerHTML = '<div class="row text-center mb-1"> <div class="col-3 mb-1 offset-md-5 "><b>Min:</b></div> <div class="col-3 mb-1"><b>Max:</b></div></div>'; // Clear any existing content

    Object.keys(numericColumnRanges).forEach((key) => {
      const minValue = numericColumnRanges[key].min;
      const maxValue = numericColumnRanges[key].max;

      form.innerHTML += `
      <div class="row text-center py-1 mb-1">
        <div class="col-5 p-1">
          <b>${key}</b>
        </div>  
        <div class="col-3">
          <input type="number" class="form-control form-control-sm" id="inmin-${key}" value="${minValue}">
        </div>
        <div class="col-3">
          <input type="number" class="form-control form-control-sm" id="inmax-${key}" value="${maxValue}">
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
      let value = match[1] || ''; // The captured group
      // If the value is quoted, remove the surrounding quotes and unescape double quotes inside
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"');
      }
      result.push(value);
    }

    return result;
  }

  function exportToJSFile(data) {
    fetch('/exportData', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: EJSON.stringify(data)
    })
      .then((response) => {
        if (response.ok) {
          console.log('File exported successfully!');
        } else {
          console.error('Failed to export file.');
        }
      })
      .catch((error) => console.error('Error:', error));
  }

  function saveMappingFunctions(mappingFunctions) {
    fetch('/saveMappingFunctions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ejson',
      },
      body: EJSON.stringify(mappingFunctions),
    })
      .then(response => {
        if (response.ok) {
          console.log('Mapping functions saved successfully!');
        } else {
          console.error('Failed to save mapping functions.');
        }
      })
      .catch(error => console.error('Error:', error));
  }

}

