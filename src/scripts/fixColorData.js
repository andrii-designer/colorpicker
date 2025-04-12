const fs = require('fs');
const path = require('path');

const COLOR_DATA_PATH = path.resolve(__dirname, '../lib/utils/accurateColorData.ts');
const OUTPUT_PATH = path.resolve(__dirname, '../lib/utils/fixedAccurateColorData.ts');

try {
  console.log('Reading color data file...');
  let fileContent = fs.readFileSync(COLOR_DATA_PATH, 'utf8');
  
  // Replace problematic apostrophes with escaped versions
  fileContent = fileContent.replace(/'name': '([^']*)'s([^']*)'/g, function(match, p1, p2) {
    return `'name': '${p1}\\'s${p2}'`;
  });

  // Fix any other potential special characters in names
  fileContent = fileContent.replace(/'name': '([^']*)&([^']*)'/g, function(match, p1, p2) {
    return `'name': '${p1}&amp;${p2}'`;
  });

  fileContent = fileContent.replace(/'name': '([^']*)"([^']*)'/g, function(match, p1, p2) {
    return `'name': '${p1}\\"${p2}'`;
  });

  // Write the fixed file
  fs.writeFileSync(OUTPUT_PATH, fileContent);
  console.log(`Fixed color data saved to: ${OUTPUT_PATH}`);
  
} catch (error) {
  console.error('Error fixing color data:', error);
} 