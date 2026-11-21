import { manejar } from '@/lib/http';
import { listar } from '@/lib/recursos';

export const runtime = 'nodejs';

export const GET = manejar((req) => listar(req, 'medicamento'));
