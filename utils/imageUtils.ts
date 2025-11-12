// Utility to trigger downloading a data URL.
export const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


// Function to apply watermarks to a base image.
export const applyWatermarks = (baseImageSrc: string, logo1Src: string | null, logo2Src: string | null): Promise<string> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return reject(new Error('Could not get canvas context'));
        }

        const baseImage = new Image();
        baseImage.crossOrigin = 'anonymous';
        baseImage.onload = () => {
            canvas.width = baseImage.width;
            canvas.height = baseImage.height;
            ctx.drawImage(baseImage, 0, 0);

            let logosToLoad = 0;
            if (logo1Src) logosToLoad++;
            if (logo2Src) logosToLoad++;
            
            if (logosToLoad === 0) {
                resolve(baseImageSrc); // No logos to apply
                return;
            }

            let loadedCount = 0;
            const checkCompletion = () => {
                if (loadedCount === logosToLoad) {
                    resolve(canvas.toDataURL('image/png')); // Output PNG to preserve transparency
                }
            };

            const drawLogo = (logoImage: HTMLImageElement, position: 'top-right' | 'bottom-right') => {
                const logoSize = Math.min(baseImage.width * 0.15, baseImage.height * 0.15);
                const padding = baseImage.width * 0.02;

                const aspectRatio = logoImage.width / logoImage.height;
                let logoWidth = logoSize;
                let logoHeight = logoSize / aspectRatio;

                if (logoHeight > logoSize) {
                    logoHeight = logoSize;
                    logoWidth = logoSize * aspectRatio;
                }

                let x, y;
                if (position === 'top-right') {
                    x = canvas.width - logoWidth - padding;
                    y = padding;
                } else { // bottom-right
                    x = canvas.width - logoWidth - padding;
                    y = canvas.height - logoHeight - padding;
                }

                ctx.globalAlpha = 0.9;
                ctx.drawImage(logoImage, x, y, logoWidth, logoHeight);
                ctx.globalAlpha = 1.0;
            };

            if (logo1Src) {
                const logo1 = new Image();
                logo1.crossOrigin = 'anonymous';
                logo1.onload = () => {
                    drawLogo(logo1, 'top-right');
                    loadedCount++;
                    checkCompletion();
                };
                logo1.onerror = () => {
                    console.error("Failed to load logo 1");
                    loadedCount++;
                    checkCompletion();
                };
                logo1.src = logo1Src;
            }

            if (logo2Src) {
                const logo2 = new Image();
                logo2.crossOrigin = 'anonymous';
                logo2.onload = () => {
                    drawLogo(logo2, 'bottom-right');
                    loadedCount++;
                    checkCompletion();
                };
                logo2.onerror = () => {
                    console.error("Failed to load logo 2");
                    loadedCount++;
                    checkCompletion();
                };
                logo2.src = logo2Src;
            }
        };
        baseImage.onerror = () => reject(new Error('Failed to load base image.'));
        baseImage.src = baseImageSrc;
    });
};

// Function to crop an image to a target aspect ratio (center crop).
// targetAspectRatio = width / height
export const cropImage = (baseImageSrc: string, targetAspectRatio: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Could not get canvas context for cropping'));

            const originalWidth = img.width;
            const originalHeight = img.height;
            const originalAspectRatio = originalWidth / originalHeight;

            let cropWidth, cropHeight, cropX, cropY;

            if (originalAspectRatio > targetAspectRatio) {
                // Original is wider than target, so crop the width
                cropHeight = originalHeight;
                cropWidth = originalHeight * targetAspectRatio;
                cropX = (originalWidth - cropWidth) / 2;
                cropY = 0;
            } else {
                // Original is taller or same aspect ratio, so crop the height
                cropWidth = originalWidth;
                cropHeight = originalWidth / targetAspectRatio;
                cropY = (originalHeight - cropHeight) / 2;
                cropX = 0;
            }

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => reject(new Error('Failed to load image for cropping.'));
        img.src = baseImageSrc;
    });
};
