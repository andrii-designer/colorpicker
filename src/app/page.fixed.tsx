export default function Home() {
  // ... rest of the component's code ...
  
  // Define handleGenerateFromBase first as a function declaration rather than a const
  function handleGenerateFromBase() {
    try {
      if (!baseColor) return;
    
      // Save current state if we have colors
      if (baseColors.length > 0) {
        const currentState = {
          colors: [...baseColors],
          advice: baseColorAdvice,
          score: baseScore
        };
        baseHistory.addToHistory(currentState);
        
        // After first generation, all subsequent generations are variations
        setIsFirstGeneration(false);
      } else {
        // First time generating, mark that the next generation should be a variation
        setIsFirstGeneration(false);
      }
      
      // Use our improved Adobe-style algorithm from utils/generateColors.ts
      const generatedPalette = colorUtils.generateColorPalette(baseColor, {
        numColors: 5,
        paletteType: paletteType as 'monochromatic' | 'complementary' | 'analogous' | 'triadic' | 'tetradic' | 'splitComplementary',
        enforceMinContrast: true,
        useAdobeAlgorithm: true, // Enable Adobe-style algorithm by default
        seed: Date.now() + Math.random() // Add random seed to ensure different results each time
      });
      
      // Convert the generated palette to string array of hex colors
      let generatedColors = generatedPalette.map(color => color.hex);
      
      // Ensure the first color is always the original base color
      if (generatedColors[0] !== baseColor.toUpperCase() && generatedColors[0] !== baseColor.toLowerCase()) {
        // Replace the first color with the original base color if it's different
        generatedColors = [baseColor, ...generatedColors.slice(1)];
      }
      
      // Set new colors
      setBaseColors(generatedColors);
      
      // Analyze the new colors
      const analysis = colorUtils.analyzeColorPalette(generatedColors);
      setBaseColorAdvice(analysis.advice);
      setBaseScore(analysis.score);
    } catch (error) {
      console.error("Error generating palette from base color:", error);
    }
  }
  
  // Then, after the function is defined, you can use it in useEffect
  useEffect(() => {
    if (baseColor) {
      handleGenerateFromBase();
    }
  }, [baseColor, paletteType]); // Remove handleGenerateFromBase from the dependency array

  // ... rest of the component ...
} 