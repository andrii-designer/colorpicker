import { generateColorDatabase } from './colorParser';
import type { ColorEntry } from './colorDatabase';

// Color database generated from the Official Register of Color Names
// Source: https://color-register.org/

export const colorDatabase: ColorEntry[] = [
  // Reds
  {
    name: "Angels Red",
    hue: 0,
    saturation: 90,
    lightness: 50,
    category: "red",
    tags: ["vivid", "bright"],
    hex: "#FF0000",
    rgb: { r: 255, g: 0, b: 0 }
  },
  {
    name: "Antique Ruby",
    hue: 350,
    saturation: 75,
    lightness: 40,
    category: "red",
    tags: ["antique", "deep"],
    hex: "#9B1B30",
    rgb: { r: 155, g: 27, b: 48 }
  },
  {
    name: "Apricot Red",
    hue: 10,
    saturation: 80,
    lightness: 60,
    category: "red",
    tags: ["warm", "bright"],
    hex: "#E25822",
    rgb: { r: 226, g: 88, b: 34 }
  },
  {
    name: "Arsenal Red",
    hue: 0,
    saturation: 95,
    lightness: 45,
    category: "red",
    tags: ["vivid", "deep"],
    hex: "#DB0007",
    rgb: { r: 219, g: 0, b: 7 }
  },

  // Oranges
  {
    name: "Aesthetic Orange",
    hue: 30,
    saturation: 85,
    lightness: 60,
    category: "orange",
    tags: ["aesthetic", "vibrant"],
    hex: "#FF9F40",
    rgb: { r: 255, g: 159, b: 64 }
  },
  {
    name: "Amber Orange",
    hue: 35,
    saturation: 85,
    lightness: 65,
    category: "orange",
    tags: ["warm", "rich"],
    hex: "#FFBF00",
    rgb: { r: 255, g: 191, b: 0 }
  },
  {
    name: "Basket Ball Orange",
    hue: 24,
    saturation: 100,
    lightness: 58,
    category: "orange",
    tags: ["bright", "vibrant"],
    hex: "#FF7518",
    rgb: { r: 255, g: 117, b: 24 }
  },

  // Yellows
  {
    name: "Banana Yellow",
    hue: 50,
    saturation: 100,
    lightness: 70,
    category: "yellow",
    tags: ["bright", "warm"],
    hex: "#FFE135",
    rgb: { r: 255, g: 225, b: 53 }
  },
  {
    name: "Bee Yellow",
    hue: 52,
    saturation: 100,
    lightness: 60,
    category: "yellow",
    tags: ["vibrant", "vivid"],
    hex: "#FFD700",
    rgb: { r: 255, g: 215, b: 0 }
  },
  {
    name: "Butter Yellow",
    hue: 48,
    saturation: 85,
    lightness: 80,
    category: "yellow",
    tags: ["soft", "light"],
    hex: "#FFFACD",
    rgb: { r: 255, g: 250, b: 205 }
  },

  // Greens
  {
    name: "Aesthetic Green",
    hue: 120,
    saturation: 75,
    lightness: 45,
    category: "green",
    tags: ["aesthetic", "medium"],
    hex: "#4CAF50",
    rgb: { r: 76, g: 175, b: 80 }
  },
  {
    name: "Apple Green",
    hue: 100,
    saturation: 100,
    lightness: 50,
    category: "green",
    tags: ["bright", "fresh"],
    hex: "#8DB600",
    rgb: { r: 141, g: 182, b: 0 }
  },
  {
    name: "Avocado Green",
    hue: 83,
    saturation: 100,
    lightness: 35,
    category: "green",
    tags: ["natural", "dark"],
    hex: "#568203",
    rgb: { r: 86, g: 130, b: 3 }
  },

  // Blues
  {
    name: "Aesthetic Blue",
    hue: 210,
    saturation: 80,
    lightness: 55,
    category: "blue",
    tags: ["aesthetic", "medium"],
    hex: "#4169E1",
    rgb: { r: 65, g: 105, b: 225 }
  },
  {
    name: "Air Force Blue",
    hue: 205,
    saturation: 85,
    lightness: 50,
    category: "blue",
    tags: ["official", "medium"],
    hex: "#5D8AA8",
    rgb: { r: 93, g: 138, b: 168 }
  },
  {
    name: "Alice Blue",
    hue: 208,
    saturation: 100,
    lightness: 97,
    category: "blue",
    tags: ["light", "pastel"],
    hex: "#F0F8FF",
    rgb: { r: 240, g: 248, b: 255 }
  },

  // Purples
  {
    name: "Aesthetic Purple",
    hue: 270,
    saturation: 75,
    lightness: 50,
    category: "purple",
    tags: ["aesthetic", "medium"],
    hex: "#8A2BE2",
    rgb: { r: 138, g: 43, b: 226 }
  },
  {
    name: "Amethyst Purple",
    hue: 270,
    saturation: 50,
    lightness: 60,
    category: "purple",
    tags: ["gemstone", "medium"],
    hex: "#9966CC",
    rgb: { r: 153, g: 102, b: 204 }
  },
  {
    name: "Barney Purple",
    hue: 280,
    saturation: 100,
    lightness: 50,
    category: "purple",
    tags: ["vibrant", "bright"],
    hex: "#A020F0",
    rgb: { r: 160, g: 32, b: 240 }
  },

  // Pinks
  {
    name: "Aesthetic Pink",
    hue: 330,
    saturation: 80,
    lightness: 70,
    category: "pink",
    tags: ["aesthetic", "medium"],
    hex: "#FFB6C1",
    rgb: { r: 255, g: 182, b: 193 }
  },
  {
    name: "Barbie Pink",
    hue: 328,
    saturation: 100,
    lightness: 65,
    category: "pink",
    tags: ["bright", "vibrant"],
    hex: "#E0218A",
    rgb: { r: 224, g: 33, b: 138 }
  },
  {
    name: "Bashful Pink",
    hue: 345,
    saturation: 50,
    lightness: 85,
    category: "pink",
    tags: ["soft", "light"],
    hex: "#F4C2C2",
    rgb: { r: 244, g: 194, b: 194 }
  },

  // Browns
  {
    name: "Aesthetic Brown",
    hue: 25,
    saturation: 45,
    lightness: 35,
    category: "brown",
    tags: ["aesthetic", "medium"],
    hex: "#8B4513",
    rgb: { r: 139, g: 69, b: 19 }
  },
  {
    name: "Baiko Brown",
    hue: 30,
    saturation: 60,
    lightness: 30,
    category: "brown",
    tags: ["warm", "deep"],
    hex: "#7B3F00",
    rgb: { r: 123, g: 63, b: 0 }
  },
  {
    name: "Bark",
    hue: 20,
    saturation: 35,
    lightness: 25,
    category: "brown",
    tags: ["natural", "dark"],
    hex: "#5D4037",
    rgb: { r: 93, g: 64, b: 55 }
  },

  // Grays
  {
    name: "Battleship Grey",
    hue: 200,
    saturation: 5,
    lightness: 45,
    category: "gray",
    tags: ["medium", "cool"],
    hex: "#848482",
    rgb: { r: 132, g: 132, b: 130 }
  },

  // Blacks
  {
    name: "Aesthetic Black",
    hue: 0,
    saturation: 0,
    lightness: 5,
    category: "black",
    tags: ["aesthetic", "dark"],
    hex: "#0D0D0D",
    rgb: { r: 13, g: 13, b: 13 }
  },

  // Whites
  {
    name: "Aesthetic White",
    hue: 0,
    saturation: 5,
    lightness: 95,
    category: "white",
    tags: ["aesthetic", "light"],
    hex: "#F5F5F5",
    rgb: { r: 245, g: 245, b: 245 }
  },

  // Metallics
  {
    name: "Antique Gold",
    hue: 45,
    saturation: 80,
    lightness: 55,
    category: "metallic",
    tags: ["antique", "metallic"],
    hex: "#CFB53B",
    rgb: { r: 207, g: 181, b: 59 }
  }
];

