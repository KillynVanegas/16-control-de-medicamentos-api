import { ApiError } from './errors';
import { getAdminAuth } from './firebase';

export interface Usuario {
  uid: string;
  email: string | null;
  rol: string | null;
}

/** El uid sale SOLO del ID token verificado. */
export async function autenticar(req: Request): Promise<Usuario> {
  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '');
  if (!m?.[1]) throw new ApiError(401, 'No autenticado');
  const auth = getAdminAuth();
  try {
    const t = await auth.verifyIdToken(m[1]);
    return { uid: t.uid, email: t.email ?? null, rol: typeof t.rol === 'string' ? t.rol : null };
  } catch {
    throw new ApiError(401, 'No autenticado');
  }
}

export function exigirAdmin(u: Usuario) {
  if (u.rol !== 'admin') throw new ApiError(403, 'Acceso denegado');
}
