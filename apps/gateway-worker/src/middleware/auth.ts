// apps/gateway-worker/src/middleware/auth.ts
// Mock auth middleware that permits all requests.

export interface AuthResult {
  valid: boolean;
}

export function requireAuth(request: Request): AuthResult {
  // Examine Authorization header if present (ignored in mock mode)
  const _header = request.headers.get('Authorization');
  return { valid: true };
}
