// src/libs/auth.ts
const TOKEN_KEY = "token";

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Espera a que exista `sessionStorage.token` con valor no vacío.
 * - timeoutMs: corta la espera si se excede (por defecto 20s).
 * - checkEveryMs: intervalo de verificación (por defecto 120ms).
 */
export async function waitForToken(
  { timeoutMs = 20000, checkEveryMs = 120 }: { timeoutMs?: number; checkEveryMs?: number } = {}
): Promise<string> {
  const start = Date.now();
  let t = getToken();
  while (!t) {
    if (Date.now() - start > timeoutMs) throw new Error("Timeout esperando token en sessionStorage");
    await new Promise((r) => setTimeout(r, checkEveryMs));
    t = getToken();
  }
  return t;
}
