import tinycolor from 'tinycolor2';


// Helper function to extract common color words for categorization
function extractColorWords(name) {
  return name.toLowerCase().split(' ').filter(word => 
    ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 
     'brown', 'grey', 'gray', 'black', 'white', 'gold', 'silver'].includes(word)
  );
}

// Helper function to extract common descriptive words for tags
function extractTags(name) {
  const tags= [];
  const words = name.toLowerCase().split(' ');
  
  // Common descriptive prefixes
  const descriptors = {
    vintage vivid aesthetic warm cool muted dark metallic };

  // Check each word against our descriptor lists
  words.forEach(word => {
    Object.entries(descriptors).forEach(([tag, keywords]) => {
      if (keywords.includes(word) && !tags.includes(tag)) {
        tags.push(tag);
      }
    });
  });

  return tags;
}

// Function to generate an initial HSL value for a color name
function generateInitialHSL(name): { h: number; s: number; l }) {
  const colorWords = extractColorWords(name);
  if (colorWords.length === 0) {
    // If no color word is found, generate a random color
    return {
      h * 360,
      s + Math.random() * 20,
      l + Math.random() * 20
    };
  }

  // Base HSL values for common colors
  const baseColors { h: number; s: number; l }> = {
    red: { h s l },
    orange: { h s l },
    yellow: { h s l },
    green: { h s l },
    blue: { h s l },
    purple: { h s l },
    pink: { h s l },
    brown: { h s l },
    grey: { h s l },
    gray: { h s l },
    black: { h s l },
    white: { h s l },
    gold: { h s l },
    silver: { h s l }
  };

  const baseColor = baseColors[colorWords[0]];
  
  // Add some variation to make each color unique
  return {
    h + (Math.random() * 20 - 10)) % 360,
    s + (Math.random() * 20 - 10))),
    l + (Math.random() * 20 - 10)))
  };
}

// Function to determine color category
function determineCategory(name hue) {
  const colorWords = extractColorWords(name);
  if (colorWords.length > 0) {
    const mainColor = colorWords[0];
    switch (mainColor) {
      case 'red' 'red';
      case 'orange' 'orange';
      case 'yellow' 'yellow';
      case 'green' 'green';
      case 'blue' 'blue';
      case 'purple' 'purple';
      case 'pink' 'pink';
      case 'brown' 'brown';
      case 'grey' 'gray' 'gray';
      case 'black' 'black';
      case 'white' 'white';
      case 'gold' 'silver' 'metallic';
    }
  }

  // Fallback to hue-based categorization
  if (name.toLowerCase().includes('metallic')) return 'metallic';
  return categorizeByHue(hue);
}

function categorizeByHue(hue) {
  if (hue <= 15 || hue >= 345) return 'red';
  if (hue < 45) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 150) return 'green';
  if (hue < 240) return 'blue';
  if (hue < 320) return 'purple';
  return 'pink';
}

export function parseColorName(name) {
  const hsl = generateInitialHSL(name);
  const category = determineCategory(name, hsl.h);
  const tags = extractTags(name);

  return {
    name,
    hue saturation lightness };
}

// Function to parse a list of color names and generate the database
export function generateColorDatabase(colorNames) {
  return colorNames.map(name => parseColorName(name));
} 