/**
 * Browser Fingerprint Collection
 * 
 * Collects device and browser information for fraud detection.
 * Uses multiple signals to create a unique device fingerprint.
 */

export interface DeviceFingerprint {
    // Browser info
    userAgent: string;
    language: string;
    languages: string[];
    platform: string;
    cookiesEnabled: boolean;
    doNotTrack: string | null;

    // Screen info
    screenWidth: number;
    screenHeight: number;
    screenColorDepth: number;
    devicePixelRatio: number;

    // Timezone
    timezone: string;
    timezoneOffset: number;

    // Hardware
    hardwareConcurrency: number;
    deviceMemory: number | null;
    maxTouchPoints: number;

    // Canvas fingerprint (hash)
    canvasHash: string;

    // WebGL info
    webglVendor: string | null;
    webglRenderer: string | null;

    // Audio fingerprint (hash)
    audioHash: string;

    // Installed fonts (sample)
    fontsSample: string[];

    // Additional signals
    sessionStorage: boolean;
    localStorage: boolean;
    indexedDB: boolean;

    // Telegram specific
    telegramWebApp: boolean;
    telegramPlatform: string | null;

    // Generated hash
    fingerprintHash: string;
}

/**
 * Collect browser fingerprint data
 */
export async function collectFingerprint(): Promise<DeviceFingerprint> {
    const fingerprint: Partial<DeviceFingerprint> = {};

    // Basic browser info
    fingerprint.userAgent = navigator.userAgent;
    fingerprint.language = navigator.language;
    fingerprint.languages = [...navigator.languages];
    fingerprint.platform = navigator.platform;
    fingerprint.cookiesEnabled = navigator.cookieEnabled;
    fingerprint.doNotTrack = navigator.doNotTrack;

    // Screen info
    fingerprint.screenWidth = screen.width;
    fingerprint.screenHeight = screen.height;
    fingerprint.screenColorDepth = screen.colorDepth;
    fingerprint.devicePixelRatio = window.devicePixelRatio;

    // Timezone
    fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    fingerprint.timezoneOffset = new Date().getTimezoneOffset();

    // Hardware
    fingerprint.hardwareConcurrency = navigator.hardwareConcurrency || 1;
    fingerprint.deviceMemory = (navigator as any).deviceMemory || null;
    fingerprint.maxTouchPoints = navigator.maxTouchPoints || 0;

    // Canvas fingerprint
    fingerprint.canvasHash = await getCanvasFingerprint();

    // WebGL info
    const webglInfo = getWebGLInfo();
    fingerprint.webglVendor = webglInfo.vendor;
    fingerprint.webglRenderer = webglInfo.renderer;

    // Audio fingerprint
    fingerprint.audioHash = await getAudioFingerprint();

    // Font detection (sample of common fonts)
    fingerprint.fontsSample = detectFonts();

    // Storage capabilities
    fingerprint.sessionStorage = !!window.sessionStorage;
    fingerprint.localStorage = !!window.localStorage;
    fingerprint.indexedDB = !!window.indexedDB;

    // Telegram specific
    fingerprint.telegramWebApp = !!(window as any).Telegram?.WebApp;
    fingerprint.telegramPlatform = (window as any).Telegram?.WebApp?.platform || null;

    // Generate final hash
    fingerprint.fingerprintHash = await generateFingerprintHash(fingerprint);

    return fingerprint as DeviceFingerprint;
}

/**
 * Canvas fingerprinting
 */
async function getCanvasFingerprint(): Promise<string> {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;

        const ctx = canvas.getContext('2d');
        if (!ctx) return 'no-canvas';

        // Draw text and shapes
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillStyle = '#f60';
        ctx.fillRect(100, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Test', 4, 17);

        // Get data URL and hash it
        const dataUrl = canvas.toDataURL();
        return await hashString(dataUrl);
    } catch {
        return 'canvas-error';
    }
}

/**
 * WebGL vendor and renderer
 */
function getWebGLInfo(): { vendor: string | null; renderer: string | null } {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return { vendor: null, renderer: null };

        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return { vendor: null, renderer: null };

        return {
            vendor: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
            renderer: (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        };
    } catch {
        return { vendor: null, renderer: null };
    }
}

/**
 * Audio fingerprinting using AudioContext
 */
async function getAudioFingerprint(): Promise<string> {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return 'no-audio';

        const context = new AudioContext();
        const oscillator = context.createOscillator();
        const analyser = context.createAnalyser();
        const gainNode = context.createGain();
        const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

        gainNode.gain.value = 0; // Mute
        oscillator.type = 'triangle';
        oscillator.frequency.value = 10000;

        oscillator.connect(analyser);
        analyser.connect(scriptProcessor);
        scriptProcessor.connect(gainNode);
        gainNode.connect(context.destination);

        oscillator.start(0);

        return new Promise((resolve) => {
            const dataArray = new Float32Array(analyser.frequencyBinCount);

            setTimeout(() => {
                analyser.getFloatFrequencyData(dataArray);
                oscillator.disconnect();
                scriptProcessor.disconnect();
                gainNode.disconnect();
                context.close();

                // Hash the audio data
                const audioSum = dataArray.reduce((acc, val) => acc + Math.abs(val), 0);
                resolve(audioSum.toFixed(2));
            }, 100);
        });
    } catch {
        return 'audio-error';
    }
}

/**
 * Detect installed fonts (sample)
 */
function detectFonts(): string[] {
    const testFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Comic Sans MS', 'Impact', 'Trebuchet MS', 'Lucida Console',
        'Helvetica', 'Tahoma', 'Arial Black'
    ];

    const installedFonts: string[] = [];
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testString = 'mmmmmmmmmmlli';
    const testSize = '72px';

    const span = document.createElement('span');
    span.style.fontSize = testSize;
    span.style.position = 'absolute';
    span.style.left = '-9999px';
    span.textContent = testString;
    document.body.appendChild(span);

    const baseWidths: Record<string, number> = {};
    for (const baseFont of baseFonts) {
        span.style.fontFamily = baseFont;
        baseWidths[baseFont] = span.offsetWidth;
    }

    for (const font of testFonts) {
        let detected = false;
        for (const baseFont of baseFonts) {
            span.style.fontFamily = `'${font}', ${baseFont}`;
            if (span.offsetWidth !== baseWidths[baseFont]) {
                detected = true;
                break;
            }
        }
        if (detected) installedFonts.push(font);
    }

    document.body.removeChild(span);
    return installedFonts;
}

/**
 * Generate SHA-256 hash of fingerprint data
 */
async function generateFingerprintHash(data: Partial<DeviceFingerprint>): Promise<string> {
    const str = JSON.stringify({
        ua: data.userAgent,
        lang: data.language,
        screen: `${data.screenWidth}x${data.screenHeight}`,
        tz: data.timezone,
        canvas: data.canvasHash,
        webgl: `${data.webglVendor}-${data.webglRenderer}`,
        audio: data.audioHash,
    });

    return await hashString(str);
}

/**
 * Hash a string using SHA-256
 */
async function hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Store fingerprint in session for later use
 */
export function storeFingerprint(fingerprint: DeviceFingerprint): void {
    try {
        sessionStorage.setItem('device_fingerprint', JSON.stringify(fingerprint));
    } catch (e) {
        console.warn('Could not store fingerprint:', e);
    }
}

/**
 * Get stored fingerprint
 */
export function getStoredFingerprint(): DeviceFingerprint | null {
    try {
        const stored = sessionStorage.getItem('device_fingerprint');
        return stored ? JSON.parse(stored) : null;
    } catch {
        return null;
    }
}
