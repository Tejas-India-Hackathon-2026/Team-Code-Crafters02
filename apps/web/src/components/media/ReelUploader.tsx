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
    Sparkles,
    ArrowRight,
    Clock,
    LayoutDashboard,
} from 'lucide-react';
import Link from 'next/link';
import { KintoCard, KintoBadge } from '../ui/kinto-card';
import { AnimatedNumber } from '../ui/animated-number';

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

export interface ReelUploaderProps { defaultCategory?: string }

export default function ReelUploader({ defaultCategory }: ReelUploaderProps): React.ReactNode {
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
    const [resultData, setResultData] = useState<any | null>(null);

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

            if (!uploadResult.success && uploadResult.status !== 'PENDING_ADMIN_REVIEW') {
                throw new Error(uploadResult.error || 'Upload failed.');
            }

            setResultData(uploadResult);
            setStatusMessage(
                uploadResult.status === 'VERIFIED'
                    ? '✓ Reel verified & published live!'
                    : '⏳ Reel queued for admin review (85%-90% confidence).'
            );
        } catch (err: any) {
            console.error('Upload Error:', err);
            setStatusMessage(`Error: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    if (resultData) {
        const score = resultData.confidenceScore ? Math.round(resultData.confidenceScore * 100) : 90;
        const isVerified = resultData.status === 'VERIFIED' || resultData.isAutoApproved;
        const isPendingReview = resultData.status === 'PENDING_ADMIN_REVIEW' || resultData.isPendingAdminReview;
        const summary = resultData.aiSummary || 'AI evaluated the craftsmanship and branding.';

        return (
            <KintoCard glow className="p-8 text-center w-full max-w-lg animate-slide-up shadow-xl border-stone-200/80">
                {/* Status Icon */}
                <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                        isVerified
                            ? 'bg-[#EDF7ED] text-[#2E7D32]'
                            : isPendingReview
                            ? 'bg-[#FFF4E5] text-[#ED6C02]'
                            : 'bg-[#FDEDED] text-[#D32F2F]'
                    }`}
                >
                    {isVerified ? (
                        <CheckCircle2 className="w-8 h-8" />
                    ) : isPendingReview ? (
                        <Clock className="w-8 h-8" />
                    ) : (
                        <AlertCircle className="w-8 h-8" />
                    )}
                </div>

                {/* Score & Tier Badge */}
                <div className="inline-flex items-center gap-1.5 mb-3">
                    <KintoBadge
                        variant={isVerified ? 'success' : isPendingReview ? 'warning' : 'danger'}
                        dot={true}
                    >
                        <span className="flex items-center gap-1">
                            {isVerified ? (
                                <>
                                    ✓ <AnimatedNumber value={score} suffix="%" /> AI Confidence (Auto-Verified)
                                </>
                            ) : isPendingReview ? (
                                <>
                                    ⏳ <AnimatedNumber value={score} suffix="%" /> AI Score (HITL Queue)
                                </>
                            ) : (
                                <>
                                    ❌ <AnimatedNumber value={score} suffix="%" /> AI Score (Below 85%)
                                </>
                            )}
                        </span>
                    </KintoBadge>
                </div>

                {/* Heading */}
                <h2 className="text-xl font-bold text-stone-950 font-display mb-2">
                    {isVerified
                        ? 'Product Reel Published & Verified!'
                        : isPendingReview
                        ? 'Video in Admin Review Queue'
                        : 'AI Verification Rejected'}
                </h2>

                {/* Description */}
                <p className="text-xs text-stone-600 mb-6 leading-relaxed">
                    {isVerified ? (
                        <>
                            Gemini Multimodal Vision authenticated your craftsmanship and maker branding. Assigned batch watermark{' '}
                            <span className="font-mono font-bold text-[#C85A32]">
                                {resultData.reel?.extracted_metadata?.batch_marking || '#01/50'}
                            </span>
                            . Your reel is now live on the marketplace feed!
                        </>
                    ) : isPendingReview ? (
                        <>
                            Your video scored in the medium confidence band (85%–89.9%). It has been safely uploaded and submitted to our human triage team for rapid review. You will be notified once approved.
                        </>
                    ) : (
                        <>
                            <strong className="text-[#D32F2F] block mb-1">Reason: {summary}</strong>
                            To protect marketplace authenticity, all videos must genuinely showcase the physical workshop craft process matching your registered brand logo.
                        </>
                    )}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {isVerified && (
                        <Link
                            href="/verification/feed"
                            className="btn-primary text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 font-semibold font-mono shadow-xs hover:shadow-md transition-all"
                        >
                            <span>View in Marketplace Feed</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    )}
                    {isPendingReview && (
                        <Link
                            href="/dashboard"
                            className="btn-primary text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 font-semibold font-mono shadow-xs hover:shadow-md transition-all"
                        >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            <span>Go to Maker Dashboard</span>
                        </Link>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            setResultData(null);
                            setFile(null);
                            setProductTitle('');
                            setPrice('');
                            setDescription('');
                            setProgress(0);
                            setStatusMessage('');
                        }}
                        className="btn-ghost text-xs py-2.5 px-5 rounded-full bg-white border border-stone-200/90 text-stone-700 hover:bg-stone-100 transition-all font-mono"
                    >
                        {isVerified || isPendingReview ? 'Upload Another Product' : 'Try Again'}
                    </button>
                </div>
            </KintoCard>
        );
    }

    return (
        <form onSubmit={handleUpload} aria-label="Artisan product details and reel upload form" className="w-full max-w-lg">
            <KintoCard glow className="p-6 sm:p-7 flex flex-col gap-4 border-stone-200/80">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-stone-950 font-display uppercase tracking-wider">
                        Product Details & Process Reel
                    </h2>
                    <KintoBadge variant="brand">
                        Tiered AI Inspection
                    </KintoBadge>
                </div>

                {/* Tier Guidelines Helper Box */}
                <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-3.5 text-[11px] text-stone-600 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-stone-900 font-semibold font-mono text-[10px] uppercase tracking-wider">
                        <span>AI Confidence Tier Thresholds:</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-0.5 text-[10px] text-center font-mono font-medium">
                        <span className="bg-[#FDEDED]/80 text-[#D32F2F] border border-[#D32F2F]/20 p-1 rounded-lg">{'< 85%: Reject'}</span>
                        <span className="bg-[#FFF4E5]/80 text-[#ED6C02] border border-[#ED6C02]/20 p-1 rounded-lg">{'85-89%: HITL Review'}</span>
                        <span className="bg-[#EDF7ED]/80 text-[#2E7D32] border border-[#2E7D32]/20 p-1 rounded-lg">{'≥ 90%: Auto-Verify'}</span>
                    </div>
                </div>

                {/* 1. Product Title */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-900 mb-1.5 font-mono">
                        Product Name / Title <span className="text-[#D32F2F]">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Package className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                        <input
                            type="text"
                            required
                            placeholder="e.g. Royal Hand-Carved Sheesham Chair"
                            value={productTitle}
                            onChange={(e) => setProductTitle(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base bg-white/90 border-stone-200/90 rounded-xl"
                        />
                    </div>
                </div>

                {/* 2. Craft Category */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-900 mb-1.5 font-mono">
                        Product Craft Category <span className="text-[#D32F2F]">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <Tag className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            style={{ paddingLeft: '2.5rem' }}
                            className="input-base bg-white/90 border-stone-200/90 rounded-xl cursor-pointer"
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
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-900 mb-1.5 font-mono">
                            Price (INR ₹)
                        </label>
                        <div className="relative flex items-center">
                            <DollarSign className="absolute left-3.5 w-4 h-4 text-stone-400 pointer-events-none" />
                            <input
                                type="number"
                                placeholder="e.g. 2400"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                style={{ paddingLeft: '2.5rem' }}
                                className="input-base bg-white/90 border-stone-200/90 rounded-xl font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-900 mb-1.5 font-mono">
                            Item Description
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. Seasoned teak, hand-polished"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="input-base bg-white/90 border-stone-200/90 rounded-xl"
                        />
                    </div>
                </div>

                {/* 4. 9:16 Video File Dropzone */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-900 mb-1.5 font-mono">
                        Upload 9:16 Workshop Video <span className="text-[#D32F2F]">*</span>
                    </label>
                    <div className="border-2 border-dashed border-stone-300 hover:border-[#C85A32]/60 bg-stone-50/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center transition-all">
                        <UploadCloud className="w-10 h-10 text-[#C85A32] mb-2" />
                        <p className="text-xs font-bold text-stone-900">
                            {file ? file.name : 'Select 9:16 Vertical Video (30–60s)'}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-1 max-w-xs leading-normal">
                            MP4 / MOV up to 100 MB. Ensure physical stamp/logo or on-screen watermark is visible.
                        </p>
                        <label className="btn-ghost text-xs py-1.5 px-4 mt-3 rounded-full bg-white border border-stone-200 shadow-2xs cursor-pointer hover:bg-stone-100 transition-all font-mono">
                            {file ? 'Change Video' : 'Choose Video File'}
                            <input
                                id="reel-video-file-input"
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
                        <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-[#C85A32] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-stone-500 mt-1 font-mono">
                            <span>{progress < 100 ? 'Uploading video...' : 'Gemini AI calculating tiered confidence...'}</span>
                            <span>{progress}%</span>
                        </div>
                    </div>
                )}

                {/* Status Message */}
                {statusMessage && (
                    <p className={`text-xs p-3 rounded-xl text-center font-medium font-mono ${
                        statusMessage.startsWith('Error')
                            ? 'bg-[#FDEDED] text-[#D32F2F] border border-[#F5C2C7]'
                            : 'bg-stone-50 text-stone-900 border border-stone-200'
                    }`}>
                        {statusMessage}
                    </p>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={!file || uploading}
                    className="btn-primary w-full py-3.5 mt-1 font-semibold text-sm rounded-full cursor-pointer disabled:opacity-50 shadow-xs hover:shadow-md transition-all font-mono"
                >
                    {uploading ? 'Analyzing Craftsmanship...' : 'Upload & Verify Product Reel'}
                </button>
            </KintoCard>
        </form>
    );
}