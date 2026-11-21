import { autenticar } from '@/lib/auth';
import { json, manejar } from '@/lib/http';

export const runtime = 'nodejs';

export const GET = manejar(async (req) => {
  const u = await autenticar(req);
  return json({ usuario: { id: u.uid, email: u.email } });
});
