/**
 * Utility for client-side image compression and WebP conversion via HTML5 Canvas.
 * Crops to square 512x512 and compresses to 0.82 quality WebP, reducing ~4MB uploads to ~25KB.
 */

export interface CompressedImageResult {
  blob: Blob;
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

export async function compressImageToWebP(
  file: File,
  maxDimension = 512,
  quality = 0.82
): Promise<CompressedImageResult> {
  // Validate MIME type
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file is not an image');
  }

  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Center-crop square calculations
          const { width, height } = img;
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          const canvas = document.createElement('canvas');
          const targetSize = Math.min(maxDimension, minDim);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas 2D context'));
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // Draw cropped square
          ctx.drawImage(
            img,
            startX,
            startY,
            minDim,
            minDim,
            0,
            0,
            targetSize,
            targetSize
          );

          // Convert to WebP blob with quality 0.82
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                // Fallback to JPEG if WebP is unsupported
                canvas.toBlob(
                  (fallbackBlob) => {
                    if (!fallbackBlob) {
                      reject(new Error('Failed to compress image'));
                      return;
                    }
                    finalizeResult(fallbackBlob, 'image/jpeg', 'jpg');
                  },
                  'image/jpeg',
                  quality
                );
                return;
              }
              finalizeResult(blob, 'image/webp', 'webp');
            },
            'image/webp',
            quality
          );

          function finalizeResult(
            finalBlob: Blob,
            mimeType: string,
            extension: string
          ) {
            const compressedSize = finalBlob.size;
            const reductionPercentage = Math.max(
              0,
              Math.round(((originalSize - compressedSize) / originalSize) * 100)
            );

            // Create new File object
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File(
              [finalBlob],
              `${baseName}.${extension}`,
              { type: mimeType }
            );

            const dataUrl = canvas.toDataURL(mimeType, quality);

            resolve({
              blob: finalBlob,
              file: compressedFile,
              dataUrl,
              originalSize,
              compressedSize,
              reductionPercentage,
            });
          }
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };

      if (typeof e.target?.result === 'string') {
        img.src = e.target.result;
      } else {
        reject(new Error('Failed to read image data'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
