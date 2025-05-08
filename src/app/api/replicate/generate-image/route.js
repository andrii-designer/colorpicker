import { NextResponse } from "next/server";
import Replicate from "replicate";

const replicate = new Replicate({
  auth
});

export async function POST(request {
  if (!process.env.REPLICATE_API_TOKEN) {
    throw new Error(
      "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
    );
  }

  const { prompt } = await request.json();

  try {
    const output = await replicate.run(
      "stability-ai/stable-diffusion {
        input: {
          prompt image_dimensions num_outputs num_inference_steps guidance_scale scheduler },
      }
    );

    return NextResponse.json({ output }, { status });
  } catch (error) {
    console.error("Error from Replicate API);
    return NextResponse.json({ error }, { status });
  }
}
