import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
                body: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
            },
            colors: {
                primary: {
                    DEFAULT: '#C85A32',
                    hover: '#B04B26',
                    foreground: '#FFFFFF',
                },
                secondary: {
                    DEFAULT: '#2C4A3E',
                    hover: '#223B31',
                    foreground: '#FFFFFF',
                },
                accent: {
                    DEFAULT: '#E08E45',
                    muted: '#F7EAD9',
                },
                background: '#FDFBF7',
                card: {
                    DEFAULT: '#FFFFFF',
                    foreground: '#1E1B18',
                },
                muted: {
                    DEFAULT: '#F3EFEA',
                    foreground: '#6B635B',
                },
                border: '#E8E2D9',
                success: {
                    DEFAULT: '#2E7D32',
                    bg: '#EDF7ED',
                },
                warning: {
                    DEFAULT: '#ED6C02',
                    bg: '#FFF4E5',
                },
                error: {
                    DEFAULT: '#D32F2F',
                    bg: '#FDEDED',
                    border: '#F5C2C7',
                },
            },
            boxShadow: {
                card: '0 2px 8px rgba(0,0,0,0.04)',
                elevated: '0 4px 16px rgba(0,0,0,0.08)',
                modal: '0 12px 40px rgba(0,0,0,0.15)',
            },
            borderRadius: {
                card: '0.75rem',
                pill: '9999px',
            },
        },
    },
    plugins: [],
};

export default config;