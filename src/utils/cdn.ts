/**
 * Cloudinary CDN URL Builder
 * Returns optimized image URLs with auto format & quality
 */
export const getCDNUrl = (
  filename: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | 'low' | 'medium' | 'high';
    aspect_ratio?: string;
    isVideo?: boolean;
    isAudio?: boolean;
  } = {}
) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dr5frqshz';
  console.log('🔵 getCDNUrl called:', { filename, cloudName, env: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME });
  const { width = 1200, height, quality = 'auto', aspect_ratio, isVideo, isAudio } = options;

  // Remove extension and sanitize for cleaner Cloudinary path
  let publicId = filename
    .replace(/\.[^/.]+$/, '')           // Remove extension
    .replace(/\s+/g, '_')               // Replace spaces with underscores
    .toLowerCase();                     // Lowercase for consistency

  // For audio/video, use simpler URL without image transformations
  if (isAudio || isVideo) {
    const url = `https://res.cloudinary.com/${cloudName}/video/upload/${publicId}`;
    console.log(`[CDN] ${isAudio ? 'Audio' : 'Video'}: ${filename} → ${url}`);
    return url;
  }

  // Build transformation params for images only
  const transforms = [
    `w_${width}`,
    height && `h_${height}`,
    `q_${quality}`,
    'f_auto', // Auto format: AVIF → WebP → JPEG
    aspect_ratio && `ar_${aspect_ratio},c_fill`,
  ]
    .filter(Boolean)
    .join(',');

  const url = `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId}`;
  console.log(`[CDN] Image: ${filename} → ${url}`);
  return url;
};

/**
 * Get image variants for responsive loading
 * Returns srcSet for multiple screen sizes
 */
export const getResponsiveSrcSet = (filename: string) => {
  return {
    mobile: getCDNUrl(filename, { width: 400 }),
    tablet: getCDNUrl(filename, { width: 800 }),
    desktop: getCDNUrl(filename, { width: 1200 }),
    srcSet: `${getCDNUrl(filename, { width: 400 })} 400w, ${getCDNUrl(filename, { width: 800 })} 800w, ${getCDNUrl(filename, { width: 1200 })} 1200w`,
  };
};

/**
 * Get blur placeholder (tiny low-quality version)
 * For blur-up loading effect
 */
export const getBlurPlaceholder = (filename: string) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dr5frqshz';
  const publicId = filename.replace(/\.[^/.]+$/, '').replace(/\s+/g, '_').toLowerCase();
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_30,q_5,f_auto/${publicId}`;
};
