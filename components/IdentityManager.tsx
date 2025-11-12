import React, { useState, useCallback } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';

interface LogoGeneratorSectionProps {
    logoName: string;
    onSave: (imageUrl: string) => void;
}

const LogoGeneratorSection: React.FC<LogoGeneratorSectionProps> = ({ logoName, onSave }) => {
    const [initialPrompt, setInitialPrompt] = useState('');
    const [detailedPrompt, setDetailedPrompt] = useState('');
    const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const [loadingState, setLoadingState] = useState<'idle' | 'prompt' | 'image'>('idle');
    const [error, setError] = useState('');

    const [promptApproved, setPromptApproved] = useState(false);

    const generateDetailedPrompt = useCallback(async () => {
        if (!initialPrompt.trim()) {
            setError('يرجى إدخال فكرة أولية للشعار.');
            return;
        }
        setLoadingState('prompt');
        setError('');
        setDetailedPrompt('');
        setPromptApproved(false);
        setGeneratedLogo(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const fullPrompt = `بصفتك مصمم هويات بصرية وخبير في العلامات التجارية، قم بكتابة وصف احترافي ومفصل لإنشاء شعار (logo). هذا الوصف سيتم استخدامه من قبل ذكاء اصطناعي آخر لتوليد الصورة.
            - اسم الشعار: "${logoName}"
            - الفكرة الأولية من المستخدم: "${initialPrompt}"
            - يجب أن يتضمن الوصف: الأسلوب (مثال: عصري، بسيط، احترافي)، الألوان المقترحة ودلالاتها، الأشكال والرموز التي يمكن استخدامها، والمشاعر التي يجب أن يثيرها الشعار.
            - اجعل الوصف دقيقاً وموجهاً للمصمم (الذكاء الاصطناعي).`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: fullPrompt,
            });
            setDetailedPrompt(response.text);
        } catch (err) {
            console.error(err);
            setError('فشل في توليد وصف الشعار.');
        } finally {
            setLoadingState('idle');
        }
    }, [initialPrompt, logoName]);
    
    const generateLogoImage = useCallback(async () => {
        if (!detailedPrompt) {
            setError('يجب الموافقة على الوصف التفصيلي أولاً.');
            return;
        }
        setLoadingState('image');
        setError('');
        setGeneratedLogo(null);
        
        try {
             const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
             const prompt = `Generate a professional logo based on the following detailed description. The logo should be on a transparent or plain white background, focusing on the symbol or wordmark itself. Do not add any extra text like the company name unless it's part of the logo wordmark itself. Description: "${detailedPrompt}"`;

             const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [{ text: prompt }] },
                config: { responseModalities: [Modality.IMAGE] },
            });
            
            const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
            if (imagePart?.inlineData) {
                setGeneratedLogo(`data:image/png;base64,${imagePart.inlineData.data}`);
            } else {
                throw new Error("لم يتمكن النموذج من إنشاء صورة. حاول مرة أخرى.");
            }
        } catch (err) {
             console.error(err);
             setError(err instanceof Error ? err.message : 'فشل في توليد الشعار.');
        } finally {
            setLoadingState('idle');
        }

    }, [detailedPrompt]);

    const handleSave = () => {
        if(generatedLogo) {
            onSave(generatedLogo);
            setIsSaved(true);
        }
    }

    return (
        <div className="w-full p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
            <h3 className="text-xl font-semibold text-blue-300 border-b border-blue-800 pb-2">شعار {logoName}</h3>
            
            {/* Step 1: Prompt Input */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">الخطوة 1: أدخل الفكرة الأولية للشعار</label>
                <textarea
                    value={initialPrompt}
                    onChange={e => setInitialPrompt(e.target.value)}
                    placeholder={`مثال: شعار يرمز للنمو والبيانات لشركة برمجيات`}
                    className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    rows={2}
                    disabled={isSaved}
                />
            </div>
            <button onClick={generateDetailedPrompt} disabled={loadingState === 'prompt' || !initialPrompt.trim() || isSaved} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-500">
                {loadingState === 'prompt' ? 'جاري التفكير...' : 'توليد وصف دقيق'}
            </button>
            
            {/* Step 2: Detailed Prompt Display & Approval */}
            {detailedPrompt && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-md animate-fade-in">
                    <label className="block text-sm font-medium text-gray-300 mb-1">الوصف المقترح:</label>
                    <p className="text-gray-200 whitespace-pre-wrap">{detailedPrompt}</p>
                    {!promptApproved && !isSaved && (
                        <div className="flex gap-2 mt-2">
                            <button onClick={() => setPromptApproved(true)} className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">موافقة</button>
                            <button onClick={generateDetailedPrompt} className="flex-1 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">إعادة توليد</button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Step 3: Image Generation */}
            {promptApproved && !isSaved && (
                 <div className="mt-4 border-t border-gray-600 pt-4">
                    <h4 className="text-md font-semibold text-gray-300 mb-2">الخطوة 2: تصميم الشعار</h4>
                    <button onClick={generateLogoImage} disabled={loadingState === 'image'} className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
                        {loadingState === 'image' ? 'جاري التصميم...' : 'توليد الشعار'}
                    </button>
                </div>
            )}

            {/* Step 4: Image Display & Approval */}
            <div className="mt-4 flex justify-center items-center h-40 bg-gray-900/50 rounded-md">
                {loadingState === 'image' && <p>جاري توليد الشعار...</p>}
                {generatedLogo && <img src={generatedLogo} alt={`${logoName} logo`} className="max-h-36 object-contain" />}
            </div>

            {generatedLogo && !isSaved && (
                 <div className="flex gap-2 mt-2">
                    <button onClick={handleSave} className="flex-1 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">حفظ الشعار</button>
                    <button onClick={generateLogoImage} className="flex-1 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700">إعادة توليد</button>
                </div>
            )}
            
            {isSaved && <p className="text-center text-green-400 font-bold">تم حفظ الشعار بنجاح!</p>}
            {error && <p className="mt-2 text-red-400">{error}</p>}
        </div>
    );
};


const IdentityManager: React.FC<{ onLogoSave: (logoType: 'brandErp' | 'onoo', imageUrl: string) => void }> = ({ onLogoSave }) => {
    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">إدارة الهوية البصرية</h2>
            <p className="text-gray-400 mb-6 text-center">قم بتوليد وحفظ الشعارات الرسمية هنا ليتم استخدامها كعلامة مائية في جميع الصور المولدة.</p>
            <div className="w-full grid md:grid-cols-2 gap-8">
                <LogoGeneratorSection logoName="BrandERP" onSave={(url) => onLogoSave('brandErp', url)} />
                <LogoGeneratorSection logoName="Onoo" onSave={(url) => onLogoSave('onoo', url)} />
            </div>
        </div>
    );
};

export default IdentityManager;