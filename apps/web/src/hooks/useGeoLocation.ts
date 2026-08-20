'use client';

import { useState, useEffect } from 'react';

interface GeoLocationState {
    lat: number | null;
    lng: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeoLocation() {
    const [location, setLocation] = useState<GeoLocationState>({
        lat: null,
        lng: null,
        error: null,
        loading: true,
    });

    const getPosition = () => {
        if (!navigator.geolocation) {
            setLocation({
                lat: null,
                lng: null,
                error: 'Geolocation is not supported by your browser',
                loading: false,
            });
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setLocation({
                    lat: 25.5941, // Default fallback coordinates (Patna, Bihar)
                    lng: 85.1376,
                    error: error.message,
                    loading: false,
                });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        getPosition();
    }, []);

    return { ...location, refetch: getPosition };
}