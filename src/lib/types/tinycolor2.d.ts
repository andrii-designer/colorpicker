declare module 'tinycolor2' {
  interface TinyColor {
    toHsl(): { h: number; s: number; l: number };
    toRgb(): { r: number; g: number; b: number; a?: number };
    isDark(): boolean;
    toString(format?: string): string;
    isValid(): boolean;
    toHexString(): string;
  }

  interface TinyColorStatic {
    (color: string): TinyColor;
    readability(color1: TinyColor | string, color2: TinyColor | string): number;
  }

  const tinycolor: TinyColorStatic;
  export default tinycolor;
} 