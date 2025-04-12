# Color Register Library

This library integrates with the [Official Register of Color Names](https://color-register.org/), allowing you to use over 6,000 named colors with their actual hex and RGB values in your application.

## Features

- Access to 6,000+ named colors from the Official Register of Color Names
- Complete color information including:
  - Hex values
  - RGB values
  - HSL values
  - Categories (red, blue, green, etc.)
  - Tags (vintage, vibrant, etc.)
- Tools for finding similar colors, complementary colors, and more
- Color palettes and collections (warm, cool, natural, etc.)
- Search and filter capabilities

## Quick Start

Visit the `/colors` page in your application to browse the sample color database. This includes around 30 representative colors with their values to demonstrate the structure.

## Getting All 6,000+ Colors

To get all colors from the Official Register of Color Names, follow these steps:

1. **Run the scraper script** to download all color data:
   ```bash
   node src/scripts/scrapeAllColors.js
   ```

2. **Wait for the script to complete**. This can take several hours as it:
   - Fetches the list of all color names from the index page
   - For each color, makes a separate request to get its hex value
   - Respects rate limits to avoid overloading the website

3. **Check the output** at `src/lib/utils/colorData.json`. This will be a JSON file containing all colors with their values.

4. **Integrate the data** by updating `populateColorDatabase.ts` to import the generated `colorData.json` file.

## Using the Color Library

```typescript
// Import the full color database
import colorDatabase from '@/lib/utils/populateColorDatabase';

// Find a specific color by name
const color = colorDatabase.find(c => c.name === "Azure");

// Get all colors in a category
const blueColors = colorDatabase.filter(c => c.category === "blue");

// Find similar colors
import { findSimilarColors } from '@/lib/utils/populateColorDatabase';
const similarColors = findSimilarColors(myColor);

// Generate a thematic palette
import { generateThematicPalette } from '@/lib/utils/colorDatabase';
const warmPalette = generateThematicPalette('warm', 5);
```

## Structure

The color library consists of the following key files:

- `src/lib/utils/colorDatabase.ts` - Main database structure and utility functions
- `src/lib/utils/populateColorDatabase.ts` - Actual color entries and collections
- `src/lib/utils/colorParser.ts` - Utilities for parsing color data
- `src/scripts/scrapeAllColors.js` - Script to scrape all 6,000+ colors
- `src/lib/utils/importColorData.ts` - Utilities for importing the scraped color data

## Performance Considerations

Loading 6,000+ colors at once can impact performance. Consider:

1. **Lazy Loading**: Load color data only when needed
2. **Pagination**: Display colors in smaller batches
3. **Server-side Processing**: Filter and sort colors on the server
4. **Code Splitting**: Split the color data into multiple files by category or letter

## Licensing and Attribution

When using this color data, please respect the copyright of the Official Register of Color Names. Consider adding attribution to your application like:

```
Color names from the Official Register of Color Names (https://color-register.org/)
``` 