import { ZodError, type z, type ZodTypeAny } from 'zod';
import { ApiError, type Detalle } from './errors';

const MAX_JSON = 100_000;

export function json(cuerpo: unknown, status = 200): Response {
  return Response.json(cuerpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function detallesZod(e: ZodError): Detalle[] {
  return e.issues.map((i) => ({ campo: i.path.join('.') || '(cuerpo)', mensaje: i.message }));
}

export function respuestaError(e: unknown): Response {
  if (e instanceof ApiError)
    return json({ error: e.message, ...(e.detalles ? { detalles: e.detalles } : {}) }, e.status);
  if (e instanceof ZodError)
    return json({ error: 'Datos inválidos', detalles: detallesZod(e) }, 400);
  // Nunca se registran mensajes (podrían contener datos personales); solo el tipo de error.
  console.error('Error interno:', e instanceof Error ? e.name : 'desconocido');
  return json({ error: 'Error interno' }, 500);
}

export function manejar<C = unknown>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C): Promise<Response> => {
    try {
      return await handler(req, ctx);
    } catch (e) {
      return respuestaError(e);
    }
  };
}

export async function leerJson<T extends ZodTypeAny>(
  req: Request,
  esquema: T,
): Promise<z.infer<T>> {
  if (!(req.headers.get('content-type') ?? '').includes('application/json'))
    throw new ApiError(415, 'Se esperaba application/json');
  if (Number(req.headers.get('content-length') ?? 0) > MAX_JSON)
    throw new ApiError(413, 'Cuerpo demasiado grande');
  let datos: unknown;
  try {
    datos = await req.json();
  } catch {
    throw new ApiError(400, 'JSON inválido');
  }
  const r = esquema.safeParse(datos);
  if (!r.success) throw new ApiError(400, 'Datos inválidos', detallesZod(r.error));
  return r.data;
}
