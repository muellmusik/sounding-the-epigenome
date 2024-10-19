# Static HTML Deployment Instructions:

0. Follow the installations instructions on the README.md to correctly install the app and all its dependencies first. Make sure the app runs correctly before proceeding to the next steps below.

1. Install 'meteor-build-client-fixed' package globally via npm by running the command: 
[$ npm install -g meteor-build-client-fixed] in your terminal.

2. Navigate to the project's root directory in your terminal. Ensure the app is not running at this point.

3. Remove meteor-base package by running the command: [$ meteor remove meteor-base]

4. Add the meteor & webapp packages by running the command: [$ meteor add meteor webapp]

5. Export the static bundle by running: [$ meteor-build-client-fixed ../StEg_static --path ""] 

    NOTE: The above command will export the static bundle files to the 'StEg_static' folder which will be placed in the parent of the app's root directory, i.e. if the root directory has the address ~/desktop/StEg_app, then the bundle will be exported to your desktop folder and will have the address ~/desktop/StEg_static. If you prefer to have this folder within the project's root directory, change the export path to "./StEg_static" in the above command. You can also define any other path by adjusting the command accordingly. 
    
    WARNING: The contents of the output folder will be deleted before building the new bundle! So don't do things like [$ meteor-build-client-fixed /home --path ""]!

6. You can then host the bundle files as a static HTML website on any server through FTP.