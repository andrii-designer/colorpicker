// Collection of varied responses for Bobby based on color palette scores

interface ResponseTemplate {
  message: string;  // Short message/title
  advice: string;   // Longer feedback text
}

// Score 9.0-10.0: Exceptional palette (5 variations)
export const exceptionalResponses: ResponseTemplate[] = [
  {
    message: "Exceptional palette",
    advice: "Stunning palette! The colors are perfectly balanced and harmonious. Nothing to improve. [COMPONENT_ADVICE]"
  },
  {
    message: "Masterful palette",
    advice: "A masterful choice of colors! Every hue complements the others beautifully. [COMPONENT_ADVICE]"
  },
  {
    message: "Outstanding palette",
    advice: "Exceptional palette! Perfect balance, contrast, and harmony. [COMPONENT_ADVICE]"
  },
  {
    message: "Near-perfect palette",
    advice: "This is a near-perfect palette. A fantastic choice of hues and perfect contrast. [COMPONENT_ADVICE]"
  },
  {
    message: "Flawless harmony",
    advice: "An outstanding palette with flawless harmony. A perfect example of color balance. [COMPONENT_ADVICE]"
  }
];

// Score 8.0-8.9: Excellent palette (5 variations)
export const excellentResponses: ResponseTemplate[] = [
  {
    message: "Beautiful palette",
    advice: "A beautiful and balanced palette. For a perfect score, try a slight tweak in lightness or saturation. [COMPONENT_ADVICE]"
  },
  {
    message: "Great harmony",
    advice: "Great harmony, but you could enhance contrast slightly to make it even better. [COMPONENT_ADVICE]"
  },
  {
    message: "Excellent palette",
    advice: "Excellent palette! Try experimenting with a more vibrant accent color for variety. [COMPONENT_ADVICE]"
  },
  {
    message: "Beautiful combination",
    advice: "The colors work beautifully together. You could explore a slightly more muted version for a softer look. [COMPONENT_ADVICE]"
  },
  {
    message: "Very pleasing palette",
    advice: "Very pleasing to the eye. Consider making the darkest or lightest color a bit more distinct. [COMPONENT_ADVICE]"
  }
];

// Score 7.0-7.9: Very good palette (5 variations)
export const veryGoodResponses: ResponseTemplate[] = [
  {
    message: "Strong palette",
    advice: "A solid palette with good contrast, but consider fine-tuning the hues for even better harmony. [COMPONENT_ADVICE]"
  },
  {
    message: "Good use of tones",
    advice: "Good use of tones, but a slight adjustment in saturation could enhance the overall look. [COMPONENT_ADVICE]"
  },
  {
    message: "Well-chosen colors",
    advice: "The colors are generally well-chosen, but one feels slightly off. Try tweaking it for better balance. [COMPONENT_ADVICE]"
  },
  {
    message: "Nice gradient effect",
    advice: "Your palette has a nice gradient effect, but it may benefit from a stronger accent color. [COMPONENT_ADVICE]"
  },
  {
    message: "Nice overall vibe",
    advice: "The overall vibe is nice, but consider refining the lightness levels for a more dynamic look. [COMPONENT_ADVICE]"
  }
];

// Score 6.0-6.9: Good palette (5 variations) - these include getAdviceBasedOnWeakestComponent
export const goodResponses: ResponseTemplate[] = [
  {
    message: "Good palette",
    advice: "A solid palette with good contrast. [COMPONENT_ADVICE]"
  },
  {
    message: "Well-crafted palette",
    advice: "A well-crafted palette. Try a slightly more saturated color for depth. [COMPONENT_ADVICE]"
  },
  {
    message: "Balanced palette",
    advice: "Balanced and clean. A small tweak in hue could perfect it. [COMPONENT_ADVICE]"
  },
  {
    message: "Nice gradient",
    advice: "Nice gradient, but it could use a touch more contrast. [COMPONENT_ADVICE]"
  },
  {
    message: "Cohesive colors",
    advice: "The colors are cohesive, but the lightness is too similar. [COMPONENT_ADVICE]"
  }
];

