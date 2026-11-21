import { manejar } from '@/lib/http';
import { borrar, guardar } from '@/lib/recursos';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export const PUT = manejar<Ctx>(async (req, ctx) =>
  guardar(req, 'medicamento', (await ctx.params).id),
);
export const DELETE = manejar<Ctx>(async (req, ctx) =>
  borrar(req, 'medicamento', (await ctx.params).id),
);
