import { autenticar } from './auth';
import { ApiError } from './errors';
import { getDb } from './firebase';
import { json, leerJson } from './http';
import { idSchema, RECURSOS, type Recurso } from './schemas';
import { z } from 'zod';

const MAX = 500;
const sinceSchema = z.string().datetime().optional();

/** El aislamiento entre usuarios lo da la RUTA: usuarios/{uid}/{recurso}/{id}. */
const coleccion = (uid: string, recurso: Recurso) => `usuarios/${uid}/${recurso}`;

function idValido(id: string): string {
  const r = idSchema.safeParse(id);
  if (!r.success)
    throw new ApiError(400, 'Datos inválidos', [{ campo: 'id', mensaje: 'Debe ser un UUID' }]);
  return r.data;
}

export async function listar(req: Request, recurso: Recurso): Promise<Response> {
  const u = await autenticar(req);
  const s = sinceSchema.safeParse(new URL(req.url).searchParams.get('since') ?? undefined);
  if (!s.success)
    throw new ApiError(400, 'Datos inválidos', [{ campo: 'since', mensaje: 'Fecha ISO inválida' }]);

  let q = getDb().collection(coleccion(u.uid, recurso)).orderBy('updated_at');
  // >= : el cliente repite desde el último updated_at; al ser PUT idempotente no hay duplicados.
  if (s.data) q = q.where('updated_at', '>=', s.data);
  const snap = await q.limit(MAX).get();
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return json({ items, servidor_ahora: new Date().toISOString() });
}

export async function guardar(req: Request, recurso: Recurso, idCrudo: string): Promise<Response> {
  const u = await autenticar(req);
  const id = idValido(idCrudo);
  const datos = await leerJson(req, RECURSOS[recurso]);

  const ref = getDb().doc(`${coleccion(u.uid, recurso)}/${id}`);
  const documento = await getDb().runTransaction(async (tx) => {
    const previo = await tx.get(ref); // lecturas antes de escrituras
    const ahora = new Date().toISOString();
    const doc = {
      ...datos,
      created_at: previo.exists ? (previo.get('created_at') as string) : ahora,
      updated_at: ahora, // puestos por el servidor
      deleted_at: null,
    };
    tx.set(ref, doc);
    return doc;
  });
  return json({ id, ...documento });
}

export async function borrar(req: Request, recurso: Recurso, idCrudo: string): Promise<Response> {
  const u = await autenticar(req);
  const id = idValido(idCrudo);
  const ref = getDb().doc(`${coleccion(u.uid, recurso)}/${id}`);
  const encontrado = await getDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const ahora = new Date().toISOString();
    tx.update(ref, { deleted_at: ahora, updated_at: ahora }); // borrado lógico
    return true;
  });
  if (!encontrado) throw new ApiError(404, 'No encontrado');
  return json({ ok: true });
}
