import axios, { type AxiosInstance, type AxiosError } from 'axios';
import { v4 as uuid } from 'uuid';

export class ApiError extends Error {
    constructor(
        public readonly code: string,
        message: string,
        public readonly details: unknown,
        public readonly status: number,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

function createClient(): AxiosInstance {
    const client = axios.create({
        baseURL: '/api/v1',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        withCredentials: true,
    });

    // Attach auth token from localStorage if present
    client.interceptors.request.use((config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Normalize API errors into ApiError instances
    client.interceptors.response.use(
        (res) => res,
        (err: AxiosError<{ error?: { code: string; message: string; details?: unknown } }>) => {
            const data = err.response?.data;
            const status = err.response?.status ?? 0;
            const apiErr = data?.error;

            throw new ApiError(
                apiErr?.code ?? 'NETWORK_ERROR',
                apiErr?.message ?? 'Sin conexión. Revisa tu señal e intenta de nuevo.',
                apiErr?.details ?? null,
                status,
            );
        },
    );

    return client;
}

export const api = createClient();

/** Generates a UUID v4 for use as Idempotency-Key on mutating requests. */
export function newIdempotencyKey(): string {
    return uuid();
}
