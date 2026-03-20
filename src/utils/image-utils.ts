/**
 * Generates a transformed Cloudinary URL for the shop
 * 
 * @param url Original Cloudinary URL
 * @param width Target width
 * @param height Target height
 * @param crop Crop mode ('fill', 'scale', 'thumb', etc.)
 */
export const getOptimizedUrl = (url?: string, width?: number, height?: number, crop: string = 'fill'): string => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;

  // Cloudinary transformations structure: /upload/[transformations]/[version]/[public_id]
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  let transformations = 'f_auto,q_auto';
  if (width) transformations += `,w_${width}`;
  if (height) transformations += `,h_${height}`;
  if (width || height) transformations += `,c_${crop}`;

  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
};
