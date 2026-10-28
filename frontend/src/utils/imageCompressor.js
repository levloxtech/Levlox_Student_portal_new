/**
 * Compresses and resizes an image file in the browser before upload.
 * Automatically scales down high-resolution smartphone/camera photos (5MB - 30MB+)
 * to a lightweight, crystal-clear image (~100KB - 300KB) with max 900px dimension.
 */
export const compressImage = (file, optOrMaxDim = 900, qualityArg = 0.85) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/') || file.type.includes('svg')) {
      return resolve(file);
    }

    let maxDimension = 900;
    let quality = 0.85;

    if (typeof optOrMaxDim === 'object' && optOrMaxDim !== null) {
      maxDimension = optOrMaxDim.maxWidth || optOrMaxDim.maxHeight || optOrMaxDim.maxDimension || 900;
      quality = optOrMaxDim.quality !== undefined ? optOrMaxDim.quality : 0.85;
    } else if (typeof optOrMaxDim === 'number') {
      maxDimension = optOrMaxDim;
      quality = typeof qualityArg === 'number' ? qualityArg : 0.85;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // Enable high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const cleanName = (file.name || 'avatar.jpg').replace(/\.[^.]+$/, '.jpg');
            const compressedFile = new File([blob], cleanName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};
