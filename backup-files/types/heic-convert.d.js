declare module 'heic-convert' {
  function convert(options: {
    buffer: Buffer;
    format 'PNG';
    quality?: number;
  }): Promise;
  
  export default convert;
} 