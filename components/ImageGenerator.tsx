import React, { useState, useCallback } from 'react';
import { GoogleGenAI } from '@google/genai';
import { applyWatermarks, downloadImage } from '../utils/imageUtils';
import type { AdCreativeState } from '../types';

interface AdCreativeGeneratorProps {
    brandErpLogo: string | null;
    onooLogo: string | null;
    adState: AdCreativeState;
    setAdState: (state: AdCreativeState) => void;
}

const AdCreativeGenerator: React.FC<AdCreativeGeneratorProps> = ({ brandErpLogo, onooLogo, adState, setAdState }) => {
    const { prompt, image, placement } = adState;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const updateState = (updates: Partial<AdCreativeState>) => {
        setAdState({ ...adState, ...updates });
    };

    const generateImage = useCallback(async () => {
        if (!prompt.trim()) {
            setError('يرجى إدخال وصف لتوليد الصورة.');
            return;
        }

        setLoading(true);
        setError('');
        updateState({ image: null });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: `صورة إعلانية احترافية لمنتج برمجي، ${prompt}. الأسلوب: نظيف، عصري، تقني.`,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/png',
                    aspectRatio: placement,
                },
            });

            if (response.generatedImages && response.generatedImages.length > 0) {
                const base64ImageBytes = response.generatedImages[0].image.imageBytes;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                
                const watermarkedImage = await applyWatermarks(imageUrl, brandErpLogo, onooLogo);
                updateState({ image: watermarkedImage });

            } else {
                throw new Error("لم يقم النموذج بإرجاع صورة. جرب وصفًا مختلفًا.");
            }
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'فشل في توليد الصورة. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    }, [prompt, brandErpLogo, onooLogo, placement, updateState]);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">مولد الصور الإعلانية</h2>
            <p className="text-gray-400 mb-6 text-center">صف فكرة إعلانك وسيقوم الذكاء الاصطناعي بتحويلها إلى صورة إبداعية.</p>

            <div className="w-full max-w-lg p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
                <textarea
                    value={prompt}
                    onChange={(e) => updateState({ prompt: e.target.value })}
                    placeholder="مثال: فريق عمل سعيد في مكتب حديث يستخدمون برنامج على شاشة كبيرة تظهر عليها رسوم بيانية للنمو..."
                    className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                    rows={3}
                />
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">اختر مقاس الصورة</label>
                    <select
                        value={placement}
                        onChange={(e) => updateState({ placement: e.target.value as AdCreativeState['placement'] })}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="16:9">أفقي (16:9)</option>
                        <option value="1:1">مربع (1:1)</option>
                        <option value="9:16">عمودي / قصة (9:16)</option>
                    </select>
                </div>
            </div>

            <button
                onClick={generateImage}
                disabled={loading || !prompt.trim()}
                className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center"
            >
                {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {loading ? 'جاري التوليد...' : 'توليد الصورة'}
            </button>

            {error && <p className="mt-4 text-red-400">{error}</p>}

            <div className="mt-8 w-full max-w-2xl">
                <div className="bg-gray-900/50 rounded-lg p-2 aspect-video flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center text-gray-400"><svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>نصمم رؤيتك...</span></div>
                    ) : image ? (
                        <img src={image} alt="Generated ad creative" className="max-h-full max-w-full rounded-md object-contain" />
                    ) : (
                        <p className="text-gray-500 text-center p-4">ستظهر صورتك الإعلانية هنا.</p>
                    )}
                </div>
                 {image && !loading && (
                    <div className="text-center mt-4">
                        <button onClick={() => downloadImage(image, 'ad-creative.png')} className="px-6 py-2 bg-green-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-green-700">
                            تحميل الصورة
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdCreativeGenerator;