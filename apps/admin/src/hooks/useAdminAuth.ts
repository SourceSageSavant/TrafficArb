'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
}

interface AuthState {
    token: string | null;
    user: AdminUser | null;
    isLoading: boolean;
}

export function useAdminAuth() {
    const [auth, setAuth] = useState<AuthState>({
        token: null,
        user: null,
        isLoading: true,
    });
    const router = useRouter();

    useEffect(() => {
        // Check for stored token on mount
        const token = localStorage.getItem('admin_token');
        const userStr = localStorage.getItem('admin_user');

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                setAuth({ token, user, isLoading: false });
            } catch {
                localStorage.removeItem('admin_token');
                localStorage.removeItem('admin_user');
                setAuth({ token: null, user: null, isLoading: false });
            }
        } else {
            setAuth({ token: null, user: null, isLoading: false });
        }
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error?.message || 'Login failed');
        }

        localStorage.setItem('admin_token', data.data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.data.user));
        setAuth({ token: data.data.token, user: data.data.user, isLoading: false });

        return data.data;
    };

    const logout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        setAuth({ token: null, user: null, isLoading: false });
        router.push('/login');
    };

    const getAuthHeaders = () => {
        if (!auth.token) return {};
        return { Authorization: `Bearer ${auth.token}` };
    };

    return { ...auth, login, logout, getAuthHeaders };
}

// API fetch wrapper with auth
export function useAdminApi() {
    const { token, logout } = useAdminAuth();

    const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
        const res = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...options.headers,
            },
        });

        if (res.status === 401) {
            logout();
            throw new Error('Session expired');
        }

        const data = await res.json();
        if (!data.success) {
            throw new Error(data.error?.message || 'API error');
        }

        return data.data;
    };

    return { fetchWithAuth };
}
