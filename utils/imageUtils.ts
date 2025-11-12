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
                    resolve(canvas.toDataURL('image/jpeg'));
                }
            };

            const drawLogo = (logoImage: HTMLImageElement, position: 'top-right' | 'bottom-right') => {
                const logoSize = Math.min(baseImage.width * 0.15, baseImage.height * 0.15); // Logo size is 15% of the smaller dimension
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
                    drawLogo(logo1, 'top-right'); // BrandERP logo
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
                    drawLogo(logo2, 'bottom-right'); // Onoo logo
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