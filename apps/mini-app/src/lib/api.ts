/**
 * API Client with fingerprint support
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    body?: unknown;
    headers?: Record<string, string>;
    fingerprint?: string | null;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
    code?: string;
}

/**
 * Make an authenticated API request with fingerprint
 */
export async function apiRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, fingerprint } = options;

    // Get auth token from storage
    const token = typeof window !== 'undefined'
        ? localStorage.getItem('auth_token')
        : null;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...headers,
    };

    // Add auth token
    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    // Add fingerprint header
    if (fingerprint) {
        requestHeaders['X-Device-Fingerprint'] = fingerprint;
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || 'Request failed',
                code: data.code,
            };
        }

        return { data };
    } catch (error) {
        console.error('API request error:', error);
        return {
            error: 'Network error',
            code: 'NETWORK_ERROR',
        };
    }
}

/**
 * API methods with fingerprint support
 */
export function createApiClient(getFingerprintHeader: () => string | null) {
    const withFingerprint = (options: RequestOptions = {}): RequestOptions => ({
        ...options,
        fingerprint: getFingerprintHeader(),
    });

    return {
        // Auth
        login: (initData: string) =>
            apiRequest('/api/auth/telegram', withFingerprint({ method: 'POST', body: { initData } })),

        // User
        getProfile: () =>
            apiRequest('/api/users/me', withFingerprint()),

        getStats: () =>
            apiRequest('/api/users/me/stats', withFingerprint()),

        // Offers
        getOffers: (params?: { category?: string; limit?: number; offset?: number }) => {
            const query = new URLSearchParams(params as Record<string, string>).toString();
            return apiRequest(`/api/offers${query ? `?${query}` : ''}`, withFingerprint());
        },

        getOffer: (id: string) =>
            apiRequest(`/api/offers/${id}`, withFingerprint()),

        // Tasks
        startTask: (offerId: string) =>
            apiRequest(`/api/tasks/${offerId}/start`, withFingerprint({ method: 'POST' })),

        getTasks: () =>
            apiRequest('/api/tasks', withFingerprint()),

        // Wallet
        getBalance: () =>
            apiRequest('/api/wallet/balance', withFingerprint()),

        getTransactions: (limit = 20, offset = 0) =>
            apiRequest(`/api/wallet/transactions?limit=${limit}&offset=${offset}`, withFingerprint()),

        requestWithdrawal: (amount: string, walletAddress: string) =>
            apiRequest('/api/wallet/withdraw', withFingerprint({
                method: 'POST',
                body: { amount, walletAddress }
            })),

        // Referrals
        getReferralStats: () =>
            apiRequest('/api/referrals', withFingerprint()),

        // Leaderboard
        getLeaderboard: (period: string, type: string) =>
            apiRequest(`/api/leaderboard?period=${period}&type=${type}`, withFingerprint()),
    };
}