// Score 5.0-5.9: Average palette (5 variations)
export const averageResponses: ResponseTemplate[] = [
  {
    message: "Decent start",
    advice: "A decent start, but the palette could be more dynamic. Experiment with a bolder accent color."
  },
  {
    message: "Okay palette",
    advice: "This palette is okay, but the colors feel disconnected. Try using a consistent saturation level."
  },
  {
    message: "Partially working",
    advice: "Some colors work well together, but others clash. Consider replacing the most contrasting hue."
  },
  {
    message: "Balanced lightness",
    advice: "A balanced lightness range, but the hues lack harmony. Try using a color wheel for guidance."
  },
  {
    message: "Decent foundation",
    advice: "The palette has a good base, but it could use a touch of vibrance or a darker tone for contrast."
  }
];

// Score 3.0-4.9: Below average palette (5 variations)
export const belowAverageResponses: ResponseTemplate[] = [
  {
    message: "Needs refinement",
    advice: "This palette has some potential but lacks balance. Try adjusting the lightness of some colors for better contrast."
  },
  {
    message: "Harsh color choices",
    advice: "The color choices are a bit harsh. Try a more subtle approach with softer shades or a more consistent color theme."
  },
  {
    message: "Too similar colors",
    advice: "Some colors are too similar, making the palette look flat. Vary the hues slightly for better contrast."
  },
  {
    message: "Temperature inconsistency",
    advice: "The palette has a mix of warm and cool tones that do not blend well. Consider sticking to one temperature range."
  },
  {
    message: "Lacks purpose",
    advice: "It feels like this palette is missing a sense of purpose. Try creating a theme (e.g., nature, vintage, pastel) to guide your choices."
  }
];

// Score 0.0-2.9: Needs improvement (5 variations)
export const needsImprovementResponses: ResponseTemplate[] = [
  {
    message: "Needs significant improvement",
    advice: "This palette needs significant improvement. The colors clash heavily, creating an overwhelming look. Try using fewer contrasting hues or explore a harmonious scheme."
  },
  {
    message: "Random color selection",
    advice: "The colors in this palette are too random. Consider a more systematic approach, like analogous or monochromatic schemes, for better harmony."
  },
  {
    message: "Lacks balance",
    advice: "The palette lacks balance in lightness and saturation. Try using a mix of dark, mid, and light tones for a more dynamic look."
  },
  {
    message: "Little visual harmony",
    advice: "There is little to no visual harmony here. Try starting with a base color and building complementary or split-complementary hues."
  },
  {
    message: "Over-saturated colors",
    advice: "Colors are too saturated and fight against each other. Consider lowering the saturation for a more pleasant look."
  }
];

// Get a random response from the appropriate category based on score
export function getRandomResponse(score: number, componentAdvice?: string): ResponseTemplate {
  let responses: ResponseTemplate[];
  
  if (score >= 9.0) {
    responses = exceptionalResponses;
  } else if (score >= 8.0) {
    responses = excellentResponses;
  } else if (score >= 7.0) {
    responses = veryGoodResponses;
  } else if (score >= 6.0) {
    responses = goodResponses;
  } else if (score >= 5.0) {
    responses = averageResponses;
  } else if (score >= 3.0) {
    responses = belowAverageResponses;
  } else {
    responses = needsImprovementResponses;
  }
  
  // Get a random response from the appropriate category
  const randomIndex = Math.floor(Math.random() * responses.length);
  const response = { ...responses[randomIndex] };
  
  // Replace [COMPONENT_ADVICE] placeholder with actual component advice if needed
  if (response.advice.includes('[COMPONENT_ADVICE]') && componentAdvice) {
    response.advice = response.advice.replace('[COMPONENT_ADVICE]', componentAdvice);
  } else if (response.advice.includes('[COMPONENT_ADVICE]')) {
    // Remove the placeholder if there's no component advice
    response.advice = response.advice.replace('[COMPONENT_ADVICE]', '');
  }
  
  return response;
} 