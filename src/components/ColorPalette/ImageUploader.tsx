'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageSelect: (imageData: string) => void;
}

export default function ImageUploader({ onImageSelect }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processHeicFile = async (file: File): Promise<string> => {
    // Create a FormData object
    const formData = new FormData();
    formData.append('file', file);
    
    // Call our API endpoint
    const response = await fetch('/api/heic-convert', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to convert HEIC image');
    }
    
    const result = await response.json();
    
    // Validate that we actually received a valid data URL
    if (!result.data || typeof result.data !== 'string' || !result.data.startsWith('data:image/')) {
      console.error('Invalid image data received from server:', result);
      throw new Error('The server returned invalid image data');
    }
    
    return result.data;
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setCurrentFile(file);
    
    try {
      // Check if it's a HEIC/HEIF file
      const isHeicFile = file.type === 'image/heic' || 
                         file.name.toLowerCase().endsWith('.heic') || 
                         file.type === 'image/heif' || 
                         file.name.toLowerCase().endsWith('.heif');
      
      let imageData: string;
      
      if (isHeicFile) {
        console.log('Processing HEIC file:', file.name, file.size);
        // Process HEIC file using server-side conversion
        imageData = await processHeicFile(file);
        console.log('HEIC conversion completed, data length:', imageData.length);
        
        // Force a small delay to ensure browser can process the image
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Preload the image to ensure it's valid before setting it
        const preloadImg = new Image();
        const preloadPromise = new Promise<void>((resolve, reject) => {
          preloadImg.onload = () => {
            console.log('HEIC image preloaded successfully, dimensions:', preloadImg.width, 'x', preloadImg.height);
            if (preloadImg.width === 0 || preloadImg.height === 0) {
              reject(new Error('The converted image has invalid dimensions'));
            } else {
              resolve();
            }
          };
          preloadImg.onerror = (e) => {
            console.error('HEIC image preload failed:', e);
            reject(new Error('Failed to load the converted image'));
          };
          // Remove any query parameters that might cause issues
          const cleanImageData = imageData.split('?')[0];
          preloadImg.src = cleanImageData;
        });
        
        try {
          await preloadPromise;
          console.log('HEIC conversion successful - image preloaded correctly');
          
          // Use the clean version of the image data without query parameters
          imageData = imageData.split('?')[0];
        } catch (preloadError) {
          console.error('HEIC image preload failed:', preloadError);
          throw new Error('The converted image failed to load. Please try another image or format.');
        }
      } else {
        // Process regular image file
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onloadend = () => {
            const result = reader.result as string;
            console.log('Regular image loaded, data length:', result.length);
            resolve(result);
          };
          reader.onerror = () => reject(new Error('Failed to read the image file.'));
          reader.readAsDataURL(file);
        });
      }
      
      // Set preview and pass data to parent
      setPreview(imageData);
      onImageSelect(imageData);
    } catch (error) {
      console.error('Image processing error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error processing image');
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Validate file size before processing
      if (file.size > 30 * 1024 * 1024) { // 30MB limit
        setError('File is too large. Please use an image under 30MB.');
        return;
      }
      
      // For HEIC files, warn about potential issues with very large files
      if ((file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) && file.size > 10 * 1024 * 1024) {
        console.warn('Large HEIC file detected. Conversion might take longer.');
      }
      
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.heic', '.heif'] // Re-added HEIC/HEIF support
    },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`cursor-pointer ${
        isDragActive ? 'bg-blue-50 border-blue-300' : ''
      }`}
    >
      <input {...getInputProps()} />
      <div className="relative">
        {isProcessing && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-10 rounded-lg">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-blue-600">Processing image...</p>
            {currentFile && (currentFile.type === 'image/heic' || currentFile.name.toLowerCase().endsWith('.heic')) && (
              <p className="text-xs text-blue-400 mt-1">HEIC conversion in progress...</p>
            )}
          </div>
        )}
        
        {error && (
          <div className="text-center p-4 bg-red-50 text-red-600 rounded-lg mb-4">
            {error}
            {error.includes('HEIC') && (
              <div className="mt-2 text-sm">
                <p>Try these alternatives:</p>
                <ul className="list-disc list-inside text-xs mt-1">
                  <li>Use a smaller HEIC file</li>
                  <li>Convert to JPEG with your device&apos;s photo app first</li>
                  <li>Try a PNG or JPG image instead</li>
                </ul>
              </div>
            )}
          </div>
        )}
        
        {preview ? (
          <div className="relative w-full aspect-video">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
              onError={(e) => {
                console.error('Image failed to load in preview');
                setError('The image failed to display. Please try another format.');
                setPreview(null);
              }}
              loading="eager"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              style={{ background: '#f0f0f0' }} // Light background to make white square more visible
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
              <p className="text-white">Click or drag to change image</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-8">
            <div className="text-4xl mb-4">📸</div>
            <p className="text-gray-600">
              {isDragActive
                ? "Drop the image here..."
                : "Drag 'n' drop an image here, or click to select"}
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Supports PNG, JPG, GIF, and HEIC formats
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
