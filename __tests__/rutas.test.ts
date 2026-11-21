import { beforeEach, describe, expect, it, vi } from 'vitest';

const { escrituras, borrarMock } = vi.hoisted(() => ({
  escrituras: [] as { path: string; data: Record<string, unknown> }[],
  borrarMock: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  getAdminAuth: () => ({
    verifyIdToken: async (t: string) => {
      if (t === 'token-a') return { uid: 'user-a', email: 'a@ejemplo.com' };
      if (t === 'token-b') return { uid: 'user-b', email: 'b@ejemplo.com' };
      throw new Error('inválido');
    },
  }),
  getDb: () => ({
    doc: (path: string) => ({ path }),
    runTransaction: async (fn: (tx: unknown) => unknown) =>
      fn({
        get: async () => ({ exists: false, get: () => null }),
        set: (ref: { path: string }, data: Record<string, unknown>) =>
          escrituras.push({ path: ref.path, data }),
        update: () => undefined,
      }),
  }),
}));
vi.mock('@/lib/blob', () => ({
  subir: vi.fn(),
  borrar: borrarMock,
  leerPrivado: vi.fn(),
  borrarPrefijo: vi.fn(),
}));

import { GET as listarMed } from '../app/api/medicamento/route';
import { PUT as guardarMed } from '../app/api/medicamento/[id]/route';
import { DELETE as borrarImagen, POST as subirImagen } from '../app/api/imagenes/route';
import { GET as yo } from '../app/api/auth/yo/route';

const ID = '3f2b8c1e-5d4a-4b7e-9a1c-2d3e4f5a6b7c';
const ctx = { params: Promise.resolve({ id: ID }) };
const valido = {
  nombre: 'Ibuprofeno',
  dosis: '1 tableta',
  cada_horas: 8,
  primera_toma: '2026-11-20T11:00:00.000Z',
  dias: null,
  activo: true,
  foto_url: null,
};
const put = (cuerpo: unknown, token = 'token-a') =>
  new Request(`http://x/api/medicamento/${ID}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
  });

beforeEach(() => {
  escrituras.length = 0;
  borrarMock.mockClear();
});

describe('autenticación', () => {
  it('401 sin token', async () => {
    const r = await listarMed(new Request('http://x/api/medicamento'), undefined);
    expect(r.status).toBe(401);
    expect(await r.json()).toEqual({ error: 'No autenticado' });
  });
  it('401 con token inválido', async () => {
    const r = await yo(
      new Request('http://x/api/auth/yo', { headers: { authorization: 'Bearer falso' } }),
      undefined,
    );
    expect(r.status).toBe(401);
  });
  it('200 con token válido; el uid sale del token', async () => {
    const r = await yo(
      new Request('http://x/api/auth/yo', { headers: { authorization: 'Bearer token-a' } }),
      undefined,
    );
    expect((await r.json()).usuario.id).toBe('user-a');
  });
});

describe('validación', () => {
  it('400 con detalles si cada_horas está fuera de rango', async () => {
    const r = await guardarMed(put({ ...valido, cada_horas: 99 }), ctx);
    expect(r.status).toBe(400);
    const cuerpo = await r.json();
    expect(cuerpo.detalles[0].campo).toBe('cada_horas');
    expect(escrituras).toHaveLength(0);
  });
  it('400 si el id no es UUID', async () => {
    const r = await guardarMed(put(valido), { params: Promise.resolve({ id: '../otro' }) });
    expect(r.status).toBe(400);
  });
  it('415 si no es JSON', async () => {
    const r = await guardarMed(
      new Request(`http://x/api/medicamento/${ID}`, {
        method: 'PUT',
        headers: { authorization: 'Bearer token-a' },
        body: 'x',
      }),
      ctx,
    );
    expect(r.status).toBe(415);
  });
});

describe('autorización y aislamiento', () => {
  it('escribe bajo usuarios/<uid del token> y descarta campos no declarados', async () => {
    const r = await guardarMed(
      put({ ...valido, uid: 'user-b', rol: 'admin', created_at: '2000-01-01T00:00:00.000Z' }),
      ctx,
    );
    expect(r.status).toBe(200);
    expect(escrituras).toHaveLength(1);
    const e = escrituras[0]!;
    expect(e.path).toBe(`usuarios/user-a/medicamento/${ID}`);
    expect(e.data).not.toHaveProperty('uid');
    expect(e.data).not.toHaveProperty('rol');
    expect(e.data.created_at).not.toBe('2000-01-01T00:00:00.000Z');
    expect(e.data.deleted_at).toBeNull();
  });
  it('otro usuario escribe en su propia ruta, nunca en la de user-a', async () => {
    await guardarMed(put(valido, 'token-b'), ctx);
    expect(escrituras[0]!.path).toBe(`usuarios/user-b/medicamento/${ID}`);
  });
  it('403 al borrar una imagen ajena y no se llama a Blob', async () => {
    const r = await borrarImagen(
      new Request(
        'http://x/api/imagenes?url=https://tienda.blob.vercel-storage.com/usuarios/user-b/foto.jpg',
        {
          method: 'DELETE',
          headers: { authorization: 'Bearer token-a' },
        },
      ),
      undefined,
    );
    expect(r.status).toBe(403);
    expect(borrarMock).not.toHaveBeenCalled();
  });
  it('415 al subir un tipo no permitido', async () => {
    const r = await subirImagen(
      new Request('http://x/api/imagenes', {
        method: 'POST',
        headers: { authorization: 'Bearer token-a', 'content-type': 'text/plain' },
        body: 'hola',
      }),
      undefined,
    );
    expect(r.status).toBe(415);
  });
});
