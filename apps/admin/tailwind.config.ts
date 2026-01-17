import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f0f12',
                surface: '#18181f',
                border: 'rgba(255, 255, 255, 0.08)',
                accent: '#6366f1',
                success: '#22c55e',
                warning: '#f59e0b',
                danger: '#ef4444',
            },
        },
    },
    plugins: [],
};

export default config;
