'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabaseClient';
import {
    UploadCloud,
    CheckCircle2,
    AlertCircle,
    Package,
    Tag,
    DollarSign,
    FileText,
    Sparkles,
    Check,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const CRAFT_CATEGORIES = [
    { id: 'woodworking', label: 'Woodworking & Carving', icon: '🪵' },
    { id: 'pottery', label: 'Pottery & Ceramics', icon: '🏺' },
    { id: 'handloom', label: 'Handloom & Textiles', icon: '🧵' },
    { id: 'metalcraft', label: 'Metalcraft & Brassware', icon: '🪚' },
    { id: 'leathercraft', label: 'Leathercraft', icon: '👜' },
    { id: 'jewelry', label: 'Handmade Jewelry', icon: '💍' },
    { id: 'stonecraft', label: 'Stone & Marble Craft', icon: '🗿' },
    { id: 'painting', label: 'Traditional Painting & Folk Art', icon: '🎨' },
    { id: 'bamboo', label: 'Bamboo & Cane Craft', icon: '🎋' },
    { id: 'terracotta', label: 'Terracotta & Clay Art', icon: '🪴' },
    { id: 'embroidery', label: 'Embroidery & Zardozi', icon: '🪡' },
    { id: 'glasscraft', label: 'Glass & Mosaic Craft', icon: '✨' },
];

export default function ReelUploader({ defaultCategory }: { defaultCategory?: string }) {
    const supabase = createClient();

    const [user, setUser] = useState<any>(null);
    const [file, setFile] = useState<File | null>(null);
    const [productTitle, setProductTitle] = useState('');
    const [category, setCategory] = useState(defaultCategory || 'woodworking');
    const [price, setPrice] = useState('');
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState<number>(0);
    const [uploading, setUploading] = useState<boolean>(false);
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [successReel, setSuccessReel] = useState<any | null>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUser(data.user);
        });
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setStatusMessage('Please select a 9:16 video file to upload.');
            return;
        }

        if (!productTitle.trim()) {
            setStatusMessage('Please provide a product title for this reel.');
            return;
        }

        try {
            setUploading(true);
            setProgress(15);
            setStatusMessage('Uploading video directly to storage...');

            const formData = new FormData();
            formData.append('video', file);
            formData.append('productTitle', productTitle.trim());
            formData.append('category', category);
            formData.append('price', price || '0');
            formData.append('description', description.trim());
            if (user) {
                formData.append('userId', user.id);
            }

            // Direct upload with XHR for smooth progress bar animation
            const uploadResult = await new Promise<any>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', '/api/vendor/reels/upload', true);

                xhr.upload.onprogress = (evt) => {
                    if (evt.lengthComputable) {
                        const pct = Math.round((evt.loaded / evt.total) * 85);
                        setProgress(Math.max(15, pct));
                    }
                };

                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const res = JSON.parse(xhr.responseText);
                            setProgress(100);
                            resolve(res);
                        } catch (err) {
                            reject(new Error('Invalid response from upload server.'));
                        }
                    } else {
                        try {
                            const errRes = JSON.parse(xhr.responseText);
                            reject(new Error(errRes.error || `Upload failed with status ${xhr.status}`));
                        } catch {
                            reject(new Error(`Upload failed with status ${xhr.status}`));
                        }
                    }
                };

                xhr.onerror = () => reject(new Error('Network connection error during upload.'));
                xhr.send(formData);
            });

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed.');
            }

            setSuccessReel(uploadResult.reel || { productTitle, category, price });
            setStatusMessage('✓ Reel published & verified successfully!');
        } catch (err: any) {
            console.error('Upload Error:', err);
            setStatusMessage(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (successReel) {
        const score = successReel.confidence_score ? Math.round(successReel.confidence_score * 100) : 10;
        const isAutoApproved = successReel.status === 'AUTO_APPROVED' && score >= 85;
        const summary = successReel.extracted_metadata?.summary || 'AI evaluated the video content.';

        return (
            <div className="card p-8 bg-white text-center w-full max-w-lg animate-slide-up shadow-card border border-[#E8E2D9]">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    isAutoApproved ? 'bg-[#EDF7ED] text-[#2E7D32]' : 'bg-[#FDEDED] text-[#D32F2F]'
                }`}>
                    {isAutoApproved ? <CheckCircle2 className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 ${
                    isAutoApproved ? 'bg-[#EDF7ED] text-[#2E7D32]' : 'bg-[#FDEDED] text-[#D32F2F]'
                }`}>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAutoApproved ? `✓ ${score}% AI Verified (≥85% Threshold Met)` : `❌ ${score}% AI Score (Below 85% Threshold)`}</span>
                </div>

                <h2 className="text-xl font-bold text-[#1E1B18] font-display mb-2">
                    {isAutoApproved ? 'Product Reel Published & Verified!' : 'AI Verification Rejected'}
                </h2>
                <p className="text-xs text-[#6B635B] mb-6 leading-relaxed">
                    {isAutoApproved ? (
                        <>
                            Gemini 3.6 Flash inspected your video and authenticated physical workshop craftsmanship and maker branding. Assigned batch watermark <span className="font-mono font-bold text-[#C85A32]">{successReel.extracted_metadata?.batch_marking || '#01/50'}</span>.
                        </>
                    ) : (
                        <>
                            <strong className="text-[#D32F2F] block mb-1">Reason: {summary}</strong>
                            To protect marketplace authenticity, all videos must genuinely showcase the physical workshop craft process (chiseling, pottery wheel, weaving, hammering) matching your registered brand logo.
                        </>
                    )}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {isAutoApproved ? (
                        <Link
                            href="/verification/feed"
                            className="btn-primary text-xs py-2.5 px-5 flex items-center justify-center gap-1.5 font-semibold"
                        >
                            <span>View in Marketplace Feed</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessReel(null);
                                setFile(null);
                                setProductTitle('');
                                setPrice('');
                                setDescription('');
                                setProgress(0);
                                setStatusMessage('');
                            }}
                            className="btn-primary text-xs py-2.5 px-5 font-semibold"
                        >
                            Try Again with Authentic Workshop Video
                        </button>
                    )}
                    {isAutoApproved && (
                        <button
                            type="button"
                            onClick={() => {
                                setSuccessReel(null);
                                setFile(null);
                                setProductTitle('');
                                setPrice('');
                                setDescription('');
                                setProgress(0);
                                setStatusMessage('');
                            }}
                            className="btn-ghost text-xs py-2.5 px-5"
                        >
                            Upload Another Product
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleUpload} className="card p-6 bg-white w-full max-w-lg shadow-card border border-[#E8E2D9] flex flex-col gap-4">
            <h2 className="text-sm font-bold text-[#1E1B18] font-display uppercase tracking-wider">
                Product Details & Process Reel
            </h2>

            {/* 1. Product Title */}
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                    Product Name / Title <span className="text-[#D32F2F]">*</span>
                </label>
                <div className="relative flex items-center">
                    <Package className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                    <input
                        type="text"
                        required
                        placeholder="e.g. Royal Hand-Carved Sheesham Chair"
                        value={productTitle}
                        onChange={(e) => setProductTitle(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                        className="input-base"
                    />
                </div>
            </div>

            {/* 2. Craft Category */}
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                    Product Craft Category <span className="text-[#D32F2F]">*</span>
                </label>
                <div className="relative flex items-center">
                    <Tag className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        style={{ paddingLeft: '2.5rem' }}
                        className="input-base cursor-pointer"
                    >
                        {CRAFT_CATEGORIES.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.icon} {cat.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3. Estimated Price & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                        Price (INR ₹)
                    </label>
                    <div className="relative flex items-center">
                        <DollarSign className="absolute left-3.5 w-4 h-4 text-[#6B635B] pointer-events-none" />
                        <input
                            type="number"
                            placeholder="e.g. 2400"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                        Item Description
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Seasoned teak, hand-polished"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-base"
                    />
                </div>
            </div>

            {/* 4. 9:16 Video File Dropzone */}
            <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-1.5">
                    Upload 9:16 Workshop Video <span className="text-[#D32F2F]">*</span>
                </label>
                <div className="border-2 border-dashed border-[#E8E2D9] hover:border-[#C85A32]/60 bg-[#FDFBF7] rounded-xl p-5 text-center flex flex-col items-center justify-center transition-colors">
                    <UploadCloud className="w-10 h-10 text-[#C85A32] mb-2" />
                    <p className="text-xs font-bold text-[#1E1B18]">
                        {file ? file.name : 'Select 9:16 Vertical Video (30–60s)'}
                    </p>
                    <p className="text-[10px] text-[#6B635B] mt-0.5">
                        MP4 / MOV up to 100 MB. Ensure physical stamp/logo is clearly visible.
                    </p>
                    <label className="btn-ghost text-xs py-1.5 px-4 mt-3 cursor-pointer">
                        {file ? 'Change Video' : 'Choose Video File'}
                        <input
                            type="file"
                            required
                            accept="video/mp4,video/quicktime,video/webm"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* Upload Progress Bar */}
            {uploading && (
                <div className="w-full">
                    <div className="w-full bg-[#F3EFEA] rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-[#C85A32] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#6B635B] mt-1">
                        <span>{progress < 100 ? 'Uploading video...' : 'AI verifying logo & stamps...'}</span>
                        <span>{progress}%</span>
                    </div>
                </div>
            )}

            {/* Status Message */}
            {statusMessage && (
                <p className={`text-xs p-2.5 rounded-lg text-center font-medium ${
                    statusMessage.startsWith('Error')
                        ? 'bg-[#FDEDED] text-[#D32F2F] border border-[#F5C2C7]'
                        : 'bg-[#FDFBF7] text-[#1E1B18] border border-[#E8E2D9]'
                }`}>
                    {statusMessage}
                </p>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={!file || uploading}
                className="btn-primary w-full py-3 mt-1 font-semibold text-sm cursor-pointer disabled:opacity-50"
            >
                {uploading ? 'Uploading & Verifying...' : 'Upload & Verify Product Reel'}
            </button>
        </form>
    );
}