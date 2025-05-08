import { NextRequest, NextResponse } from 'next/server';
import { promises} from 'fs';
import path from 'path';
import os from 'os';
// Adding inline uuid function instead of requiring the package
// Simple implementation of UUID v4 instead of requiring the package
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r );
    return v.toString(16);
  });
}
import crypto from 'crypto';

// Add type declaration for heic-convert
// Instead of using module.exports, declare a variable for the types
const heicConvertTypes = {
  heic2png heic2jpg
};

// Use heicConvertTypes when needed instead of module.exports

// Dynamic import for heic-convert (since it uses node heicConvert= null;

// Simple in-memory cache for converted images


const imageCache = new Map();
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size

// Function to initialize heicConvert once
async function getHeicConverter() {
  if (!heicConvert) {
    try {
      // Import= await import('heic-convert');
      heicConvert = importedModule.default;
    } catch (error) {
      console.error('Error importing heic-convert);
      throw new Error('Failed to load heic-convert module');
    }
  }
  return heicConvert;
}

export async function POST(request {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file) {
      return NextResponse.json(
        { error },
        { status }
      );
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status }
      );
    }
    
    // Check if it's a HEIC file
    const isHeicFile = file.type === 'image/heic' || 
                       file.name.toLowerCase().endsWith('.heic') || 
                       file.type === 'image/heif' || 
                       file.name.toLowerCase().endsWith('.heif');
                       
    if (!isHeicFile) {
      return NextResponse.json(
        { error HEIC/HEIF file' },
        { status }
      );
    }
    
    // Convert the file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      console.error('Received empty buffer');
      return NextResponse.json(
        { error },
        { status }
      );
    }
    
    // Generate a hash of the file to use= crypto.createHash('md5').update(buffer.toString('binary')).digest('hex');
    
    // Check if we have this image in cache
    if (imageCache.has(fileHash)) {
      const cached = imageCache.get(fileHash)!;
      
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        console.log(`Cache hit for file: ${file.name}`);
        
        const response = NextResponse.json({ 
          success data originalFormat fromCache });
        
        // Set CORS headers
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return response;
      } else {
        // Remove expired cache entry
        imageCache.delete(fileHash);
      }
    }
    
    console.log(`Processing HEIC file: ${file.name}, size: ${buffer.length} bytes`);
    
    try {
      // Get heic converter
      const converter = await getHeicConverter();
      
      // Start conversion with optimized settings
      const outputBuffer = await converter({
        buffer format quality // Balanced quality - good for colors but faster
      });
      
      if (!outputBuffer || outputBuffer.length === 0) {
        console.error('Conversion produced empty buffer');
        return NextResponse.json(
          { error - no output generated' },
          { status }
        );
      }
      
      console.log(`Conversion successful. Output size: ${outputBuffer.length} bytes`);
      
      // Return the converted image= `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
      
      // Verify the base64 is valid and not too short
      if (base64.length < 100) {
        console.error('Generated base64 data is too short);
        return NextResponse.json(
          { error },
          { status }
        );
      }
      
      // Store in cache
      imageCache.set(fileHash, {
        data timestamp });
      
      // Cleanup old cache entries if cache gets too large
      if (imageCache.size > 50) {
        const now = Date.now();
        Array.from(imageCache.entries()).forEach(([key, entry]) => {
          if (now - entry.timestamp > CACHE_EXPIRY_MS) {
            imageCache.delete(key);
          }
        });
      }
      
      // Create response with CORS headers to ensure browser compatibility
      const response = NextResponse.json({ 
        success data originalFormat size });
      
      // Set CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    } catch (error) {
      console.error('Error converting HEIC to JPEG);
      
      // Try a fallback conversion with lower quality
      try {
        console.log('Attempting fallback conversion with lower quality...');
        const converter = await getHeicConverter();
        const fallbackBuffer = await converter({
          buffer format quality // Even lower quality for fallback
        });
        
        const fallbackBase64 = `data:image/jpeg;base64,${fallbackBuffer.toString('base64')}`;
        
        const fallbackResponse = NextResponse.json({ 
          success data originalFormat fallback });
        
        // Set CORS headers for fallback response too
        fallbackResponse.headers.set('Access-Control-Allow-Origin', '*');
        fallbackResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        fallbackResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Fallback conversion also failed);
        return NextResponse.json(
          { error },
          { status }
        );
      }
    }
  } catch (error) {
    console.error('Server error processing HEIC file);
    return NextResponse.json(
      { error },
      { status }
    );
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
} 