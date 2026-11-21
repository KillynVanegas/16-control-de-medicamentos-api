import { ApiError } from './errors';
import { env } from './env';

const IDENTITY = 'https://identitytoolkit.googleapis.com/v1/accounts:';
const SECURETOKEN = 'https://securetoken.googleapis.com/v1/token';
const CREDENCIALES = [
  'EMAIL_NOT_FOUND',
  'INVALID_PASSWORD',
  'INVALID_LOGIN_CREDENTIALS',
  'USER_DISABLED',
];
const SESION = [
  'INVALID_REFRESH_TOKEN',
  'TOKEN_EXPIRED',
  'USER_NOT_FOUND',
  'MISSING_REFRESH_TOKEN',
  'INVALID_GRANT_TYPE',
];

function codigoErrorFirebase(mensaje: string): string {
  const codigo = mensaje.trim().split(/[\s:]/)[0] ?? '';
  return /^[A-Z][A-Z0-9_]{0,79}$/.test(codigo) ? codigo : 'UNKNOWN';
}

/** Traduce el código de error de Firebase a un ApiError. Credenciales: mismo mensaje exista o no el correo. */
export function mapearErrorFirebase(mensaje: string): ApiError {
  const codigo = codigoErrorFirebase(mensaje);
  if (codigo === 'EMAIL_EXISTS') return new ApiError(409, 'El correo ya está registrado');
  if (codigo === 'WEAK_PASSWORD') return new ApiError(400, 'La contraseña es demasiado débil');
  if (codigo === 'INVALID_EMAIL') return new ApiError(400, 'Correo inválido');
  if (codigo === 'TOO_MANY_ATTEMPTS_TRY_LATER')
    return new ApiError(429, 'Demasiados intentos. Intente más tarde.');
  if (CREDENCIALES.includes(codigo)) return new ApiError(401, 'Credenciales inválidas');
  if (SESION.includes(codigo)) return new ApiError(401, 'Sesión inválida');
  return new ApiError(500, 'Error interno');
}

async function llamar(
  url: string,
  init: RequestInit,
  operacion: 'registro' | 'login' | 'refresh',
): Promise<Record<string, string>> {
  const r = await fetch(url, init);
  const datos = (await r.json()) as Record<string, unknown>;
  if (!r.ok) {
    const e = datos.error as { message?: string } | undefined;
    const codigo = codigoErrorFirebase(e?.message ?? '');
    console.error('Error de Firebase Auth:', operacion, codigo);
    throw mapearErrorFirebase(codigo);
  }
  return datos as Record<string, string>;
}

export interface Sesion {
  token: string;
  refreshToken: string;
  expiraEnSeg: number;
  usuario: { id: string; email: string };
}

async function credenciales(
  accion: 'signUp' | 'signInWithPassword',
  email: string,
  password: string,
): Promise<Sesion> {
  const d = await llamar(
    `${IDENTITY}${accion}?key=${encodeURIComponent(env().FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
    accion === 'signUp' ? 'registro' : 'login',
  );
  return {
    token: d.idToken as string,
    refreshToken: d.refreshToken as string,
    expiraEnSeg: Number(d.expiresIn),
    usuario: { id: d.localId as string, email: d.email as string },
  };
}

export const registrar = (email: string, password: string) =>
  credenciales('signUp', email, password);
export const iniciarSesion = (email: string, password: string) =>
  credenciales('signInWithPassword', email, password);

export async function renovar(refreshToken: string) {
  const d = await llamar(
    `${SECURETOKEN}?key=${encodeURIComponent(env().FIREBASE_WEB_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    },
    'refresh',
  );
  return {
    token: d.id_token as string,
    refreshToken: d.refresh_token as string,
    expiraEnSeg: Number(d.expires_in),
  };
}
