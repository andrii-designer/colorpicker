declare module 'tinycolor2' {
  ;
    toRgb(): { r: number; g: number; b: number; a? };
    isDark(): boolean;
    toString(format?): string;
    isValid(): boolean;
    toHexString(): string;
  }

  

  const tinycolor: TinyColorStatic;
  export default tinycolor;
} 