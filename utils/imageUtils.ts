// Utility to trigger downloading a data URL.
export const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Helper function to load an image. Resolves with null if the image fails to load.
const loadImage = (src: string): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.error(`Failed to load image from src: ${src}`);
            resolve(null);
        };
        img.src = src;
    });
};

/**
 * Applies watermarks to a base image in a professional stacked layout.
 * The logos are placed in the bottom-right corner, with the product logo (BrandERP)
 * stacked on top of the company logo (Onoo).
 */
export const applyWatermarks = async (baseImageSrc: string, brandErpLogoSrc: string | null, onooLogoSrc: string | null): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get canvas context. Returning original image.');
        return baseImageSrc;
    }

    const [baseImage, brandErpLogo, onooLogo] = await Promise.all([
        loadImage(baseImageSrc),
        brandErpLogoSrc ? loadImage(brandErpLogoSrc) : Promise.resolve(null),
        onooLogoSrc ? loadImage(onooLogoSrc) : Promise.resolve(null),
    ]);

    if (!baseImage) {
        throw new Error('The base image for watermarking could not be loaded.');
    }

    canvas.width = baseImage.width;
    canvas.height = baseImage.height;
    ctx.drawImage(baseImage, 0, 0);

    // If no logos loaded, return the original image data URL
    if (!brandErpLogo && !onooLogo) {
        return canvas.toDataURL('image/png');
    }

    const padding = baseImage.width * 0.025; // Use 2.5% of image width as padding
    const logoMaxWidth = baseImage.width * 0.12; // Constrain logo width to 12% of image width
    const spacing = padding / 2; // Spacing between logos

    ctx.globalAlpha = 0.85; // Set a professional transparency level
    
    let currentY = canvas.height - padding;

    // Draw the company logo (Onoo) first at the bottom
    if (onooLogo) {
        const aspectRatio = onooLogo.width / onooLogo.height;
        let logoWidth = Math.min(logoMaxWidth, onooLogo.width);
        let logoHeight = logoWidth / aspectRatio;

        // If the logo becomes too tall, constrain by height instead
        if (logoHeight > logoMaxWidth) { 
            logoHeight = logoMaxWidth;
            logoWidth = logoHeight * aspectRatio;
        }
        
        const x = canvas.width - logoWidth - padding;
        const y = currentY - logoHeight;
        ctx.drawImage(onooLogo, x, y, logoWidth, logoHeight);
        currentY = y - spacing; // Update Y position for the logo above
    }

    // Draw the product logo (BrandERP) above the company logo
    if (brandErpLogo) {
        const aspectRatio = brandErpLogo.width / brandErpLogo.height;
        let logoWidth = Math.min(logoMaxWidth, brandErpLogo.width);
        let logoHeight = logoWidth / aspectRatio;
        
        // If the logo becomes too tall, constrain by height instead
        if (logoHeight > logoMaxWidth) {
            logoHeight = logoMaxWidth;
            logoWidth = logoHeight * aspectRatio;
        }

        const x = canvas.width - logoWidth - padding;
        const y = currentY - logoHeight;
        ctx.drawImage(brandErpLogo, x, y, logoWidth, logoHeight);
    }

    ctx.globalAlpha = 1.0; // Reset alpha
    return canvas.toDataURL('image/png');
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