'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../../../lib/supabaseClient';
import { useGeoLocation } from '../../../../hooks/useGeoLocation';
import { MapPin, Sparkles } from 'lucide-react';

export default function NewProjectPage() {
    const router = useRouter();
    const supabase = createClient();
    const { lat, lng, loading: geoLoading } = useGeoLocation();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');
    const [deadline, setDeadline] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            setSubmitting(true);
            const { data: { user }, error: authError } = await supabase.auth.getUser();

            if (authError || !user) {
                throw new Error('Please sign in to post a custom commission request.');
            }

            // Convert coordinates to PostGIS WKT Point string
            const pointWkt = lat && lng ? `POINT(${lng} ${lat})` : null;

            const { data, error } = await supabase
                .from('custom_projects')
                .insert({
                    buyer_id: user.id,
                    title,
                    description,
                    budget_min: parseFloat(budgetMin),
                    budget_max: parseFloat(budgetMax),
                    deadline: new Date(deadline).toISOString(),
                    delivery_location: pointWkt,
                    status: 'OPEN',
                })
                .select('id')
                .single();

            if (error) throw error;

            router.push(`/projects/${data.id}`);
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