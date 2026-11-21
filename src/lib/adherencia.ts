export interface TomaMinima {
  programada_para: string;
  estado: string;
}

/** Adherencia = tomadas / programadas (solo tomas ya vencidas). */
export function calcularAdherencia(tomas: TomaMinima[], ahora: Date) {
  const programadas = tomas.filter((t) => new Date(t.programada_para).getTime() <= ahora.getTime());
  const tomadas = programadas.filter((t) => t.estado === 'tomada').length;
  return {
    programadas: programadas.length,
    tomadas,
    porcentaje: programadas.length === 0 ? null : Math.round((tomadas / programadas.length) * 100),
  };
}
