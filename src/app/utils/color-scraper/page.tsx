'use client';

import { useState, useEffect } from 'react';
import { 
  scrapeColorRegister, 
  formatColorDatabase,
  generateColorEntry,
  type ColorData
} from '@/lib/utils/scrapeColors';

export default function ColorScraper() {
  const [isClient, setIsClient] = useState(false);
  const [colorData, setColorData] = useState<ColorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapingProgress, setScrapingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  const [scrapingMethod, setScrapingMethod] = useState<'names-only' | 'with-values'>('names-only');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleScrapeClick = async () => {
    setIsLoading(true);
    setError(null);
    setScrapingProgress(0);
    
    try {
      // Use fetch to get the HTML content from the color register website
      const response = await fetch('/api/proxy-color-register');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      
      const html = await response.text();
      
      // Scrape color names using our utility
      const colors = scrapeColorRegister(html);
      setColorData(colors);
      
      if (scrapingMethod === 'with-values') {
        // If we want values, we need to scrape each color page
        setScrapingProgress(1);
        await scrapeColorValues(colors);
      }
      
      // Format the data for our database
      const formattedData = formatDatabaseEntries(colors);
      setFormattedOutput(formattedData);
      
    } catch (err) {
      console.error(err);
      setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      setScrapingProgress(100);
    }
  };

  const scrapeColorValues = async (colors: ColorData[]) => {
    // For this demo, we&apos;ll limit to the first 10 colors
    // In a real implementation, you&apos;d want to do this server-side
    const maxColors = 10;
    const colorsToScrape = colors.slice(0, maxColors);
    
    setScrapingProgress(5);
    
    for (let i = 0; i < colorsToScrape.length; i++) {
      const color = colorsToScrape[i];
      try {
        // Get the color&apos;s page URL
        const colorName = color.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const url = `/api/proxy-color-value?color=${encodeURIComponent(colorName)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Failed to fetch color data for ${color.name}`);
          continue;
        }
        
        const data = await response.json();
        if (data.hex) {
          color.hex = data.hex;
          if (data.rgb) {
            color.rgb = data.rgb;
          }
        }
      } catch (err) {
        console.warn(`Error fetching color data for ${color.name}:`, err);
      }
      
      // Update progress
      setScrapingProgress(5 + Math.floor((i + 1) / colorsToScrape.length * 95));
    }
    
    // Update the state with the new data
    setColorData([...colors]);
  };

  const formatDatabaseEntries = (colors: ColorData[]): string => {
    // Generate properly formatted database entries
    let output = "// Color database generated from the Official Register of Color Names\n";
    output += "// Source: https://color-register.org/\n\n";
    output += "import type { ColorEntry } from './colorDatabase';\n\n";
    output += "export const colorDatabase: ColorEntry[] = [\n";
    
    colors.forEach((color, index) => {
      const entry = generateColorEntry(color);
      output += `  {\n`;
      output += `    name: "${entry.name}",\n`;
      output += `    hue: ${entry.hue},\n`;
      output += `    saturation: ${entry.saturation},\n`;
      output += `    lightness: ${entry.lightness},\n`;
      output += `    category: "${entry.category}",\n`;
      output += `    tags: [${entry.tags.map((t: string) => `"${t}"`).join(', ')}],\n`;
      if (entry.hex) {
        output += `    hex: "${entry.hex}",\n`;
      }
      if (entry.rgb) {
        output += `    rgb: { r: ${entry.rgb.r}, g: ${entry.rgb.g}, b: ${entry.rgb.b} },\n`;
      }
      output += `  }${index < colors.length - 1 ? ',' : ''}\n`;
    });
    
    output += "];\n\n";
    output += "export default colorDatabase;";
    
    return output;
  };

  const handleCopyClick = () => {
    if (isClient && formattedOutput) {
      navigator.clipboard.writeText(formattedOutput)
        .then(() => {
          alert('Formatted color database copied to clipboard!');
        })
        .catch(err => {
          console.error('Failed to copy text:', err);
          alert('Failed to copy. Please select and copy manually.');
        });
    }
  };

  if (!isClient) {
    return null; // Prevent rendering during SSR
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-4 text-gray-800">Color Register Scraper</h1>
        <p className="mb-4 text-gray-600">
          This utility scrapes all color names and their values from the official color register website and formats them
          for use in our application&apos;s color database.
        </p>
        
        <div className="mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Scraping Method</h2>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="names-only"
                  checked={scrapingMethod === 'names-only'}
                  onChange={() => setScrapingMethod('names-only')}
                  className="mr-2"
                />
                <span>Names Only (Fast)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="with-values"
                  checked={scrapingMethod === 'with-values'}
                  onChange={() => setScrapingMethod('with-values')}
                  className="mr-2"
                />
                <span>With Color Values (Slow, Demo Limited to 10 Colors)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Note: For a full scrape with values, it&apos;s better to use a server-side script.
            </p>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleScrapeClick}
              disabled={isLoading}
              className={`px-6 py-2 rounded-md text-white font-medium 
                ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} 
                transition-colors`}
            >
              {isLoading ? 'Scraping...' : 'Scrape Colors'}
            </button>
            
            <button
              onClick={handleCopyClick}
              disabled={!formattedOutput || isLoading}
              className={`px-6 py-2 rounded-md text-white font-medium 
                ${!formattedOutput || isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} 
                transition-colors`}
            >
              Copy Formatted Database
            </button>
          </div>
        </div>
        
        {isLoading && scrapingMethod === 'with-values' && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${scrapingProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Scraping progress: {scrapingProgress}% (This can take a while)
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {colorData.length > 0 && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-800">
              Found {colorData.length} colors
            </h2>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md h-48 overflow-y-auto">
              <ul className="grid grid-cols-3 gap-2">
                {colorData.slice(0, 100).map((color, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-center">
                    {color.hex && (
                      <span 
                        className="inline-block w-4 h-4 mr-2 rounded-full border border-gray-300" 
                        style={{ backgroundColor: color.hex }}
                      ></span>
                    )}
                    {color.name}
                  </li>
                ))}
                {colorData.length > 100 && (
                  <li className="text-sm text-gray-500">... and {colorData.length - 100} more</li>
                )}
              </ul>
            </div>
          </div>
        )}
        
        {formattedOutput && (
          <div>
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Formatted Database</h2>
            <p className="mb-2 text-sm text-gray-600">
              Copy and paste this into your color database file:
            </p>
            <div className="border border-gray-200 rounded-md bg-gray-50 p-4">
              <pre className="text-xs text-gray-700 overflow-x-auto h-64 overflow-y-auto">
                {formattedOutput}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 