import { json, leerJson, manejar } from '@/lib/http';
import { iniciarSesion } from '@/lib/firebaseAuthRest';
import { limitar } from '@/lib/rateLimit';
import { credencialesSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export const POST = manejar(async (req) => {
  limitar(req, 'login');
  const { email, password } = await leerJson(req, credencialesSchema);
  return json(await iniciarSesion(email, password));
});
