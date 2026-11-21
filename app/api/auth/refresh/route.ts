import { json, leerJson, manejar } from '@/lib/http';
import { renovar } from '@/lib/firebaseAuthRest';
import { limitar } from '@/lib/rateLimit';
import { refreshSchema } from '@/lib/schemas';

export const runtime = 'nodejs';

export const POST = manejar(async (req) => {
  limitar(req, 'refresh', 30);
  const { refreshToken } = await leerJson(req, refreshSchema);
  return json(await renovar(refreshToken));
});
