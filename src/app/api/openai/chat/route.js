import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req {
  const { messages } = await req.json();
  const result = await streamText({
    model: openai("gpt-4o"),
    messages system });

  return result.toDataStreamResponse();
}
