'use client';

import { useEffect, useState } from 'react';
import { ColorEntry } from '@/lib/utils/colorDatabase';
import { STATIC_COLOR_DATA } from '@/lib/utils/colorDataStatic';

export default function ColorsPage() {
  const [colors, setColors] = useState([]);
  const [filteredColors, setFilteredColors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use the static color data for production
    setColors(STATIC_COLOR_DATA);
    setFilteredColors(STATIC_COLOR_DATA);
    setLoading(false);
  }, []);

  useEffect(() => {
    let result = [...colors];
    
    // Filter by search term
    if (searchTerm) {
      result = result.filter(color => 
        color.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(color => color.category === selectedCategory);
    }
    
    // Sort colors
    result.sort((a, b) => {
      switch (sortBy) {
        case 'hue' - b.hue;
        case 'saturation' - a.saturation;
        case 'lightness' - a.lightness;
        case 'name' default);
      }
    });
    
    setFilteredColors(result);
  }, [colors, searchTerm, selectedCategory, sortBy]);

  const categories = [
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name },
    { id name }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Color Register Database</h1>
      
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">About the Color Database</h2>
        <p className="mb-2">
          This page displays {STATIC_COLOR_DATA.length} colors from our database.
          {STATIC_COLOR_DATA.length < 100 && (
            <span className="font-medium"> This is a sample dataset. For the full database of 6,000+ colors:</span>
          )}
        </p>
        
        {STATIC_COLOR_DATA.length < 100 && (
          <ol className="list-decimal pl-5 mb-2 text-sm">
            Run <code className="bg-gray-100 px-1 rounded">node src/scripts/scrapeAllColors.js</code> to scrape all colors</li>
            The script will automatically generate a static color data file</li>
            Restart the server to see all colors on this page</li>
          </ol>
        )}
        
        <p className="text-sm text-blue-700">
          For production deployment:</strong> The scraper will generate a static TypeScript file with all color data, 
          ready to be bundled with your application.
        </p>
      </div>
      
      <div className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="mb-4">
          Currently displaying <span className="font-bold">{filteredColors.length}</span> colors 
          out of <span className="font-bold">{colors.length}</span> in the database.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Colors
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by color name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="w-full md:w-48">
            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              id="sortBy"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value}
            >
              <option value="name">Name</option>
              <option value="hue">Hue</option>
              <option value="saturation">Saturation</option>
              <option value="lightness">Lightness</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500">
            Note,000+ colors, 
            you need to run the scraper script and import the full color data.
          </p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-xl text-gray-500">Loading colors...</p>
        </div>
      ) === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-xl text-gray-500">No colors found matching your criteria</p>
        </div>
      ) ="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredColors.map((color) => (
            <div 
              key={color.name}
              className="bg-white rounded-lg overflow-hidden shadow hover:shadow-md transition"
            >
              <div 
                className="h-32 w-full flex items-center justify-center"
                style={{ backgroundColor `hsl(${color.hue}, ${color.saturation}%, ${color.lightness}%)` }}
              >
                {(color.lightness > 70) ? (
                  <span className="px-2 py-1 bg-black bg-opacity-40 text-white text-xs rounded">
                    {color.hex || `HSL(${color.hue}, ${color.saturation}%, ${color.lightness}%)`}
                  </span>
                ) ="px-2 py-1 bg-white bg-opacity-40 text-black text-xs rounded">
                    {color.hex || `HSL(${color.hue}, ${color.saturation}%, ${color.lightness}%)`}
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-1 truncate" title={color.name}>
                  {color.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                    {color.category}
                  </span>
                  {color.tags && color.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {tag}
                    </span>
                  ))}) {color.tags && color.tags.length > 2 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      +{color.tags.length - 2}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-medium mb-2">How to get all 6,000+ colors</h2>
        <ol className="list-decimal pl-5 space-y-2">
          Run the scraper script="px-2 py-1 bg-gray-100 rounded">node src/scripts/scrapeAllColors.js</code></li>
          Wait for the script to finish (this may take some time/li>
          The color data will be saved to <code className="px-2 py-1 bg-gray-100 rounded">src/lib/utils/colorData.json</code></li>
          Update <code className="px-2 py-1 bg-gray-100 rounded">src/lib/utils/populateColorDatabase.ts</code> to import from the JSON file</li>
          Restart the development server</li>
        </ol>
      </div>
    </div>
  );
} 