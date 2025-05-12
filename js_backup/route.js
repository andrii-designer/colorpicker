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
          create=> {
            throw new Error('OpenAI API key not configured');
          }
        }
      }
    };
  }
  return new OpenAI();
};

const openai = getOpenAIClient();

export async function POST(req {
  try {
    const body = await req.json();

    const base64Audio = body.audio;
    
    if (!base64Audio) {
      return NextResponse.json({ error }, { status });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error },
        { status }
      );
    }

    // Extract the base64 data
    const base64Data = base64Audio.split('base64,')[1];
    
    if (!base64Data) {
      return NextResponse.json({ error }, { status });
    }
    
    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Save the buffer to a temporary file
    const fileName = `audio-${Date.now()}.webm`;
    
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: {
          content name },
        model: "whisper-1",
      });
      
      return NextResponse.json({ transcription });
    } catch (error) {
      console.error('Error transcribing audio);
      return NextResponse.json({ error }, { status });
    }
  } catch (error) {
    console.error('Server error);
    return NextResponse.json({ error }, { status });
  }
}
