// EXIF extraction utility for image metadata
// Uses exif-parser for JPEG files, manual parsing for PNG/GIF

import ExifParser from "exif-parser";

export interface ExifData {
  width?: number;
  height?: number;
  lat?: number;
  lon?: number;
  dateTaken?: string;
  orientation?: number;
}

/**
 * Extract EXIF metadata from an image buffer
 * @param buffer - ArrayBuffer of the image file
 * @param mimeType - MIME type of the image
 * @returns Extracted EXIF data
 */
export function extractExif(buffer: ArrayBuffer, mimeType: string): ExifData {
  // EXIF is only present in JPEG files
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return extractJpegExif(buffer);
  }

  // For other formats, try to get basic dimensions
  if (mimeType === "image/png") {
    return extractPngDimensions(buffer);
  }

  if (mimeType === "image/gif") {
    return extractGifDimensions(buffer);
  }

  if (mimeType === "image/webp") {
    return extractWebpDimensions(buffer);
  }

  return {};
}

/**
 * Extract EXIF data from JPEG files
 */
function extractJpegExif(buffer: ArrayBuffer): ExifData {
  try {
    const parser = ExifParser.create(new Uint8Array(buffer));
    parser.enableSimpleValues(true);

    const result = parser.parse();
    const exif: ExifData = {};

    // Dimensions
    if (result.imageSize) {
      exif.width = result.imageSize.width;
      exif.height = result.imageSize.height;
    }

    // GPS coordinates
    if (result.tags?.GPSLatitude !== undefined && result.tags?.GPSLongitude !== undefined) {
      exif.lat = result.tags.GPSLatitude;
      exif.lon = result.tags.GPSLongitude;

      // Adjust for hemisphere
      if (result.tags.GPSLatitudeRef === "S") {
        exif.lat = -Math.abs(exif.lat);
      }
      if (result.tags.GPSLongitudeRef === "W") {
        exif.lon = -Math.abs(exif.lon);
      }
    }

    // Date taken (try multiple EXIF fields)
    const dateField =
      result.tags?.DateTimeOriginal ||
      result.tags?.CreateDate ||
      result.tags?.ModifyDate;

    if (dateField) {
      // exif-parser returns dates as Unix timestamps (seconds)
      if (typeof dateField === "number") {
        exif.dateTaken = new Date(dateField * 1000).toISOString();
      }
    }

    // Orientation for potential rotation handling
    if (result.tags?.Orientation) {
      exif.orientation = result.tags.Orientation;
    }

    return exif;
  } catch (error) {
    console.error("EXIF extraction failed:", error);
    return {};
  }
}

/**
 * Extract dimensions from PNG files
 * PNG dimensions are at bytes 16-23 in the IHDR chunk
 */
function extractPngDimensions(buffer: ArrayBuffer): ExifData {
  try {
    const view = new DataView(buffer);

    // Verify PNG signature (first 8 bytes)
    if (
      view.getUint32(0) === 0x89504e47 && // \x89PNG
      view.getUint32(4) === 0x0d0a1a0a // \r\n\x1a\n
    ) {
      // Dimensions are at offset 16 and 20 (big-endian)
      return {
        width: view.getUint32(16),
        height: view.getUint32(20),
      };
    }
  } catch (error) {
    console.error("PNG dimension extraction failed:", error);
  }
  return {};
}

/**
 * Extract dimensions from GIF files
 * GIF dimensions are at bytes 6-9 (little-endian)
 */
function extractGifDimensions(buffer: ArrayBuffer): ExifData {
  try {
    const view = new DataView(buffer);

    // Verify GIF signature (GIF87a or GIF89a)
    const sig1 = view.getUint16(0);
    const sig2 = view.getUint8(2);

    if (sig1 === 0x4749 && sig2 === 0x46) {
      // "GIF"
      return {
        width: view.getUint16(6, true), // little-endian
        height: view.getUint16(8, true),
      };
    }
  } catch (error) {
    console.error("GIF dimension extraction failed:", error);
  }
  return {};
}

/**
 * Extract dimensions from WebP files
 * WebP has a more complex structure with VP8/VP8L chunks
 */
function extractWebpDimensions(buffer: ArrayBuffer): ExifData {
  try {
    const view = new DataView(buffer);

    // Check RIFF header and WEBP signature
    if (
      view.getUint32(0) === 0x52494646 && // "RIFF"
      view.getUint32(8) === 0x57454250 // "WEBP"
    ) {
      const chunkType = view.getUint32(12);

      // VP8 lossy format
      if (chunkType === 0x56503820) {
        // "VP8 "
        // Skip to frame header, dimensions at offset 26-29
        const width = view.getUint16(26, true) & 0x3fff;
        const height = view.getUint16(28, true) & 0x3fff;
        return { width, height };
      }

      // VP8L lossless format
      if (chunkType === 0x5650384c) {
        // "VP8L"
        // Dimensions encoded in first 4 bytes after signature
        const bits = view.getUint32(21, true);
        const width = (bits & 0x3fff) + 1;
        const height = ((bits >> 14) & 0x3fff) + 1;
        return { width, height };
      }

      // VP8X extended format
      if (chunkType === 0x56503858) {
        // "VP8X"
        // Canvas dimensions at offset 24-29 (24-bit values)
        const widthMinus1 =
          view.getUint8(24) | (view.getUint8(25) << 8) | (view.getUint8(26) << 16);
        const heightMinus1 =
          view.getUint8(27) | (view.getUint8(28) << 8) | (view.getUint8(29) << 16);
        return {
          width: widthMinus1 + 1,
          height: heightMinus1 + 1,
        };
      }
    }
  } catch (error) {
    console.error("WebP dimension extraction failed:", error);
  }
  return {};
}

/**
 * Generate a human-readable title from a filename
 */
export function generateTitleFromFilename(filename: string): string {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.[^.]+$/, "");

  // Replace common separators with spaces
  const withSpaces = nameWithoutExt.replace(/[-_]/g, " ");

  // Remove timestamp suffix if present (e.g., "-1234567890")
  const withoutTimestamp = withSpaces.replace(/-\d{10,}$/, "");

  // Capitalize first letter of each word
  const titleCase = withoutTimestamp
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  return titleCase.trim() || "Untitled";
}
