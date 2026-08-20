import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google';
import Navbar from '../components/layout/Navbar';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-display',
    display: 'swap',
});

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-body',
    display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ['latin'],
    variable: '--font-mono',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'Karigar Kart — Handmade Artisan Marketplace',
    description: 'Discover verified artisan goods, commission bespoke handcrafted items, and support Indian makers with AI-powered quality verification.',
    keywords: ['artisan marketplace', 'handmade craft', 'gemini vision verification', 'escrow payments', 'indian artisans'],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}): React.ReactNode {
    return (
        <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
            <body id="__karigar_root" className="bg-[#FAF7F2] text-stone-900 antialiased selection:bg-[#C85A32]/20 selection:text-[#C85A32]">
                <Navbar />
                {children}
            </body>
        </html>
    );
}
