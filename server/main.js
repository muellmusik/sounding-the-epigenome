import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { EJSON } from 'meteor/ejson';
import fs from 'fs';
import path from 'path';

Meteor.startup(() => {
// Correctly identify the root directory of the Meteor project
const findMeteorProjectRoot = () => {
  let currentDir = process.cwd();

  while (currentDir !== path.parse(currentDir).root) {
    if (fs.existsSync(path.join(currentDir, '.meteor'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  throw new Error('Could not find the .meteor directory. Are you sure this is a Meteor project?');
};

const projectRoot = findMeteorProjectRoot();
console.log('Project Root:', projectRoot);

// Ensure the ./imports/data directory exists within the project root
const dataDir = path.join(projectRoot, 'imports', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('Created data directory at:', dataDir);
}

  // Ensure the ./imports/specs directory exists within the project root
const specsDir = path.join(projectRoot, 'imports', 'specs');
 if (!fs.existsSync(specsDir)) {
  fs.mkdirSync(specsDir, { recursive: true });
  console.log('Created specs directory at:', specsDir);
 }


  // Handle file export requests
  WebApp.connectHandlers.use('/exportData', (req, res, next) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Use EJSON to parse the incoming JSON data
      const data = EJSON.parse(body);

      // Generate the JS file content using EJSON
      let jsContent = `const data = ${EJSON.stringify(data, { indent: true })};\n`;
      const filePath = path.join(dataDir, 'data.js');

      jsContent += '\n\nexport default data;\n';

      // Write the content to data.js in the ./data directory
      fs.writeFileSync(filePath, jsContent);

      // Respond with success
      res.writeHead(200);
      res.end('File has been created successfully!');
    });
  });

  WebApp.connectHandlers.use('/saveMappingFunctions', (req, res, next) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      // Use EJSON to parse the incoming JSON data
      const mappingFunctions = EJSON.parse(body);

      // Generate the JS file content
      let specsContent = 'const specs = {\n';
      for (const key in mappingFunctions) {
        specsContent += `
    ${key}: function(val, outmin, outmax){
        const inmin = ${mappingFunctions[key].inmin};
        const inmax = ${mappingFunctions[key].inmax};
        return (((val - inmin) / (inmax - inmin)) * (outmax - outmin)) + outmin;
    },\n`;
      }
      specsContent += '};\n\nexport default specs;\n';

      const filePath = path.join(specsDir, 'specs.js');

      // Write the content to specs.js in the ./specs directory
      fs.writeFileSync(filePath, specsContent);

      // Respond with success
      res.writeHead(200);
      res.end('Mapping functions have been saved successfully!');
    });
  });
});