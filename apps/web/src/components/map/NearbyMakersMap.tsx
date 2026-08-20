'use client';

import { useState, useEffect } from 'react';
import { createClient } from '../../lib/supabaseClient';
import { useGeoLocation } from '../../hooks/useGeoLocation';
import { MapPin, ShieldCheck, Navigation } from 'lucide-react';

interface Maker {
    id: string;
    full_name: string;
    avatar_url: string;
    distance_km: number;
    vendor_verified: boolean;
}

export default function NearbyMakersMap() {
    const supabase = createClient();
    const { lat, lng, loading: geoLoading } = useGeoLocation();
    const [makers, setMakers] = useState<Maker[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedMaker, setSelectedMaker] = useState<Maker | null>(null);

    useEffect(() => {
        if (lat && lng) {
            fetchNearbyMakers(lat, lng);
        }
    }, [lat, lng]);

    const fetchNearbyMakers = async (latitude: number, longitude: number) => {
        try {
            setLoading(true);
            const { data, error } = await supabase.rpc('find_nearby_makers', {
                lat: latitude,
                lng: longitude,
                radius_meters: 50000, // 50 km radius
            });

            if (error) throw error;
            setMakers(data || []);
        } catch (err) {
            console.error('Error fetching nearby makers:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white border border-[#E8E2D9] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#E8E2D9] flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-[#C85A32]" />
                    <h2 className="font-semibold text-sm text-[#1E1B18]">Nearby Verified Artisans (50km Radius)</h2>
                </div>
                <span className="text-xs font-mono bg-[#F3EFEA] text-[#6B635B] px-2 py-1 rounded">
                    {makers.length} Makers Found
                </span>
            </div>

            <div className="p-6 bg-[#FDFBF7] min-h-[220px] flex flex-col justify-center items-center">
                {loading || geoLoading ? (
                    <p className="text-xs text-[#6B635B] animate-pulse">Scanning PostGIS spatial indices for artisans...</p>
                ) : makers.length === 0 ? (
                    <p className="text-xs text-[#6B635B]">No verified artisans currently within 50 km of your coordinates.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                        {makers.map((maker) => (
                            <div
                                key={maker.id}
                                onClick={() => setSelectedMaker(maker)}
                                className="p-4 bg-white border border-[#E8E2D9] rounded-xl hover:border-[#C85A32]/40 transition-all cursor-pointer shadow-sm relative group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#F3EFEA] flex items-center justify-center font-bold text-[#C85A32] text-sm">
                                        {maker.full_name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <h4 className="font-medium text-xs text-[#1E1B18]">{maker.full_name}</h4>
                                            {maker.vendor_verified && (
                                                <ShieldCheck className="w-3.5 h-3.5 text-[#2C4A3E]" />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-[#6B635B] flex items-center gap-1 mt-0.5">
                                            <MapPin className="w-3 h-3 text-[#C85A32]" />
                                            {maker.distance_km} km away
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}