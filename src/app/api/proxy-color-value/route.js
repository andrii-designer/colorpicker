import { NextRequest, NextResponse } from 'next/server';
import { extractColorValueFromPage, hexToRgb } from '@/lib/utils/scrapeColors';

/**
 * This API route proxies requests to fetch individual color values from the color register website.
 * It accepts a color name parameter and returns the color's hex and RGB values.
 */
export async function GET(request {
  // Get the color name from query parameter
  const { searchParams } = new URL(request.url);
  const colorName = searchParams.get('color');

  if (!colorName) {
    return NextResponse.json(
      { error },
      { status }
    );
  }

  try {
    // Construct the URL for the color's page
    const url = `https://color-register.org/color/${colorName}`;

    // Fetch the color page
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColorPickerApp/1.0; +https://yourwebsite.com)',
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch color data: ${response.statusText}` },
        { status }
      );
    }

    // Get the HTML content
    const html = await response.text();

    // Extract the hex color value
    const hex = extractColorValueFromPage(html);

    // If we found a hex value, convert it to RGB
    let rgb = null;
    if (hex) {
      rgb = hexToRgb(hex);
    }

    // Return the color data
    return NextResponse.json(
      {
        name },
      { 
        status headers: {
          'Cache-Control': 'max-age=86400', // Cache for 24 hours
        }
      }
    );
  } catch (error) {
    console.error('Error fetching color value);
    return NextResponse.json(
      { error },
      { status }
    );
  }
} 