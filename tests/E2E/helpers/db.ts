import { execSync } from 'child_process';

/**
 * Reset and reseed the database before E2E tests.
 * Called once at the start of the test suite.
 */
export function resetDatabase(): void {
    execSync('php artisan migrate:fresh --seed --env=testing --force', {
        cwd: process.cwd(),
        stdio: 'inherit',
    });
}

/**
 * Get a Sanctum token for a seeded test user by role.
 */
export async function getToken(
    role: 'user' | 'partner' | 'staff' | 'admin',
    baseURL: string,
): Promise<string> {
    const emails: Record<string, string> = {
        user:    'user@canchasapp.pe',
        partner: 'partner@canchasapp.pe',
        staff:   'staff@canchasapp.pe',
        admin:   'admin@canchasapp.pe',
    };
    const passwords: Record<string, string> = {
        user:    'User1234!',
        partner: 'Partner1234!',
        staff:   'Staff1234!',
        admin:   'Admin1234!',
    };

    const res = await fetch(`${baseURL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emails[role], password: passwords[role] }),
    });

    const json = await res.json() as { data: { token: string } };
    return json.data.token;
}
