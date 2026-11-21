import { autenticar } from '@/lib/auth';
import { borrarPrefijo } from '@/lib/blob';
import { getAdminAuth, getDb } from '@/lib/firebase';
import { json, manejar } from '@/lib/http';

export const runtime = 'nodejs';

/** Borrado total: documentos, imágenes y el usuario de Firebase Auth. */
export const DELETE = manejar(async (req) => {
  const u = await autenticar(req);
  await getDb().recursiveDelete(getDb().doc(`usuarios/${u.uid}`));
  await borrarPrefijo(`usuarios/${u.uid}/`);
  await getAdminAuth().deleteUser(u.uid);
  return json({ ok: true });
});
