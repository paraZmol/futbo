# Regla: Seguridad Mínima Siempre Activa

> Esta regla aplica a TODO código que el agente sugiera, sin excepción.

## Lista negra absoluta

El agente NUNCA debe sugerir, generar, ni permitir:

1. **Hardcodear secretos.** Ninguna API key, token, password, connection string en código.
   - ✅ `config('services.culqi.secret')` o `env('CULQI_SECRET')`.
   - ❌ `'sk_test_abc123def456'` literal.

2. **Loggear datos sensibles.**
   - PCI: número de tarjeta, CVV, expiración.
   - PII bruto: DNI, RUC sin enmascarar, dirección física.
   - Secretos: webhook secrets, JWT, API keys.
   - Si se necesita loggear para debug, **enmascarar** (`****1234`).

3. **SQL/NoSQL injection.**
   - Solo bindings parametrizados (`DB::select('... WHERE id = ?', [$id])` o Eloquent).
   - **NUNCA** `DB::raw()` con concatenación de input del usuario.

4. **XSS por inserción de HTML del usuario.**
   - En Blade: `{{ }}` (escapa). Nunca `{!! !!}` con datos del usuario.
   - En React: nunca `dangerouslySetInnerHTML` con datos del usuario.

5. **Mass assignment sin protección.**
   - Modelos Eloquent tienen `$fillable` explícito.
   - **NUNCA** `Model::create($request->all())` sin validación previa.

6. **Comparaciones inseguras de strings sensibles.**
   - HMACs, tokens, passwords: `hash_equals()` (PHP) / `crypto.timingSafeEqual()` (Node).
   - **NUNCA** `===` para comparar firmas o tokens.

7. **Endpoints públicos sin rate limiting.**
   - Login, signup, reset password, OTP, webhooks: rate limit obligatorio.

## Lista blanca de prácticas obligatorias

1. **Validar inputs siempre.** Form Requests en Laravel, Zod en frontend. Sin "lo valido después".
2. **Autorización explícita.** `Policy` para cada recurso. `Gate::authorize` o `$this->authorize` en cada acción.
3. **HTTPS obligatorio en producción.** Redirección automática `http → https` en infra.
4. **CORS restrictivo.** Solo dominios conocidos. No `*` salvo en endpoints públicos sin estado.
5. **Cookies con flags.** `HttpOnly`, `Secure`, `SameSite=Lax` (o `Strict` si aplica).
6. **JWT con expiración corta.** Access tokens ≤ 15 min. Refresh tokens rotativos.
7. **Passwords con bcrypt** (default Laravel) o argon2id. **NUNCA** md5, sha1.
8. **CSRF tokens** en formularios web (default Laravel + Sanctum).

## Antes de mergear código que toca seguridad

Si el PR toca: auth, pagos, webhooks, permisos, manejo de archivos del usuario, o BD del usuario:

- [ ] ¿Hay validación server-side de TODOS los inputs?
- [ ] ¿Hay autorización explícita (no asumida por estar autenticado)?
- [ ] ¿Los logs no exponen datos sensibles?
- [ ] ¿Se usan comparaciones constantes en tiempo donde aplica?
- [ ] ¿Hay tests que cubren escenarios maliciosos? (replay attack, escalación de privilegios, etc.)
- [ ] ¿Hay rate limiting?

Si una respuesta es "no", **el agente debe señalarlo y bloquear la sugerencia de commit hasta resolver**.
