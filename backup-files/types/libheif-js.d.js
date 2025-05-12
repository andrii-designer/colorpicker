declare module 'libheif-js' {
  class HeifDecoder {
    decode(data): HeifImage[];
  }

  class HeifImage {
    get_width(): number;
    get_height(): number;
    get_pixels(): Uint8Array;
  }

  export { HeifDecoder, HeifImage };
} 