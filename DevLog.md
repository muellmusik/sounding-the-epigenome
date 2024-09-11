# Dev Log:

* Milad Mardakheh (11/09/2024):

    - Implemented looping

    - Added Tempo-relative scaling of note durations

    - Automatic detection of min/max ranges of parsed data

    - Expanded the number of consecutive rows for sonification

    - Adjusted the UI and logic to display only one row for sonification of multiple rows homogenous data.

    TODO:

    - Implement scales/modes

    - Signal chain modular system - Major overhaul

    - Adding other sound sources/instruments --> FM synth, Sampler

    - Adding Audio FX capabilities --> Reverb, Feedback Delay, HPF, LPF, Distortion

    - General UI overhaul

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