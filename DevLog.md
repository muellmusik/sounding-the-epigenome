# Dev Log:

* Milad Mardakheh (29/09/2024):

    - Implemented signal chain modular system:

        - The user can select a preferred instrument and build an FX chain by stacking multiple FX.

        - Selected instruments and FX-chain parameters update the mapping and ranges tables dynamically, and can be mapped to data parameters per sonification of each row of data.

        - Added relevant UI elements: single and multi-select drop-downs

    - Added multiple instruments and effects:

        [Instruments]:

        - Oscillator
        - FMSynth
        - Membrane Synth
        - Metal Synth
        - Plucked Synth
        - Sampler (Piano)

        [Effects]:

        - Reverb
        - Feedback Delay
        - Distortion
        - Chorus
        - Tremolo
        - LPF-Sweep
        - Stereo Panner

    - Updated preset storing/removal/playback logic:

        - Implemented a buffer recording and playback system for the preset module instead of running the synth and effects of each stored preset live. This was done to improve performance and solve major issues with audio drops and stuttering encountered after the signal chain modular system was implemented.

        - Updated preset button behavior per looped or unlooped sample, i.e. toggle/trigger.

        - Added preset remove button to the UI.

    - Added Recording functionality to the app:

        - Records the master output of all audio generated via user interaction in the app. 

        - Exports .wav file of recording to disk.

        - Added Record button to the UI

    - General UI overhaul:

        - Added Bootswatch themes for quick UI upgrade: currently on 'solar'

        - Created custom .css files (for tom-select and nouislider elements)

        - Added shadows to HTML elements for a sharper, 3D look.

        - Improved the responsive layout.


    TODO:

    - Implement scales/modes
    - Language switch/tab --> English/Español


* Milad Mardakheh (11/09/2024):

    - Implemented looping

    - Added Tempo-relative scaling of note durations

    - Automatic detection of min/max ranges of parsed data

    - Expanded the number of consecutive rows for sonification

    - Adjusted the UI and logic to display only one row for sonification of multiple rows homogenous data.

    TODO:

    - Implement scales/modes

    - S̶i̶g̶n̶a̶l̶ c̶h̶a̶i̶n̶ m̶o̶d̶u̶l̶a̶r̶ s̶y̶s̶t̶e̶m̶ -̶ M̶a̶j̶o̶r̶ o̶v̶e̶r̶h̶a̶u̶l̶

    - A̶d̶d̶i̶n̶g̶ o̶t̶h̶e̶r̶ s̶o̶u̶n̶d̶ s̶o̶u̶r̶c̶e̶s̶/̶i̶n̶s̶t̶r̶u̶m̶e̶n̶t̶s̶ -̶-̶>̶ F̶M̶ s̶y̶n̶t̶h̶,̶ S̶a̶m̶p̶l̶e̶r̶

    - A̶d̶d̶i̶n̶g̶ A̶u̶d̶i̶o̶ F̶X̶ c̶a̶p̶a̶b̶i̶l̶i̶t̶i̶e̶s̶ -̶-̶>̶ R̶e̶v̶e̶r̶b̶,̶ F̶e̶e̶d̶b̶a̶c̶k̶ D̶e̶l̶a̶y̶,̶ H̶P̶F̶,̶ L̶P̶F̶,̶ D̶i̶s̶t̶o̶r̶t̶i̶o̶n̶

    - G̶e̶n̶e̶r̶a̶l̶ U̶I̶ o̶v̶e̶r̶h̶a̶u̶l̶

    - Language switch/tab --> English/Español


* Milad Mardakheh (27/08/2024):

    - Main changes:

        - Ported IPSOS modules, functions and UI elements as a fully-functional base for the app. Updated dependencies and used platforms to the latest versions in the process, e.g. meteor, Bootstrap, Tone, etc. 

    - Back-end changes: 

        - Implemented file loading and parsing functionality, i.e. the user can upload .csv, .tsv, .txt data files, select preferred columns and number of rows to import, set custom header labels for each column, input data min/max ranges, and load the parsed data for sonification. This runs through a combination of server-side [./server/main.js] and client-side [./client/main.jsx] processes.

        - Dynamic loading and modification of [./imports/data/data.js] per file upload and parsing by user.

        - Dynamic structuring of mapping functions, i.e. [./imports/specs/specs.js], per data file upload by user.

        - Removed redundancies and Improved range-slider constructors and event handlers code i.e., [./client/sliders.js].

    - Front-end changes:

        - User can select up to 4 consectuive rows of data, starting from the selected Row#, to import for sonification, which can be sonified either as a chord or a sequence. The '4' rows is an arbitrary restriction. This could be expanded to any number.