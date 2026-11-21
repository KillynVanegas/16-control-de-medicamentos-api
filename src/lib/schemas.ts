import { z } from 'zod';

const iso = z.string().datetime();

export const idSchema = z.string().uuid();

export const credencialesSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(128),
});

export const refreshSchema = z.object({ refreshToken: z.string().min(1).max(4096) });

// Los campos no declarados se descartan (z.object no los conserva).
export const medicamentoSchema = z.object({
  nombre: z.string().trim().min(1).max(120),
  dosis: z.string().trim().min(1).max(120),
  cada_horas: z.number().int().min(1).max(48),
  primera_toma: iso,
  dias: z.number().int().min(1).max(3650).nullable(),
  activo: z.boolean(),
  foto_url: z.string().max(1000).nullable(),
});

export const tomaSchema = z.object({
  medicamento_id: z.string().uuid(),
  programada_para: iso,
  estado: z.enum(['pendiente', 'tomada', 'omitida']),
  registrada_en: iso.nullable(),
});

export const RECURSOS = { medicamento: medicamentoSchema, toma: tomaSchema } as const;
export type Recurso = keyof typeof RECURSOS;
