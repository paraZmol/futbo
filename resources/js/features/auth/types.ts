export type AuthUser = {
    id: number;
    publicId: string;
    name: string;
    email: string;
    role: 'user' | 'partner' | 'staff' | 'admin';
};

export type LoginInput = { email: string; password: string };
export type RegisterInput = { name: string; email: string; password: string; phone?: string };
