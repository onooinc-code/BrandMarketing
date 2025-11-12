import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { applyWatermarks } from '../utils/imageUtils';

interface PostGeneratorProps {
    brandErpLogo: string | null;
    onooLogo: string | null;
}

const PostGenerator: React.FC<PostGeneratorProps> = ({ brandErpLogo, onooLogo }) => {
    const [postGoal, setPostGoal] = useState('زيادة الوعي بالعلامة التجارية');
    const [topic, setTopic] = useState('');
    const [generatedPost, setGeneratedPost] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const generatePost = useCallback(async () => {
        if (!topic.trim()) {
            setError('يرجى إدخال موضوع المنشور.');
            return;
        }

        setLoading(true);
        setGeneratedPost('');
        setGeneratedImage(null);
        setError('');
        setImageError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `بصفتك خبير تسويق محترف للغاية لمنتج برمجي اسمه "BrandERP" من شركة "Onoo"، قم بكتابة منشور تسويقي مفصل ومقنع لمنصة Facebook.
            - الهدف الرئيسي من المنشور هو: "${postGoal}".
            - الموضوع الذي يجب التركيز عليه هو: "${topic}".
            - استخدم لغة قوية وموجهة للمدراء التنفيذيين وصناع القرار في الشركات.
            - اشرح الفائدة بوضوح وقدم دعوة للعمل (Call to Action) في النهاية.
            - أضف وسوم (hashtags) استراتيجية ومناسبة في نهاية المنشور.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            setGeneratedPost(response.text);

        } catch (err) {
            console.error(err);
            setError('فشل في توليد نص المنشور. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    }, [postGoal, topic]);
    
    const generateImageForPost = useCallback(async () => {
        if (!generatedPost) {
            setImageError('يجب توليد نص المنشور أولاً.');
            return;
        }

        setImageLoading(true);
        setGeneratedImage(null);
        setImageError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `أنشئ صورة إعلانية احترافية، بأسلوب عصري ونظيف، تصلح لمنشور على Facebook. يجب أن تعبر الصورة بصريًا عن الفكرة الرئيسية في النص التالي: "${topic}". تجنب وضع أي نصوص على الصورة.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);

            if (imagePart && imagePart.inlineData) {
                const base64ImageBytes = imagePart.inlineData.data;
                const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                
                const watermarkedImage = await applyWatermarks(imageUrl, brandErpLogo, onooLogo);
                setGeneratedImage(watermarkedImage);

            } else {
                 throw new Error("لم يتمكن النموذج من إنشاء صورة. حاول مرة أخرى.");
            }

        } catch (err) {
            console.error(err);
            setImageError(err instanceof Error ? err.message : 'فشل في توليد الصورة.');
        } finally {
            setImageLoading(false);
        }
    }, [generatedPost, topic, brandErpLogo, onooLogo]);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">مولد منشورات فيسبوك</h2>
            <p className="text-gray-400 mb-6 text-center">أداة من خطوتين: أولاً، قم بتوليد محتوى نصي احترافي، ثم قم بإنشاء صورة إعلانية معبرة.</p>
            
            <div className="w-full max-w-2xl p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
                <h3 className="text-lg font-semibold text-blue-300 border-b border-blue-800 pb-2">الخطوة 1: كتابة المحتوى</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">اختر هدف المنشور</label>
                    <select
                        value={postGoal}
                        onChange={(e) => setPostGoal(e.target.value)}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option>زيادة الوعي بالعلامة التجارية</option>
                        <option>الإعلان عن ميزة جديدة</option>
                        <option>جذب عملاء محتملين</option>
                        <option>مشاركة دراسة حالة</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">أدخل موضوع المنشور</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder='مثال: "تسهيل إدارة المخزون للشركات الصناعية"'
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                 <button
                    onClick={generatePost}
                    disabled={loading || !topic.trim()}
                    className="w-full mt-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading && (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {loading ? 'جاري كتابة النص...' : 'توليد نص المنشور'}
                </button>
            </div>
            
            {error && <p className="mt-4 text-red-400">{error}</p>}

            {generatedPost && (
                <div className="mt-8 w-full max-w-2xl bg-gray-900/50 p-6 rounded-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">النص المقترح:</h3>
                    <textarea
                        readOnly
                        value={generatedPost}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md whitespace-pre-wrap font-sans text-gray-200 h-64 resize-none"
                    ></textarea>
                     <button
                        onClick={() => navigator.clipboard.writeText(generatedPost)}
                        className="mt-4 px-4 py-2 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-colors text-sm"
                    >
                        نسخ النص
                    </button>

                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-4">الخطوة 2: تصميم الصورة</h3>
                        <div className="bg-gray-700/50 rounded-lg p-2 aspect-video flex items-center justify-center mb-4">
                             {imageLoading ? (
                                <div className="flex flex-col items-center text-gray-400">
                                    <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري تصميم الصورة...</span>
                                </div>
                            ) : generatedImage ? (
                                <img src={generatedImage} alt="Generated post creative" className="max-h-full max-w-full rounded-md object-contain" />
                            ) : (
                                <p className="text-gray-500 text-center p-4">ستظهر الصورة المصاحبة للمنشور هنا.</p>
                            )}
                        </div>
                         <button
                            onClick={generateImageForPost}
                            disabled={imageLoading}
                            className="w-full mt-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {imageLoading && (
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {imageLoading ? 'جاري التوليد...' : 'توليد صورة للمنشور'}
                        </button>
                         {imageError && <p className="mt-4 text-red-400 text-center">{imageError}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostGenerator;