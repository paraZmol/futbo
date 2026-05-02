import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    fullWidth?: boolean;
};

const variantClasses: Record<Variant, string> = {
    primary:   'bg-[var(--green-action)] hover:bg-[var(--green-dark)] text-white focus-visible:ring-green-600',
    secondary: 'bg-[var(--navy-soft)] hover:bg-[var(--navy-mid)] text-[var(--navy-deep)] focus-visible:ring-[var(--navy-mid)]',
    danger:    'bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-500',
    ghost:     'bg-transparent hover:bg-[var(--gray-border)] text-[var(--gray-primary)] focus-visible:ring-gray-400',
};

const sizeClasses: Record<Size, string> = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-base min-h-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[52px]',
};

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    children,
    className = '',
    ...props
}: ButtonProps) {
    return (
        <button
            type="button"
            disabled={disabled || loading}
            className={[
                'inline-flex items-center justify-center gap-2 rounded-lg font-semibold',
                'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                variantClasses[variant],
                sizeClasses[size],
                fullWidth ? 'w-full' : '',
                className,
            ].join(' ')}
            {...props}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{loading ? 'Cargando...' : children}</span>
                </>
            ) : children}
        </button>
    );
}
