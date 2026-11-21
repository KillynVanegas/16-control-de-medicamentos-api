export const TIPOS = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as const;
export const MAX_BYTES = 4_000_000; // Vercel limita el cuerpo a 4,5 MB

/** Tipo real según los primeros bytes (no se confía solo en el Content-Type). */
export function tipoReal(b: Uint8Array): keyof typeof TIPOS | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png';
  const txt = (i: number, n: number) => String.fromCharCode(...Array.from(b.slice(i, i + n)));
  if (txt(0, 4) === 'RIFF' && txt(8, 4) === 'WEBP') return 'image/webp';
  return null;
}

/** Acepta una URL del store o un pathname y devuelve el pathname normalizado (o null si es sospechoso). */
export function pathnameDe(valor: string): string | null {
  let p = valor;
  try {
    if (/^https?:\/\//i.test(valor)) p = new URL(valor).pathname;
    p = decodeURIComponent(p).replace(/^\/+/, '');
  } catch {
    return null;
  }
  return p.includes('..') || p.includes('\\') ? null : p;
}

export const esPropia = (pathname: string, uid: string) => pathname.startsWith(`usuarios/${uid}/`);
