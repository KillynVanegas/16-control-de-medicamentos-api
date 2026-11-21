import { z } from 'zod';
import { autenticar } from '@/lib/auth';
import { calcularAdherencia } from '@/lib/adherencia';
import { ApiError } from '@/lib/errors';
import { getDb } from '@/lib/firebase';
import { json, manejar } from '@/lib/http';

export const runtime = 'nodejs';

const consulta = z.object({
  desde: z.string().datetime().optional(),
  hasta: z.string().datetime().optional(),
});

export const GET = manejar(async (req) => {
  const u = await autenticar(req);
  const sp = new URL(req.url).searchParams;
  const p = consulta.safeParse({
    desde: sp.get('desde') ?? undefined,
    hasta: sp.get('hasta') ?? undefined,
  });
  if (!p.success)
    throw new ApiError(400, 'Datos inválidos', [
      { campo: 'desde/hasta', mensaje: 'Use fechas ISO 8601' },
    ]);

  const ahora = new Date();
  const hasta = p.data.hasta ?? ahora.toISOString();
  const desde = p.data.desde ?? new Date(ahora.getTime() - 7 * 86_400_000).toISOString();

  // Rango sobre un solo campo (sin índice compuesto); los borrados lógicos se filtran en memoria.
  const snap = await getDb()
    .collection(`usuarios/${u.uid}/toma`)
    .where('programada_para', '>=', desde)
    .where('programada_para', '<=', hasta)
    .get();
  const tomas = snap.docs
    .map((d) => d.data() as { programada_para: string; estado: string; deleted_at: string | null })
    .filter((t) => t.deleted_at == null);
  return json({ ...calcularAdherencia(tomas, new Date(hasta)), desde, hasta });
});
