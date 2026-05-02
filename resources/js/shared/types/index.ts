export type ApiResponse<T> = { data: T };

export type PaginatedResponse<T> = {
    data: T[];
    meta: { page: number; perPage: number; total: number; totalPages: number };
};
