import { ApiError } from './errors';

// Limitador en memoria (por instancia). Complételo con el Firewall de Vercel antes de usar datos reales.
const cubos = new Map<string, { n: number; reinicio: number }>();

export function reiniciarLimites() {
  cubos.clear();
}

export function limitar(req: Request, clave: string, max = 10, ventanaMs = 60_000) {
  const ip = (req.headers.get('x-forwarded-for') ?? 'desconocido').split(',')[0]!.trim();
  const k = `${clave}:${ip}`;
  const ahora = Date.now();
  const c = cubos.get(k);
  if (!c || c.reinicio < ahora) {
    cubos.set(k, { n: 1, reinicio: ahora + ventanaMs });
    return;
  }
  c.n += 1;
  if (c.n > max) throw new ApiError(429, 'Demasiados intentos. Intente más tarde.');
}
