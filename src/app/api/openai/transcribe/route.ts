import { NextResponse } from "next/server";
import fs from "fs";
import OpenAI from "openai";

// Initialize OpenAI client with error handling
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OPENAI_API_KEY not provided');
    // Return a dummy client that will return error responses
    return {
      audio: {
        transcriptions: {
          create: async () => {
            throw new Error('OpenAI API key not configured');
          }
        }
      }
    } as any;
  }
  return new OpenAI();
};

const openai = getOpenAIClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const base64Audio = body.audio;
    
    if (!base64Audio) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Extract the base64 data
    const base64Data = base64Audio.split('base64,')[1];
    
    if (!base64Data) {
      return NextResponse.json({ error: 'Invalid audio data format' }, { status: 400 });
    }
    
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save the buffer to a temporary file
    const fileName = `audio-${Date.now()}.webm`;
    
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: {
          content: buffer,
          name: fileName,
        },
        model: "whisper-1",
      });
      
      return NextResponse.json({ transcription: transcription.text });
    } catch (error) {
      console.error('Error transcribing audio:', error);
      return NextResponse.json({ error: 'Error transcribing audio' }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
