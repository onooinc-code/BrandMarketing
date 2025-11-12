import React, { useState, useEffect, useCallback } from 'react';
import type { ActiveTab, AppState, ProductInfo, ChatMessage, PostGeneratorState, AdCreativeState, VoiceConsultantState } from './types';
import ProductProfile from './components/ProductProfile';
import MarketingChatbot from './components/MarketingChatbot';
import PostGenerator from './components/PostGenerator';
import AdCreativeGenerator from './components/AdCreativeGenerator';
import VoiceConsultant from './components/VoiceConsultant';
import IdentityManager from './components/IdentityManager';

const OnooIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16a4 4 R0 100-8 4 4 0 000 8z" />
    </svg>
);

const initialAppState: AppState = {
    productInfo: {
        name: 'BrandERP',
        company: 'Onoo-اونو',
        description: 'نظام ERP متكامل لإدارة موارد الشركات بفاعلية.',
        targetAudience: 'الشركات المتوسطة والكبيرة في قطاع الصناعة والتجزئة.',
        usp: 'سهولة الاستخدام والتخصيص مع دعم فني على مدار الساعة.'
    },
    chatHistory: [{ role: 'model', content: "أهلاً بك! أنا خبير التسويق الرقمي لـ BrandERP. كيف يمكنني مساعدتك في خطتك التسويقية اليوم؟" }],
    postGenerator: {
        goal: 'زيادة الوعي بالعلامة التجارية',
        topic: '',
        post: '',
        image: null,
        placement: '1:1'
    },
    adCreative: {
        prompt: '',
        image: null,
        placement: '16:9'
    },
    voiceConsultant: {
        history: [],
    },
    logos: {
        brandErp: null,
        onoo: null,
    },
    activeTab: 'PRODUCT_PROFILE',
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>(initialAppState);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

    // Load state on initial render: try server first, then localStorage
    useEffect(() => {
        const loadProject = async () => {
            let loadedState = null;
            try {
                const response = await fetch('/api/project');
                if (response.ok) {
                    loadedState = await response.json();
                    console.log("Project loaded from server.");
                } else if (response.status === 404) {
                    console.log("No project on server, trying localStorage.");
                    const savedState = localStorage.getItem('onooMarketingAIState');
                    if (savedState) {
                        loadedState = JSON.parse(savedState);
                        console.log("Project loaded from localStorage.");
                    }
                } else {
                    console.error(`Server responded with status: ${response.status}`);
                }
            } catch (error) {
                console.error("Failed to load project from server, falling back to localStorage:", error);
                const savedState = localStorage.getItem('onooMarketingAIState');
                if (savedState) {
                   try {
                       loadedState = JSON.parse(savedState);
                   } catch (e) {
                       console.error("Failed to parse state from localStorage", e);
                   }
                }
            }
    
            if (loadedState) {
                // Ensure the loaded state is valid and has the correct structure.
                // This prevents errors from old/corrupted saved data and solves the bug.
                const validatedState: AppState = {
                    ...initialAppState,
                    ...loadedState,
                    productInfo: { ...initialAppState.productInfo, ...(loadedState.productInfo || {}) },
                    chatHistory: Array.isArray(loadedState.chatHistory) ? loadedState.chatHistory : initialAppState.chatHistory,
                    postGenerator: { ...initialAppState.postGenerator, ...(loadedState.postGenerator || {}) },
                    adCreative: { ...initialAppState.adCreative, ...(loadedState.adCreative || {}) },
                    voiceConsultant: { ...initialAppState.voiceConsultant, ...(loadedState.voiceConsultant || {}) },
                    logos: { ...initialAppState.logos, ...(loadedState.logos || {}) },
                    activeTab: loadedState.activeTab || initialAppState.activeTab
                };
                setAppState(validatedState);
            }
        };
    
        loadProject();
    }, []);

    // Save state to localStorage as a backup whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('onooMarketingAIState', JSON.stringify(appState));
        } catch (error) {
            console.error("Failed to save state to localStorage", error);
        }
    }, [appState]);

    const handleSaveToServer = useCallback(async () => {
        setSaveStatus('saving');
        try {
            const response = await fetch('/api/project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appState),
            });
            if (!response.ok) {
                throw new Error('Failed to save to server');
            }
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        } catch (error) {
            console.error("Save failed:", error);
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }
    }, [appState]);

    const setActiveTab = (tab: ActiveTab) => {
        setAppState(prev => ({...prev, activeTab: tab}));
    }

    const handleLogoSave = (logoType: 'brandErp' | 'onoo', imageUrl: string) => {
        setAppState(prev => ({
            ...prev,
            logos: {
                ...prev.logos,
                [logoType]: imageUrl
            }
        }));
    };

    const handleExport = () => {
        const jsonString = JSON.stringify(appState, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'onoo-marketing-project-backup.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const text = e.target?.result;
                    if (typeof text === 'string') {
                        const importedState = JSON.parse(text);
                        setAppState(importedState);
                        alert("تم استيراد النسخة الاحتياطية بنجاح. اضغط على 'حفظ المشروع' لرفعها للسيرفر.");
                    }
                } catch (error) {
                    console.error("Failed to import project file", error);
                    alert("الملف غير صالح أو تالف.");
                }
            };
            reader.readAsText(file);
        }
    };

    const renderContent = () => {
        switch (appState.activeTab) {
            case 'PRODUCT_PROFILE':
                return <ProductProfile 
                            productInfo={appState.productInfo} 
                            setProductInfo={(info: ProductInfo) => setAppState(p => ({...p, productInfo: info}))} 
                       />;
            case 'CHATBOT':
                return <MarketingChatbot 
                            messages={appState.chatHistory}
                            setMessages={(msgs: ChatMessage[]) => setAppState(p => ({...p, chatHistory: msgs}))}
                       />;
            case 'POST_GENERATOR':
                return <PostGenerator 
                            brandErpLogo={appState.logos.brandErp} 
                            onooLogo={appState.logos.onoo}
                            postState={appState.postGenerator}
                            setPostState={(state: PostGeneratorState) => setAppState(p => ({...p, postGenerator: state}))}
                        />;
            case 'AD_CREATIVE':
                return <AdCreativeGenerator 
                            brandErpLogo={appState.logos.brandErp} 
                            onooLogo={appState.logos.onoo}
                            adState={appState.adCreative}
                            setAdState={(state: AdCreativeState) => setAppState(p => ({...p, adCreative: state}))}
                       />;
            case 'VOICE_CONSULTANT':
                return <VoiceConsultant 
                            voiceState={appState.voiceConsultant}
                            setVoiceState={(state: VoiceConsultantState) => setAppState(p => ({...p, voiceConsultant: state}))}
                       />;
            case 'IDENTITY_MANAGER':
                return <IdentityManager onLogoSave={handleLogoSave} savedLogos={appState.logos} />;
            default:
                return <ProductProfile 
                            productInfo={appState.productInfo} 
                            setProductInfo={(info: ProductInfo) => setAppState(p => ({...p, productInfo: info}))} 
                        />;
        }
    };

    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => {
        const isActive = appState.activeTab === tab;
        return (
            <button
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-2 text-xs md:text-sm font-medium text-center transition-all duration-300 ${
                    isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
                {label}
            </button>
        );
    };

    const getSaveButtonContent = () => {
        switch (saveStatus) {
            case 'saving':
                return <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>جاري الحفظ...</>;
            case 'saved':
                return 'تم الحفظ!';
            case 'error':
                return 'فشل الحفظ';
            default:
                return 'حفظ المشروع';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 font-sans" style={{fontFamily: 'Tahoma, sans-serif'}}>
            <div className="container mx-auto p-4 max-w-5xl">
                <header className="text-center mb-6 py-4">
                    <div className="flex items-center justify-center text-4xl font-bold text-blue-400">
                        <h1>خبير تسويق أونو</h1>
                        <OnooIcon />
                    </div>
                    <p className="text-blue-200 mt-2">مساعدك الذكي لتسويق BrandERP بفاعلية</p>
                </header>

                <main>
                    <div className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                        <div className="flex w-full rounded-t-xl overflow-hidden">
                            <TabButton tab="PRODUCT_PROFILE" label="ملف المنتج" />
                            <TabButton tab="IDENTITY_MANAGER" label="إدارة الهوية" />
                            <TabButton tab="CHATBOT" label="خبير الدردشة" />
                            <TabButton tab="POST_GENERATOR" label="مولد المنشورات" />
                            <TabButton tab="AD_CREATIVE" label="مولد الإعلانات" />
                            <TabButton tab="VOICE_CONSULTANT" label="المستشار الصوتي" />
                        </div>
                        <div className="p-4 md:p-8">
                            {renderContent()}
                        </div>
                    </div>
                </main>
                 <footer className="text-center text-gray-500 mt-8 text-sm">
                    <p>مدعوم بواسطة Google Gemini. تم التطوير باستخدام React و Tailwind CSS.</p>
                     <div className="mt-4 flex flex-wrap justify-center items-center gap-4">
                        <button 
                            onClick={handleSaveToServer}
                            disabled={saveStatus === 'saving'}
                            className={`px-4 py-2 rounded-md transition-colors w-40 text-white flex items-center justify-center
                                ${saveStatus === 'idle' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                                ${saveStatus === 'saving' ? 'bg-yellow-600 cursor-not-allowed' : ''}
                                ${saveStatus === 'saved' ? 'bg-green-600' : ''}
                                ${saveStatus === 'error' ? 'bg-red-600' : ''}
                            `}
                        >
                            {getSaveButtonContent()}
                        </button>
                        <button onClick={handleExport} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">تصدير نسخة احتياطية</button>
                        <label className="cursor-pointer px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors">
                            استيراد نسخة احتياطية
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default App;