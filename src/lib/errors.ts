export interface Detalle {
  campo: string;
  mensaje: string;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detalles?: Detalle[],
  ) {
    super(message);
  }
}
