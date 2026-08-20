'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabaseClient';
import { useGeoLocation } from '../../../../hooks/useGeoLocation';
import { MapPin, Sparkles, ImagePlus, X, Upload } from 'lucide-react';

export default function NewProjectPage() {
    const router = useRouter();
    const supabase = createClient();
    const { lat, lng, loading: geoLoading } = useGeoLocation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [deadline, setDeadline] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setErrorMsg('Please select a valid image file (PNG, JPG, WEBP).');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setErrorMsg('Image size should be under 10MB.');
            return;
        }

        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            setSubmitting(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error('Please sign in to post a custom commission request.');
            }

            let uploadedImageUrl = imagePreview;

            // Attempt upload to Supabase Storage if file is present
            if (imageFile) {
                try {
                    const fileExt = imageFile.name.split('.').pop() || 'jpg';
                    const filePath = `commissions/${user.id}-${Date.now()}.${fileExt}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('verification_reels')
                        .upload(filePath, imageFile, { upsert: true });

                    if (!uploadError && uploadData) {
                        const { data: publicUrlData } = supabase.storage
                            .from('verification_reels')
                            .getPublicUrl(filePath);
                        if (publicUrlData?.publicUrl) {
                            uploadedImageUrl = publicUrlData.publicUrl;
                        }
                    }
                } catch (e) {
                    console.log('Using local image preview data:', e);
                }
            }

            // Convert coordinates to PostGIS WKT Point string
            const pointWkt = lat && lng ? `POINT(${lng} ${lat})` : null;

            // Append reference image marker to description to guarantee persistent preview
            const finalDescription = uploadedImageUrl
                ? `${description}\n\n[REFERENCE_IMAGE: ${uploadedImageUrl}]`
                : description;

            const insertPayload: any = {
                buyer_id: user.id,
                title,
                description: finalDescription,
                budget_min: parseFloat(budgetMin),
                budget_max: parseFloat(budgetMax),
                deadline: new Date(deadline).toISOString(),
                delivery_location: pointWkt,
                status: 'OPEN',
            };

            if (uploadedImageUrl) {
                insertPayload.image_url = uploadedImageUrl;
            }

            let newProjectId: string | null = null;

            try {
                const { data, error } = await supabase
                    .from('custom_projects')
                    .insert(insertPayload)
                    .select('id')
                    .single();

                if (!error && data) {
                    newProjectId = data.id;
                }
            } catch (insertErr) {
                // If table doesn't have image_url column, retry without it
                delete insertPayload.image_url;
                const { data, error } = await supabase
                    .from('custom_projects')
                    .insert(insertPayload)
                    .select('id')
                    .single();
                if (error) throw error;
                newProjectId = data?.id;
            }

            // Store in shared local cache so artisan dashboard sees the newly posted commission immediately
            if (typeof window !== 'undefined' && newProjectId) {
                try {
                    const cachedProjects = JSON.parse(localStorage.getItem('karigar_custom_projects_cache') || '[]');
                    const newCachedProj = {
                        id: newProjectId,
                        title,
                        description: finalDescription,
                        budget_min: parseFloat(budgetMin),
                        budget_max: parseFloat(budgetMax),
                        deadline: new Date(deadline).toISOString(),
                        status: 'OPEN',
                        image_url: uploadedImageUrl,
                        created_at: new Date().toISOString(),
                        buyer_id: user.id,
                        buyer: { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Client' },
                    };
                    localStorage.setItem('karigar_custom_projects_cache', JSON.stringify([newCachedProj, ...cachedProjects]));
                } catch (e) {}
            }

            if (newProjectId) {
                router.push(`/projects/${newProjectId}`);
            } else {
                router.push('/projects');
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'Failed to create project request.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6">
            <div className="max-w-2xl mx-auto bg-white border border-[#E8E2D9] rounded-xl p-8 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2 text-[#C85A32] mb-2 font-medium text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span>Bespoke Commission</span>
                </div>
                <h1 className="text-2xl font-bold text-[#1E1B18] mb-2 font-display">
                    Post a Custom Artisan Project
                </h1>
                <p className="text-sm text-[#6B635B] mb-6">
                    Describe your dream handmade piece. Nearby verified makers will review your requirements and submit bids.
                </p>

                {errorMsg && (
                    <div className="mb-6 p-3 bg-[#FDEDED] border border-[#F5C2C7] text-[#D32F2F] text-xs rounded-lg">
                        {errorMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                            Project Title
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Hand-carved Walnut Dining Table"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full h-10 px-3.5 border border-[#E8E2D9] rounded-lg text-sm focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                            Detailed Specifications & Material Preferences
                        </label>
                        <textarea
                            required
                            rows={4}
                            placeholder="Specify dimensions, wood/fabric types, finish, and custom engraving requests..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full p-3.5 border border-[#E8E2D9] rounded-lg text-sm focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none"
                        />
                    </div>

                    {/* Reference Sketches or Inspiration Photos upload section */}
                    <div>
                        <label className="block text-xs font-semibold text-[#1E1B18] mb-1.5">
                            Reference Sketches or Inspiration Photos <span className="text-[#6B635B] font-normal">(optional)</span>
                        </label>
                        <p className="text-[11px] text-[#6B635B] mb-2.5">
                            Upload a design sketch, blueprint, or reference photo to help artisans quote accurate milestone estimates.
                        </p>

                        <div className="flex items-center gap-3">
                            {!imagePreview ? (
                                <label className="w-20 h-20 border-2 border-dashed border-[#D4C8B8] hover:border-[#C85A32] rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all bg-[#FAF8F5] hover:bg-[#F3EFEA] group">
                                    <input
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp,image/jpg"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                    <ImagePlus className="w-5 h-5 text-[#8C827A] group-hover:text-[#C85A32] transition-colors" />
                                    <span className="text-[11px] text-[#8C827A] group-hover:text-[#C85A32] mt-1 font-medium">Add</span>
                                </label>
                            ) : (
                                <div className="relative w-24 h-24 rounded-xl border border-[#E8E2D9] overflow-hidden shadow-xs group bg-[#FAF8F5]">
                                    <img
                                        src={imagePreview}
                                        alt="Sketch preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                                        title="Remove photo"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}

                            {imageFile && (
                                <div className="text-xs text-[#6B635B]">
                                    <p className="font-semibold text-[#1E1B18] truncate max-w-[200px]">{imageFile.name}</p>
                                    <p className="text-[11px] text-[#2E7D32] flex items-center gap-1 mt-0.5">
                                        <span>✓ Ready to attach</span>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                Min Budget (INR)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    placeholder="5000"
                                    value={budgetMin}
                                    onChange={(e) => setBudgetMin(e.target.value)}
                                    className="w-full h-10 px-3.5 border border-[#E8E2D9] rounded-lg text-sm focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                Max Budget (INR)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    required
                                    placeholder="15000"
                                    value={budgetMax}
                                    onChange={(e) => setBudgetMax(e.target.value)}
                                    className="w-full h-10 px-3.5 border border-[#E8E2D9] rounded-lg text-sm focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                Target Deadline
                            </label>
                            <input
                                type="date"
                                required
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                                className="w-full h-10 px-3.5 border border-[#E8E2D9] rounded-lg text-sm focus:border-[#C85A32] focus:ring-2 focus:ring-[#C85A32]/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#1E1B18] mb-2">
                                Delivery Coordinates (PostGIS)
                            </label>
                            <div className="h-10 px-3.5 bg-[#F3EFEA] border border-[#E8E2D9] rounded-lg text-xs flex items-center gap-2 text-[#6B635B]">
                                <MapPin className="w-4 h-4 text-[#C85A32]" />
                                {geoLoading ? 'Detecting coordinates...' : `${lat?.toFixed(4)}, ${lng?.toFixed(4)}`}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="mt-4 w-full bg-[#C85A32] hover:bg-[#B04B26] text-white py-2.5 rounded-lg text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                        {submitting ? 'Publishing Commission...' : 'Publish Project Request'}
                    </button>
                </form>
            </div>
        </main>
    );
}