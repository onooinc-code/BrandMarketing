import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage, GroundingChunk } from '../types';

interface MarketingChatbotProps {
    messages: ChatMessage[];
    setMessages: (messages: ChatMessage[]) => void;
}

const MarketingChatbot: React.FC<MarketingChatbotProps> = ({ messages, setMessages }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [userInput, setUserInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const chatSession = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: 'أنت خبير تسويق محترف ومتخصص في برامج ERP. اسم المنتج هو BrandERP واسم الشركة هو Onoo. قدم إجابات واستراتيجيات تسويقية دقيقة ومبتكرة ومفصلة. استخدم بحث جوجل لتقديم أحدث المعلومات.',
                    tools: [{googleSearch: {}}],
                },
                history: messages.slice(1).map(m => ({ // Exclude initial message
                    role: m.role,
                    parts: m.content
                }))
            });
            setChat(chatSession);
        } catch (err) {
            console.error("Failed to initialize chat:", err);
            setError("لم يتم بدء جلسة المحادثة. يرجى التحقق من مفتاح API وتحديث الصفحة.");
        }
    }, []); // Chat history is now managed by App state, so we only init once.

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = useCallback(async () => {
        if (!userInput.trim() || !chat || loading) return;

        const userMessage: ChatMessage = { role: 'user', content: userInput };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setUserInput('');
        setLoading(true);
        setError('');

        try {
            let fullResponse = '';
            const sources = new Map<string, { uri: string; title: string }>();
            const responseStream = await chat.sendMessageStream({ message: userInput });

            const modelMessage: ChatMessage = { role: 'model', content: '' };
            setMessages([...newMessages, modelMessage]);

            for await (const chunk of responseStream) {
                fullResponse += chunk.text;
                
                chunk.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach(gc => {
                    if (gc.web?.uri && gc.web?.title) {
                        sources.set(gc.web.uri, gc.web);
                    }
                });

                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    lastMessage.content = fullResponse;
                    if (sources.size > 0) {
                         lastMessage.sources = Array.from(sources.values()).map(web => ({ web }));
                    }
                    return updatedMessages;
                });
            }
        } catch (err) {
            console.error(err);
            const errorMessage: ChatMessage = { role: 'model', content: "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى." };
            setMessages(prev => [...prev.slice(0, -1), errorMessage]);
            setError('فشل في الحصول على رد.');
        } finally {
            setLoading(false);
        }
    }, [userInput, chat, loading, messages, setMessages]);

    return (
        <div className="flex flex-col h-[60vh] max-h-[700px]">
             <h2 className="text-2xl font-bold text-blue-300 mb-4 text-center">خبير الدردشة التسويقي</h2>
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-xl ${msg.role === 'user' ? 'bg-blue-700 text-white' : 'bg-gray-700 text-gray-200'}`}>
                           <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-2 border-t border-gray-600 pt-2">
                                    <p className="text-xs font-semibold text-gray-400 mb-1">المصادر:</p>
                                    <ul className="space-y-1">
                                        {msg.sources.map((source, i) => (
                                            source.web && (
                                                <li key={i} className="text-xs truncate">
                                                    <a href={source.web.uri} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                        <span>{source.web.title || source.web.uri}</span>
                                                    </a>
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                 {loading && messages[messages.length - 1].role === 'user' && (
                    <div className="flex justify-start">
                        <div className="px-4 py-2 rounded-xl bg-gray-700 text-gray-200">
                           <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
            </div>

            {error && <p className="mt-2 text-center text-red-400">{error}</p>}
            
            <div className="mt-4 flex">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="اطلب خطة تسويق، أفكار محتوى..."
                    className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-l-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    disabled={!chat}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !userInput.trim() || !chat}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-r-full transition-colors hover:bg-blue-700 disabled:bg-gray-500"
                >
                    إرسال
                </button>
            </div>
        </div>
    );
};

export default MarketingChatbot;