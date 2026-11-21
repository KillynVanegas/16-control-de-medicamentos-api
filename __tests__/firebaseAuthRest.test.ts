import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registrar } from '@/lib/firebaseAuthRest';

vi.mock('@/lib/env', () => ({
  env: () => ({ FIREBASE_WEB_API_KEY: 'test-key' }),
}));

describe('diagnóstico seguro de Firebase Auth', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('registra el código de Firebase sin datos de la solicitud o la respuesta', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { message: 'API_KEY_INVALID: user@example.com' } },
            { status: 400 },
          ),
        ),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(registrar('user@example.com', 'private-password')).rejects.toMatchObject({
      status: 500,
      message: 'Error interno',
    });

    expect(log).toHaveBeenCalledWith('Error de Firebase Auth:', 'registro', 'API_KEY_INVALID');
    expect(JSON.stringify(log.mock.calls)).not.toContain('user@example.com');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-password');
  });

  it('sustituye mensajes externos que no son códigos por UNKNOWN', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json(
            { error: { message: 'unexpected response containing private data' } },
            { status: 500 },
          ),
        ),
    );
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(registrar('user@example.com', 'private-password')).rejects.toMatchObject({
      status: 500,
      message: 'Error interno',
    });

    expect(log).toHaveBeenCalledWith('Error de Firebase Auth:', 'registro', 'UNKNOWN');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private data');
  });
});
