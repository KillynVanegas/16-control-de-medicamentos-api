import { autenticar } from '@/lib/auth';
import { borrar, leerPrivado, subir } from '@/lib/blob';
import { ApiError } from '@/lib/errors';
import { json, manejar } from '@/lib/http';
import { esPropia, MAX_BYTES, pathnameDe, TIPOS, tipoReal } from '@/lib/imagenes';

export const runtime = 'nodejs';

function pathnamePropio(req: Request, uid: string): { pathname: string; original: string } {
  const sp = new URL(req.url).searchParams;
  const original = sp.get('url') ?? sp.get('pathname') ?? '';
  const pathname = pathnameDe(original);
  if (!original)
    throw new ApiError(400, 'Datos inválidos', [{ campo: 'url', mensaje: 'Obligatorio' }]);
  if (!pathname || !esPropia(pathname, uid)) throw new ApiError(403, 'Acceso denegado');
  return { pathname, original };
}

export const POST = manejar(async (req) => {
  const u = await autenticar(req);
  const tipo = (req.headers.get('content-type') ?? '').split(';')[0]!.trim();
  if (!(tipo in TIPOS)) throw new ApiError(415, 'Tipo de imagen no permitido');
  if (Number(req.headers.get('content-length') ?? 0) > MAX_BYTES)
    throw new ApiError(413, 'Imagen demasiado grande');

  const cuerpo = await req.arrayBuffer();
  if (cuerpo.byteLength === 0) throw new ApiError(400, 'Cuerpo vacío');
  if (cuerpo.byteLength > MAX_BYTES) throw new ApiError(413, 'Imagen demasiado grande');
  if (tipoReal(new Uint8Array(cuerpo)) !== tipo)
    throw new ApiError(415, 'El contenido no coincide con el tipo de imagen');

  const ext = TIPOS[tipo as keyof typeof TIPOS];
  const r = await subir(`usuarios/${u.uid}/${crypto.randomUUID()}.${ext}`, cuerpo, tipo);
  return json({ url: r.url, pathname: r.pathname }, 201);
});

/** Entrega la imagen privada a través de la API, solo a su dueño. */
export const GET = manejar(async (req) => {
  const u = await autenticar(req);
  const { pathname } = pathnamePropio(req, u.uid);
  const r = await leerPrivado(pathname);
  if (!r) throw new ApiError(404, 'No encontrado');
  return new Response(r.stream, {
    headers: {
      'Content-Type': r.contentType,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
});

export const DELETE = manejar(async (req) => {
  const u = await autenticar(req);
  const { original } = pathnamePropio(req, u.uid);
  await borrar(original);
  return json({ ok: true });
});
