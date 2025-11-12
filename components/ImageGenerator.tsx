import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { applyWatermarks } from '../utils/imageUtils';

interface AdCreativeGeneratorProps {
    brandErpLogo: string | null;
    onooLogo: string | null;
}

const AdCreativeGenerator: React.FC<AdCreativeGeneratorProps> = ({ brandErpLogo, onooLogo }) => {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const generateImage = useCallback(async () => {
        if (!prompt.trim()) {
            setError('يرجى إدخال وصف لتوليد الصورة.');
            return;
        }

        setLoading(true);
        setError('');
        setGeneratedImage(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `صورة إعلانية احترافية لمنتج برمجي، ${prompt}`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
                
                const watermarkedImage = await applyWatermarks(imageUrl, brandErpLogo, onooLogo);
                setGeneratedImage(watermarkedImage);

            } else {
                throw new Error("لم يقم النموذج بإرجاع صورة. جرب وصفًا مختلفًا.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'فشل في توليد الصورة. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    }, [prompt, brandErpLogo, onooLogo]);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">مولد الصور الإعلانية</h2>
            <p className="text-gray-400 mb-6 text-center">صف فكرة إعلانك وسيقوم الذكاء الاصطناعي بتحويلها إلى صورة إبداعية.</p>

            <div className="w-full max-w-lg p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="مثال: فريق عمل سعيد في مكتب حديث يستخدمون برنامج على شاشة كبيرة تظهر عليها رسوم بيانية للنمو..."
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={3}
                />
            </div>

            <button
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
            >
                {loading && (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                {loading ? 'جاري التوليد...' : 'توليد الصورة'}
            </button>

            {error && <p className="mt-4 text-red-400">{error}</p>}

            <div className="mt-8 w-full max-w-2xl">
                <div className="bg-gray-900/50 rounded-lg p-2 aspect-video flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center text-gray-400">
                            <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>نصمم رؤيتك...</span>
                        </div>
                    ) : generatedImage ? (
                        <img src={generatedImage} alt="Generated ad creative" className="max-h-full max-w-full rounded-md object-contain" />
                    ) : (
                        <p className="text-gray-500 text-center p-4">ستظهر صورتك الإعلانية هنا.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdCreativeGenerator;