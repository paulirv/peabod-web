declare module "exif-parser" {
  interface ImageSize {
    width: number;
    height: number;
  }

  interface ExifTags {
    GPSLatitude?: number;
    GPSLongitude?: number;
    GPSLatitudeRef?: string;
    GPSLongitudeRef?: string;
    DateTimeOriginal?: number;
    CreateDate?: number;
    ModifyDate?: number;
    Orientation?: number;
    [key: string]: unknown;
  }

  interface ExifResult {
    imageSize?: ImageSize;
    tags?: ExifTags;
  }

  interface ExifParserInstance {
    enableSimpleValues(enable: boolean): ExifParserInstance;
    parse(): ExifResult;
  }

  function create(buffer: Buffer | Uint8Array): ExifParserInstance;

  const ExifParser: { create: typeof create };

  export { create };
  export default ExifParser;
}
