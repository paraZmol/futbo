import { api } from '@/shared/lib/apiClient';
import type { AuthUser, LoginInput, RegisterInput } from '../types';

export async function login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
    const res = await api.post<{ data: { token: string; user: AuthUser } }>('/auth/login', input);
    return res.data.data;
}

export async function register(input: RegisterInput): Promise<{ token: string; user: AuthUser }> {
    const res = await api.post<{ data: { token: string; user: AuthUser } }>('/auth/register', input);
    return res.data.data;
}

export async function logout(): Promise<void> {
    await api.post('/auth/logout');
}
