import { json, leerJson, manejar } from '@/lib/http';
import { registrar } from '@/lib/firebaseAuthRest';
import { limitar } from '@/lib/rateLimit';
import { credencialesSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export const POST = manejar(async (req) => {
  limitar(req, 'registro');
  const { email, password } = await leerJson(req, credencialesSchema);
  return json(await registrar(email, password), 201);
});
