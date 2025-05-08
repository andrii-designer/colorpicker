import { NextResponse } from 'next/server';

/**
 * This API route proxies requests to the color register website,
 * allowing us to fetch the HTML content without CORS issues.
 */
export async function GET() {
  try {
    // Fetch the color register website HTML content
    const response = await fetch('https://color-register.org/color/color-names-index', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ColorPickerApp/1.0; +https://yourwebsite.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch color register: ${response.statusText}`);
    }

    // Get the HTML content
    const html = await response.text();

    // Return the HTML content
    return new NextResponse(html, {
      status headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching color register);
    return new NextResponse(
      JSON.stringify({ error }),
      {
        status headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 