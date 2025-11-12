import React, { useState } from 'react';
import type { ActiveTab } from './types';
import ProductProfile from './components/PlantIdentifier';
import MarketingChatbot from './components/GardeningChatbot';
import PostGenerator from './components/ImageEditor';
import AdCreativeGenerator from './components/ImageGenerator';
import VoiceConsultant from './components/VoiceAssistant';
import IdentityManager from './components/IdentityManager';

const OnooIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M12 6V3m0 18v-3" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
);

const App: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('PRODUCT_PROFILE');
    const [brandErpLogo, setBrandErpLogo] = useState<string | null>(null);
    const [onooLogo, setOnooLogo] = useState<string | null>(null);

    const handleLogoSave = (logoType: 'brandErp' | 'onoo', imageUrl: string) => {
        if (logoType === 'brandErp') {
            setBrandErpLogo(imageUrl);
        } else {
            setOnooLogo(imageUrl);
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'PRODUCT_PROFILE':
                return <ProductProfile />;
            case 'CHATBOT':
                return <MarketingChatbot />;
            case 'POST_GENERATOR':
                return <PostGenerator brandErpLogo={brandErpLogo} onooLogo={onooLogo} />;
            case 'AD_CREATIVE':
                return <AdCreativeGenerator brandErpLogo={brandErpLogo} onooLogo={onooLogo} />;
            case 'VOICE_CONSULTANT':
                return <VoiceConsultant />;
            case 'IDENTITY_MANAGER':
                return <IdentityManager onLogoSave={handleLogoSave} />;
            default:
                return <ProductProfile />;
        }
    };

    const TabButton = ({ tab, label }: { tab: ActiveTab; label: string }) => {
        const isActive = activeTab === tab;
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
                </footer>
            </div>
        </div>
    );
};

export default App;