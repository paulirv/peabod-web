/**
 * ResponsiveImage component using Cloudflare Image Transformations
 *
 * Uses <picture> element with srcset for optimal image delivery
 * based on viewport size and device pixel ratio.
 */

import { getImageUrl, generateSrcSet, IMAGE_PRESETS, type ImagePreset } from '@/lib/image';

interface ResponsiveImageProps {
  /** Path to the image in R2 storage */
  path: string;
  /** Alt text for accessibility */
  alt: string;
  /** Image preset for responsive breakpoints */
  preset?: ImagePreset;
  /** Custom widths for srcset (overrides preset) */
  widths?: number[];
  /** Custom sizes attribute (overrides preset) */
  sizes?: string;
  /** Additional CSS classes */
  className?: string;
  /** Aspect ratio for container (e.g., "16/9", "1/1") */
  aspectRatio?: string;
  /** Loading strategy */
  loading?: 'lazy' | 'eager';
  /** Fetch priority hint */
  priority?: boolean;
  /** Object fit style */
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function ResponsiveImage({
  path,
  alt,
  preset = 'card',
  widths: customWidths,
  sizes: customSizes,
  className = '',
  loading = 'lazy',
  priority = false,
  objectFit = 'cover',
}: ResponsiveImageProps) {
  const presetConfig = IMAGE_PRESETS[preset];
  const widths = customWidths || presetConfig.widths;
  const sizes = customSizes || presetConfig.sizes;

  // Generate srcset for WebP (modern browsers)
  const webpSrcSet = generateSrcSet(path, [...widths], { format: 'auto' });

  // Fallback URL (largest size)
  const fallbackUrl = getImageUrl(path, {
    width: Math.max(...widths),
    format: 'auto',
  });

  return (
    <picture>
      {/* WebP/AVIF source (auto format selection by Cloudflare) */}
      <source
        srcSet={webpSrcSet}
        sizes={sizes}
        type="image/webp"
      />
      {/* Fallback img element */}
      <img
        src={fallbackUrl}
        alt={alt}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className={className}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
        }}
      />
    </picture>
  );
}

/**
 * Wrapper component with aspect ratio container
 */
interface ResponsiveImageContainerProps extends ResponsiveImageProps {
  /** Container CSS classes */
  containerClassName?: string;
}

export function ResponsiveImageContainer({
  containerClassName = '',
  aspectRatio: customAspectRatio,
  preset = 'card',
  ...props
}: ResponsiveImageContainerProps) {
  const presetConfig = IMAGE_PRESETS[preset];
  const aspectRatio = customAspectRatio || presetConfig.aspectRatio;

  return (
    <div
      className={`relative overflow-hidden ${containerClassName}`}
      style={aspectRatio !== 'auto' ? { aspectRatio } : undefined}
    >
      <ResponsiveImage
        {...props}
        preset={preset}
        aspectRatio={aspectRatio}
        className={`absolute inset-0 w-full h-full ${props.className || ''}`}
      />
    </div>
  );
}
