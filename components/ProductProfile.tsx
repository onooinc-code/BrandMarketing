import React, { useState } from 'react';
import type { ProductInfo } from '../types';

interface ProductProfileProps {
    productInfo: ProductInfo;
    setProductInfo: (info: ProductInfo) => void;
}

const ProductProfile: React.FC<ProductProfileProps> = ({ productInfo, setProductInfo }) => {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // State is already updated on change, this just gives user feedback
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <div className="flex flex-col items-center">
            <h2 className="text-2xl font-bold text-blue-300 mb-4">ملف المنتج</h2>
            <p className="text-gray-400 mb-6 text-center">أدخل معلومات منتجك الأساسية هنا ليستخدمها الذكاء الاصطناعي في توليد المحتوى والخطط. يتم الحفظ تلقائياً.</p>

            <div className="w-full max-w-2xl p-6 bg-gray-700/50 rounded-lg shadow-inner space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">اسم المنتج</label>
                    <input type="text" value={productInfo.name} readOnly className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">اسم الشركة</label>
                    <input type="text" value={productInfo.company} readOnly className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">وصف المنتج</label>
                    <textarea value={productInfo.description} onChange={e => setProductInfo({...productInfo, description: e.target.value})} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">الجمهور المستهدف</label>
                    <input type="text" value={productInfo.targetAudience} onChange={e => setProductInfo({...productInfo, targetAudience: e.target.value})} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">نقطة البيع الفريدة (USP)</label>
                    <input type="text" value={productInfo.usp} onChange={e => setProductInfo({...productInfo, usp: e.target.value})} className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>
            </div>

            <button
                onClick={handleSave}
                className="mt-6 px-8 py-3 bg-blue-600 text-white font-bold rounded-full transition-all duration-300 hover:bg-blue-700 flex items-center"
            >
                {saved ? 'تم الحفظ!' : 'تأكيد الحفظ'}
            </button>
        </div>
    );
};

export default ProductProfile;