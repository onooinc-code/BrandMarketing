
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { decode, encode, decodeAudioData } from '../utils/audioUtils';

type ConnectionState = 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'CLOSED' | 'ERROR';

const VoiceConsultant: React.FC = () => {
    const [connectionState, setConnectionState] = useState<ConnectionState>('IDLE');
    const [transcription, setTranscription] = useState<{ user: string; model: string }>({ user: '', model: '' });
    const [history, setHistory] = useState<{ role: 'user' | 'model'; content: string }[]>([]);

    const sessionRef = useRef<LiveSession | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const userTranscriptionRef = useRef('');
    const modelTranscriptionRef = useRef('');

    const cleanUp = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
            sessionRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
        }
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);
    
    useEffect(() => {
        return () => cleanUp();
    }, [cleanUp]);

    const startConversation = async () => {
        if (connectionState !== 'IDLE' && connectionState !== 'CLOSED' && connectionState !== 'ERROR') return;
        setConnectionState('CONNECTING');
        setHistory([]);
        setTranscription({ user: '', model: '' });
        userTranscriptionRef.current = '';
        modelTranscriptionRef.current = '';
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setConnectionState('CONNECTED');
                        inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
                        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                        
                        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const source = inputAudioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);

                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.outputTranscription) {
                            const text = message.serverContent.outputTranscription.text;
                            modelTranscriptionRef.current += text;
                            setTranscription(prev => ({...prev, model: modelTranscriptionRef.current}));
                        }
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            userTranscriptionRef.current += text;
                             setTranscription(prev => ({...prev, user: userTranscriptionRef.current}));
                        }
                        if (message.serverContent?.turnComplete) {
                            setHistory(prev => [...prev, {role: 'user', content: userTranscriptionRef.current}, {role: 'model', content: modelTranscriptionRef.current}])
                            setTranscription({ user: '', model: '' });
                            userTranscriptionRef.current = '';
                            modelTranscriptionRef.current = '';
                        }
                        
                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => audioSourcesRef.current.delete(source));
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setConnectionState('ERROR');
                        cleanUp();
                    },
                    onclose: () => {
                        setConnectionState('CLOSED');
                        cleanUp();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    systemInstruction: 'أنت مستشار تسويق صوتي لمنتج BrandERP. كن احترافياً، استمع جيداً لأسئلة المستخدم، وقدم نصائح تسويقية سريعة وفعالة بصوت واضح وواثق.',
                },
            });
            sessionRef.current = await sessionPromise;
        } catch (error) {
            console.error('Failed to start conversation:', error);
            setConnectionState('ERROR');
            cleanUp();
        }
    };

    const stopConversation = () => {
        if (sessionRef.current) {
            sessionRef.current.close();
        } else {
            cleanUp();
            setConnectionState('IDLE');
        }
    };

    const getButtonState = () => {
        switch (connectionState) {
            case 'IDLE':
            case 'CLOSED':
            case 'ERROR':
                return { text: 'بدء الاستشارة الصوتية', action: startConversation, color: 'bg-blue-600 hover:bg-blue-700' };
            case 'CONNECTING':
                return { text: 'جاري الاتصال...', action: () => {}, color: 'bg-yellow-600', disabled: true };
            case 'CONNECTED':
                return { text: 'إنهاء الاستشارة', action: stopConversation, color: 'bg-red-600 hover:bg-red-700' };
        }
    };
    
    const { text, action, color, disabled } = getButtonState();

    return (
        <div className="flex flex-col items-center text-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">المستشار الصوتي</h2>
            <p className="text-gray-400 mb-6">تحدث مباشرة مع خبير التسويق واحصل على استشارات فورية.</p>
            
            <button onClick={action} disabled={disabled} className={`px-8 py-4 text-lg text-white font-bold rounded-full transition-all duration-300 ${color} disabled:opacity-50 disabled:cursor-wait mb-6`}>
                {text}
            </button>
            
            <div className="w-full max-w-2xl min-h-[200px] bg-gray-900/50 p-4 rounded-lg">
                <p className="text-right text-blue-400 font-semibold">أنت: <span className="text-gray-200 font-normal">{transcription.user}</span></p>
                <p className="text-right text-indigo-400 font-semibold mt-2">الخبير: <span className="text-gray-200 font-normal">{transcription.model}</span></p>
            </div>

            <div className="mt-6 w-full max-w-2xl">
                 <h3 className="text-xl font-bold text-blue-300 mb-2">سجل المحادثة</h3>
                 <div className="space-y-2 text-right">
                     {history.map((item, index) => (
                         <p key={index} className={`${item.role === 'user' ? 'text-blue-400' : 'text-indigo-400'}`}>
                             <span className="font-bold capitalize">{item.role === 'user' ? 'أنت' : 'الخبير'}: </span>{item.content}
                         </p>
                     ))}
                 </div>
            </div>
            
        </div>
    );
};

export default VoiceConsultant;
