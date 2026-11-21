import { describe, expect, it } from 'vitest';
import { exigirAdmin } from '@/lib/auth';
import { calcularAdherencia } from '@/lib/adherencia';
import { mapearErrorFirebase } from '@/lib/firebaseAuthRest';
import { esPropia, pathnameDe, tipoReal } from '@/lib/imagenes';

describe('rol admin', () => {
  it('403 sin el claim rol = admin', () => {
    expect(() => exigirAdmin({ uid: 'u', email: null, rol: null })).toThrow('Acceso denegado');
    expect(() => exigirAdmin({ uid: 'u', email: null, rol: 'admin' })).not.toThrow();
  });
});

describe('errores de Firebase Auth', () => {
  it('credenciales inválidas: mismo 401 y mensaje exista o no el correo', () => {
    const a = mapearErrorFirebase('EMAIL_NOT_FOUND');
    const b = mapearErrorFirebase('INVALID_PASSWORD');
    const c = mapearErrorFirebase('INVALID_LOGIN_CREDENTIALS');
    expect([a.status, b.status, c.status]).toEqual([401, 401, 401]);
    expect(new Set([a.message, b.message, c.message]).size).toBe(1);
  });
  it('correo repetido 409, contraseña débil 400, intentos 429', () => {
    expect(mapearErrorFirebase('EMAIL_EXISTS').status).toBe(409);
    expect(
      mapearErrorFirebase('WEAK_PASSWORD : Password should be at least 6 characters').status,
    ).toBe(400);
    expect(mapearErrorFirebase('TOO_MANY_ATTEMPTS_TRY_LATER').status).toBe(429);
  });
  it('códigos desconocidos no filtran detalles', () => {
    const e = mapearErrorFirebase('ALGO_RARO');
    expect(e.status).toBe(500);
    expect(e.message).toBe('Error interno');
  });
});

describe('adherencia', () => {
  const t = (h: number, estado: string) => ({
    programada_para: new Date(2026, 10, 20, h).toISOString(),
    estado,
  });
  it('tomadas / programadas vencidas', () => {
    const r = calcularAdherencia(
      [t(6, 'tomada'), t(8, 'omitida'), t(22, 'pendiente')],
      new Date(2026, 10, 20, 12),
    );
    expect(r).toEqual({ programadas: 2, tomadas: 1, porcentaje: 50 });
  });
  it('sin tomas vencidas → null', () => {
    expect(calcularAdherencia([], new Date()).porcentaje).toBeNull();
  });
});

describe('imágenes', () => {
  it('detecta el tipo por los bytes', () => {
    expect(tipoReal(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(tipoReal(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe('image/png');
    expect(tipoReal(new TextEncoder().encode('RIFF\0\0\0\0WEBP'))).toBe('image/webp');
    expect(tipoReal(new TextEncoder().encode('<script>'))).toBeNull();
  });
  it('propiedad por prefijo y rechazo de ..', () => {
    expect(esPropia('usuarios/a/x.jpg', 'a')).toBe(true);
    expect(esPropia('usuarios/ab/x.jpg', 'a')).toBe(false);
    expect(pathnameDe('usuarios/a/../b/x.jpg')).toBeNull();
    expect(pathnameDe('https://t.blob.vercel-storage.com/usuarios/a/x.jpg')).toBe(
      'usuarios/a/x.jpg',
    );
  });
});
