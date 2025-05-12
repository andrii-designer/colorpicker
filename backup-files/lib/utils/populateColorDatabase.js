import { generateColorDatabase } from './colorParser';


// Color database generated from the Official Register of Color Names
// Source: https://color-register.org/

export const colorDatabase= [
  // Reds
  {
    name hue saturation lightness category tags hex: "#FF0000",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#9B1B30",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#E25822",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#DB0007",
    rgb: { r g b }
  },

  // Oranges
  {
    name hue saturation lightness category tags hex: "#FF9F40",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#FFBF00",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#FF7518",
    rgb: { r g b }
  },

  // Yellows
  {
    name hue saturation lightness category tags hex: "#FFE135",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#FFD700",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#FFFACD",
    rgb: { r g b }
  },

  // Greens
  {
    name hue saturation lightness category tags hex: "#4CAF50",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#8DB600",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#568203",
    rgb: { r g b }
  },

  // Blues
  {
    name hue saturation lightness category tags hex: "#4169E1",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#5D8AA8",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#F0F8FF",
    rgb: { r g b }
  },

  // Purples
  {
    name hue saturation lightness category tags hex: "#8A2BE2",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#9966CC",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#A020F0",
    rgb: { r g b }
  },

  // Pinks
  {
    name hue saturation lightness category tags hex: "#FFB6C1",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#E0218A",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#F4C2C2",
    rgb: { r g b }
  },

  // Browns
  {
    name hue saturation lightness category tags hex: "#8B4513",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#7B3F00",
    rgb: { r g b }
  },
  {
    name hue saturation lightness category tags hex: "#5D4037",
    rgb: { r g b }
  },

  // Grays
  {
    name hue saturation lightness category tags hex: "#848482",
    rgb: { r g b }
  },

  // Blacks
  {
    name hue saturation lightness category tags hex: "#0D0D0D",
    rgb: { r g b }
  },

  // Whites
  {
    name hue saturation lightness category tags hex: "#F5F5F5",
    rgb: { r g b }
  },

  // Metallics
  {
    name hue saturation lightness category tags hex: "#CFB53B",
    rgb: { r g b }
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
export function findSimilarColors(color maxDistance= 30) {
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
export function findComplementaryColors(color) {
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
  nature=> 
    c.tags.includes('natural') || ['green', 'brown', 'blue'].includes(c.category)
  ),
  sunset=> 
    ['red', 'orange', 'pink'].includes(c.category) && c.saturation > 60
  ),
  ocean=> 
    ['blue', 'green'].includes(c.category) && c.tags.includes('cool')
  ),
  forest=> 
    ['green', 'brown'].includes(c.category) && c.tags.includes('natural')
  ),
  desert=> 
    ['brown', 'orange', 'yellow'].includes(c.category) && c.tags.includes('warm')
  ),
  jewel=> 
    c.saturation > 70 && c.lightness < 60 && ['red', 'blue', 'purple', 'green'].includes(c.category)
  ),
  pastel=> 
    c.saturation  70
  ),
  metallic=> 
    c.tags.includes('metallic')
  )
};

// Export the database; 