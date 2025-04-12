import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Add type declaration for heic-convert
declare module 'heic-convert' {
  export default function(options: {
    buffer: Buffer;
    format: 'JPEG' | 'PNG';
    quality?: number;
  }): Promise<Buffer>;
}

// Dynamic import for heic-convert (since it uses node:worker_threads)
let heicConvert: any = null;

// Simple in-memory cache for converted images
interface CacheEntry {
  data: string;
  timestamp: number;
}

const imageCache = new Map<string, CacheEntry>();
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB max file size

// Function to initialize heicConvert once
async function getHeicConverter() {
  if (!heicConvert) {
    const module = await import('heic-convert');
    heicConvert = module.default;
  }
  return heicConvert;
}

export async function POST(request: NextRequest) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }
    
    // Check if it's a HEIC file
    const isHeicFile = file.type === 'image/heic' || 
                       file.name.toLowerCase().endsWith('.heic') || 
                       file.type === 'image/heif' || 
                       file.name.toLowerCase().endsWith('.heif');
                       
    if (!isHeicFile) {
      return NextResponse.json(
        { error: 'Not a HEIC/HEIF file' },
        { status: 400 }
      );
    }
    
    // Convert the file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    if (buffer.length === 0) {
      console.error('Received empty buffer');
      return NextResponse.json(
        { error: 'File buffer is empty' },
        { status: 400 }
      );
    }
    
    // Generate a hash of the file to use as a cache key
    const fileHash = crypto.createHash('md5').update(buffer.toString('binary')).digest('hex');
    
    // Check if we have this image in cache
    if (imageCache.has(fileHash)) {
      const cached = imageCache.get(fileHash)!;
      
      // Check if cache entry is still valid
      if (Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
        console.log(`Cache hit for file: ${file.name}`);
        
        const response = NextResponse.json({ 
          success: true, 
          data: cached.data,
          originalFormat: 'heic',
          fromCache: true
        });
        
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
        buffer: buffer,
        format: 'JPEG', 
        quality: 0.85 // Balanced quality - good for colors but faster
      });
      
      if (!outputBuffer || outputBuffer.length === 0) {
        console.error('Conversion produced empty buffer');
        return NextResponse.json(
          { error: 'Conversion failed - no output generated' },
          { status: 500 }
        );
      }
      
      console.log(`Conversion successful. Output size: ${outputBuffer.length} bytes`);
      
      // Return the converted image as base64 with proper MIME type
      const base64 = `data:image/jpeg;base64,${outputBuffer.toString('base64')}`;
      
      // Verify the base64 is valid and not too short
      if (base64.length < 100) {
        console.error('Generated base64 data is too short:', base64);
        return NextResponse.json(
          { error: 'Conversion produced invalid data' },
          { status: 500 }
        );
      }
      
      // Store in cache
      imageCache.set(fileHash, {
        data: base64,
        timestamp: Date.now()
      });
      
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
        success: true, 
        data: base64,
        originalFormat: 'heic',
        size: outputBuffer.length
      });
      
      // Set CORS headers
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      
      return response;
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      
      // Try a fallback conversion with lower quality
      try {
        console.log('Attempting fallback conversion with lower quality...');
        const converter = await getHeicConverter();
        const fallbackBuffer = await converter({
          buffer: buffer,
          format: 'JPEG',
          quality: 0.6 // Even lower quality for fallback
        });
        
        const fallbackBase64 = `data:image/jpeg;base64,${fallbackBuffer.toString('base64')}`;
        
        const fallbackResponse = NextResponse.json({ 
          success: true, 
          data: fallbackBase64,
          originalFormat: 'heic',
          fallback: true
        });
        
        // Set CORS headers for fallback response too
        fallbackResponse.headers.set('Access-Control-Allow-Origin', '*');
        fallbackResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        fallbackResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type');
        
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('Fallback conversion also failed:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to convert HEIC image after multiple attempts' },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error('Server error processing HEIC file:', error);
    return NextResponse.json(
      { error: 'Server error processing image' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS preflight requests
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
} 