// Export useful subsets
export const aestheticColors = colorDatabase.filter(
  color => color.tags.includes('aesthetic')
);

export const vintageColors = colorDatabase.filter(
  color => color.tags.includes('antique') || color.tags.includes('vintage')
);

export const vividColors = colorDatabase.filter(
  color => color.tags.includes('vivid') || color.tags.includes('vibrant')
);

// Helper function to get similar colors
export function findSimilarColors(color: ColorEntry, maxDistance: number = 30): ColorEntry[] {
  return colorDatabase.filter(c => {
    const hueDiff = Math.min(
      Math.abs(c.hue - color.hue),
      Math.abs(c.hue - color.hue + 360),
      Math.abs(c.hue - color.hue - 360)
    );
    const satDiff = Math.abs(c.saturation - color.saturation);
    const lightDiff = Math.abs(c.lightness - color.lightness);
    
    return hueDiff <= maxDistance && satDiff <= 20 && lightDiff <= 20;
  });
}

// Helper function to get complementary colors
export function findComplementaryColors(color: ColorEntry): ColorEntry[] {
  const complementaryHue = (color.hue + 180) % 360;
  return colorDatabase.filter(c => {
    const hueDiff = Math.min(
      Math.abs(c.hue - complementaryHue),
      Math.abs(c.hue - complementaryHue + 360),
      Math.abs(c.hue - complementaryHue - 360)
    );
    return hueDiff <= 30;
  });
}

// Export themed color collections
export const colorCollections = {
  nature: colorDatabase.filter(c => 
    c.tags.includes('natural') || ['green', 'brown', 'blue'].includes(c.category)
  ),
  sunset: colorDatabase.filter(c => 
    ['red', 'orange', 'pink'].includes(c.category) && c.saturation > 60
  ),
  ocean: colorDatabase.filter(c => 
    ['blue', 'green'].includes(c.category) && c.tags.includes('cool')
  ),
  forest: colorDatabase.filter(c => 
    ['green', 'brown'].includes(c.category) && c.tags.includes('natural')
  ),
  desert: colorDatabase.filter(c => 
    ['brown', 'orange', 'yellow'].includes(c.category) && c.tags.includes('warm')
  ),
  jewel: colorDatabase.filter(c => 
    c.saturation > 70 && c.lightness < 60 && ['red', 'blue', 'purple', 'green'].includes(c.category)
  ),
  pastel: colorDatabase.filter(c => 
    c.saturation < 50 && c.lightness > 70
  ),
  metallic: colorDatabase.filter(c => 
    c.tags.includes('metallic')
  )
};

// Export the database as the default export
export default colorDatabase; 