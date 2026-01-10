/**
 * Cloudflare Image Transformations utility
 *
 * Generates optimized image URLs using Cloudflare's Image Resizing service.
 * @see https://developers.cloudflare.com/images/transform-images/
 */

// Production domain for Cloudflare Image Transformations
const PRODUCTION_DOMAIN = 'https://peabod.com';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  fit?: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
  quality?: number;
  format?: 'auto' | 'webp' | 'avif' | 'json';
  dpr?: number;
}

/**
 * Generate a Cloudflare Image Transformation URL
 * Uses full domain since transforms are configured on peabod.com zone
 */
export function getImageUrl(
  path: string,
  options: ImageTransformOptions = {}
): string {
  const {
    width,
    height,
    fit = 'cover',
    quality = 80,
    format = 'auto',
    dpr,
  } = options;

  // Build transformation parameters
  const params: string[] = [];

  if (width) params.push(`width=${width}`);
  if (height) params.push(`height=${height}`);
  if (fit) params.push(`fit=${fit}`);
  if (quality) params.push(`quality=${quality}`);
  if (format) params.push(`format=${format}`);
  if (dpr) params.push(`dpr=${dpr}`);

  // If no transformations, return original path
  if (params.length === 0) {
    return `${PRODUCTION_DOMAIN}/api/media/${path}`;
  }

  // Use Cloudflare's cdn-cgi image transformation endpoint on the production domain
  const transformString = params.join(',');
  return `${PRODUCTION_DOMAIN}/cdn-cgi/image/${transformString}/api/media/${path}`;
}

/**
 * Responsive image breakpoints for srcset generation
 */
export const IMAGE_BREAKPOINTS = {
  thumbnail: 150,
  small: 320,
  medium: 640,
  large: 960,
  xlarge: 1280,
  full: 1920,
} as const;

export type ImageBreakpoint = keyof typeof IMAGE_BREAKPOINTS;

/**
 * Generate srcset string for responsive images
 */
export function generateSrcSet(
  path: string,
  widths: number[],
  options: Omit<ImageTransformOptions, 'width'> = {}
): string {
  return widths
    .map(width => {
      const url = getImageUrl(path, { ...options, width });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Common image size presets for different use cases
 */
export const IMAGE_PRESETS = {
  // Article card thumbnail
  card: {
    widths: [320, 480, 640],
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    aspectRatio: '16/9',
  },
  // Article hero image
  hero: {
    widths: [640, 960, 1280, 1920],
    sizes: '100vw',
    aspectRatio: '16/9',
  },
  // Media library thumbnail
  mediaThumbnail: {
    widths: [150, 300],
    sizes: '150px',
    aspectRatio: '1/1',
  },
  // Media preview in editor
  mediaPreview: {
    widths: [320, 640],
    sizes: '320px',
    aspectRatio: 'auto',
  },
  // Admin table thumbnail
  tableThumb: {
    widths: [64, 128],
    sizes: '64px',
    aspectRatio: '4/3',
  },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;
