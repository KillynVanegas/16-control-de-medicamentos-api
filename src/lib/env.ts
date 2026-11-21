import { z } from 'zod';

const esquema = z.object({
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().min(1),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  FIREBASE_WEB_API_KEY: z.string().min(1),
});

/** Se lee de forma perezosa para que las pruebas no necesiten variables. */
export function env() {
  const r = esquema.safeParse(process.env);
  if (!r.success) throw new Error('Configuración del servidor incompleta');
  return r.data;
}
