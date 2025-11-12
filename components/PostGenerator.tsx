import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { applyWatermarks, cropImage, downloadImage } from '../utils/imageUtils';
import type { PostGeneratorState } from '../types';

interface PostGeneratorProps {
    brandErpLogo: string | null;
    onooLogo: string | null;
    postState: PostGeneratorState;
    setPostState: (state: PostGeneratorState) => void;
}

const PostGenerator: React.FC<PostGeneratorProps> = ({ brandErpLogo, onooLogo, postState, setPostState }) => {
    const { goal, topic, post, image, placement } = postState;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState('');
    
    const updateState = (updates: Partial<PostGeneratorState>) => {
        setPostState({ ...postState, ...updates });
    };

    const generatePost = useCallback(async () => {
        if (!topic.trim()) {
            setError('يرجى إدخال موضوع المنشور.');
            return;
        }

        setLoading(true);
        updateState({ post: '', image: null });
        setError('');
        setImageError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const prompt = `بصفتك خبير تسويق محترف للغاية لمنتج برمجي اسمه "BrandERP" من شركة "Onoo"، قم بكتابة منشور تسويقي مفصل ومقنع لمنصة Facebook.
            - الهدف الرئيسي من المنشور هو: "${goal}".
            - الموضوع الذي يجب التركيز عليه هو: "${topic}".
            - استخدم لغة قوية وموجهة للمدراء التنفيذيين وصناع القرار في الشركات.
            - اشرح الفائدة بوضوح وقدم دعوة للعمل (Call to Action) في النهاية.
            - أضف وسوم (hashtags) استراتيجية ومناسبة في نهاية المنشور.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: prompt,
            });

            updateState({ post: response.text });

        } catch (err) {
            console.error(err);
            setError('فشل في توليد نص المنشور. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    }, [goal, topic, updateState]);
    
    const generateImageForPost = useCallback(async () => {
        if (!post) {
            setImageError('يجب توليد نص المنشور أولاً.');
            return;
        }

        setImageLoading(true);
        updateState({ image: null });
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
                
                const ratioMap = { '1:1': 1, '16:9': 16/9, '9:16': 9/16 };
                const croppedImage = await cropImage(imageUrl, ratioMap[placement]);
                const watermarkedImage = await applyWatermarks(croppedImage, brandErpLogo, onooLogo);
                updateState({ image: watermarkedImage });

            } else {
                 throw new Error("لم يتمكن النموذج من إنشاء صورة. حاول مرة أخرى.");
            }

        } catch (err) {
            console.error(err);
            setImageError(err instanceof Error ? err.message : 'فشل في توليد الصورة.');
        } finally {
            setImageLoading(false);
        }
    }, [post, topic, brandErpLogo, onooLogo, placement, updateState]);

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">مولد منشورات فيسبوك</h2>
            <p className="text-gray-400 mb-6 text-center">أداة من خطوتين: أولاً، قم بتوليد محتوى نصي احترافي، ثم قم بإنشاء صورة إعلانية معبرة.</p>
            
            <div className="w-full max-w-2xl p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
                <h3 className="text-lg font-semibold text-blue-300 border-b border-blue-800 pb-2">الخطوة 1: كتابة المحتوى</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">اختر هدف المنشور</label>
                    <select
                        value={goal}
                        onChange={(e) => updateState({ goal: e.target.value })}
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
                        onChange={(e) => updateState({ topic: e.target.value })}
                        placeholder='مثال: "تسهيل إدارة المخزون للشركات الصناعية"'
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                </div>
                 <button
                    onClick={generatePost}
                    disabled={loading || !topic.trim()}
                    className="w-full mt-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {loading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {loading ? 'جاري كتابة النص...' : 'توليد نص المنشور'}
                </button>
            </div>
            
            {error && <p className="mt-4 text-red-400">{error}</p>}

            {post && (
                <div className="mt-8 w-full max-w-2xl bg-gray-900/50 p-6 rounded-lg animate-fade-in">
                    <h3 className="text-lg font-semibold text-blue-300 mb-2">النص المقترح:</h3>
                    <textarea
                        readOnly
                        value={post}
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-md whitespace-pre-wrap font-sans text-gray-200 h-64 resize-none"
                    ></textarea>
                     <button onClick={() => navigator.clipboard.writeText(post)} className="mt-4 px-4 py-2 bg-gray-600 text-white font-semibold rounded-full hover:bg-gray-500 transition-colors text-sm">نسخ النص</button>

                    <div className="mt-6 border-t border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-blue-300 mb-4">الخطوة 2: تصميم الصورة</h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-300 mb-1">اختر مقاس المنشور</label>
                            <select
                                value={placement}
                                onChange={(e) => updateState({ placement: e.target.value as PostGeneratorState['placement'] })}
                                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            >
                                <option value="1:1">منشور مربع (1:1)</option>
                                <option value="16:9">منشور أفقي (16:9)</option>
                                <option value="9:16">قصة / Story (9:16)</option>
                            </select>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-2 aspect-video flex items-center justify-center mb-4">
                             {imageLoading ? (
                                <div className="flex flex-col items-center text-gray-400"><svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>جاري تصميم الصورة...</span></div>
                            ) : image ? (
                                <img src={image} alt="Generated post creative" className="max-h-full max-w-full rounded-md object-contain" />
                            ) : (
                                <p className="text-gray-500 text-center p-4">ستظهر الصورة المصاحبة للمنشور هنا.</p>
                            )}
                        </div>
                         <div className="flex gap-4">
                            <button onClick={generateImageForPost} disabled={imageLoading} className="flex-1 mt-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center">
                                {imageLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {imageLoading ? 'جاري التوليد...' : 'توليد صورة للمنشور'}
                            </button>
                             {image && <button onClick={() => downloadImage(image, 'post-image.png')} className="mt-2 px-8 py-3 bg-green-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-green-700">تحميل الصورة</button>}
                         </div>
                         {imageError && <p className="mt-4 text-red-400 text-center">{imageError}</p>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostGenerator;