declare module 'color-convert' {
  const convert: {
    rgb: {
      hsl: (rgb: [number, number, number]) => [number, number, number];
      lab: (rgb: [number, number, number]) => [number, number, number];
      lch: (rgb: [number, number, number]) => [number, number, number];
    };
    hex: {
      rgb: (hex: string) => [number, number, number];
      hsl: (hex: string) => [number, number, number];
      lab: (hex: string) => [number, number, number];
      lch: (hex: string) => [number, number, number];
    };
    hsl: {
      rgb: (hsl: [number, number, number]) => [number, number, number];
      hex: (hsl: [number, number, number]) => string;
      lab: (hsl: [number, number, number]) => [number, number, number];
      lch: (hsl: [number, number, number]) => [number, number, number];
    };
    lab: {
      rgb: (lab: [number, number, number]) => [number, number, number];
      hsl: (lab: [number, number, number]) => [number, number, number];
      hex: (lab: [number, number, number]) => string;
      lch: (lab: [number, number, number]) => [number, number, number];
    };
    lch: {
      rgb: (lch: [number, number, number]) => [number, number, number];
      hsl: (lch: [number, number, number]) => [number, number, number];
      lab: (lch: [number, number, number]) => [number, number, number];
      hex: (lch: [number, number, number]) => string;
    };
  };

  export default convert;
} 