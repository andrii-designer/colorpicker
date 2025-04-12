const https = require('https');
const tinycolor = require('tinycolor2');

// Function to convert color name to URL-friendly format
function formatColorForUrl(name) {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim(); // Remove leading/trailing spaces
}

// Function to fetch color data from the website
function fetchColorData(colorName) {
  return new Promise((resolve, reject) => {
    const formattedName = formatColorForUrl(colorName);
    const url = `https://color-register.org/color/${formattedName}`;
    
    console.log(`Fetching color data for "${colorName}" from ${url}`);
    
    https.get(url, (res) => {
      console.log(`Status code: ${res.statusCode}`);
      
      if (res.statusCode === 404) {
        resolve({ 
          notFound: true,
          name: colorName
        });
        return;
      }
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // Extract hex code using regex
          const hexMatch = data.match(/#([A-F0-9]{6})\s*-\s*[^<]+color image/i);
          
          if (hexMatch && hexMatch[1]) {
            const hex = `#${hexMatch[1].toUpperCase()}`;
            console.log(`Found hex value: ${hex}`);
            
            const color = tinycolor(hex);
            const rgb = color.toRgb();
            const hsl = color.toHsl();
            
            resolve({
              name: colorName,
              hex: hex,
              rgb: { r: rgb.r, g: rgb.g, b: rgb.b },
              hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100) }
            });
          } else {
            console.log(`Failed to extract hex code from HTML`);
            console.log(`HTML snippet: ${data.substring(0, 1000)}...`);
            resolve({ 
              parseError: true,
              name: colorName,
              url: url
            });
          }
        } catch (error) {
          console.error(`Error parsing data: ${error.message}`);
          resolve({ 
            error: error.message,
            name: colorName
          });
        }
      });
    }).on('error', (error) => {
      console.error(`Network error: ${error.message}`);
      resolve({ 
        networkError: error.message,
        name: colorName
      });
    });
  });
}

// Test with 'Ab Fab'
async function testFetch() {
  try {
    const result = await fetchColorData('Ab Fab');
    console.log('Result:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

testFetch(); 